import Node from './node.js'
import {drawBezierSplit} from './draw.js'

export default class Tree{
  constructor(game){
    this.game = game
    this.CHUNKW=game.options.node_distance[0]*32
    this.CHUNKH=game.options.node_distance[1]*32
    this.canvases = []
    this.offset = [0,0]
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
        'unlocks': [ 1, 2 ],
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
        'unlocks': [ 3, 'figs00' ],
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
      'figs00': new Node(game, this, {
        'pos': [ 1, -2 ],
        'cost': 2,
        'text': {
          'en': '+1 🍊'
        },
        'area': 'figs',
        'shape': 'lump',
        'unlocks': [
          'figs01',
          'figs02'
        ],
        'onactivate': function(game){
          game.current_character().resources.figs.amount += 1
        }
      }),
      'figs01': new Node(game, this, {
        'pos': [ 1, -3 ],
        'cost': 4,
        'text': {
          'en': '+2 🍊'
        },
        'area': 'figs',
        'shape': 'lump',
        'unlocks': ['figs03'],
        'onactivate': function(game){
          game.current_character().resources.figs.amount += 2
        }
      }),
      'figs02': new Node(game, this, {
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
        'unlocks': ['figs09'],
        'onactivate': function(game){
          game.unlock('figtosp')
        }
      }),
      'figs03': new Node(game, this, {
        'pos': [ 1, -4 ],
        'cost': 8,
        'text': {
          'en': '+4 🍊'
        },
        'area': 'figs',
        'shape': 'lump',
        'unlocks': ['figs04'],
        'onactivate': function(game){
          game.current_character().resources.figs.amount += 4
        }
      }),
      'figs04': new Node(game, this, {
        'pos': [ 1, -5 ],
        'cost': 12,
        'text': {
          'en': '+8 🍊'
        },
        'area': 'figs',
        'shape': 'lump',
        'unlocks': ['figs05','figs06'],
        'onactivate': function(game){
          game.current_character().resources.figs.amount += 8
        }
      }),
      'figs05': new Node(game, this, {
        'pos': [ 1, -6 ],
        'cost': 30,
        'text': {
          'en': '+10 🍊 (permanent)'
        },
        'detail': {
          'en': 'Permanently gain +10 🍊. Can only be purchased once per character.'
        },
        'area': 'figs',
        'shape': 'lump',
        'unlocks': [],
        'onactivate': function(game){
          game.current_character().resources.figs.permanent += 10
          game.current_character().resources.figs.amount += 10
        },
        'permanent': true
      }),
      'figs06': new Node(game, this, {
        'pos': [ 0, -6 ],
        'cost': 4,
        'text': {
          'en': '+1 🍊'
        },
        'area': 'figs',
        'shape': 'lump',
        'unlocks': ['figs07'],
        'onactivate': function(game){
          game.current_character().resources.figs.amount += 1
        }
      }),
      'figs07': new Node(game, this, {
        'pos': [ 0, -7 ],
        'cost': 8,
        'text': {
          'en': '+2 🍊'
        },
        'area': 'figs',
        'shape': 'lump',
        'unlocks': ['figs08'],
        'onactivate': function(game){
          game.current_character().resources.figs.amount += 2
        }
      }),
      'figs08': new Node(game, this, {
        'pos': [ 0, -8 ],
        'cost': 10,
        'text': {
          'en': '+4 🍊'
        },
        'area': 'figs',
        'shape': 'lump',
        'unlocks': [],
        'onactivate': function(game){
          game.current_character().resources.figs.amount += 4
        }
      }),
      'figs09': new Node(game, this, {
        'pos': [ 3, -3 ],
        'cost': 8,
        'text': {
          'en': '+0.2 🍊 per active node\n(max 8)'
        },
        'area': 'figs',
        'shape': 'lump',
        'unlocks': ['figs10'],
        'onactivate': function(game){
          let amount = 0.5 * game.current_character().activated_nodes.size
          if (amount > 8) amount = 8
          game.current_character().resources.figs.amount += amount
        }
      }),
      'figs10': new Node(game, this, {
        'pos': [ 3, -4 ],
        'cost': 4,
        'text': {
          'en': '+1 🍊 on respec'
        },
        'area': 'figs',
        'shape': 'lump',
        'unlocks': ['figs11','figs12'],
        'onactivate': function(game){
          game.current_character().onrespec.resources.figs += 1
        }
      }),
      'figs11': new Node(game, this, {
        'pos': [ 3, -5 ],
        'cost': 6,
        'text': {
          'en': '+2 🍊 on respec'
        },
        'area': 'figs',
        'shape': 'lump',
        'unlocks': ['figs13'],
        'onactivate': function(game){
          game.current_character().onrespec.resources.figs += 2
        }
      }),
      'figs12': new Node(game, this, {
        'pos': [ 2, -5 ],
        'cost': 10,
        'text': {
          'en': '+1 🍊\n(permanent)'
        },
        'detail': {
          'en': 'Permanently gain +1 🍊. Can only be purchased once per character.'
        },
        'area': 'figs',
        'shape': 'lump',
        'unlocks': [],
        'onactivate': function(game){
          game.current_character().resources.figs.permanent += 1
          game.current_character().resources.figs.amount += 1
        },
        'permanent': true
      }),
      'figs13': new Node(game, this, {
        'pos': [ 3, -6 ],
        'cost': 16,
        'text': {
          'en': '+5 🍊 on respec'
        },
        'area': 'figs',
        'shape': 'lump',
        'unlocks': [],
        'onactivate': function(game){
          game.current_character().onrespec.resources.figs += 5
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
        'detail': {
          'en': 'Gain 0.5 🌰 per active node on respec, up to a maximum of 8 🌰.'
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
        'unlocks': [20],
        'onactivate': function(game){
          game.current_character().resources.sp.amount += 10
        },
      }),
      '18': new Node(game, this, {
        'pos': [ -5, -5 ],
        'cost': 9007199254740992,
        'text': {
          'en': 'ａｓｃｅｎｄ'
        },
        'area': 'zebraspace',
        'unlocks': [],
        'onactivate': function(game){
          game.current_character().resources.forEach((res)=>{
            res.amount = 9007199254740992
          })
        },
      }),
      '19': new Node(game, this, {
        'pos': [ 5, 5 ],
        'cost': -9007199254740992,
        'text': {
          'en': 'ｄｅｓｃｅｎｄ'
        },
        'area': 'zebraspace',
        'unlocks': [],
        'onactivate': function(game){
          game.current_character().resources.forEach((res)=>{
            res.amount = -9007199254740992
          })
        },
      }),
      '20': new Node(game, this, {
        'pos': [ -2, -5 ],
        'cost': 10,
        'text': {
          'en': '+10 🌰'
        },
        'area': 'trunk',
        'unlocks': [36,45],
        'onactivate': function(game){
          game.current_character().resources.sp.amount += 10
        },
      }),
      '21': new Node(game, this, {
        'pos': [ 0, -10 ],
        'cost': 15,
        'text': {
          'en': '+10 🌰'
        },
        'detail': {
          'en': 'Before the Law stands a doorkeeper on guard. To this doorkeeper there comes a man from the country who begs for admittance to the Law.'
        },
        'area': 'law',
        'unlocks': [22],
        'onactivate': function(game){
          game.current_character().resources.sp.amount += 10
        },
      }),
      '22': new Node(game, this, {
        'pos': [ 0, -11 ],
        'cost': 20,
        'text': {
          'en': '+10 🌰'
        },
        'detail': {
          'en': 'But the doorkeeper says that he cannot admit the man at the moment. The man, on reflection, asks if he will be allowed, then, to enter later. "It is possible," answers the doorkeeper, "but not at this moment."'
        },
        'area': 'law',
        'unlocks': [23],
        'onactivate': function(game){
          game.current_character().resources.sp.amount += 10
        },
      }),
      '23': new Node(game, this, {
        'pos': [ 0, -12 ],
        'cost': 40,
        'text': {
          'en': '+20 🌰'
        },
        'detail': {
          'en': 'Since the door leading into the Law stands open as usual and the doorkeeper steps to one side, the man bends down to peer through the entrance. When the doorkeeper sees that, he laughs and says: "If you are so strongly tempted, try to get in without my permission."'
        },
        'area': 'law',
        'unlocks': [24],
        'onactivate': function(game){
          game.current_character().resources.sp.amount += 20
        },
      }),
      '24': new Node(game, this, {
        'pos': [ 0, -13 ],
        'cost': 60,
        'text': {
          'en': '+40 🌰'
        },
        'detail': {
          'en': '"But note that I am powerful. And I am only the lowest doorkeeper. From hall to hall keepers stand at every door, one more powerful than the other. Even the third of these has an aspect that even I cannot bear to look at."'
        },
        'area': 'law',
        'unlocks': [25],
        'onactivate': function(game){
          game.current_character().resources.sp.amount += 40
        },
      }),
      '25': new Node(game, this, {
        'pos': [ 0, -14 ],
        'cost': 80,
        'text': {
          'en': '+50 🌰'
        },
        'detail': {
          'en': 'These are difficulties which the man from the country has not expected to meet, the Law, he thinks, should be accessible to every man and at all times, but when he looks more closely at the doorkeeper in his furred robe, with his huge pointed nose and long, thin, Tartar beard, he decides that he had better wait until he gets permission to enter.'
        },
        'area': 'law',
        'unlocks': [26],
        'onactivate': function(game){
          game.current_character().resources.sp.amount += 50
        },
      }),
      '26': new Node(game, this, {
        'pos': [ 0, -15 ],
        'cost': 100,
        'text': {
          'en': '+50 🌰'
        },
        'detail': {
          'en': 'The doorkeeper gives him a stool and lets him sit down at the side of the door. There he sits waiting for days and years. He makes many attempts to be allowed in and wearies the doorkeeper with his importunity.'
        },
        'area': 'law',
        'unlocks': [27],
        'onactivate': function(game){
          game.current_character().resources.sp.amount += 50
        },
      }),
      '27': new Node(game, this, {
        'pos': [ 0, -16 ],
        'cost': 200,
        'text': {
          'en': '+100 🌰'
        },
        'detail': {
          'en': 'The doorkeeper often engages him in brief conversation, asking him about his home and about other matters, but the questions are put quite impersonally, as great men put questions, and always conclude with the statement that the man cannot be allowed to enter yet.'
        },
        'area': 'law',
        'unlocks': [28],
        'onactivate': function(game){
          game.current_character().resources.sp.amount += 100
        },
      }),
      '28': new Node(game, this, {
        'pos': [ 0, -17 ],
        'cost': 200,
        'text': {
          'en': '+1 🌰'
        },
        'detail': {
          'en': 'The man, who has equipped himself with many things for his journey, parts with all he has, however valuable, in the hope of bribing the doorkeeper. The doorkeeper accepts it all, saying, however, as he takes each gift: "I take this only to keep you from feeling that you have left something undone."'
        },
        'area': 'law',
        'unlocks': [29],
        'onactivate': function(game){
          game.current_character().resources.sp.amount += 1
        },
      }),
      '29': new Node(game, this, {
        'pos': [ 0, -18 ],
        'cost': 300,
        'text': {
          'en': '+100 🌰'
        },
        'detail': {
          'en': 'During all these long years the man watches the doorkeeper almost incessantly. He forgets about the other doorkeepers, and this one seems to him the only barrier between himself and the Law. In the first years he curses his evil fate aloud; later, as he grows old, he only mutters to himself.'
        },
        'area': 'law',
        'unlocks': [30],
        'onactivate': function(game){
          game.current_character().resources.sp.amount += 100
        },
      }),
      '30': new Node(game, this, {
        'pos': [ 0, -19 ],
        'cost': 500,
        'text': {
          'en': '+100 🌰\n+10 🐛'
        },
        'detail': {
          'en': 'He grows childish, and since in his prolonged watch he has learned to know even the fleas in the doorkeeper\'s fur collar, he begs the very fleas to help him and to persuade the doorkeeper to change his mind.'
        },
        'area': 'law',
        'unlocks': [31],
        'onactivate': function(game){
          game.current_character().resources.sp.amount += 100
          game.current_character().resources.worms.amount += 10
        },
      }),
      '31': new Node(game, this, {
        'pos': [ 0, -20 ],
        'cost': 500,
        'text': {
          'en': '+200 🌰'
        },
        'detail': {
          'en': 'Finally his eyes grow dim and he does not know whether the world is really darkening around him or whether his eyes are only deceiving him. But in the darkness he can now perceive a radiance that streams immortally from the door of the Law.'
        },
        'area': 'law',
        'unlocks': [32],
        'onactivate': function(game){
          game.current_character().resources.sp.amount += 200
        },
      }),
      '32': new Node(game, this, {
        'pos': [ 0, -21 ],
        'cost': 200,
        'text': {
          'en': '+100 🌰'
        },
        'detail': {
          'en': 'Now his life is drawing to a close. Before he dies, all that he has experienced during the whole time of his sojourn condenses in his mind into one question, which he has never yet put to the doorkeeper. He beckons the doorkeeper, since he can no longer raise his stiffening body.'
        },
        'area': 'law',
        'unlocks': [33],
        'onactivate': function(game){
          game.current_character().resources.sp.amount += 100
        },
      }),
      '33': new Node(game, this, {
        'pos': [ 0, -22 ],
        'cost': 100,
        'text': {
          'en': '+50 🌰'
        },
        'detail': {
          'en': 'The doorkeeper has to bend far down to hear him, for the difference in size between them has increased very much to the man\'s disadvantage. "What do you want to know now?" asks the doorkeeper, "you are insatiable."'
        },
        'area': 'law',
        'unlocks': [34],
        'onactivate': function(game){
          game.current_character().resources.sp.amount += 50
        },
      }),
      '34': new Node(game, this, {
        'pos': [ 0, -23 ],
        'cost': 10,
        'text': {
          'en': '+1 🌰'
        },
        'detail': {
          'en': '"Everyone strives to attain the Law," answers the man, "how does it come about, then, that in all these years no one has come seeking admittance but me?"'
        },
        'area': 'law',
        'unlocks': [35],
        'onactivate': function(game){
          game.current_character().resources.sp.amount += 1
        },
      }),
      '35': new Node(game, this, {
        'pos': [ 0, -24 ],
        'cost': 1000,
        'text': {
          'en': '+0 🌰'
        },
        'detail': {
          'en': 'The doorkeeper perceives that the man is at the end of his strength and that his hearing is failing, so he bellows in his ear: "No one but you could gain admittance through this door, since this door was intended only for you. I am now going to shut it."'
        },
        'area': 'law',
        'unlocks': [],
        'onactivate': function(game){
          game.current_character().resources.sp.amount += 0
        },
      }),
      '36': new Node(game, this, {
        'pos': [ -3, -6 ],
        'cost': 1,
        'text': {
          'en': '+1 🌰'
        },
        'area': 'trunk_perm128',
        'unlocks': [37],
        'onactivate': function(game){
          game.current_character().resources.sp.amount += 1
        },
      }),
      '37': new Node(game, this, {
        'pos': [ -3, -7 ],
        'cost': 2,
        'text': {
          'en': '+2 🌰'
        },
        'area': 'trunk_perm128',
        'unlocks': [38],
        'onactivate': function(game){
          game.current_character().resources.sp.amount += 2
        },
      }),
      '38': new Node(game, this, {
        'pos': [ -3, -8 ],
        'cost': 4,
        'text': {
          'en': '+4 🌰'
        },
        'area': 'trunk_perm128',
        'unlocks': [39],
        'onactivate': function(game){
          game.current_character().resources.sp.amount += 4
        },
      }),
      '39': new Node(game, this, {
        'pos': [ -3, -9 ],
        'cost': 8,
        'text': {
          'en': '+8 🌰'
        },
        'area': 'trunk_perm128',
        'unlocks': [40],
        'onactivate': function(game){
          game.current_character().resources.sp.amount += 8
        },
      }),
      '40': new Node(game, this, {
        'pos': [ -3, -10 ],
        'cost': 16,
        'text': {
          'en': '+16 🌰'
        },
        'area': 'trunk_perm128',
        'unlocks': [41],
        'onactivate': function(game){
          game.current_character().resources.sp.amount += 16
        },
      }),
      '41': new Node(game, this, {
        'pos': [ -3, -11 ],
        'cost': 32,
        'text': {
          'en': '+32 🌰'
        },
        'area': 'trunk_perm128',
        'unlocks': [42],
        'onactivate': function(game){
          game.current_character().resources.sp.amount += 32
        },
      }),
      '42': new Node(game, this, {
        'pos': [ -3, -12 ],
        'cost': 64,
        'text': {
          'en': '+64 🌰'
        },
        'area': 'trunk_perm128',
        'unlocks': [43],
        'onactivate': function(game){
          game.current_character().resources.sp.amount += 64
        },
      }),
      '43': new Node(game, this, {
        'pos': [ -3, -13 ],
        'cost': 128,
        'text': {
          'en': '+128 🌰'
        },
        'area': 'trunk_perm128',
        'unlocks': [44],
        'onactivate': function(game){
          game.current_character().resources.sp.amount += 128
        },
      }),
      '44': new Node(game, this, {
        'pos': [ -3, -14 ],
        'cost': 0,
        'text': {
          'en': '+128 🌰\n(permanent)'
        },
        'detail': {
          'en': 'Permanently gain +128 🌰. Can only be purchased once per character.'
        },
        'area': 'trunk_perm128',
        'unlocks': [],
        'onactivate': function(game){
          game.current_character().resources.sp.permanent += 128
          game.current_character().resources.sp.amount += 128
        },
        'permanent': true
      }),
      '45': new Node(game, this, {
        'pos': [ -1, -6 ],
        'cost': 1,
        'text': {
          'en': '+0 🌰'
        },
        'area': 'trunk_costgate',
        'unlocks': [46],
        'onactivate': function(){
        },
      }),
      '46': new Node(game, this, {
        'pos': [ -1, -7 ],
        'cost': 10,
        'text': {
          'en': '+0 🌰'
        },
        'area': 'trunk_costgate',
        'unlocks': [47],
        'onactivate': function(){
        },
      }),
      '47': new Node(game, this, {
        'pos': [ -1, -8 ],
        'cost': 20,
        'text': {
          'en': '+0 🌰'
        },
        'area': 'trunk_costgate',
        'unlocks': [48],
        'onactivate': function(){
        },
      }),
      '48': new Node(game, this, {
        'pos': [ -1, -9 ],
        'cost': 40,
        'text': {
          'en': '+0 🌰'
        },
        'area': 'trunk_costgate',
        'unlocks': [49,21],
        'onactivate': function(){
        },
      }),
      '49': new Node(game, this, {
        'pos': [ -2, -10 ],
        'cost': 50,
        'text': {
          'en': '+60 🌰'
        },
        'area': 'trunk_profit',
        'unlocks': [50],
        'onactivate': function(game){
          game.current_character().resources.sp.amount += 60
        },
      }),
      '50': new Node(game, this, {
        'pos': [ -2, -11 ],
        'cost': 60,
        'text': {
          'en': '+80 🌰'
        },
        'area': 'trunk_profit',
        'unlocks': [51],
        'onactivate': function(game){
          game.current_character().resources.sp.amount += 80
        },
      }),
      '51': new Node(game, this, {
        'pos': [ -2, -12 ],
        'cost': 70,
        'text': {
          'en': '+100 🌰'
        },
        'area': 'trunk_profit',
        'unlocks': [52],
        'onactivate': function(game){
          game.current_character().resources.sp.amount += 100
        },
      }),
      '52': new Node(game, this, {
        'pos': [ -2, -13 ],
        'cost': 80,
        'text': {
          'en': '+100 🌰'
        },
        'area': 'trunk_profit',
        'unlocks': [],
        'onactivate': function(game){
          game.current_character().resources.sp.amount += 100
        },
      }),
    }
    // Add id & neighbor information to nodes
    Object.entries(nodes).forEach(([id, node])=>{
      node.hidden = false // TODO reveal all for debugging
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
    this.minx--
    this.miny--
    this.maxx++
    this.maxy++
  }

  // make enough canvases to separate tree into chunks
  init_canvases(){
    let [maxx, maxy] = this.game.gridpos_to_realpos([this.maxx, this.maxy])
    let [minx, miny] = this.game.gridpos_to_realpos([this.minx, this.miny])
    let w = Math.ceil((maxx - minx) / this.CHUNKW)
    let h = Math.ceil((maxy - miny) / this.CHUNKH)
    // offset the canvas to center on 0,0
    this.offset = [
      minx - this.game.options.node_size[0]*0.5,
      miny - this.game.options.node_size[1]*0.5
    ]
    for (let i=0; i<w; i++){
      this.canvases[i] = new Array(h)
      for (let j=0; j<h; j++){
        this.canvases[i][j] = this.make_canvas()
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
