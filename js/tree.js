import Node from './node.js'
import {drawBezierSplit} from './draw.js'

export default class Tree{
  constructor(game){
    this.game = game
    this.CHUNKW=game.options.node_distance[0]*32
    this.CHUNKH=game.options.node_distance[1]*32
    this.canvases = []
    this.canvas_offsets = []
    this.nodes = this.init_tree()
    this.nodes_to_redraw = new Set()
    this.get_bounds()
    this.init_canvases()
  }

  init_tree(){
    let game = this.game
    let nodes = {
      '0': new Node(game, this, {
        'pos': [0, 0],
        'cost': 0,
        'text': {
          'en': '+1 🌰'
        },
        'area': 'Ground',
        'unlocks': [ 1, 2, -100],
        'hidden': false,
        'onactivate': function(game){
          game.current_character().resources.sp.amount += 1
        },
      }),
      '1': new Node(game, this, {
        'pos': [ 0, -1 ],
        'cost': 1,
        'text': {
          'en': '+2 🌰'
        },
        'area': 'trunk',
        'unlocks': [ 3, 5 ],
        'onactivate': function(game){
          game.current_character().resources.sp.amount += 2
        }
      }),
      '2': new Node(game, this, {
        'pos': [ 0, 1 ],
        'cost': 1,
        'text': {
          'en': '+1 🌰\non respec'
        },
        'area': 'trunk',
        'unlocks': [ 4, 6 ],
        'onactivate': function(game){
          game.current_character().onrespec.resources.sp += 1
        }
      }),
      '3': new Node(game, this, {
        'pos': [ -1, -2 ],
        'cost': 2,
        'text': {
          'en': '+3 🌰'
        },
        'area': 'trunk',
        'unlocks': [ 7, 9 ],
        'onactivate': function(game){
          game.current_character().resources.sp.amount += 3
        }
      }),
      '4': new Node(game, this, {
        'pos': [ -1, 2 ],
        'cost': 2,
        'text': {
          'en': '+2 🌰\non respec'
        },
        'area': 'trunk',
        'unlocks': [ 8, 10 ],
        'onactivate': function(game){
          game.current_character().onrespec.resources.sp += 2
        }
      }),
      '5': new Node(game, this, {
        'pos': [ 1, -2 ],
        'cost': 2,
        'text': {
          'en': '+1 🍊'
        },
        'area': 'figs',
        'shape': 'lump',
        'unlocks': [
          11,
          13
        ],
        'onactivate': function(game){
          game.current_character().resources.figs.amount += 1
        }
      }),
      '6': new Node(game, this, {
        'pos': [ 1, 2 ],
        'cost': 2,
        'text': {
          'en': '+1 🐛'
        },
        'area': 'worms',
        'shape': 'wiggly',
        'unlocks': [
          12,
          14
        ],
        'onactivate': function(game){
          game.current_character().resources.worms.amount += 1
        }
      }),
      '7': new Node(game, this, {
        'pos': [ -2, -3 ],
        'cost': 4,
        'text': {
          'en': '+5 🌰'
        },
        'area': 'trunk',
        'unlocks': [15, 17],
        'onactivate': function(game){
          game.current_character().resources.sp.amount += 5
        }
      }),
      '8': new Node(game, this, {
        'pos': [ -2, 3 ],
        'cost': 4,
        'text': {
          'en': '+3 🌰 on respec'
        },
        'area': 'roots',
        'unlocks': [16],
        'onactivate': function(game){
          game.current_character().onrespec.resources.sp += 3
        }
      }),
      '9': new Node(game, this, {
        'pos': [ -1, -3 ],
        'cost': 4,
        'text': {
          'en': '+0.5 🌰 per\nactive node\n(max 8)'
        },
        'area': 'trunk',
        'unlocks': [],
        'onactivate': function(game){
          let amount = 0.5 * game.current_character().activated_nodes.size
          if (amount > 8) amount = 8
          game.current_character().resources.sp.amount += amount
        }
      }),
      '10': new Node(game, this, {
        'pos': [ -1, 3 ],
        'cost': 4,
        'text': {
          'en': '+0.5 🌰 per active node on respec (max 8)'
        },
        'shape': 'fat',
        'area': 'roots',
        'unlocks': [],
        'onactivate': function(game){
          game.onrespec.pre.push(
            function(){
              let amount = 0.5 * game.current_character().activated_nodes.size
              if (amount > 8) amount = 8
              game.current_character().onrespec.resources.sp += amount
            }
          )
        }
      }),
      '11': new Node(game, this, {
        'pos': [ 1, -3 ],
        'cost': 4,
        'text': {
          'en': '+2 🍊'
        },
        'area': 'figs',
        'shape': 'lump',
        'unlocks': [],
        'onactivate': function(game){
          game.current_character().resources.figs.amount += 2
        }
      }),
      '12': new Node(game, this, {
        'pos': [ 1, 3 ],
        'cost': 4,
        'text': {
          'en': '+2 🐛'
        },
        'area': 'worms',
        'shape': 'wiggly',
        'unlocks': [],
        'onactivate': function(game){
          game.current_character().resources.worms.amount += 2
        }
      }),
      '13': new Node(game, this, {
        'pos': [ 2, -3 ],
        'cost': 4,
        'text': {
          'en': 'unlock\n🍊→🌰'
        },
        'detail': {
          'en': 'Unlock the ability to convert 🍊 to 🌰. Starting rate is 1🍊→2🌰.'
        },
        'area': 'figs',
        'shape': 'lump',
        'unlocks': [],
        'onactivate': function(game){
          game.unlock('figtosp')
        }
      }),
      '14': new Node(game, this, {
        'pos': [ 2, 3 ],
        'cost': 4,
        'text': {
          'en': '🐛→🌰 discount'
        },
        'detail': {
          'en': '🌰 cost of underground nodes is reduced by 0.5 per 🐛. (Maximum discount: 50%)'
        },
        'area': 'worms',
        'shape': 'wiggly',
        'unlocks': [],
        'onactivate': function(game){
          game.unlock('wormspdiscount')
        }
      }),
      '15': new Node(game, this, {
        'pos': [ -3, -3 ],
        'cost': 8,
        'text': {
          'en': '+1 🌰\n(permanent)'
        },
        'detail': {
          'en': 'Permanently gain +1 🌰. Can only be purchased once per character.'
        },
        'area': 'trunk',
        'unlocks': [],
        'onactivate': function(game){
          game.current_character().resources.sp.permanent += 1
          game.current_character().resources.sp.amount += 1
        },
        'permanent': true
      }),
      '16': new Node(game, this, {
        'pos': [ -3, 3 ],
        'cost': 8,
        'text': {
          'en': '+1 🌰\n(permanent)'
        },
        'detail': {
          'en': 'Permanently gain +1 🌰. Can only be purchased once per character.'
        },
        'area': 'underground',
        'unlocks': [],
        'onactivate': function(game){
          game.current_character().resources.sp.permanent += 1
          game.current_character().resources.sp.amount += 1
        },
        'permanent': true
      }),
      '17': new Node(game, this, {
        'pos': [ -2, -4 ],
        'cost': 8,
        'text': {
          'en': '+10 🌰'
        },
        'area': 'trunk',
        'unlocks': [],
        'onactivate': function(game){
          game.current_character().resources.sp.amount += 10
        },
      }),
    }
    // Add id & neighbor information to nodes
    Object.entries(nodes).forEach(([id, node])=>{
      node.id = id
      node.unlocks.forEach((neighbor)=>{
        if (nodes[neighbor] != undefined)
          nodes[neighbor].parents.add(node)
      })
    })
    return nodes
  }

  get_bounds(){
    this.minx = 0
    this.maxx = 0
    this.miny = 0
    this.maxy = 0
    Object.values(this.nodes).forEach((node)=>{
      if (node.pos[0] < this.minx)
        this.minx = node.pos[0]
      if (node.pos[0] > this.maxx)
        this.maxx = node.pos[0]
      if (node.pos[1] < this.miny)
        this.miny = node.pos[1]
      if (node.pos[1] > this.maxy)
        this.maxy = node.pos[1]
    })
    this.maxx += 1
    this.maxy += 1
  }

  // make enough canvases to separate tree into chunks
  init_canvases(){
    let [maxx, maxy] = this.game.gridpos_to_realpos([this.maxx, this.maxy])
    let [minx, miny] = this.game.gridpos_to_realpos([this.minx, this.miny])
    let totalw = maxx - minx
    let totalh = maxy - miny
    let w = Math.ceil(totalw / this.CHUNKW)
    let h = Math.ceil(totalh / this.CHUNKH)
    let midw = totalw*0.5 + this.game.options.node_size[0]*0.5
    let midh = totalh*0.5 + this.game.options.node_size[1]*0.5
    for (let i=0; i<w; i++){
      this.canvases[i] = new Array(h)
      this.canvas_offsets[i] = new Array(h)
      for (let j=0; j<h; j++){
        this.canvases[i][j] = this.make_canvas()
        let cx = i-(w*0.5)+0.5
        let cy = j-(h*0.5)+0.5
        this.canvas_offsets[i][j] = [
          cx*this.CHUNKW - midw,
          cy*this.CHUNKH - midh
        ]
      }
    }
  }

  make_canvas(){
    let canvas = document.createElement('canvas')
    canvas.width = this.CHUNKW
    canvas.height = this.CHUNKH
    return canvas
  }

  clear(){
    this.canvases.forEach((i)=>{
      i.forEach((j)=>{
        let ctx = j.getContext('2d')
        ctx.clearRect(0,0,j.width,j.height)
      })
    })
  }

  draw(){
    // Draw connections
    Object.values(this.nodes).forEach((node)=>{
      this.draw_connections(node)
    })
    // Draw nodes
    Object.values(this.nodes).forEach(node => {
      if(node.hidden==false){
        node.draw()
        this.draw_node(node)
      }
    })
  }

  clear_node(node){
    // determine which canvas to clear
    let [i,j,x,y] = this.grid_to_treepos(node.pos)
    let canvas = this.canvases[i][j]
    let ctx = canvas.getContext('2d')
    ctx.clearRect(x-node.padx,y-node.pady,node.canvas.width,node.canvas.height)
  }

  draw_node(node){
    if (node.hidden) return
    // determine upon which canvas to draw
    let [i,j,x,y] = this.grid_to_treepos(node.pos)
    let canvas = this.canvases[i][j]
    let ctx = canvas.getContext('2d')
    ctx.drawImage(node.canvas, x-node.padx, y-node.pady)
  }

  redraw_nodes(){
    this.nodes_to_redraw.forEach((node)=>{
      this.redraw_node(node)
    })
    this.nodes_to_redraw.clear()
  }

  redraw_node(node){
    // clear canvas
    this.clear_node(node)
    // draw connections
    this.draw_connections(node)
    node.parents.forEach((parent)=>{
      this.draw_connections(parent)
    })
    // draw nodes
    node.draw()
    this.draw_node(node)
    node.parents.forEach((parent)=>{
      parent.draw()
      this.draw_node(parent)
    })
  }

  draw_connections(node){
    node.unlocks.forEach((id)=>{
      let neighbor = this.nodes[id]
      if (neighbor && (!neighbor.hidden || neighbor.link_t !== undefined)){
        this.draw_connection(node, neighbor)
      }
    })
  }

  draw_connection(node1, node2){
    let [a,b,c,d] = this.get_connection_points(node1,node2)
    let [i1,j1,x1,y1] = this.grid_to_treepos([a,b])
    let [i2,j2,x2,y2] = this.grid_to_treepos([c,d])
    let canvas = this.canvases[i1][j1]
    let ctx = canvas.getContext('2d')
    if (!(i1==i2 && j1==j2)){
      console.log('TODO different canvases')
    }
    // control points
    let cx = x2
    let cy = y1
    // progress
    let t = 1.0
    if (node2.link_t!=undefined)
      t = node2.link_t
    let color
    // dashed line if destination is unreachable and visible
    if (!node2.is_reachable() && !node2.hidden && !(node2.outline_t!=undefined && node2.outline_t < 1)){
      color = this.game.get_color('nodes', 'link_locked')
      ctx.setLineDash([6, 6])
    }else{
      color = this.game.get_color('nodes', 'link')
      ctx.setLineDash([])
    }
    ctx.lineWidth = 8
    ctx.strokeStyle = color
    drawBezierSplit(ctx, x1, y1, cx, cy, x2, y2, 0, t)
  }

  get_connection_points(node1, node2){
    let x1=0, x2=0, y1=0, y2=0
    let dx = node2.pos[0] - node1.pos[0]
    let dy = node2.pos[1] - node1.pos[1]
    if (dx == 0){   // same x
      if (dy > 0)   // node2 below node1
        y1 = 1
      else          // node2 above node1
        y1 = -1
      y2 = -y1
    }else{          // different x
      let sign = -1 // node2 left of node1
      if (dx > 0)   // node2 right of node1
        sign = 1
      x1 = sign
      if (dy == 0){ // same y
        x2 = -sign
      }else if (dy > 0){
        y2 = -1  // node2 below node1
      }else{
        y2 = 1   // node2 above node1
      }
    }
    let rw = 0.5*this.game.options.node_size[0] / this.game.options.node_distance[0]
    let rh = 0.5*this.game.options.node_size[1] / this.game.options.node_distance[1]
    return [
      node1.pos[0]+((x1+1)*rw),
      node1.pos[1]+((y1+1)*rh),
      node2.pos[0]+((x2+1)*rw),
      node2.pos[1]+((y2+1)*rh)
    ]
  }

  // Convert grid position to tree position
  // (divided into chunks)
  grid_to_treepos(pos){
    let d = this.game.options.node_distance
    let x = (pos[0] - this.minx)
    let y = (pos[1] - this.miny)
    let divx = this.CHUNKW/d[0]
    let divy = this.CHUNKH/d[1]
    let i = Math.floor(x/divx)
    let j = Math.floor(y/divy)
    x = (x%divx)*d[0]
    y = (y%divy)*d[1]
    return [i,j,x,y]
  }
}
