import Garden from './garden.js'

var game = {}

window.onload = function(){
  game.canvas = document.getElementById('garden_canvas')
  game.ctx = game.canvas.getContext('2d')
  game.garden = new Garden(game)
  resize() // resize canvas based on viewport
  window.addEventListener('resize', resize)
  window.addEventListener('keydown', draw)
}

function draw(time){
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
  draw()
}
