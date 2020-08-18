const leaf_palette = [
  '#4ec054',
  '#2d9848',
  '#176e13',
  '#03501e',
  '#012618',
]
const trunk_palette = [
  '#a6792e',
  '#8e5737',
  '#4f2e03',
  '#271305'
]

const default_tree_params = {
  'height': 120,
  'branches': 8,
  'thicc': 48,
  'bend': 0.02,
  'slant': 0.03,
  'leaf_size': 32,
  'min_leaf_level': 3,
  'seed': 0
}

class Palette{
  constructor(colors, idx){
    this.colors = colors
    this.idx = idx
  }

  get_color(){
    let n = this.colors.length
    let c = this.colors[ping_pong_mod(this.idx, n)]
    return c
  }

  randshift(rand){
    let r = rand.quick()
    if (r>0.5)
      this.idx++
    else
      this.idx--
  }
}

export default class Garden{
  constructor(game){
    this.game = game
    this.grow()
  }

  grow(){
    let params = Object.assign({},default_tree_params)
    let _params = this.game.get_params()
    Object.entries(_params).forEach(([k,v])=>{
      params[k] = v
    })
    this.trees = {
      'chestnut': new Tree(this.game.ctx, params)
    }
    Object.values(this.trees).forEach((tree)=>{
      tree.grow()
    })
  }

  draw(){
    this.game.ctx.imageSmoothingEnabled = false
    let ox = Math.floor((this.game.canvas.width * 0.5))
    let oy = Math.floor(this.game.canvas.height)
    this.game.ctx.translate(ox, oy)
    Object.values(this.trees).forEach((tree)=>{
      tree.draw()
    })
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
    this.pixels = []
    this.leaves = []
    this.trunk_palette = new Palette(trunk_palette, trunk_palette.length)
    this.rand = new Math.seedrandom(this.seed)
  }

  draw(){
    this.pixels.forEach((p) => {
      let color = p[4]
      for (let i=0; i<p[2]; i++){
        for (let j=0; j<p[3]; j++){
          this.ctx.fillStyle = color
          this.ctx.fillRect(p[0]+i, p[1]+j, 1, 1)
        }
        color = darken(color, 20)
      }
    })
  }

  grow(){
    let new_growth = this._grow(Math.PI*0.5,0,0,0,0,this.height)
    while(new_growth.length > 0){
      let g = new_growth.pop()
      let n = this._grow(g[0],g[1],g[2],g[3],g[4],g[5])
      new_growth.push(...n)
    }
    this.grow_leaves()
  }

  // grows and returns an array of new growth
  _grow(angle=Math.PI*0.5, slant=0, x=0, y=0, t=0, max_t=this.height){
    let new_growth = []
    let thicc = Math.floor(map_range_exp([0,this.height],[this.thicc,1],t,0.1))
    let px = Math.round(x-thicc*0.5)
    let py = Math.round(y)
    this.pixels.push([px, py, thicc, 1, this.trunk_palette.get_color()])
    if(this.rand.quick() > 0.75)
      this.trunk_palette.randshift(this.rand)
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
        max_t -= Math.floor(this.rand.quick()*10)
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

  grow_leaves(){
    this.leaves.forEach((leaf)=>{
      let size = Math.ceil(this.leaf_size * leaf[2] * this.rand.quick())
      if (size < 1) size = 1
      //let color = darken(leafcolor, this.rand.quick()*20)
      let palette = new Palette(leaf_palette, 2)
      this.grow_leaf(leaf[0], leaf[1], size, palette)
    })
  }

  grow_leaf(x, y, size, palette){
    let new_leaves = this._grow_leaf(x,y,size,palette)
    let drawn_pixels = new Set()
    while(new_leaves.length > 0){
      let leaf = new_leaves.pop()
      let pos = leaf[0]+','+leaf[1]
      if (!drawn_pixels.has(pos)){
        drawn_pixels.add(pos)
        let n = this._grow_leaf(leaf[0],leaf[1],leaf[2],leaf[3])
        new_leaves.push(...n)
      }
    }
  }

  _grow_leaf(x,y,size,palette){
    let new_leaves = []
    this.pixels.push([Math.round(x),Math.round(y),1,1,palette.get_color()])
    size--
    if (size < 1) return []
    let r = this.rand.quick()
    if (r > 0.75)
      palette.randshift(this.rand)
    if(this.rand.quick() > 0.3)
      new_leaves.push([x+1, y, size, palette])
    if(this.rand.quick() > 0.3)
      new_leaves.push([x, y+1, size, palette])
    if(this.rand.quick() > 0.3)
      new_leaves.push([x-1, y, size, palette])
    if(this.rand.quick() > 0.3)
      new_leaves.push([x, y-1, size, palette])
    return new_leaves
  }

  rand_bend(){
    let b = this.bend*0.2
    return (this.rand.quick() * b) + (this.bend-b)
  }

  rand_slant(){
    let s = this.slant*0.8
    return (this.rand.quick() * s) + (this.slant-s)
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

function ping_pong_mod(i, n){
  let cycle = 2 * n
  i = ((i%cycle)+cycle)%cycle
  if (i >= n)
    return cycle - 1 - i
  return i
}
