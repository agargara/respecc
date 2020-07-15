export function draw_tree(ctx, game){
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
          draw_connection(ctx, node, neighbor, game)
        }
      }
    })
  })
  // Draw characters
  draw_characters(ctx, game)

  // Draw nodes themselves
  nodes_to_draw.forEach(node => {
    draw_node(ctx, node, game)
  })
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
 * @param {Number} [radius = 5] The corner radius; It can also be an object
 *                 to specify different radii for corners
 * @param {Number} [radius.tl = 0] Top left
 * @param {Number} [radius.tr = 0] Top right
 * @param {Number} [radius.br = 0] Bottom right
 * @param {Number} [radius.bl = 0] Bottom left
 * @param {Boolean} [fill = false] Whether to fill the rectangle.
 * @param {Boolean} [stroke = true] Whether to stroke the rectangle.
 */
function draw_round_rect(ctx, x, y, width, height, radius, fill, stroke) {
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

export function draw_connection(ctx, node1, node2, game){
  let [x1, y1, x2, y2] = get_connection_points(node1, node2, game)
  // control point
  let cx = x2
  let cy = y1
  // progress
  let t = 1.0
  // slowly reveal nodes
  if (node2.link_t!=undefined && node2.link_t < 1){
    t = node2.link_t
    node2.link_t += (0.05*game.options.animation_speed)
    if (node2.link_t >= 1.0){
      t = 1
      node2.locked = false
      node2.hidden = false
      node2.link_t = undefined
    }
  }

  let color
  // dashed line if destination is locked and visible
  if (node2.locked && !node2.hidden){
    color = get_color(game.options.theme, 'nodes', 'link_locked')
    ctx.setLineDash([6, 6])
  }else{
    color = get_color(game.options.theme, 'nodes', 'link')
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
  let yoffset = game.options.node_size*0.5
  let xoffset = yoffset*1.618033989
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

function draw_node(ctx, node, game){
  let h = game.options.node_size
  let w = h*1.618033989
  let [x,y] = game.gridpos_to_realpos(node.pos)
  let margin = game.options.node_text_margin
  let color = get_color(game.options.theme, 'nodes', node.status)
  ctx.fillStyle = color
  if (node.shape == 'heart'){
    draw_heart(ctx, x, y, w, h, true, false)
  }else if (node.shape == 'svg'){
    let points = game.testpoints
    ctx.lineWidth = 10
    ctx.strokeStyle = '#f60'
    draw_points(ctx, points, 0.5)
  }else{
    // default shape: rounded rectangle
    draw_round_rect(ctx, x-w*0.5, y-h*0.5, w, h, h*0.5, true, false)
  }

  let text = node.text[game.options.lang]
  if (text){
    text = text+'\nCost: '+node.cost+' SP'
    draw_node_text(ctx, text, x, y, w-margin, game.options)
  }
}

function draw_heart(ctx, x, y, w, h, fill=false, stroke=false){
  y += 4
  h = h*0.5
  w = w*0.75
  let c1 = 2.5
  let c2 = 0.75
  ctx.beginPath()
  ctx.moveTo(x, y+h)
  ctx.bezierCurveTo(x-w, y+(h*c2), x-w, y-(h*c1), x, y-h)
  ctx.bezierCurveTo(x+w, y-(h*c1), x+w, y+(h*c2), x, y+h)
  //ctx.quadraticCurveTo(x+w, y-(h*c), x, y+h)
  ctx.closePath()
  if (fill) {
    ctx.fill()
  }
  if (stroke) {
    ctx.stroke()
  }
}

function draw_node_text(ctx, text, x, y, max_width, options){
  ctx.fillStyle = get_color(options.theme, 'nodes', 'text')
  ctx.textAlign = 'center'
  let size = 12
  ctx.font = size + 'px sans-serif'
  let h = ctx.measureText('M').width
  let lines = text.split('\n')
  let yoffset = (lines.length*0.5*size)-h
  lines.forEach((line, i) => {
    ctx.fillText(line, x, y+(i*size)-yoffset)
  })
}

function draw_characters(ctx, game){
  // Draw outlines for each character
  Object.values(game.characters).forEach(chara => {
    let pos = game.gridpos_to_realpos(chara.pos)
    let [x,y] = [pos[0], pos[1]]
    let h = game.options.node_size
    let w = h*1.618033989
    ctx.lineWidth = 12
    ctx.setLineDash([])
    ctx.strokeStyle = chara.color
    draw_round_rect(ctx, x-w*0.5, y-h*0.5, w, h, h*0.5, false, true)
  })
}

// get color from theme, return default if not found
function get_color(theme, key1, key2){
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

// draw a portion of a point arrat
function draw_points(ctx, points, portion){
  let len = points.length*portion
  ctx.beginPath()
  ctx.moveTo(points[0].x,points[0].y)
  for (let i=1; i<len; i++)
    ctx.lineTo(points[i].x,points[i].y)
  ctx.stroke()
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
function drawBezierSplit(ctx, x0, y0, x1, y1, x2, y2, t0, t1) {
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
 * Linearly interpolates between two numbers
 */
function lerp(v0, v1, t) {
  return ( 1.0 - t ) * v0 + t * v1
}
