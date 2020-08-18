export default class Garden{
  constructor(game){
    this.game = game
    this.scale = 4
    this.trees = {
      'chestnut': new Tree(this.game.ctx, {
        'height': 100,
        'branches': 7,
        'thicc': 64,
        'bend': 0.02,
        'slant': 0.06,
        'leaf_size': 12,
        'min_leaf_level': 4
      })
    }
  }

  draw(){
    this.game.ctx.imageSmoothingEnabled = false
    let s = this.scale
    let ox = (this.game.canvas.width * 0.5)/s
    let oy = this.game.canvas.height/s
    this.game.ctx.scale(s, s)
    this.game.ctx.translate(ox, oy)
    Object.values(this.trees).forEach((tree)=>{
      tree.reset()
      this.game.ctx.fillStyle = '#AA471F'
      tree.grow()
      tree.draw_leaves()
    })
    this.game.ctx.scale(1, 1)
    this.game.ctx.setTransform(1,0,0,1,0,0)
  }

  reset(){
    let params = {
      'height': 120,
      'branches': 12,
      'thicc': 16,
      'bend': 0.02,
      'slant': 0.03,
      'leaf_size': 8,
      'min_leaf_level': 11
    }
    let _params = this.game.get_params()
    Object.entries(_params).forEach(([k,v])=>{
      params[k] = v
    })
    let tree = new Tree(this.game.ctx, params)
    this.trees = {
      'chestnut': tree
    }
    this.game.draw()
  }
}

class Tree{
  constructor(ctx, params){
    this.ctx = ctx
    Object.entries(params).forEach(([key,value])=>{
      this[key] = value
    })
    this.splits = Math.floor(this.height/this.branches)
    this.reset()
  }

  reset(){
    this.leaves = []
  }

  grow(){
    let new_growth = this._grow(Math.PI*0.5,0,0,0,0,this.height)
    while(new_growth.length > 0){
      let g = new_growth.pop()
      let n = this._grow(g[0],g[1],g[2],g[3],g[4],g[5])
      new_growth.push(...n)
    }
  }

  // grows and returns an array of new growth
  _grow(angle=Math.PI*0.5, slant=0, x=0, y=0, t=0, max_t=this.height){
    let new_growth = []
    let thicc = Math.floor(map_range_exp([0,this.height],[this.thicc,1],t,0.1))
    this.ctx.fillRect(Math.round(x-thicc*0.5), Math.round(y), thicc, thicc)
    if (t<max_t){
      x += Math.cos(angle)
      y -= Math.sin(angle)
      angle += slant
      if (angle > Math.PI || angle < -Math.PI*0.5){
        slant *= -1
      }
      if (t%this.splits == 0){
        let b = this.rand_bend()
        let s = this.rand_slant()
        max_t -= Math.floor(Math.random()*10)
        new_growth.push([angle+b, s, x, y, t+1, max_t])
        new_growth.push([angle-b, -s, x, y, t+1, max_t])
        if ((t/this.splits)>this.min_leaf_level){
          this.leaves.push([x, y, t/this.height])
        }
      }else{
        new_growth.push([angle, slant, x, y, t+1, max_t])
      }
    }else{
      this.leaves.push([x, y, 1])
    }
    return new_growth
  }

  draw_leaves(){
    this.leaves.forEach((leaf)=>{
      this.ctx.fillStyle = darken('#47AA1F', Math.random()*20)
      let size = Math.ceil(this.leaf_size * leaf[2] * Math.random())
      if (size < 1) size = 1
      this.draw_leaf(this.ctx, leaf[0], leaf[1], size)
    })
  }

  draw_leaf(ctx, x, y, size){
    fill_circle(ctx, x, y, size)
  }

  rand_bend(){
    let b = this.bend*0.2
    return (Math.random() * b) + (this.bend-b)
  }

  rand_slant(){
    let s = this.slant*0.8
    return (Math.random() * s) + (this.slant-s)
  }
}

function map_range_exp(from, to, n, pow){
  let normalized = map_range(from, [0,1], n)
  normalized = Math.pow(normalized, pow)
  return to[0] + normalized * (to[1]-to[0])
}

function map_range(from, to, n) {
  return to[0] + (n - from[0]) * (to[1] - to[0]) / (from[1] - from[0])
}

function rand_int(min, max){
  max = Math.ceil(max)
  min = Math.floor(min)
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function fill_circle(ctx, cx, cy, radius){
  let error = -radius
  let x = radius
  let y = 0
  while (x >= y){
    let last_y = y
    error += y
    y++
    error += y
    draw4lines(ctx, cx, cy, x, last_y)
    if (error >= 0) {
      if (x != last_y)
        draw4lines(ctx, cx, cy, last_y, x)
      error -= x
      x--
      error -= x
    }
  }
}

function draw4lines(ctx, cx, cy, x, y){
  ctx.fillRect(cx - x, cy + y, 2*x, 1)
  if (y != 0)
    ctx.fillRect(cx - x, cy - y, 2*x, 1)
}


/**
 * Lighten or Darken Color
 *
 * The CSS preprocessors Sass and LESS can take any color and darken() or
 * lighten() it by a specific value. But no such ability is built into
 * JavaScript. This function takes colors in hex format (i.e. #F06D06, with or
 * without hash) and lightens or darkens them with a value.
 *
 * @param {String} colorCode The hex color code (with or without # prefix).
 * @param {Int} amount
 */
function darken(colorCode, amount) {
  var usePound = false
  if (colorCode[0] == '#') {
    colorCode = colorCode.slice(1)
    usePound = true
  }

  var num = parseInt(colorCode, 16)

  var r = (num >> 16) + amount

  if (r > 255) {
    r = 255
  } else if (r < 0) {
    r = 0
  }

  var b = ((num >> 8) & 0x00FF) + amount

  if (b > 255) {
    b = 255
  } else if (b < 0) {
    b = 0
  }

  var g = (num & 0x0000FF) + amount

  if (g > 255) {
    g = 255
  } else if (g < 0) {
    g = 0
  }

  return (usePound ? '#' : '') + (g | (b << 8) | (r << 16)).toString(16)
}
