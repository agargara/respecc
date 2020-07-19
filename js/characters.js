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
  }

  reset(){
    this.current_node = this.start_node
    this.pos = Array.from(this.tree[this.current_node].pos)
    this.reachable_nodes = {
      '0': true
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
}
export function init_characters(game) {
  return {
    'arborist': new Character(
      game,
      'arborist',
      0,
      '#8E9B58' // moss green
    )
  }
}
