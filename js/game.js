import { get } from './util.js'

var global_options={
  'scale_min': 0.75,
  'scale_max': 1.5,
  'animation_speed': 2.0,
}
var theme = {
  'bgcolor': '#1a1f1a',
  'selected_node': '#f00'
}
var canvas, ctx            // canvas and drawing context
var vw, vh                 // viewport height/width
var camera={x:0,y:0,z:1.0} // camera position
var tree={}
var redraw = false

window.onload = function(){
  init_game()
  init_ui()
  animate()
}

function init_game(){
  canvas = document.getElementById('game_screen')
  ctx = canvas.getContext('2d')
  resize()
  // load tree svg
  get('img/big_tree_test.svg', load_tree)
}

// resize canvas based on viewport
function resize(){
  vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0)
  vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0)
  canvas.width  = vw*0.8
  canvas.height = vh*0.8
}

function load_tree(svg){
  tree['svg'] = svg.documentElement
  get_node_locations(svg)
  let img = new Image()
  let xml = (new XMLSerializer()).serializeToString(svg.documentElement)
  img.src = 'data:image/svg+xml;base64,' + btoa(xml)
  tree['image'] = img
  img.onload = function() { redraw=true }
}

function get_node_locations(svg){
  tree['nodes'] = {}
  let circles = svg.getElementsByTagName('circle')
  let i = 0
  Array.from(circles).forEach(function(circle) {
    let id = 'node_'+i
    i++
    tree['nodes'][id] = {
      'x': circle.getAttribute('cx'),
      'y': circle.getAttribute('cy'),
      'r': circle.getAttribute('r'),
      'name': circle.getAttribute('id')
    }
  })
}

function init_ui(){
  // initialize zoom slider
  var ui_zoom = document.getElementById('ui_zoom')
  ui_zoom.addEventListener('input', function(){
    camera['z'] = this.value
    redraw = true
  })
  // set mouse move events
  canvas.addEventListener('mousemove', e => {
    let x = e.offsetX
    let y = e.offsetY
    hover_over(x, y)
  })
}

function hover_over(x, y){
  // hit detection for tree
  if (!tree['nodes'])
    return
  Object.entries(tree['nodes']).forEach(([k,node]) => {
    if(hit_circle(x, y, node['x'], node['y'], node['r'])){
      node['selected'] = true
      redraw = true
    }else{
      node['selected'] = false
    }
  })
}

function hit_circle(x1, y1, x2, y2, r){
  let dx = x1 - x2
  let dy = y1 - y2
  let distance = Math.sqrt(dx * dx + dy * dy)
  if (distance < r)
    return true
  else
    return false
}

function animate() {
  requestAnimationFrame(animate)
  if (redraw){
    redraw = false
    draw()
  }
}
function draw(){
  // draw background
  ctx.rect(0, 0, canvas.width, canvas.height)
  ctx.fillStyle = theme['bgcolor']
  ctx.fill()
  // draw tree
  draw_tree()
}

function draw_tree(){
  if (!tree['svg'])
    return
  let viewbox = tree['svg'].viewBox.baseVal
  let w = viewbox['width']
  let h = viewbox['height']
  ctx.drawImage(tree['image'], camera['x'], camera['y'], camera['z']*w, camera['z']*h)
  // highlight selected areas
  Object.entries(tree['nodes']).forEach(([k,node]) => {
    if(node['selected']){
      draw_circle(node['x'], node['y'], node['r'], theme['selected_node'])
    }
  })
}

function draw_circle(x, y, r, color){
  ctx.beginPath()
  ctx.arc(x, y, r, 0, 2 * Math.PI, false)
  ctx.fillStyle = color
  ctx.fill()
}

/* initialize zoom buttons
  var btns = document.getElementsByClassName('btnzoom')
  Array.from(btns).forEach(function(btn) {
    btn.addEventListener('click', function(){init_zoom_btn(this)}, false)
  })
}

function init_zoom_btn(btn){
  var scale = btn.getAttribute('data-scale')
  camera['z'] = parseFloat(scale)
  draw()
}
*/
