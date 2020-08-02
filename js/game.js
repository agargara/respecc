/* TODO
  HIGH
  improve conversion rate ability
  switching characters
    - set node statuses based on character
  rework movement code - don't go to nearest node, but only to connected nodes
    keep neighbor list in each node
  give the world a sense of scale: space nodes farther apart?

  MEDIUM
  more nodes!
  level up mechanic
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
  mini-map

  LOW
  a tab with all your resources displayed in a pile, growing things
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

import {clearelem, get, load_image, deep_copy, deep_merge, hit_circle, get_display_transform} from './util.js'
import Draw from './draw.js'
import Tree from './tree.js'
import Animate from './animate.js'
import {init_characters} from './characters.js'
import {get_string} from './strings.js'
import {options} from './options.js'

var game = {}
window.game = game // allow console access for easy debugging
var nodes
var characters
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
  game.images = {}
  document.getElementById('loading_overlay').classList.remove('hidden')
  const promises = [
    get('resources/nodes.svg', 'svg'),
    load_image('img/characters.png'),
    load_image('img/sp.png'),
  ]
  Promise.allSettled(promises).
    then((results) => {
      if (results[0].status === 'fulfilled')
        game.nodes_svg = results[0].value
      if (results[1].status === 'fulfilled')
        game.images['characters'] = results[1].value
      if (results[2].status === 'fulfilled')
        game.images['sp'] = results[2].value
      init()
    })
}

function init(){
  init_svgs()
  init_game()
  init_hints()
  load() // load save data
  update_hud()
  // get display transform to handle zoom and pan
  let [initx,inity] = game.gridpos_to_realpos(current_character().pos)
  let opt = {
    'zoom_min': game.options.zoom_min,
    'zoom_max': game.options.zoom_max,
    'zoom_default': game.options.zoom_default,
    'initx': initx,
    'inity': inity
  }
  game.display_transform = get_display_transform(ctx, canvas, mouse, opt)
  // draw tree
  game.tree.draw()
  game.animate = new Animate(game)
  // draw everything
  game.draw = new Draw(game)
  // hide the loading screen
  document.getElementById('loading_overlay').classList.add('hidden')
  // allow input
  init_listeners()
  // start autosave
  if (game.options.autosave){
    game.autosave_timer = setInterval(save, game.options.autosave_interval)
  }
  // done with init, allow saving
  game.dontsave = false
}

function init_game(){
  game.dontsave = true // disallow saving until game is loaded
  game.options=options
  game.unlocks = {}
  game.hide_hint = {}
  game.onrespec = {'pre':[]}
  game.seasons = ['Evernal', 'Vernal', 'Estival', 'Serotinal', 'Autumnal', 'Hibernal']
  game.current_season = 2

  // Initialize tree
  game.tree = new Tree(game)
  nodes = game.tree.nodes
  game.nodes = nodes
  nodes[0].selected = true
  characters = init_characters(game)
  game.characters = characters
  game.state = {
    'current_character': 'arborist'
  }
  canvas = document.getElementById('game_screen')
  ctx = canvas.getContext('2d')
  game.canvas = canvas
  game.ctx = ctx
  resize() // resize canvas based on viewport
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

function init_hints(){
  // display purchase node hint after 5 seconds
  window.setTimeout(() => {
    let move_hint = function(){
      if (current_character().activated_nodes.size == 1 && current_node_id() == 0){
        // display movement hint if player hasn't moved
        hint('move')
      }
    }
    if (current_character().activated_nodes.size < 1){
      hint('purchasenode', move_hint)
    }else{
      move_hint()
    }
  }, 3000)
}

/*
  [GAME] core game functions
*/
function load(){
  let save = localStorage.getItem('save')
  if (save){
    save = JSON.parse(save)
    game.state = save.state
    Object.entries(save.unlocks).forEach(
      ([feature,unlocked])=>{
        if(unlocked) game.unlock(feature)
      }
    )
    game.options = save.options
    deep_merge(save.nodes, game.nodes)
    Object.entries(save.characters).forEach(([key, value])=>{
      Object.assign(characters[key], value)
    })
    Object.values(characters).forEach((chara)=>{
      chara.reactivate_nodes()
    })
  }
}

function save(){
  if (game.dontsave) return
  game.dontsave = true
  update_status('save', 'saving', false)
  let save = {
    'state': game.state,
    'unlocks': game.unlocks,
    'options': game.options,
    'nodes': {},
    'characters': {}
  }
  // save tree node status
  Object.entries(nodes).forEach(([k,node])=>{
    save.nodes[k] = {
      'hidden': node.hidden,
      'selected': node.selected,
      'status': node.status
    }
  })
  // save relevant info about characters
  Object.entries(characters).forEach(([k,chara])=>{
    save.characters[k] = {
      'current_node': chara.current_node,
      'pos': chara.pos,
      'reachable_nodes': chara.reachable_nodes,
      'nodes_to_activate': Array.from(chara.activated_nodes.keys()),
      'resources': chara.resources,
      'abilities': chara.abilities,
    }
  })
  localStorage.setItem('save',JSON.stringify(save))
  game.dontsave = false
  setTimeout(()=>{update_status('save', 'saved', true)}, 1000)
}

function current_character(){
  return characters[game.state.current_character]
}
game.current_character = current_character

function respec(){
  game.dontsave = true
  game.animate.cancel_animations()
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
  update_hud()
  // redraw tree
  game.tree.clear()
  game.tree.draw()
  game.dontsave = false
}

game.unlock = function(feature){
  game.unlocks[feature] = true
}

/*
  [NODE] node manipulation
*/
function current_node_id(){
  return current_character()['current_node']
}
game.current_node = ()=>{
  return nodes[current_node_id()]
}

function unlock_neighbors(node){
  let r = current_character().reachable_nodes
  node.unlocks.forEach((id) => {
    if (!nodes.hasOwnProperty(id)) return
    let neighbor = nodes[id]
    if (game.options.animation_speed <= 0 || !neighbor.hidden){
      neighbor.hidden = false
      r[id] = true
    }else{
      game.animate.reveal_node(node, neighbor).then(()=>{
        r[id] = true
      }, ()=>{})
    }
  })
}
// check if x, y is within node
function hit_node(x, y, node){
  let pos = game.gridpos_to_realpos(node.pos)
  return hit_circle(x, y, pos[0], pos[1], game.options.node_size[0]*0.5)
}
// convert grid position to real position
game.gridpos_to_realpos = function(gridpos){
  let d = game.options.node_distance
  return [
    gridpos[0] * d[0],
    gridpos[1] * d[1]
  ]
}
game.purchase_node = function(node){
  // hide purchase node hint
  let h = game.hide_hint['purchasenode']
  if (h) h()
  // run activate function
  if (typeof node.onactivate === 'function') node.onactivate(game)
  unlock_neighbors(node)
  update_hud()
  // redraw node
  game.tree.nodes_to_redraw.add(node)
}

/*
  [EVENT] event listeners (keyboard, mouse, resize, etc.)
*/
function init_listeners(){
  window.addEventListener('resize', resize)
  // navigation buttons
  Array.from(document.getElementById('navigation').children).forEach((btn)=>{
    if (!btn.id || !btn.id.startsWith('nav-')) return
    let tab_id = btn.id.replace('nav-', '')
    btn.addEventListener('click', ()=>{
      open_tab(tab_id, btn)
    })
  })
  // button events
  document.getElementById('btn_convert').addEventListener('click', ()=>{
    convert_resources(true)
  })
  document.getElementById('btn_reset').addEventListener('click', ()=>{
    localStorage.removeItem('save')
    location.reload()
  })
  document.getElementById('btn_cheat').addEventListener('click', ()=>{
    Object.values(current_character().resources).forEach((res)=>{
      res.amount += 100
      update_hud()
    })
  })
  // text/number inputs
  document.getElementById('num_convert_a').addEventListener('input', ()=>{
    update_conversion()
  })
  document.getElementById('convert_res_a').addEventListener('change', update_conversion_options)
  // listen for keyboard events
  document.addEventListener('keydown', function (e) {
    keys_pressed[e.key.toLowerCase()] = true
    handle_keyboard_input()
  })
  document.addEventListener('keyup', function (e) {
    if (e.key == ' '){
      e.preventDefault()
    }
    keys_pressed[e.key.toLowerCase()] = false
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
    current_character().purchase()
  }
}

// Handle movement with wasd keys.
function handle_movement(){
  // determine angle based on combination of wasd
  let dx = 0, dy = 0
  if (keys_pressed.w || keys_pressed.urrowup){
    dy += -1
    keys_pressed.w = keys_pressed.arrowup = false
  }
  if (keys_pressed.s || keys_pressed.arrowdown){
    dy += 1
    keys_pressed.s = keys_pressed.arrowdown = false
  }
  if (keys_pressed.a || keys_pressed.arrowleft){
    dx += -1
    keys_pressed.a = keys_pressed.arrowleft = false
  }
  if (keys_pressed.d || keys_pressed.arrowright){
    dx += 1
    keys_pressed.d = keys_pressed.arrowright = false
  }
  if (dy == 0 && dx == 0) return
  let angle = Math.atan2(dy, dx)
  current_character().step(angle)

  /*
  let pos = c.pos
  let closest_distance = 9999
  let closest_angle = 10
  let closest_node_id = null
  Object.entries(nodes).forEach(([k,node]) => {
    // skip hidden and unreachable
    if (node.hidden || !node.is_reachable()) return
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
  */
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
  if (!nodes) return
  [x,y] = mouse_to_game_coords(x, y)
  Object.entries(nodes).some(([id, node]) => {
    if (!node) return false
    if(hit_node(x, y, node)){
      // if current node, purchase it,
      // otherwise move to it
      if(node === game.current_node())
        current_character().purchase()
      else
        current_character().move(id)
      return true
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
  [UI] altering the interface and view
*/
function str( category, status){
  return get_string(category, status, game.options.lang)
}

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
  if (tab_id == 'character')
    update_character_tab()
}

function update_status(category, status, fade=true){
  let elem = document.getElementById('status')
  let text = category
  if (status)
    text = str(category,status)
  elem.textContent = text
  elem.classList.remove('fadeout')
  if(fade){
    // Trigger re-flow to ensure animation restarts
    void elem.offsetWidth
    elem.classList.add('fadeout')
  }
}

function update_hud(){
  // clear hud and resource list
  let hud = document.getElementById('hud_left')
  clearelem(hud)
  let resource_list = document.getElementById('resource_list')
  clearelem(resource_list)

  // season info
  let s = game.seasons[game.current_season]
  let seasonelem = document.createElement('span')
  seasonelem.classList.add('hud_season')
  seasonelem.innerHTML = 'Season: <span class="'+s+'">'+s+'</span>'

  // current character info
  let c = current_character()
  let charelem = document.createElement('span')
  charelem.classList.add('hud_character')
  charelem.innerHTML = '<img class="portrait pixelated" src="'+c.portrait+'"> Level '+c.level+' '+c.classy

  // resource list
  let reselem = document.createElement('span')
  reselem.classList.add('hud_resources')
  Object.values(current_character().resources).forEach((r) => {
    if (r.amount > 0) r.show=true
    if (r.show){
      let amt = +r.amount.toFixed(2)
      let str = r.name+' '+amt
      // add to resources page
      let elem = document.createElement('div')
      elem.innerHTML = str
      resource_list.appendChild(elem)
      reselem.innerHTML += str+' '
    }
  })
  let hudspan = document.createElement('span')
  hudspan.appendChild(charelem)
  hudspan.appendChild(reselem)
  hudspan.appendChild(seasonelem)
  hud.appendChild(hudspan)
}
game.update_hud = update_hud

// Update the character info tab
function update_character_tab(){
  let c = current_character()
  let charelem = document.createElement('h2')
  charelem.classList.add('character_info')
  charelem.innerHTML = '<img class="portrait_large pixelated" src="'+c.portrait+'">Level '+c.level+' '+c.classy
  let info = document.getElementById('chara_info')
  clearelem(info)
  info.appendChild(charelem)

  // Show resource conversion menu if ability is unlocked
  if (c.abilities['convert']){
    document.getElementById('resource_conversion').classList.remove('hidden')
    add_conversion_options(c.abilities['convert'])
  }else{
    document.getElementById('resource_conversion').classList.add('hidden')
  }
}

function add_conversion_options(conversions){
  let select_a = document.getElementById('convert_res_a')
  clearelem(select_a)
  Object.keys(conversions).forEach((key)=>{
    let opt = document.createElement('option')
    opt.setAttribute('value', key)
    opt.innerHTML = current_character().resources[key].name
    select_a.appendChild(opt)
  })
  select_a.selectedIndex = 0
  update_conversion_options()
}

// Update conversion options based on selected resource
function update_conversion_options(){
  let select_a = document.getElementById('convert_res_a')
  let select_b = document.getElementById('convert_res_b')
  clearelem(select_b)
  let res_a = select_a.options[select_a.selectedIndex].value
  let options = current_character().abilities.convert[res_a]
  Object.keys(options).forEach((key)=>{
    let opt = document.createElement('option')
    opt.setAttribute('value', key)
    opt.innerHTML = current_character().resources[key].name
    select_b.appendChild(opt)
  })
  select_b.selectedIndex = 0
  let min_value = current_character().resources[select_b.options[0].value].value
  document.getElementById('num_convert_a').value = min_value
  document.getElementById('num_convert_a').setAttribute('step', min_value)
  update_conversion()
}

function update_conversion(){
  let result = convert_resources()
  if (result === null || result === undefined)
    result = ''
  if (result) result = +result.toFixed(2)
  document.getElementById('num_convert_b').value = result
}

function convert_resources(do_conversion=false){
  document.getElementById('conversion_error').innerHTML = ''
  let a = document.getElementById('convert_res_a')
  a = a.options[a.selectedIndex].value
  let b = document.getElementById('convert_res_b')
  b = b.options[b.selectedIndex].value
  let num = document.getElementById('num_convert_a').value
  if (num<=0) return ''
  let result = ''
  try{
    result = current_character().convert_resources(a, b, num, do_conversion)
  }catch(err){
    document.getElementById('conversion_error').innerHTML = err
  }
  return result
}

// Display hint text
async function hint(hintid, callback){
  let text = str('hints','respec')
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
game.hint = hint
game.debug = function(thing){
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

// get color from theme, return default if not found
game.get_color = function(key1, key2){
  let theme = game.options.theme
  let color = theme.default
  if (theme[key1]){
    if(theme[key1].constructor != Object){
      color = theme[key1]
    }else if (key2){
      if (theme[key1][key2])
        color = theme[key1][key2]
      else if (theme[key1]['default'])
        color = theme[key1]['default']
    }
  }
  return color
}

game.error = function(err){
  console.error(err)
}
