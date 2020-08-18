import Garden from './garden.js'

var game = {}
var scale = 4
window.onload = function(){
  game.canvas = document.getElementById('garden_canvas')
  game.ctx = game.canvas.getContext('2d')
  game.garden = new Garden(game)
  add_control('height', 120, 10, 200, 10)
  add_control('branches', 8, 0, 30)
  add_control('thicc', 48, 1, 64)
  add_control('bend', 0.02, 0, 1, 0.01)
  add_control('slant', 0.03, 0, 1, 0.01)
  add_control('leaf_size', 32, 1, 64)
  add_control('min_leaf_level', 3, 0, 100)
  add_control('seed', 0, 0, 128)
  resize() // resize canvas based on viewport
  window.addEventListener('resize', resize)
  window.addEventListener('keydown', resize)
}

game.draw = function(){
  game.ctx.fillStyle = '#2da4b6'
  game.ctx.fillRect(0, 0, game.canvas.width, game.canvas.height)
  game.garden.draw()
  //requestAnimationFrame((time)=>{draw(time)})
}

function resize(){
  game.canvas.width  = Math.floor(game.canvas.offsetWidth*(1/scale))
  game.canvas.height = Math.floor(game.canvas.offsetHeight*(1/scale))
  game.draw()
}

function add_control(param,defaultValue,min,max,step=1){
  let label = document.createElement('label')
  label.innerHTML = param
  label.setAttribute('for', param)
  let control = document.createElement('input')
  control.classList.add('control')
  control.setAttribute('type', 'number')
  control.setAttribute('defaultValue', defaultValue)
  control.setAttribute('value', defaultValue)
  control.setAttribute('min', min)
  control.setAttribute('max', max)
  control.setAttribute('step', step)
  control.setAttribute('id', param)
  control.addEventListener('change', ()=>{
    game.garden.grow()
    resize()
  })
  let controls = document.getElementById('controls')
  controls.appendChild(label)
  controls.appendChild(control)
}

game.get_params = function(){
  let params = {}
  let controls = document.getElementsByClassName('control')
  Array.from(controls).forEach((control)=>{
    params[control.id] = parseFloat(control.value)
  })
  return params
}
