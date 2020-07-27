export let options = {
  'autosave': true,
  'autosave_interval': 10000,
  'click_margin': 16,
  'zoom_min': 0.5, // TODO change min zoom based on amount of tree revealed
  'zoom_default': 1,
  'zoom_max': 2,
  'animation_speed': 1.0, // higher numbers are faster, 0 for off
  'max_travel_dist': 2,
  'lang': 'en',
  'node_size': [104, 64],
  'node_distance': [146, 90],
  'node_text_margin': 24,
  'node_font_size': 12,
  'selected_stroke_width': 8,
  'autopan': true,
  'autopan_margin': 0.5,
  'show_node_details': true,
  'theme': {
    'default': '#f00',
    'bgcolor': '#080E07', // rich black
    'nodes': {
      'link': '#fff',
      'link_locked': '#999',
      'deactivated': '#9a9',
      'activated': '#fff',
      'selected': '#8E9B58',
      'text': '#000',
      'cost': '#4d7250',
      'detailbg': '#c2b7e8',
      'detailborder': '#6b57a5',
      'detailtext': '#000',
    }
  }
}
