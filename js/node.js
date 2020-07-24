import {draw_points, draw_text, draw_round_rect} from './draw.js'

export default class Node {
  constructor(game, tree, node){
    this.tree = tree
    this.game = game
    // set defaults
    this.init()
    // override
    Object.entries(node).forEach(([k, v]) => {
      this[k] = v
    })
    // set shape
    if(!this.shape){
      if (this.pos[1] < 0)
        this.shape = 'defaultup'
      else
        this.shape = 'defaultdown'
    }
    this.canvas = document.createElement('canvas')
    this.w = this.game.options.node_size[0]
    this.h = this.game.options.node_size[1]
    this.canvas.width = this.game.options.node_size[0]
    this.canvas.height = this.game.options.node_size[1]
    this.ctx = this.canvas.getContext('2d')
    this.points = game.node_shapes[this.shape]
  }

  init(){
    this.unlocks = []
    this.hidden = true
    this.locked = true
    this.selected = false
    this.link_t = undefined
    this.outline_t = undefined
    this.status = 'deactivated'
    this.id=''
  }

  respec(){
    this.locked = true
  }

  get_cost(){
    let cost = this.cost
    // apply discounts
    let discount = 0
    if (this.game === undefined) return cost
    if (this.game.unlocks.wormspdiscount && this.pos[1] > 0){
      discount += this.game.current_character().resources.worms.amount*0.5
    }
    if (discount > cost*0.5)
      discount = cost*0.5
    return cost - discount
  }

  draw(){
    let color = this.game.get_color('nodes', this.status)
    this.ctx.fillStyle = color
    // partial outline when animating
    let t = 1
    if (this.outline_t != undefined)
      t = this.outline_t
    // add stroke if node is selected
    if (this.selected){
      color = this.game.get_color('nodes', 'selected')
      this.ctx.strokeStyle = color
      this.ctx.lineWidth = 8
      this.ctx.setLineDash([])
    }
    draw_points(this.ctx, 0, 0, this.points, t, true, this.selected)

    // don't draw text while node is animating
    if (this.link_t!=undefined && this.link_t < 1) return
    if (this.outline_t!=undefined && this.outline_t < 1) return
    this.draw_node_text()
  }

  draw_node_text(){
    let text = this.text[this.game.options.lang]
    let margin = this.game.options.node_text_margin
    let w = this.game.options.node_size[0]
    let h = this.game.options.node_size[1]
    let x = w*0.5
    let y = h*0.5
    if(text)
      draw_text(this.ctx, text, x, y, w-margin, this.game, 'center', 3)
    // draw cost in bottom left
    if (this.status != 'activated'){
      let cost = this.get_cost()+' 🌰'
      let costx = -w*0.5+14
      let costy = h*0.5+2
      this.ctx.fillStyle = this.game.get_color('nodes', 'cost')
      let costw = this.ctx.measureText(cost).width
      let ox = (costw-26)*0.5
      draw_round_rect(this.ctx, costx-18, costy-10, costw+8, 24, 4, true, false)
      draw_text(this.ctx, cost, costx+ox, costy, costw+8, this.game, 'center', 1)
    }
  }
}
