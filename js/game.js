/* TODO
  HIGH
  display current character at top
  refactor code:
    - store ordered purchased node list in Character
      - this will allow save/load of builds, as well as separate builds per character
    - when drawing nodes check current character to decide which nodes are active
  test if performance suffers with 1000 nodes

  MEDIUM
  add more nodes
  more cool looking node shapes
  use own icons instead of emojis
    https://codepen.io/Matnard/pen/mAlEJ
  menu with manual save/load, options
  save slots
  controls help
    show hints at appropriate times
  min zoom based on size of visible tree
  reveal entire areas instead of one node at a time
  NEW CHARACTER!!!
  resource autoconversion skill

  LOW
  character pathfinding
    move along curved paths
  better looking graphics
    pretty background
    UI
    color themes

  IDEAS
  store xy position in character object and draw based on that
  characters handle their own animation
  make draw.js into class?
  dark magic - bonemancy
    collect bones
    use bones to cast dark magic

    'detail': {
      'en': 'Every universe is covered by seven layers — earth, water, fire, air, sky, the total energy and false ego — each ten times greater than the previous one. There are innumerable universes besides this one, and although they are unlimitedly large, they move about like atoms in You. Therefore You are called unlimited [ananta].'
    },
*/

import {clearelem, get, load_image, deep_merge, deep_copy, hit_circle, get_display_transform, DefaultDict} from './util.js'
import {draw_tree} from './draw.js'
import {init_tree} from './tree.js'
import {init_characters} from './characters.js'
import {init_resources} from './resources.js'
import {strings} from './strings.js'

const GOLD = 1.618033989
var tree
var characters
var game = {}
game.options={
  'autosave': true,
  'autosave_interval': 5000,
  'click_margin': 16,
  'zoom_min': 0.5,
  'zoom_max': 1.25,
  'animation_speed': 1.0, // higher numbers are faster, 0 for off
  'max_travel_dist': 2,
  'lang': 'en',
  'node_size': 64,
  'node_distance': 90,
  'node_text_margin': 24,
  'autopan': true,
  'autopan_margin': 0.5,
  'show_node_details': true,
  'theme': {
    'default': '#f00',
    'bgcolor': '#080E07', // rich black
    'nodes': {
      'link': '#fff',
      'link_locked': '#999',
      'deactivated': '#9a9',
      'activated': '#fff',
      'selected': '#8E9B58',
      'text': '#000',
      'cost': '#4d7250',
      'detailbg': '#c2b7e8',
      'detailborder': '#6b57a5',
      'detailtext': '#000',
    }
  }
}
game.dontsave = false
game.images = {}
game.hide_hint = {}
var canvas, ctx            // canvas and drawing context
var vw, vh                 // viewport height/width
var keys_pressed = {}
var mouse = {
  pos: {'x':0,'y':0,'z':0},
  alt : false,
  shift : false,
  ctrl : false,
  btn : 0,
  over : false, // mouseover
  btnmask : [1, 2, 4, 6, 5, 3]
}

window.onload = function(){
  load_assets()
}

function load_assets(){
  document.getElementById('loading_overlay').classList.remove('hidden')
  const promises = [
    get('./resources/nodes.svg', 'svg'),
    load_image('./img/characters.png'),
    load_image('./img/sp.png'),
  ]
  Promise.allSettled(promises).
    then((results) => {
      if (results[0].status === 'fulfilled')
        game.nodes_svg = results[0].value
      if (results[1].status === 'fulfilled')
        game.images['characters'] = results[1].value
      if (results[2].status === 'fulfilled')
        game.images['sp'] = results[2].value
      init_game()
    })
}

function init_game(){
  init_svgs()
  reset_all()
  canvas = document.getElementById('game_screen')
  ctx = canvas.getContext('2d')
  resize()
  load() // load save data
  update_hud()
  update_conversion()
  if (game.options.autosave){
    game.autosave_timer = setInterval(save, game.options.autosave_interval)
  }
  init_listeners()
  document.getElementById('loading_overlay').classList.add('hidden')
  requestAnimationFrame(draw)
}

// convert svg paths to point arrays
function init_svgs(){
  let paths = game.nodes_svg.querySelectorAll('path')
  game.node_shapes = {}
  paths.forEach( (path) => {
    if(!path) return
    let name = path.parentNode.getAttribute('id')
    let points = path_to_points(path)
    if(points && name)
      game.node_shapes[name] = points
  })
}
function path_to_points(path){
  let points = []
  let len = path.getTotalLength()
  for (let i=0; i<len; i++){
    points.push(path.getPointAtLength(i))
  }
  return points
}

/*
  [GAME] core game functions
*/
function load(){
  let save = localStorage.getItem('save')
  if (save){
    save = JSON.parse(save)
    game.state = save.state
    game.resources = save.resources
    Object.entries(save.unlocks).forEach(
      ([feature,unlocked])=>{
        if(unlocked) game.unlock(feature)
      }
    )
    game.options = save.options

    deep_merge(save.tree, tree)
    deep_merge(save.characters, characters)
  }
}

function save(){
  if (game.dontsave) return
  game.dontsave = true
  update_status('save', 'saving', false)
  let save = {
    'state': game.state,
    'resources': game.resources,
    'unlocks': game.unlocks,
    'options': game.options,
    'tree': {'nodes': {}},
    'characters': {}
  }
  // save tree node status
  Object.entries(tree).forEach(([k,node])=>{
    save.tree[k] = {
      'status': node.status,
      'locked': node.locked,
      'hidden': node.hidden,
      'selected': node.selected
    }
  })
  // save relevant info about characters
  Object.entries(characters).forEach(([k,chara])=>{
    save.characters[k] = {
      'current_node': chara.current_node,
      'pos': chara.pos,
      'reachable_nodes': chara.reachable_nodes,
    }
  })

  localStorage.setItem('save',JSON.stringify(save))
  game.dontsave = false
  setTimeout(()=>{update_status('save', 'saved', true)}, 1000)
}

function current_character(){
  return characters[game.state.current_character]
}

function respec(){
  game.dontsave = true
  let h = game.hide_hint['respec']
  if (h) h()
  // run pre-respec functions
  game.onrespec.pre.forEach((f) => {
    f()
  })
  // reset keys
  keys_pressed = {}
  // reset characters
  Object.values(characters).forEach((char) => {
    char.reset()
  })
  // reset activated nodes
  Object.values(tree).forEach(node => {
    if (!(node.permanent && node.status === 'activated'))
      node.respec()
  })
  tree['0'].locked = false
  tree['0'].selected = true
  // reset resources
  Object.values(game.resources).forEach((res) => {
    res.amount = res.permanent
  })
  // gain respec resources
  Object.entries(game.onrespec.resources).forEach(([k, res]) => {
    game.resources[k].amount += res
  })
  // reset onrespec
  game.onrespec = {'resources': new DefaultDict(0), 'pre':[]}
  update_hud()
  game.dontsave = false
}

function reset_all(){
  game.dontsave = true
  tree = init_tree(game)
  game.tree = tree
  characters = init_characters(game)
  game.characters = characters
  game.resources = init_resources()
  game.unlocks = {}
  game.state = {
    'current_character': 'arborist'
  }
  game.onrespec = {'resources': new DefaultDict(0), 'pre':[]}
  tree['0'].locked = false
  // display purchase node hint after 5 seconds
  window.setTimeout(() => {
    let move_hint = function(){
      if (current_node_id() == 0 && tree['1'].status != 'activated' && tree['2'].status != 'activated'){
        // display movement hint if player hasn't moved
        hint(get_string('hints','move'), game, 'move')
      }
    }
    if (current_node_id() == 0 && tree['0'].status != 'activated'){
      hint(get_string('hints','purchasenode'), game, 'purchasenode', move_hint, 2000)
    }else{
      move_hint()
    }
  }, 3000)
  game.dontsave = false
}

game.unlock = function(feature){
  game.unlocks[feature] = true
  if (feature === 'figtosp') {
    document.getElementById('resource_conversion').classList.remove('hidden')
  }
}

/*
  [NODE] node manipulation
*/
function current_node_id(){
  return current_character()['current_node']
}
game.current_node = ()=>{
  return tree[current_node_id()]
}
// Check if node is activatable
function can_activate(node){
  if (game.resources.sp.amount < node.get_cost()) return false
  return true
}
function unlock_neighbors(node){
  let r = current_character().reachable_nodes
  node.unlocks.forEach((id) => {
    r[id] = true
    if (game.options.animation_speed <= 0 || !tree[id].hidden){
      tree[id].locked = false
      tree[id].hidden = false
    }else{
      tree[id].link_t = 0
      tree[id].outline_t = 0
    }
  })
}
// check if x, y is within node
function hit_node(x, y, node){
  let pos = game.gridpos_to_realpos(node.pos)
  return hit_circle(x, y, pos[0], pos[1], game.options.node_size)
}
// convert grid position to real position
game.gridpos_to_realpos = function(gridpos){
  let d = game.options.node_distance
  return [
    gridpos[0] * d * GOLD,
    gridpos[1] * d
  ]
}
function purchase_node(node){
  let h = game.hide_hint['purchasenode']
  if (h) h()
  if (node.status == 'deactivated' && can_activate(node)){
    // update cost
    game.resources.sp.amount -= node.get_cost()
    // run activate function
    if (typeof node.onactivate === 'function') node.onactivate(game)
    node.status = 'activated'
    unlock_neighbors(node)
    update_hud()
    // show respec hint when out of SP
    if (game.resources.sp.amount == 0){
      hint(get_string('hints','respec'), game, 'respec')
    }
  }
}

/*
  [EVENT] event listeners (keyboard, mouse, resize, etc.)
*/
function init_listeners(){
  window.addEventListener('resize', resize)
  // navigation buttons
  Array.from(document.getElementById('navigation').children).forEach((node)=>{
    if (!node.id || !node.id.startsWith('nav-')) return
    let tab_id = node.id.replace('nav-', '')
    node.addEventListener('click', ()=>{
      open_tab(tab_id, node)
    })
  })
  // button events
  document.getElementById('btn_convert').addEventListener('click', ()=>{
    convert_resources(true)
  })
  document.getElementById('btn_reset').addEventListener('click', ()=>{
    // TODO delete save is for debug purposes only
    update_status('resetting all')
    localStorage.removeItem('save')
    reset_all
  })
  document.getElementById('btn_cheat').addEventListener('click', ()=>{
    Object.values(game.resources).forEach((res)=>{
      res.amount += 100
      update_hud()
    })
  })
  // text/number inputs
  document.getElementById('num_convert_a').addEventListener('input', ()=>{
    update_conversion()
  })

  // get display transform to handle zoom and pan
  game.display_transform = get_display_transform(ctx, canvas, mouse)
  // listen for keyboard events
  document.addEventListener('keydown', function (e) {
    keys_pressed[e.key] = true
    handle_keyboard_input()
  })
  document.addEventListener('keyup', function (e) {
    if (e.key == ' '){
      e.preventDefault()
    }
    keys_pressed[e.key] = false
  })
  // listen for mouse events on canvas
  canvas.addEventListener('mousemove', mouse_move)
  canvas.addEventListener('mousedown', mouse_move)
  canvas.addEventListener('mouseup', mouse_move)
  canvas.addEventListener('mouseout', mouse_move)
  canvas.addEventListener('mouseover', mouse_move)
  canvas.addEventListener('mousewheel', mouse_move)
  canvas.addEventListener('DOMMouseScroll', mouse_move) // firefox
  canvas.addEventListener('contextmenu', function (e) {
    e.preventDefault()
  }, false)
}

// Take action based on which keys are pressed.
function handle_keyboard_input(){
  // ignore keypresses when tree is hidden
  if (document.getElementById('tree').classList.contains('hidden')) return
  // r: respec!
  if (keys_pressed['r']){
    respec()
    return
  }
  handle_movement()
  // Spacebar: activate current node
  if (keys_pressed[' ']){
    purchase_node(game.current_node())
  }
}

// Handle movement with wasd keys.
function handle_movement(){
  // determine angle based on combination of wasd
  let dx = 0, dy = 0
  if (keys_pressed.w || keys_pressed.ArrowUp){
    dy += -1
    keys_pressed.w = keys_pressed.ArrowUp = false
  }
  if (keys_pressed.s || keys_pressed.ArrowDown){
    dy += 1
    keys_pressed.s = keys_pressed.ArrowDown = false
  }
  if (keys_pressed.a || keys_pressed.ArrowLeft){
    dx += -1
    keys_pressed.a = keys_pressed.ArrowLeft = false
  }
  if (keys_pressed.d || keys_pressed.ArrowRight){
    dx += 1
    keys_pressed.d = keys_pressed.ArrowRight = false
  }
  if (dy == 0 && dx == 0) return
  let angle = Math.atan2(dy, dx)

  // find closest unlocked node to current character in direction
  let c = current_character()
  let pos = c.pos
  let closest_distance = 9999
  let closest_angle = 10
  let closest_node_id = null
  Object.entries(tree).forEach(([k,node]) => {
    // skip hidden and locked
    if (node.hidden || node.locked) return
    dy = node.pos[1] - pos[1]
    dx = node.pos[0] - pos[0]
    // skip current position
    if (dx == 0 && dy == 0) return
    let angle2 = Math.atan2(dy, dx)
    let diff = Math.abs(Math.atan2(Math.sin(angle2-angle), Math.cos(angle2-angle)))
    let dist = Math.sqrt(dx * dx + dy * dy)
    // Only allow traveling to nodes less than 90 degrees away
    if (diff < Math.PI*0.5 && dist <= closest_distance && dist < game.options.max_travel_dist){
      // Don't allow ties
      if (closest_angle == diff && closest_distance == dist){
        closest_node_id = null
      }else{
        closest_angle = diff
        closest_distance = dist
        closest_node_id = k
      }
    }
  })
  if(closest_node_id != null)
    c.move(closest_node_id)
}

function mouse_move(event) {
  let x = event.offsetX
  let y = event.offsetY
  mouse.pos['x'] = x
  mouse.pos['y'] = y
  if (mouse.pos.x === undefined) {
    mouse.pos.x = event.clientX
    mouse.pos.y = event.clientY
  }
  mouse.alt = event.altKey
  mouse.shift = event.shiftKey
  mouse.ctrl = event.ctrlKey
  if (event.type === 'mousedown') {
    event.preventDefault()
    mouse.btn |= mouse.btnmask[event.which-1]
    game.mousedownpos =  deep_copy(mouse.pos)
  } else if (event.type === 'mouseup') {
    mouse.btn &= mouse.btnmask[event.which+2]
    // only click if mouseup coordinates are close to mousedown coordinates
    if (click_is_close(mouse.pos))
      click(x, y)
  } else if (event.type === 'mouseout') {
    mouse.btn = 0
    mouse.over = false
  } else if (event.type === 'mouseover') {
    mouse.over = true
  } else if (event.type === 'mousewheel') {
    event.preventDefault()
    mouse.pos.z = event.wheelDelta
  } else if (event.type === 'DOMMouseScroll') { // Firefox
    mouse.pos.z = -event.detail
  }
}

function click_is_close(pos){
  let dx = pos.x - game.mousedownpos.x
  let dy = pos.y - game.mousedownpos.y
  if (Math.abs(dx) < game.options.click_margin && Math.abs(dy) < game.options.click_margin)
    return true
  else
    return false
}
function click(x, y){
  // detect if any node was clicked
  if (!tree) return
  [x,y] = mouse_to_game_coords(x, y)
  Object.entries(tree).forEach(([id, node]) => {
    if (!node) return
    if(hit_node(x, y, node)){
      // if current node, purchase it,
      // otherwise move to it
      if(node === game.current_node())
        purchase_node(node)
      else
        current_character().move(id)
    }
  })
}

function mouse_to_game_coords(x, y){
  // apply transform (scale/pan)
  let dt = game.display_transform
  let mat = dt.matrix
  // pan
  x -= mat[4]
  y -= mat[5]
  // scale
  x /= mat[0]
  y /= mat[3]
  return [x,y]
}

/*
  [DRAW] drawing related functions
*/
function draw(){
  // update the transform
  game.display_transform.update()
  // set home transform to clear the screem
  game.display_transform.setHome()
  // draw background
  // [optimize] only redraw necessary parts?
  ctx.rect(0, 0, canvas.width, canvas.height)
  ctx.fillStyle = game.options.theme.bgcolor
  ctx.fill()
  // draw tree
  game.display_transform.setTransform()
  draw_tree(ctx, game)
  if (game.debugtext)
    draw_debug_text(ctx, game.debugtext)
  requestAnimationFrame(draw)
}

/*
  [UI] altering the interface and view
*/
function open_tab(tab_id, nav){
  let tabs = document.getElementsByClassName('tab')
  Array.from(tabs).forEach((tab)=>{
    if (tab.id === tab_id)
      tab.classList.remove('hidden')
    else
      tab.classList.add('hidden')
  })
  // update nav menu
  Array.from(document.getElementById('navigation').children).forEach((tab)=>{
    tab.classList.remove('selected')
  })
  nav.classList.add('selected')
}

function update_status(category, status, fade=true){
  let elem = document.getElementById('status')
  let text = category
  if (status)
    text = get_string(category,status)
  elem.textContent = text
  elem.classList.remove('fadeout')
  if(fade){
    // Trigger re-flow to ensure animation restarts
    void elem.offsetWidth
    elem.classList.add('fadeout')
  }
}

function get_string(category, status){
  if (strings[category] && strings[category][status])
    return strings[category][status][game.options.lang]
  else
    return 'love'
}

function update_hud(){
  // clear hud and resource list
  let hud = document.getElementById('hud_left')
  clearelem(hud)
  let resource_list = document.getElementById('resource_list')
  clearelem(resource_list)

  // current character info
  let c = current_character()
  let charhtml = '<img class="portrait pixelated" src="'+c.img+'"> Level '+c.level+' '+c.classy

  // resource list
  let reshtml = ''
  Object.values(game.resources).forEach((r) => {
    if (r.amount > 0) r.show=true
    if (r.show){
      let str = r.name+': '+r.amount
      // add to resources page
      let elem = document.createElement('div')
      elem.innerHTML = str
      resource_list.appendChild(elem)
      reshtml += str+' '
    }
  })
  let hudspan = document.createElement('span')
  hudspan.innerHTML = charhtml+'　　　'+reshtml
  hud.appendChild(hudspan)
}

// Display hint text
async function hint(text, game, hintid, callback){
  var container = document.getElementById('hints')
  var elem = document.createElement('div')
  elem.innerHTML = text
  container.appendChild(elem)
  // hide hint after trigger
  let promise = new Promise((resolve) => { game.hide_hint[hintid] = resolve })
  await promise.then(() => {
    container.removeChild(elem)
    if (callback)
      callback()
  })
}

function debug(thing){
  document.getElementById('debug').textContent = JSON.stringify(thing)
}

// resize canvas based on viewport
function resize(){
  vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0)
  vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0)
  canvas.width  = vw*0.8 - 2 // subtract 2 for border
  canvas.height = vh*0.8 - 2
}

// pan so that cursor is not too far from center
game.autopan = function(){
  if (!game.options.autopan) return
  let pos = current_character().pos
  let [x,y] = game.gridpos_to_realpos(pos)
  let w = canvas.width * 0.5
  let h = canvas.height * 0.5
  let dt = game.display_transform
  let mat = dt.matrix
  // calculate distance from center of canvas
  let center_x = mat[4]-w
  let center_y = mat[5]-h
  // adjust player pos based on scale
  x *= mat[0]
  y *= mat[3]
  let dx = x + center_x
  let dy = y + center_y
  let m = game.options.autopan_margin
  if (dx > w*m){
    // pan right
    dt.x = -(w*m+w-x-dt.cox)/mat[0]
  }else if (-dx > w*m){
    // pan left
    dt.x = (w*m-w+x+dt.cox)/mat[0]
  }
  if (dy > h*m){
    // pan down
    dt.y = -(h*m+h-y-dt.coy)/mat[0]
  }else if (-dy > h*m){
    // pan up
    dt.y = (h*m-h+y+dt.coy)/mat[0]
  }
}

function draw_debug_text(ctx, text){
  ctx.fillStyle = '#fff'
  ctx.textAlign = 'right'
  ctx.font = '12px sans-serif'
  let x = canvas.width-12, y = 24
  let lines = text.split('\n')
  game.display_transform.setHome()
  lines.forEach((line, i) => {
    ctx.fillText(line, x, y+(i*12))
  })
}

// update conversion ui based on conversion rates and selected currencies
function update_conversion(){
  let result = convert_resources()
  if (result)
    document.getElementById('num_convert_b').value = result
  else
    document.getElementById('num_convert_b').value = ''
}

function convert_resources(do_conversion=false){
  let a = document.getElementById('convert_res_a')
  a = a.options[a.selectedIndex].value
  let b = document.getElementById('convert_res_b')
  b = b.options[b.selectedIndex].value
  let num = document.getElementById('num_convert_a').value
  if (num<=0) return
  let val_a = game.resources[a].value
  let val_b = game.resources[b].value
  let result = (num * val_a)/val_b
  if(do_conversion){
    if (game.resources[a].amount < num){
      document.getElementById('conversion_error').innerHTML='Insufficient '+game.resources[a].name+' for conversion'
    }else{
      document.getElementById('conversion_error').innerHTML=''
      game.resources[a].amount -= num
      game.resources[b].amount += result
      update_hud()
    }
  }
  return result
}
