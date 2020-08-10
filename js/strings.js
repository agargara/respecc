var strings={
  'save':{
    'saving':{
      'en': 'Saving...'
    },
    'saved':{
      'en': 'Saved.'
    }
  },
  'hints':{
    'purchasenode':{
      'en': '[spacebar] or click to purchase node'
    },
    'move':{
      'en': 'wasd, arrow keys, or click to move'
    },
    'respec':{
      'en': 'press [r] to respec'
    },
  },
  'default_names':{
    'Arborist':{
      'en': 'Eletfa'
    },
    'Horticulturalist':{
      'en': 'Udumbara'
    },
  }
}

var names = {
  'en': ['Meow Meow', 'A Cute Whale', 'Garden Eel', 'Popopo']
}
export function get_string(category, status, lang='en'){
  if (strings[category] && strings[category][status])
    return strings[category][status][lang]
  else
    return 'love'
}

export function random_name(lang){
  let n = names[lang]
  if (!n) n = names['en']
  return n[Math.floor(Math.random() * n.length)]
}
