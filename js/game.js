/* TODO
  HIGH
  autopan when selected node is far from center
  save/load
  autosave
  animations

  MEDIUM
  pan bugfix (mouse pan jumps sometimes??)
  better looking UI
  better color themes
  graphics for character, resources, etc.
*/

import {hit_circle, get_display_transform, DefaultDict} from './util.js'
import {draw_connection, draw_characters, draw_node} from './draw.js'
import {tree} from './tree.js'

var game = {}
game.resources = {
  'sp': {'name': 'SP', 'amount': 0, 'show': true},
  'figs': {'name': 'Figs', 'amount': 0},
  'worms':  {'name': 'Worms', 'amount': 0}
}
game.unlocks = {}
game.onrespec = {'resources': new DefaultDict(0), 'pre':[]}

var options={
  'scale_min': 0.75,
  'scale_max': 1.5,
  'animation_speed': 2.0,
  'max_travel_dist': 2,
  'lang': 'en',
  'node_size': 64,
  'node_distance': 24,
  'node_text_margin': 24,
  'autopan': true,
  'autopan_margin': 0.8,
  'theme': {
    'default': '#f00',
    'bgcolor': '#1a1f1a',
    'selected_node': '#f00',
    'nodes': {
      'link': '#fff',
      'deactivated': '#9a9',
      'activated': '#fff',
      'selected': '#efe',
      'text': '#000'
    }
  }
}
var characters = {}
var canvas, ctx            // canvas and drawing context
var vw, vh                 // viewport height/width
var current_character
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
var display_transform

window.onload = function(){
  init_game()
  init_listeners()
  animate()
}

function init_game(){
  canvas = document.getElementById('game_screen')
  ctx = canvas.getContext('2d')
  resize()
  // TODO save data format
  load_save()
  update_hud()
}

/*
  [GAME] core game functions
*/
// TODO load this stuff from a save file / browser cache
function load_save(){
  // Load tree node statuses
  Object.values(tree.nodes).forEach(node => {
    node.status = 'deactivated'
    node.locked = true
  })
  tree.nodes['0'].locked = false
  // Load characters
  let chara = new_character()
  characters.arborist = chara
  current_character = 'arborist'
}

function new_character(){
  return {
    'current_node': '0',
    'class': 'arborist',
    'color': '#ff0',
    'reset': function(){
      this.current_node = '0'
    }
  }
}

function respec(){
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
  Object.values(tree.nodes).forEach(node => {
    node.status = 'deactivated'
    node.locked = true
  })
  tree.nodes['0'].locked = false
  // reset resources
  Object.values(game.resources).forEach((res) => {
    res.amount = 0
  })
  // gain respec resources
  Object.entries(game.onrespec.resources).forEach(([k, res]) => {
    game.resources[k].amount += res
  })
  // reset onrespec
  game.onrespec = {'resources': new DefaultDict(0), 'pre':[]}
  update_hud()
}

/*
  [NODE] node manipulation
*/
// Check if node is activatable
game.current_node = function(){
  return tree.nodes[characters[current_character]['current_node']]
}
function can_activate(node){
  if (game.resources.sp.amount < node.cost) return false
  return true
}
function unlock_neighbors(node){
  node.unlocks.forEach((id) => {
    tree.nodes[id].locked = false
    tree.nodes[id].hidden = false
  })
}

/*
  [EVENT] event listeners (keyboard, mouse, resize, etc.)
*/
function init_listeners(){
  window.addEventListener('resize', resize)
  // get display transform to handle zoom and pan
  display_transform = get_display_transform(ctx, canvas, mouse)
  // listen for keyboard events
  document.addEventListener('keydown', function (e) {
    keys_pressed[e.key] = true
    handle_keyboard_input()
  })
  document.addEventListener('keyup', function (e) {
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
    let n = game.current_node()
    if (n.status == 'deactivated' && can_activate(n)){
      // update cost
      game.resources.sp.amount -= n.cost
      // run activate function
      if (typeof n.onactivate === 'function') n.onactivate(game)
      n.status = 'activated'
      unlock_neighbors(n)
      update_hud()
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
  let angle = Math.atan2(dy, dx)

  // find closest unlocked node in direction
  let current_node = tree.nodes[characters[current_character]['current_node']]
  let closest_distance = 9999
  let closest_angle = 10
  let closest_node_id = null
  let pos = current_node.pos
  Object.entries(tree.nodes).forEach(([k,node]) => {
    // skip self
    if (k == characters[current_character]['current_node']) return
    // skip hidden and locked
    if (node.hidden || node.locked) return
    dy = node.pos[1] - pos[1]
    dx = node.pos[0] - pos[0]
    let angle2 = Math.atan2(dy, dx)
    let diff = Math.abs(Math.atan2(Math.sin(angle2-angle), Math.cos(angle2-angle)))
    let dist = Math.sqrt(dx * dx + dy * dy)
    // Only allow traveling to nodes less than 90 degrees away
    if (diff < Math.PI*0.5 && dist <= closest_distance && dist < options.max_travel_dist){
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
    characters[current_character]['current_node'] = closest_node_id
    // pan after movement
    autopan()
  }
}

function hover_over(x, y){
  // hit detection for tree
  if (!tree || !tree.nodes)
    return
  Object.values(tree.nodes).forEach(node => {
    if(hit_circle(x, y, node.x, node.y, node.r)){
      node.selected = true
    }else{
      node.selected = false
    }
  })
}

function mouse_move(event) {
  let x = event.offsetX
  let y = event.offsetY
  hover_over(x, y)
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

/*
  [DRAW] drawing related functions
*/
function animate() {
  requestAnimationFrame(animate)
  draw()
}
function draw(){
  // update the transform
  display_transform.update()
  // set home transform to clear the screem
  display_transform.setHome()
  // draw background
  ctx.rect(0, 0, canvas.width, canvas.height)
  ctx.fillStyle = options.theme.bgcolor
  ctx.fill()
  // draw tree
  display_transform.setTransform()
  draw_tree()
}

function draw_tree(){
  if(!tree || !tree.nodes)
    return
  // get nodes to draw
  let nodes_to_draw = []
  Object.values(tree.nodes).forEach(node => {
    if(node.hidden==false){
      nodes_to_draw.push(node)
    }
  })
  // Draw connections between nodes
  nodes_to_draw.forEach(node => {
    node.unlocks.forEach(id => {
      let neighbor = tree.nodes[id]
      if(neighbor && !neighbor.hidden){
        draw_connection(ctx, node, neighbor, options)
      }
    })
  })
  // Draw characters
  draw_characters(ctx, characters, tree, options)

  // Draw nodes themselves
  nodes_to_draw.forEach(node => {
    draw_node(ctx, node, options)
  })
}

/*
  [UI] altering the interface and view
*/
function update_hud(){
  let restxt = ''
  Object.values(game.resources).forEach((r) => {
    if (r.amount > 0) r.show=true
    if (r.show){
      restxt += r.name+': '+r.amount+' '
    }
  })
  document.getElementById('hud').textContent = restxt
}

// resize canvas based on viewport
function resize(){
  vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0)
  vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0)
  canvas.width  = vw*0.8
  canvas.height = vh*0.8
}

// pan so that cursor is not too far from center
function autopan(){
  if (!options.autopan) return
  let pos = game.current_node().pos
  let d = options.node_distance
  let x = pos[0] * 6 * d
  let y = pos[1] * 4 * d
  let w = canvas.width * 0.5
  let h = canvas.height * 0.5
  // calculate distance from Œ˙a
  let dx = x - display_transform.x - w
  let dy = y - display_transform.y - h
  let m = options.autopan_margin
  // pan right
  if (dx > w*m){
    display_transform.x = (-w*m)+x-w
  }
  // pan down
  if (dy > h*m){
    display_transform.y = (-h*m)+y-h
  }
}
