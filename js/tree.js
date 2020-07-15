export function init_tree(){
  return {
    '0': {
      'pos': [
        0,
        0
      ],
      'cost': 0,
      'text': {
        'en': 'Gain\n1 SP'
      },
      'area': 'Ground',
      'unlocks': [
        1,
        2
      ],
      'hidden': false,
      'onactivate': function(game){
        game.resources.sp.amount += 1
      }
    },
    '1': {
      'pos': [
        0,
        -1
      ],
      'shape': 'svg',
      'cost': 1,
      'text': {
        'en': 'Gain\n2 SP'
      },
      'area': 'trunk',
      'unlocks': [
        3,
        5
      ],
      'hidden': false,
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
        'en': 'Gain\n1 SP\non respec'
      },
      'area': 'trunk',
      'unlocks': [
        4,
        6
      ],
      'hidden': false,
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
        'en': 'Gain\n3 SP'
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
        'en': 'Gain\n2 SP\non respec'
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
        'en': 'Gain\n1 fig'
      },
      'area': 'figs',
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
        'en': 'Gain\n1 worm'
      },
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
        'en': 'Gain\n4 SP'
      },
      'area': 'trunk',
      'unlocks': [],
      'hidden': true,
      'onactivate': function(game){
        game.resources.sp.amount += 4
      }
    },
    '8': {
      'pos': [
        -2,
        3
      ],
      'cost': 4,
      'text': {
        'en': 'Gain\n3 SP on respec'
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
      'cost': 6,
      'text': {
        'en': 'Gain\n1 SP per\nactive node'
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
        'en': 'Gain\n0.5 SP per\nactive node\non respec'
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
        'en': 'Gain\n2 figs'
      },
      'area': 'figs',
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
        'en': 'Gain\n2 worms'
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
        'en': 'Unlock\nfig→SP\nconversion'
      },
      'area': 'figs',
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
        'en': 'Worms decrease\nSP cost of all\n underground nodes'
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
