import {init_resources} from './resources.js'
import {DefaultDict, deep_merge} from './util.js'
export default class Character {
  constructor(game, classy, node, color, name) {
    this.game = game
    this.nodes = game.nodes
    this.classy = classy
    this.start_node = node
    this.current_node = 0
    this.color = color
    this.name = name
    this.pos = Array.from(this.nodes[node].pos)
    this.reachable_nodes = {
      '0': true
    }
    this.level = 1
    this.portrait = 'img/portraits/'+this.classy+'.png'
    this.activated_nodes = new Map()
    this.nodes_to_activate = []
    this.resources = init_resources()
    this.onrespec = {'resources': new DefaultDict(0), 'pre':[]}
    this.abilities = {}
    this.canvas = document.createElement('canvas')
    this.canvas.height = 32
    this.canvas.width = 32
    this.ctx = this.canvas.getContext('2d')
    this.img = game.images['icon_'+this.classy]
  }

  reset(){
    this.nodes[this.current_node].selected = false
    this.current_node = this.start_node
    this.pos = Array.from(this.nodes[this.current_node].pos)
    this.reachable_nodes = {
      '0': true
    }
    // reset abilities
    this.abilities = {}
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
      if (node.permanent){
        node.respec()
      }else{
        node.status = 'deactivated'
        node.selected = false
        this.activated_nodes.delete(nodeid)
      }
    }
    // select current node
    this.nodes[this.current_node].selected = true
  }

  cancel_movement(){
    clearTimeout(this.move_timeout)
  }

  // Step one node in a given angle
  step(angle){
    // Closest neighbor must be less than 90 degrees
    let min_diff = Math.PI*0.5
    let closest_neighbor
    let dy,dx
    let cn = this.nodes[this.current_node]
    cn.neighbors.forEach((neighbor)=>{
      // skip hidden and unreachable
      let n = this.nodes[neighbor]
      if (!n || n.hidden || !n.is_reachable()) return
      // get difference in angles
      dx = n.pos[0] - cn.pos[0]
      dy = n.pos[1] - cn.pos[1]
      let angle2 = Math.atan2(dy, dx)
      let diff = angle2-angle
      if (diff > Math.PI) diff -= Math.PI*2
      if (diff < -Math.PI) diff += Math.PI*2
      diff = Math.abs(diff)
      if (diff < min_diff){
        min_diff = diff
        closest_neighbor = neighbor
      }
    })
    if (closest_neighbor)
      this.move(closest_neighbor)
  }

  move(target){
    // check that target is valid
    if(!this.reachable_nodes[target]) return
    let h = this.game.hide_hint['move']
    if (h) h()
    let cn = this.game.current_node()
    cn.selected = false
    this.cancel_movement()
    // redraw source node
    this.game.tree.nodes_to_redraw.add(cn)
    this.old_node = cn
    this._move(target)
  }

  _move(target){
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
      // redraw new node and old node
      this.game.tree.nodes_to_redraw.add(this.nodes[target])
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

  // unlock abilities
  unlock(ability){
    let keys = ability.split(' ')
    let abilities = keys.reverse().reduce((res, key) => ({[key]: res}), true)
    deep_merge(abilities, this.abilities)
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
  }

  can_activate(node, nodeid){
    return (
      !this.activated_nodes.has(nodeid) &&
      this.resources.sp.amount >= node.get_cost())
  }

  // try to convert resources
  convert_resources(res1, res2, num, do_conversion=false){
    let r1 = this.resources[res1]
    let r2 = this.resources[res2]
    if (!r1 || !r2) throw('Invalid resource')
    //if (num != Math.round(num)) throw('Whole number conversions only.')
    if (num > r1.amount) throw('Insufficient '+r1.name)
    let result = (num * r1.value) / r2.value
    if (result < 0) throw('Cannot convert to negative resources')
    if(do_conversion){
      r1.amount -= num
      r2.amount += result
      this.game.update_hud()
    }
    return result
  }

  get_node_status(nodeid){
    if (this.activated_nodes.has(nodeid))
      return 'activated'
    else
      return 'deactivated'
  }

  // called when loading save file
  reactivate_nodes(){
    if (!this.nodes_to_activate) return
    this.nodes_to_activate.forEach((nodeid) => {
      let node = this.nodes[nodeid]
      this.activated_nodes.set(nodeid, node)
    })
  }

  draw(){
    if (!this.image) return
    this.ctx.imageSmoothingEnabled = false
    this.ctx.drawImage(this.image, 0, 0)
    this.ctx.imageSmoothingEnabled = true
  }
}
