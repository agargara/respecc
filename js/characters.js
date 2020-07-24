import {init_resources} from './resources.js'
import {DefaultDict} from './util.js'
class Character {
  constructor(game, classy, node, color) {
    this.game = game
    this.nodes = game.nodes
    this.classy = classy
    this.start_node = node
    this.current_node = 0
    this.color = color
    this.pos = Array.from(this.nodes[node].pos)
    this.reachable_nodes = {
      '0': true
    }
    this.level = 1
    this.portrait = 'img/portraits/'+this.classy+'.png'
    this.activated_nodes = new Map()
    this.resources = init_resources()
    this.onrespec = {'resources': new DefaultDict(0), 'pre':[]}
    this.canvas = document.createElement('canvas')
    this.canvas.height = 32
    this.canvas.width = 32
    this.ctx = this.canvas.getContext('2d')
    // TODO split image into separate characters
    this.img = game.images['characters']
  }

  reset(){
    this.current_node = this.start_node
    this.pos = Array.from(this.nodes[this.current_node].pos)
    this.reachable_nodes = {
      '0': true
    }
    // reset resources
    Object.values(this.resources).forEach((res) => {
      res.amount = res.permanent
    })
    // gain respec resources
    Object.entries(this.onrespec.resources).forEach(([k, res]) => {
      this.resources[k].amount += res
    })
    // reset onrespec
    this.onrespec = {'resources': new DefaultDict(0), 'pre':[]}
    // delete activated nodes except permanent ones
    for (let [nodeid, node] of this.activated_nodes){
      if (node.permanent)
        node.respec()
      else
        this.activated_nodes.delete(nodeid)
    }
  }

  cancel_movement(){
    clearTimeout(this.move_timeout)
  }

  move(target){
    let h = this.game.hide_hint['move']
    if (h) h()
    this.cancel_movement()
    this._move(target)
  }

  _move(target){
    // check that target is valid
    if(!this.reachable_nodes[target]) return
    let cn = this.game.current_node()
    cn.selected = false
    // no animation?
    if (this.game.options.animation_speed <= 0){
      this.pos = this.nodes[target].pos
      this.current_node = target
      return
    }
    let target_pos = this.nodes[target].pos
    // move towards target and retrigger move
    let dx = target_pos[0] - this.pos[0]
    let dy = target_pos[1] - this.pos[1]
    // reached target?
    if (Math.abs(dx) < 0.03 && Math.abs(dy) < 0.03){
      this.pos = Array.from(target_pos)
      this.current_node = target
      this.reachable_nodes[target] = true
      this.nodes[target].selected = true
      return
    }
    this.pos[0] += dx*0.1
    this.pos[1] += dy*0.1
    this.game.autopan()
    this.move_timeout = setTimeout(
      () => {
        this._move(target)
      },
      50/this.game.animation_speed
    )
  }

  // try to purchase current node
  purchase(){
    let node = this.nodes[this.current_node]
    if (!this.can_activate(node, this.current_node))
      return
    // update cost
    this.resources.sp.amount -= node.get_cost()
    // add to list of activated nodes
    this.activated_nodes.set(this.current_node, node)
    node.status = 'activated'
    // purchase node
    this.game.purchase_node(node)
    // show respec hint when out of SP
    if (this.resources.sp.amount == 0){
      this.game.hint('respec')
    }
  }

  can_activate(node, nodeid){
    return (
      !this.activated_nodes.has(nodeid) &&
      this.resources.sp.amount >= node.get_cost())
  }

  get_node_status(nodeid){
    if (this.activated_nodes.has(nodeid))
      return 'activated'
    else
      return 'deactivated'
  }

  draw(){
    if (!this.image) return
    this.ctx.imageSmoothingEnabled = false
    this.ctx.drawImage(this.image, 0, 0)
  }
}
export function init_characters(game) {
  return {
    'arborist': new Character(
      game,
      'Arborist',
      0,
      '#8E9B58', // moss green
    )
  }
}
