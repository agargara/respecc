import Garden from './garden.js'

var game = {}

window.onload = function(){
  game.canvas = document.getElementById('garden_canvas')
  game.ctx = game.canvas.getContext('2d')
  game.garden = new Garden(game)
  add_control('height', 120, 10, 200, 10)
  add_control('branches', 12, 0, 30)
  add_control('thicc', 16, 1, 64)
  add_control('bend', 0.02, 0, 1, 0.01)
  add_control('slant', 0.03, 0, 1, 0.01)
  add_control('leaf_size', 8, 1, 64)
  add_control('min_leaf_level', 11, 0, 100)
  resize() // resize canvas based on viewport
  window.addEventListener('resize', resize)
  window.addEventListener('keydown', game.draw)
}

game.draw = function(){
  game.ctx.fillStyle = '#87ceeb'
  game.ctx.fillRect(0, 0, game.canvas.width, game.canvas.height)
  game.garden.draw()
  //requestAnimationFrame((time)=>{draw(time)})
}

function resize(){
  let vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0)
  let vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0)
  game.canvas.width  = vw*0.8 - 2 // subtract 2 for border
  game.canvas.height = vh*0.8 - 2
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
  control.addEventListener('change', ()=>{game.garden.reset()})
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
