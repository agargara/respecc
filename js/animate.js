export default class Animate{
  constructor(game){
    this.game = game
    this.animations = []
    this.cancel_functions = []
  }

  cancel_animations(){
    this.animations.forEach((anim)=>{
      clearInterval(anim)
    })
    this.cancel_functions.forEach((func)=>{
      func()
    })
    this.animations = []
    this.cancel_functions = []
  }

  // gradually reveal a new node
  reveal_node(source,target){
    target.link_t = 0
    target.outline_t = 0
    return new Promise((resolve, reject) => {
      let interval = setInterval(()=>{
        // slowly reveal connections
        if (target.link_t!=undefined){
          target.link_t += (0.05*this.game.options.animation_speed)
          if (target.link_t >= 1.0){
            target.hidden = false
            target.link_t = undefined
          }
        }
        // slowly reveal node
        if (target.outline_t!=undefined && !target.hidden){
          target.outline_t += (0.02*this.game.options.animation_speed)
          // finished revealing:
          if (target.outline_t >= 1.0){
            target.outline_t = undefined
            clearInterval(interval)
            resolve()
          }
        }
        this.game.tree.nodes_to_redraw.add(source)
        this.game.tree.nodes_to_redraw.add(target)
      }, 17)
      this.animations.push(interval)
      this.cancel_functions.push(()=>{
        target.outline_t = undefined
        target.link_t = undefined
        reject()
      })
    })
  }
}
