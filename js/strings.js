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
  }
}

export function get_string(category, status, lang){
  if (strings[category] && strings[category][status])
    return strings[category][status][lang]
  else
    return 'love'
}
