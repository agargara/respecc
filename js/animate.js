export default class Animate{
  constructor(game){
    this.game = game
    this.animations = []
  }

  // gradually reveal a new node
  reveal_node(node,parent){
    node.link_t = 0
    node.outline_t = 0
    let interval = setInterval(()=>{
      // slowly reveal connections
      if (node.link_t!=undefined){
        node.link_t += (0.005*this.game.options.animation_speed)
        if (node.link_t >= 1.0){
          node.hidden = false
          node.link_t = undefined
        }
      }
      // slowly reveal node
      if (node.outline_t!=undefined && !node.hidden){
        node.outline_t += (0.02*this.game.options.animation_speed)
        if (node.outline_t >= 1.0){
          node.locked = false
          node.outline_t = undefined
          clearInterval(interval)
        }
      }
      this.game.nodes_to_redraw.add(node)
      this.game.nodes_to_redraw.add(parent)
    }, 17)
    this.animations.push(interval)
  }
}
