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

export function draw_connection(ctx, node1, node2, options){
  let r = options.node_distance
  let x1 = node1.pos[0] * r * 6
  let y1 = node1.pos[1] * r * 4
  let x2 = node2.pos[0] * r * 6
  let y2 = node2.pos[1] * r * 4
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.quadraticCurveTo(x2, y1, x2, y2)
  let color = get_color(options.theme, 'nodes', 'link')
  ctx.strokeStyle = color
  ctx.stroke()
}

export function draw_node(ctx, node, options){
  let h = options.node_size
  let w = h*1.618033989
  let d = options.node_distance
  let x = node.pos[0] * d * 6
  let y = node.pos[1] * d * 4
  let margin = options.node_text_margin
  let color = get_color(options.theme, 'nodes', node.status)
  ctx.fillStyle = color
  draw_round_rect(ctx, x-w*0.5, y-h*0.5, w, h, h*0.5, true, false)
  let text = node.text[options.lang]
  if (text){
    draw_node_text(ctx, text, x, y, w-margin, options)
  }
}

function draw_node_text(ctx, text, x, y, max_width, options){
  ctx.fillStyle = get_color(options.theme, 'nodes', 'text')
  ctx.textAlign = 'center'
  let lines = text.split('\n')
  let size = 12
  ctx.font = size + 'px sans-serif'
  let yoffset = (lines.length-2) * size
  lines.forEach((line, i) => {
    ctx.fillText(line, x, y+(i*size)-yoffset)
  })
}

export function draw_characters(ctx, characters, tree, options){
  // Draw outlines for each character
  Object.values(characters).forEach(chara => {
    let node = tree.nodes[chara.current_node]
    let d = options.node_distance
    let x = node.pos[0] * d * 6
    let y = node.pos[1] * d * 4
    let h = options.node_size
    let w = h*1.618033989
    h+=8
    w+=8
    ctx.fillStyle = chara.color
    draw_round_rect(ctx, x-w*0.5, y-h*0.5, w, h, h*0.5, true, false)
//    draw_circle(ctx, x, y, r+4, chara.color)
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
