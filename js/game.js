var global_options={
  'scale_min': 0.75,
  'scale_max': 1.5,
  'animation_speed': 1.0
};
var panning = false;
var start_pan_x, start_pan_y;
var pan_x=0, pan_y=0;

window.onload = function(){
  init_game();
}

function init_game(){
  // build the tree
  var tree = document.querySelector('#tree');
  populate_tree(tree, 1000);
  tree.addEventListener("mousedown", start_pan, false);
  tree.addEventListener("touchstart", start_pan, false);
  tree.addEventListener("touchend", function(e){panning=false}, false);
  tree.addEventListener("mouseup", function(e){panning=false}, false);
  tree.addEventListener("touchmove", function(e){pan_tree(e,this)}, false);
  tree.addEventListener("mousemove", function(e){pan_tree(e,this)}, false);
}

function populate_tree(tree, num_nodes){
  for(let i = 0; i < num_nodes; i++) {
    let node = document.createElement('div');
    node.classList.add('node');
    let textnode = document.createTextNode('Node '+i);
    node.appendChild(textnode);
    tree.appendChild(node);
  }
}

function start_pan(e){
  panning=true;
  e.preventDefault();
  e = e || window.event;
  start_pan_x = e.pageX;
  start_pan_y = e.pageY;
}

function pan_tree(e, tree){
  if(!panning){return;}
  e.preventDefault();
  e = e || window.event;
  pan_x += e.pageX-start_pan_x;
  pan_y += e.pageY-start_pan_y;
  console.log("X: "+pan_x+" Y: "+pan_y);
  tree.style.transform='translate('+pan_x+'px,'+pan_y+'px)';
}
