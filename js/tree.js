class Node {
  constructor(game, node){
    this.game = game
    // set defaults
    this.init()
    // override
    Object.entries(node).forEach(([k, v]) => {
      this[k] = v
    })
  }

  init(){
    this.unlocks = []
    this.hidden = true
    this.status = 'deactivated'
    this.locked = true
    this.selected = false
    this.link_t = undefined
    this.outline_t = undefined
  }

  respec(){
    if (!this.permanent)
      this.status = 'deactivated'
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
}

export function init_tree(game){
  return {
    '0': new Node(game, {
      'pos': [0, 0],
      'cost': 0,
      'text': {
        'en': '+1 🌰'
      },
      'area': 'Ground',
      'unlocks': [ 1, 2 ],
      'hidden': false,
      'onactivate': function(game){
        game.current_character().resources.sp.amount += 1
      },
      'selected': true
    }),
    '1': new Node(game, {
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
    '2': new Node(game, {
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
    '3': new Node(game, {
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
    '4': new Node(game, {
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
    '5': new Node(game, {
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
    '6': new Node(game, {
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
    '7': new Node(game, {
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
    '8': new Node(game, {
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
    '9': new Node(game, {
      'pos': [ -1, -3 ],
      'cost': 4,
      'text': {
        'en': '+0.5 🌰 per\nactive node\n(max 8)'
      },
      'area': 'trunk',
      'unlocks': [],
      'onactivate': function(game){
        let amount = 0
        Object.values(game.tree).forEach(node => {
          if (node.status == 'activated' )
            amount += 0.5
        })
        if (amount > 8) amount = 8
        game.current_character().resources.sp.amount += amount
      }
    }),
    '10': new Node(game, {
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
            let amount = 0
            Object.values(game.tree).forEach(node => {
              if (node.status == 'activated' )
                amount += 0.5
            })
            if (amount > 8) amount = 8
            game.current_character().onrespec.resources.sp += amount
          }
        )
      }
    }),
    '11': new Node(game, {
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
    '12': new Node(game, {
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
    '13': new Node(game, {
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
    '14': new Node(game, {
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
    '15': new Node(game, {
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
    '16': new Node(game, {
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
    '17': new Node(game, {
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
}
