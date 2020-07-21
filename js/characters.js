import {init_resources} from './resources.js'
import {DefaultDict} from './util.js'
import {get_string} from './strings.js'
class Character {
  constructor(game, classy, node, color) {
    this.game = game
    this.tree = game.tree
    this.classy = classy
    this.start_node = node
    this.current_node = 0
    this.color = color
    this.pos = Array.from(this.tree[node].pos)
    this.reachable_nodes = {
      '0': true
    }
    this.level = 1
    this.img = '../img/portraits/'+this.classy+'.png'
    this.activated_nodes = new Map()
    this.resources = init_resources()
    this.onrespec = {'resources': new DefaultDict(0), 'pre':[]}
  }

  reset(){
    this.current_node = this.start_node
    this.pos = Array.from(this.tree[this.current_node].pos)
    this.reachable_nodes = {
      '0': true
    }
    // reset resources
    this.resources.forEach((res) => {
      res.amount = res.permanent
    })
    // gain respec resources
    this.onrespec.resources.forEach(([k, res]) => {
      this.resources[k].amount += res
    })
    // reset onrespec
    this.onrespec = {'resources': new DefaultDict(0), 'pre':[]}
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
      this.pos = this.tree[target].pos
      this.current_node = target
      return
    }
    let target_pos = this.tree[target].pos
    // move towards target and retrigger move
    let dx = target_pos[0] - this.pos[0]
    let dy = target_pos[1] - this.pos[1]
    // reached target?
    if (Math.abs(dx) < 0.03 && Math.abs(dy) < 0.03){
      this.pos = Array.from(target_pos)
      this.current_node = target
      this.reachable_nodes[target] = true
      this.tree[target].selected = true
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

  // try to purchase target node
  purchase(target){
    let node = this.tree[target]
    if (!this.can_activate(node))
      return
    // update cost
    this.resources.sp.amount -= node.get_cost()
    // add to list of activated nodes
    this.activated_nodes.set(target, node)
    // show respec hint when out of SP
    if (this.resources.sp.amount == 0){
      this.game.hint('respec')
    }
    // purchase node
    this.game.purchase_node(node)
  }

  can_activate(node){
    return (node.status === 'deactivated' && this.resources.sp.amount < node.get_cost())
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
