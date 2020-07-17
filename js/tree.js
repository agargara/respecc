export function init_tree(){
  return {
    '0': {
      'pos': [
        0,
        0
      ],
      'cost': 0,
      'text': {
        'en': '+1 🌰'
      },
      'detail': {
        'en': 'Gain 1 🌰'
      },
      'area': 'Ground',
      'unlocks': [
        1,
        2
      ],
      'hidden': false,
      'onactivate': function(game){
        game.resources.sp.amount += 1
      },
      'selected': true
    },
    '1': {
      'pos': [
        0,
        -1
      ],
      'cost': 1,
      'text': {
        'en': '+2 🌰'
      },
      'area': 'trunk',
      'unlocks': [
        3,
        5
      ],
      'hidden': true,
      'onactivate': function(game){
        game.resources.sp.amount += 2
      }
    },
    '2': {
      'pos': [
        0,
        1
      ],
      'cost': 1,
      'text': {
        'en': '+1 🌰\non respec'
      },
      'area': 'trunk',
      'unlocks': [
        4,
        6
      ],
      'hidden': true,
      'onactivate': function(game){
        game.onrespec.resources.sp += 1
      }
    },
    '3': {
      'pos': [
        -1,
        -2
      ],
      'cost': 2,
      'text': {
        'en': '+3 🌰'
      },
      'area': 'trunk',
      'unlocks': [
        7,
        9
      ],
      'hidden': true,
      'onactivate': function(game){
        game.resources.sp.amount += 3
      }
    },
    '4': {
      'pos': [
        -1,
        2
      ],
      'cost': 2,
      'text': {
        'en': '+2 🌰\non respec'
      },
      'area': 'trunk',
      'unlocks': [
        8,
        10
      ],
      'hidden': true,
      'onactivate': function(game){
        game.onrespec.resources.sp += 2
      }
    },
    '5': {
      'pos': [
        1,
        -2
      ],
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
      'hidden': true,
      'onactivate': function(game){
        game.resources.figs.amount += 1
      }
    },
    '6': {
      'pos': [
        1,
        2
      ],
      'cost': 2,
      'text': {
        'en': '+1 🐛'
      },
      'shape': 'fat',
      'area': 'worms',
      'unlocks': [
        12,
        14
      ],
      'hidden': true,
      'onactivate': function(game){
        game.resources.worms.amount += 1
      }
    },
    '7': {
      'pos': [
        -2,
        -3
      ],
      'cost': 4,
      'text': {
        'en': '+5 🌰'
      },
      'area': 'trunk',
      'unlocks': [],
      'hidden': true,
      'onactivate': function(game){
        game.resources.sp.amount += 5
      }
    },
    '8': {
      'pos': [
        -2,
        3
      ],
      'cost': 4,
      'text': {
        'en': '+3 🌰 on respec'
      },
      'area': 'roots',
      'unlocks': [],
      'hidden': true,
      'onactivate': function(game){
        game.onrespec.resources.sp += 3
      }
    },
    '9': {
      'pos': [
        -1,
        -3
      ],
      'cost': 4,
      'text': {
        'en': '+0.5 🌰 per\nactive node'
      },
      'area': 'trunk',
      'unlocks': [],
      'hidden': true,
      'onactivate': function(game){
        Object.values(game.tree).forEach(node => {
          if (node.status == 'activated' )
            game.resources.sp.amount += 0.5
        })
      }
    },
    '10': {
      'pos': [
        -1,
        3
      ],
      'cost': 4,
      'text': {
        'en': '+0.5 🌰 per\nactive node\non respec'
      },
      'area': 'roots',
      'unlocks': [],
      'hidden': true,
      'onactivate': function(game){
        game.onrespec.pre.push(
          function(){
            Object.values(game.tree).forEach(node => {
              if (node.status == 'activated' )
                game.onrespec.resources.sp += 0.5
            })
          }
        )
      }
    },
    '11': {
      'pos': [
        1,
        -3
      ],
      'cost': 4,
      'text': {
        'en': '+2 🍊'
      },
      'area': 'figs',
      'shape': 'lump',
      'unlocks': [],
      'hidden': true,
      'onactivate': function(game){
        game.resources.figs.amount += 2
      }
    },
    '12': {
      'pos': [
        1,
        3
      ],
      'cost': 4,
      'text': {
        'en': '+2 🐛'
      },
      'area': 'worms',
      'unlocks': [],
      'hidden': true,
      'onactivate': function(game){
        game.resources.worms.amount += 2
      }
    },
    '13': {
      'pos': [
        2,
        -3
      ],
      'cost': 4,
      'text': {
        'en': 'Unlock\n🍊→🌰\nconversion'
      },
      'area': 'figs',
      'shape': 'lump',
      'unlocks': [],
      'hidden': true,
      'onactivate': function(game){
        game.unlocks.figtosp = true
      }
    },
    '14': {
      'pos': [
        2,
        3
      ],
      'cost': 4,
      'text': {
        'en': '🐛→🌰 discount'
      },
      'detail': {
        'en': '🌰 cost of underground nodes is reduced by 0.5 per 🐛.'
      },
      'area': 'worms',
      'unlocks': [],
      'hidden': true,
      'onactivate': function(game){
        game.unlocks.wormspbonus = true
      }
    }
  }
}
