/* TODO
store xy position in character object and draw based on that
characters handle their own animation
  HIGH
  detailed description of current node

  MEDIUM
  character moves along curved path
  menu with manual save/load, options
  save slots
  controls help
    show hints at appropriate times
  min zoom based on size of visible tree
  reveal entire areas instead of one node at a time

  LOW
  better looking graphics
    pretty background
    UI
    color themes

  IDEAS
  make draw.js into class?
  dark magic - bonemancy
    collect bones
    use bones to cast dark magic
*/

import {get, load_image, deep_copy, hit_circle, get_display_transform, DefaultDict} from './util.js'
import {draw_tree} from './draw.js'
import {init_tree} from './tree.js'
import {init_characters} from './characters.js'
import {strings} from './strings.js'

const GOLD = 1.618033989
var tree
var characters
var game = {}
game.options={
  'autosave': true,
  'autosave_interval': 5000,
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
      'cost': '#4d7250'
    }
  }
}
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
    game.unlocks = save.unlocks
    game.options = save.options
    deep_copy(save.tree, tree)
    deep_copy(save.characters, characters)
  }
}

function save(){
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
      'hidden': node.hidden
    }
  })
  // save relevant info about characters
  Object.entries(characters).forEach(([k,chara])=>{
    save.characters[k] = {
      'current_node': chara.current_node,
    }
  })
  localStorage.setItem('save',JSON.stringify(save))
  setTimeout(()=>{update_status('save', 'saved', true)}, 1000)
}

function current_character(){
  return characters[game.state.current_character]
}

function respec(){
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
      node.status = 'deactivated'
    node.locked = true
    node.selected = false
    // cancel animations
    node.link_t = undefined
    node.outline_t = undefined
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
}

function reset_all(){
  tree = init_tree()
  game.tree = tree
  characters = init_characters(game)
  game.characters = characters
  game.resources = {
    'sp': {'name': '🌰', 'show': true},
    'figs': {'name': '🍊'},
    'worms':  {'name': '🐛'}
  }
  Object.values(game.resources).forEach((res)=>{
    res.amount = 0
    res.permanent = 0
  })
  game.unlocks = {}
  game.state = {
    'current_character': 'arborist'
  }
  game.onrespec = {'resources': new DefaultDict(0), 'pre':[]}
  Object.values(tree).forEach(node => {
    node.status = 'deactivated'
    node.locked = true
  })
  tree['0'].locked = false
  // display purchase node hint after 5 seconds
  window.setTimeout(() => {
    let wasd_hint = function(){
      if (current_node_id() == 0 && tree['1'].status != 'activated' && tree['2'].status != 'activated'){
        // display wasd hint if player hasn't moved
        hint(get_string('hints','wasd'), game, 'wasd')
      }
    }
    if (current_node_id() == 0 && tree['0'].status != 'activated'){
      hint(get_string('hints','purchasenode'), game, 'purchasenode', wasd_hint, 2000)
    }else{
      wasd_hint()
    }
  }, 3000)
}

/*
  [NODE] node manipulation
*/
function current_node_id(){
  return current_character()['current_node']
}
function current_node(){
  return tree[current_node_id()]
}
// Check if node is activatable
function can_activate(node){
  if (game.resources.sp.amount < node.cost) return false
  return true
}
function unlock_neighbors(node){
  node.unlocks.forEach((id) => {
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
  let nx = node.pos[0]
  let ny = node.pos[1]
  return hit_circle(x, y, nx, ny, game.options.node_size)
}
// convert grid position to real position
game.gridpos_to_realpos = function(gridpos){
  let d = game.options.node_distance
  return [
    gridpos[0] * d * GOLD,
    gridpos[1] * d
  ]
}

/*
  [EVENT] event listeners (keyboard, mouse, resize, etc.)
*/
function init_listeners(){
  window.addEventListener('resize', resize)
  // button events
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
  // listen for mouse events
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
  // r: respec!
  if (keys_pressed['r']){
    respec()
    return
  }
  handle_movement()
  // Spacebar: activate current node
  if (keys_pressed[' ']){
    let h = game.hide_hint['purchasenode']
    if (h) h()
    let n = current_node()
    if (n.status == 'deactivated' && can_activate(n)){
      // update cost
      game.resources.sp.amount -= n.cost
      // run activate function
      if (typeof n.onactivate === 'function') n.onactivate(game)
      n.status = 'activated'
      unlock_neighbors(n)
      update_hud()
      // show respec hint when out of SP
      if (game.resources.sp.amount == 0){
        hint(get_string('hints','respec'), game, 'respec')
      }
    }
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
  let h = game.hide_hint['wasd']
  if (h) h()
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
  if(closest_node_id != null){
    // stop existing movement
    c.cancel_movement()
    let cn = current_node()
    cn.selected = false
    c.move(closest_node_id)
  }
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
  } else if (event.type === 'mouseup') {
    mouse.btn &= mouse.btnmask[event.which+2]
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

function click(x, y){
  // detect if any node was clicked
  if (!tree) return
  Object.values(tree).forEach(node => {
    if(hit_node(x, y, node)){
      debug(node)
    }
  })
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
  let restxt = ''
  Object.values(game.resources).forEach((r) => {
    if (r.amount > 0) r.show=true
    if (r.show){
      restxt += r.name+': '+r.amount+' '
    }
  })
  document.getElementById('resources').textContent = restxt
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
// todo convert new lines?
  document.getElementById('debug').textContent = JSON.stringify(thing)
}

// resize canvas based on viewport
function resize(){
  vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0)
  vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0)
  canvas.width  = vw*0.8
  canvas.height = vh*0.8
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
