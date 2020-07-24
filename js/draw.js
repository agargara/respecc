const GOLD = 1.618033989

export default class Draw {
  constructor(game){
    this.game = game
    this.ctx = game.ctx
    this.dt = game.display_transform
    this.t = 0
    this.times = []
    this.init_draw()
  }

  init_draw(){
    // start animation loop
    requestAnimationFrame((time)=>{this.draw(time)})
  }

  draw(time){
    // update transform
    this.dt.update()
    this.clear()
    // draw FPS
    this.draw_debug(this.get_fps(time)+'fps')
    // draw tree canvas
    this.draw_tree()
    requestAnimationFrame((time)=>{this.draw(time)})
  }

  clear(){
    // set home transform to clear the screem
    this.dt.setHome()
    this.ctx.fillStyle = this.game.get_color('bgcolor')
    this.ctx.fillRect(0, 0, this.game.canvas.width, this.game.canvas.height)
    // set transform again
    this.dt.setTransform()
  }

  draw_tree(){
    for (let i=0; i<this.game.tree.canvases.length; i++){
      let row = this.game.tree.canvases[i]
      for(let j=0; j<row.length; j++){
        let c = row[j]
        let offset = this.game.tree.canvas_offsets[i][j]
        this.ctx.drawImage(c, offset[0],offset[1])
      }
    }
  }

  draw_debug(text){
    this.dt.setHome()
    let x = this.game.canvas.width-12, y = 24
    this.ctx.fillStyle = '#000'
    this.ctx.fillRect(x, y+3, -32, -18)
    this.ctx.fillStyle = '#fff'
    this.ctx.textAlign = 'right'
    this.ctx.font = '12px sans-serif'
    this.ctx.fillText(text, x, y)
    this.dt.setTransform()
  }

  get_fps(time){
    this.times.push(time-this.t)
    this.t = time
    if (this.times.length > 6) this.times.shift()
    const sum = this.times.reduce((a, b) => a + b, 0)
    const avg = (sum / this.times.length) || 0
    return Math.ceil(1000/avg)
  }
}


/*
function draw_tree(ctx, game){
  let tree = game.tree
  if(!tree)
    return
  // get nodes to draw
  let nodes_to_draw = []
  Object.values(tree).forEach(node => {
    if(node.hidden==false){
      nodes_to_draw.push(node)
    }
  })

  // Draw connections between nodes
  nodes_to_draw.forEach(node => {
    node.unlocks.forEach(id => {
      let neighbor = tree[id]
      if(neighbor){
        if(!neighbor.hidden || neighbor.link_t != undefined){
          animate(neighbor, game)
          draw_connection(ctx, node, neighbor, game)
        }
      }
    })
  })

  // Draw nodes themselves
  nodes_to_draw.forEach(node => {
    animate(node, game)
    node.draw()
  })

  // Draw characters
  draw_characters(ctx, game)

  // Draw node's detail description
  draw_node_detail(ctx, game)
}
*/

// process node animations
function animate(node, game){
  // slowly reveal connections
  if (node.link_t!=undefined && node.link_t < 1){
    node.link_t += (0.05*game.options.animation_speed)
    if (node.link_t >= 1.0){
      node.hidden = false
      node.link_t = undefined
    }
  }
  // slowly reveal nodes
  if (node.outline_t!=undefined && node.outline_t < 1 && !node.hidden){
    node.outline_t += (0.02*game.options.animation_speed)
    if (node.outline_t >= 1.0){
      node.locked = false
      node.outline_t = undefined
    }
  }
}

export function draw_connection(ctx, node1, node2, game){
  let [x1, y1, x2, y2] = get_connection_points(node1, node2, game)
  // control point
  let cx = x2
  let cy = y1
  // progress
  let t = 1.0
  if (node2.link_t!=undefined)
    t = node2.link_t
  let color
  // dashed line if destination is locked and visible
  if (node2.locked && !node2.hidden && !(node2.outline_t!=undefined && node2.outline_t < 1)){
    color = game.get_color('nodes', 'link_locked')
    ctx.setLineDash([6, 6])
  }else{
    color = game.get_color('nodes', 'link')
    ctx.setLineDash([])
  }
  ctx.lineWidth = 8
  ctx.strokeStyle = color
  drawBezierSplit(ctx, x1, y1, cx, cy, x2, y2, 0, t)
}

// [optimize] don't recalculate this stuff every draw frame...
function get_connection_points(node1, node2, game){
  let [x1, y1] = game.gridpos_to_realpos(node1.pos)
  let [x2, y2] = game.gridpos_to_realpos(node2.pos)
  let xoffset = game.options.node_size[0]*0.5
  let yoffset = game.options.node_size[1]*0.5
  // [optimize] there's probably a clever way to simplify the logic below but my brain hurts too much to figure it out
  if (x1 == x2){
    if (y2 < y1){
      // node 2 is directly above node 1:
      y1 += -yoffset
      y2 += yoffset
    }else{
      // node 2 is directly below node 1:
      y1 += yoffset
      y2 += -yoffset
    }
  }else{
    // node 2: left or right of node 1?
    let sign = 1
    if (x2 < x1){
      sign = -1
    }
    x1 += xoffset*sign
    if (y1 == y2){
      // same level
      x2 += xoffset*sign
    }else if (y2 < y1){
      // up
      y2 += yoffset
    }else{
      // down
      y2 += -yoffset
    }
  }
  return [x1, y1, x2, y2]
}

function draw_node_text(ctx, node, game){
  let text = node.text[game.options.lang]
  let [x,y] = game.gridpos_to_realpos(node.pos)
  let margin = game.options.node_text_margin
  let w = game.options.node_size[0] - margin
  let h = game.options.node_size[1]
  if(text)
    draw_text(ctx, text, x, y, w, game, 'center', 3)
  // draw cost in bottom left
  if (node.status === 'deactivated'){
    let cost = node.get_cost()+' 🌰'
    let costx = x-w*0.5+14
    let costy = y+h*0.5+2
    ctx.fillStyle = game.get_color('nodes', 'cost')
    let costw = ctx.measureText(cost).width
    let ox = (costw-26)*0.5
    draw_round_rect(ctx, costx-18, costy-10, costw+8, 24, 4, true, false)
    draw_text(ctx, cost, costx+ox, costy, costw+8, game, 'center', 1)
  }
}

export function draw_text(ctx, text, x, y, max_width, game, text_align='center', max_lines=3){
  ctx.fillStyle = game.get_color('nodes', 'text')
  ctx.textAlign = text_align
  let size = 12
  ctx.font = size + 'px sans-serif'
  let lines =  word_wrap(ctx, text, max_width)
  // shrink text to fit in max lines
  while (lines.length > max_lines){
    size -= 0.5
    ctx.font = size + 'px sans-serif'
    lines =  word_wrap(ctx, text, max_width)
  }
  let lineheight = size+2
  let yoffset = lineheight*0.5*(lines.length-1)-size*0.5
  if (lines.length > 2)
    yoffset += size*0.25
  lines.forEach((line, i) => {
    ctx.fillText(line, x, y+(i*lineheight)-yoffset)
  })
  /* TODO
  // replace emoji with images
  ctx.imageSmoothingEnabled = false
  ctx.drawImage(game.images.sp, x, y) */
}

function draw_characters(ctx, game){
  if (!game.images.characters) return
  // Draw each character
  let offset = game.options.node_size[1]-16
  Object.values(game.characters).forEach(chara => {
    let pos = game.gridpos_to_realpos(chara.pos)
    // TODO draw just part of characters.png based on character class
    // TODO offset x&y when multiple characters on node
    ctx.imageSmoothingEnabled = false
    ctx.drawImage(game.images.characters, pos[0]-offset, pos[1]-offset)
  })
}



// draw a portion of a point array
export function draw_points(ctx, x, y, points, portion, fill=true, stroke=false){
  let z = points.length
  let len1 = z
  if (portion < 1){
    len1 = Math.ceil(z*portion*0.5)
  }
  ctx.beginPath()
  // draw first half
  ctx.moveTo(points[0].x+x,points[0].y+y)
  for (let i=1; i<len1; i++)
    ctx.lineTo(points[i].x+x,points[i].y+y)
  if(portion<1){
    let len2 = z-len1
    // draw second half
    ctx.moveTo(points[0].x+x,points[0].y+y)
    for (let i=z-1; i>=len2; i--)
      ctx.lineTo(points[i].x+x,points[i].y+y)
  }
  ctx.closePath()
  if (fill) ctx.fill()
  if (stroke) ctx.stroke()
}

function draw_node_detail(ctx, game){
  let node = game.current_node()
  // draw details
  if (!(node.selected && game.options.show_node_details && node.detail))
    return

  let [x,y] = game.gridpos_to_realpos(node.pos)
  let w = game.options.node_size[0]
  let ww = w*GOLD
  let margin = 12
  let padding = 16
  ctx.fillStyle = game.get_color('nodes', 'detailbg')
  ctx.lineWidth = 4
  ctx.strokeStyle = game.get_color('nodes', 'detailborder')
  let text = node.detail[game.options.lang]
  let lines =  word_wrap(ctx, text, ww-8)
  let hh = lines.length * 12+padding
  draw_round_rect(ctx, x+w*0.5+margin, y-hh*0.5-padding*0.5, ww+padding, hh+padding, 16, true, true)
  ctx.fillStyle = game.get_color('nodes', 'detailtext')
  draw_text(ctx, node.detail[game.options.lang], x+w*0.5+margin+padding*0.5+ww*0.5, y, ww-padding, game, 'center', 20)
}



/**
 * Draws a portion of a quadratic curve
 *
 * @param ctx       The canvas context to draw to
 * @param x0        The x-coord of the start point
 * @param y0        The y-coord of the start point
 * @param x1        The x-coord of the control point
 * @param y1        The y-coord of the control point
 * @param x2        The x-coord of the end point
 * @param y2        The y-coord of the end point
 * @param t0        The start ratio of the splitted bezier from 0.0 to 1.0
 * @param t1        The start ratio of the splitted bezier from 0.0 to 1.0
 */
export function drawBezierSplit(ctx, x0, y0, x1, y1, x2, y2, t0, t1) {
  ctx.beginPath()

  if( 0.0 == t0 && t1 == 1.0 ) {
    ctx.moveTo( x0, y0 )
    ctx.quadraticCurveTo( x1, y1, x2, y2 )
  } else if( t0 != t1 ) {
    var t00 = t0 * t0,
      t01 = 1.0 - t0,
      t02 = t01 * t01,
      t03 = 2.0 * t0 * t01

    var nx0 = t02 * x0 + t03 * x1 + t00 * x2,
      ny0 = t02 * y0 + t03 * y1 + t00 * y2

    t00 = t1 * t1
    t01 = 1.0 - t1
    t02 = t01 * t01
    t03 = 2.0 * t1 * t01

    var nx2 = t02 * x0 + t03 * x1 + t00 * x2,
      ny2 = t02 * y0 + t03 * y1 + t00 * y2

    var nx1 = lerp ( lerp ( x0 , x1 , t0 ) , lerp ( x1 , x2 , t0 ) , t1 ),
      ny1 = lerp ( lerp ( y0 , y1 , t0 ) , lerp ( y1 , y2 , t0 ) , t1 )

    ctx.moveTo( nx0, ny0 )
    ctx.quadraticCurveTo( nx1, ny1, nx2, ny2 )
  }

  ctx.stroke()
  ctx.closePath()
}
/**
 * Draws a rounded rectangle using the current state of the canvas.
 * If you omit the last three params, it will draw a rectangle
 * outline with a 5 pixel border radius
 * @param {CanvasRenderingContext2D} ctx
 * @param {Number} x The top left x coordinate
 * @param {Number} y The top left y coordinate
 * @param {Number} width The width of the rectangle
 * @param {Number} height The height of the rectangle
 * @param {Number} [radius = 5] The corner radius It can also be an object
 *                 to specify different radii for corners
 * @param {Number} [radius.tl = 0] Top left
 * @param {Number} [radius.tr = 0] Top right
 * @param {Number} [radius.br = 0] Bottom right
 * @param {Number} [radius.bl = 0] Bottom left
 * @param {Boolean} [fill = false] Whether to fill the rectangle.
 * @param {Boolean} [stroke = true] Whether to stroke the rectangle.
 */
export function draw_round_rect(ctx, x, y, width, height, radius, fill, stroke) {
  if (typeof stroke === 'undefined') {
    stroke = true
  }
  if (typeof radius === 'undefined') {
    radius = 5
  }
  if (typeof radius === 'number') {
    radius = {tl: radius, tr: radius, br: radius, bl: radius}
  } else {
    var defaultRadius = {tl: 0, tr: 0, br: 0, bl: 0}
    for (var side in defaultRadius) {
      radius[side] = radius[side] || defaultRadius[side]
    }
  }
  ctx.beginPath()
  ctx.moveTo(x + radius.tl, y)
  ctx.lineTo(x + width - radius.tr, y)
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr)
  ctx.lineTo(x + width, y + height - radius.br)
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height)
  ctx.lineTo(x + radius.bl, y + height)
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl)
  ctx.lineTo(x, y + radius.tl)
  ctx.quadraticCurveTo(x, y, x + radius.tl, y)
  ctx.closePath()
  if (fill) {
    ctx.fill()
  }
  if (stroke) {
    ctx.stroke()
  }
}

export function draw_circle(ctx, x, y, r, color){
  ctx.beginPath()
  ctx.arc(x, y, r, 0, 2 * Math.PI, false)
  ctx.fillStyle = color
  ctx.fill()
}

function word_wrap(ctx, text, maxw) {
  let words = text.split(/[ \n]+/)
  let lines = []
  let currentline = words[0]
  words.forEach((word, i) => {
    if (i==0) return
    let w = ctx.measureText(currentline + ' ' + word).width
    if (w < maxw) {
      currentline += ' ' + word
    } else {
      lines.push(currentline)
      currentline = word
    }
  })
  lines.push(currentline)
  return lines
}

function draw_debug_text(ctx, game){
  let text = game.debugtext
  ctx.fillStyle = '#fff'
  ctx.textAlign = 'right'
  ctx.font = '12px sans-serif'
  let x = game.canvas.width-12, y = 24
  let lines = text.split('\n')
  game.display_transform.setHome()
  lines.forEach((line, i) => {
    ctx.fillText(line, x, y+(i*12))
  })
}

/**
 * Linearly interpolates between two numbers
 */
function lerp(v0, v1, t) {
  return ( 1.0 - t ) * v0 + t * v1
}
