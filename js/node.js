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
    this.neighbors = new Set(this.unlocks)
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
    this.canvas.width = this.game.options.node_distance[0]
    this.canvas.height = this.game.options.node_distance[1]
    this.padx = Math.ceil(this.canvas.width*0.5 - this.w*0.5)
    this.pady = Math.ceil(this.canvas.height*0.5 - this.h*0.5)
    this.ctx = this.canvas.getContext('2d')
    this.points = game.node_shapes[this.shape]
  }

  init(){
    this.unlocks = []
    this.parents = new Set()
    this.hidden = true
    this.selected = false
    this.link_t = undefined
    this.outline_t = undefined
    this.status = 'deactivated'
    this.id=''
  }

  reset(){
    this.selected = false
    this.status = 'deactivated'
  }

  is_reachable(){
    if (!this.id) return false
    return this.game.current_character().reachable_nodes[this.id]
  }

  respec(){
  }

  get_cost(){
    let cost = this.cost
    // apply discounts
    let discount = 0
    if (this.game === undefined) return cost
    let c = this.game.current_character()
    if (c.abilities['wormspdiscount'] && this.pos[1] > 0){
      discount += this.game.current_character().resources.worms.amount*0.2
    }
    if (c.abilities['figspdiscount'] && this.pos[1] < 0){
      discount += this.game.current_character().resources.figs.amount*0.2
    }
    if (discount > cost*0.5)
      discount = cost*0.5
    return Math.ceil(cost - discount)
  }

  draw(){
    this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height)
    let color = this.game.get_color('nodes', this.status)
    this.ctx.fillStyle = color
    // partial outline when animating
    let t = 1.0
    if (this.outline_t != undefined)
      t = this.outline_t
    let x = this.padx
    let y = this.pady

    // outline node if selected
    if (this.selected){
      this.ctx.strokeStyle = this.game.get_color('nodes', 'selected')
      let strokew = this.game.options.selected_stroke_width || 8
      this.ctx.lineWidth = strokew
      this.ctx.setLineDash([])
    }
    draw_points(this.ctx, x, y, this.points, t, true, this.selected)
  }

  // [optimize] this method is currently unused, as text is redrawn every frame on the main canvas to get better resolution. At high node counts it might be necessary to use this method instead to prevent costly fillText operations every frame
  draw_node_text(){
    let w = this.game.options.node_size[0]
    let h = this.game.options.node_size[1]
    let x = w*0.5+this.padx
    let y = h*0.5+this.pady

    let text = this.text[this.game.options.lang]
    let margin = this.game.options.node_text_margin
    if(text)
      draw_text(this.ctx, text, x, y, w-margin, this.game, 'center', 3)

    // draw cost in bottom left
    if (this.status != 'activated'){
      let cost = this.get_cost()+' 🌰'
      let costx = x-w*0.5+14
      let costy = y+h*0.5-2
      this.ctx.fillStyle = this.game.get_color('nodes', 'cost')
      let costw = this.ctx.measureText(cost).width
      let ox = (costw-26)*0.5
      draw_round_rect(this.ctx, costx-18, costy-10, costw+8, 24, 4, true, false)
      draw_text(this.ctx, cost, costx+ox, costy, costw+8, this.game, 'center', 1)
    }
  }
}
