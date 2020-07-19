export class DefaultDict {
  constructor(defaultVal) {
    return new Proxy({}, {
      get: (target, name) => name in target ? target[name] : defaultVal
    })
  }
}

export function clearelem(elem){
  while(elem.firstChild){
    elem.removeChild(elem.firstChild)
  }
}

export function get (url, type) {
  return new Promise(function (resolve, reject) {
    var xhr = new XMLHttpRequest()
    xhr.open('GET', url)
    if (type === 'blob')
      xhr.responseType = 'blob'
    xhr.onload = function () {
      if (this.status >= 200 && this.status < 300) {
        let response
        if (type === 'xml'){
          response = xhr.responseXML
        }else if (type === 'svg'){
          // [optimize] there might be a better way to do this
          let div = document.createElement('div')
          div.innerHTML = xhr.responseText
          response = div.querySelector('svg')
        }else if (type === 'text'){
          response = xhr.responseText
        } else {
          response = xhr.response
        }
        resolve(response)
      } else {
        reject({
          status: this.status,
          statusText: xhr.statusText
        })
      }
    }
    xhr.onerror = function () {
      reject({
        status: this.status,
        statusText: xhr.statusText
      })
    }
    xhr.send()
  })
}

export function load_image (url) {
  return new Promise(function (resolve, reject) {
    let img = new Image()
    img.src = url
    img.onload = function () {
      resolve(img)
    }
    img.onerror = function () {
      console.log('error loading image: '+url)
      reject()
    }
  })
}

// [optimize] this could create recursion hell...
// copy elements of a into b
export function deep_merge(a, b){
  if (!isobj(a) || !isobj(b))
    return
  Object.entries(a).forEach(([k, v]) => {
    if (isobj(v)){
      if (isobj(b[k]))
        deep_merge(v, b[k])
    }else{
      b[k] = v
    }
  })
}

function isobj(a){
  return (typeof a === 'object' && a !== null)
}

export function normalize(pos, scale=1.0) {
  let norm = Math.sqrt(pos[0] * pos[0] + pos[1] * pos[1])
  if (norm != 0) {
    pos[0] = scale * pos[0] / norm
    pos[1] = scale * pos[1] / norm
  }
  return pos
}

export function dot(p1, p2) {
  return (p1[0]*p2[0] + p1[1]*p2[1])
}

export function distance(p1, p2){
  let dx = p1[0] - p2[0]
  let dy = p1[0] - p2[0]
  return Math.sqrt(dx * dx + dy * dy)
}

export function hit_circle(x1, y1, x2, y2, r){
  let dx = x1 - x2
  let dy = y1 - y2
  let dist = Math.sqrt(dx * dx + dy * dy)
  if (dist < r)
    return true
  else
    return false
}

export function get_display_transform(ctx, canvas, mouse){
  return {
    x:-canvas.width/2,
    y:-canvas.height/2,
    ox:0,
    oy:0,
    scale:1,
    rotate:0,
    cx:-canvas.width/2,
    cy:-canvas.height/2,
    cox:0,
    coy:0,
    cscale:1,
    crotate:0,
    dx:0,  // deltat values
    dy:0,
    dox:0,
    doy:0,
    dscale:1,
    drotate:0,
    drag:0.1,  // drag for movements
    accel:0.7, // acceleration
    matrix:[0,0,0,0,0,0], // main matrix
    invMatrix:[0,0,0,0,0,0], // invers matrix
    mouseX:0,
    mouseY:0,
    ctx:ctx,
    setTransform:function(){
      var m = this.matrix
      var i = 0
      this.ctx.setTransform(m[i++],m[i++],m[i++],m[i++],m[i++],m[i++])
    },
    setHome:function(){
      this.ctx.setTransform(1,0,0,1,0,0)
    },
    update:function(){
      // smooth all movement out. drag and accel control how this moves
      // acceleration
      this.dx += (this.x-this.cx)*this.accel
      this.dy += (this.y-this.cy)*this.accel
      this.dox += (this.ox-this.cox)*this.accel
      this.doy += (this.oy-this.coy)*this.accel
      this.dscale += (this.scale-this.cscale)*this.accel
      this.drotate += (this.rotate-this.crotate)*this.accel
      // drag
      this.dx *= this.drag
      this.dy *= this.drag
      this.dox *= this.drag
      this.doy *= this.drag
      this.dscale *= this.drag
      this.drotate *= this.drag
      // set the chase values. Chase chases the requiered values
      this.cx += this.dx
      this.cy += this.dy
      this.cox += this.dox
      this.coy += this.doy
      this.cscale += this.dscale
      this.crotate += this.drotate

      // create the display matrix
      this.matrix[0] = Math.cos(this.crotate)*this.cscale
      this.matrix[1] = Math.sin(this.crotate)*this.cscale
      this.matrix[2] =  - this.matrix[1]
      this.matrix[3] = this.matrix[0]

      // set the coords relative to the origin
      this.matrix[4] = -(this.cx * this.matrix[0] + this.cy * this.matrix[2])+this.cox
      this.matrix[5] = -(this.cx * this.matrix[1] + this.cy * this.matrix[3])+this.coy


      // create invers matrix
      var det = (this.matrix[0] * this.matrix[3] - this.matrix[1] * this.matrix[2])
      this.invMatrix[0] = this.matrix[3] / det
      this.invMatrix[1] =  - this.matrix[1] / det
      this.invMatrix[2] =  - this.matrix[2] / det
      this.invMatrix[3] = this.matrix[0] / det

      // check for mouse. Do controls and get real position of mouse.
      if(mouse !== undefined){  // if there is a mouse get the real cavas coordinates of the mouse
        if(mouse.oldX !== undefined && (mouse.btn & 1)===1){ // check if panning (middle button)
          var mdx = mouse.pos.x-mouse.oldX // get the mouse movement
          var mdy = mouse.pos.y-mouse.oldY
          // get the movement in real space
          var mrx = (mdx * this.invMatrix[0] + mdy * this.invMatrix[2])
          var mry = (mdx * this.invMatrix[1] + mdy * this.invMatrix[3])
          this.x -= mrx
          this.y -= mry
        }
        // do the zoom with mouse wheel
        if(mouse.pos.z !== undefined && mouse.pos.z !== 0){
          this.ox = mouse.pos.x
          this.oy = mouse.pos.y
          this.x = this.mouseX
          this.y = this.mouseY
          /* Special note from answer */
          // comment out the following is you change drag and accel
          // and the zoom does not feel right (lagging and not
          // zooming around the mouse
          /*
          this.cox = mouse.pos.x
          this.coy = mouse.pos.y
          this.cx = this.mouseX
          this.cy = this.mouseY
          */
          if(mouse.pos.z > 0){ // zoom in
            this.scale *= 1.1
            mouse.pos.z -= 20
            if(mouse.pos.z < 0){
              mouse.pos.z = 0
            }
          }
          if(mouse.pos.z < 0){ // zoom out
            this.scale *= 1/1.1
            mouse.pos.z += 20
            if(mouse.pos.z > 0){
              mouse.pos.z = 0
            }
          }
        }
        // get the real mouse position
        var screenX = (mouse.pos.x - this.cox)
        var screenY = (mouse.pos.y - this.coy)
        this.mouseX = this.cx + (screenX * this.invMatrix[0] + screenY * this.invMatrix[2])
        this.mouseY = this.cy + (screenX * this.invMatrix[1] + screenY * this.invMatrix[3])
        mouse.rx = this.mouseX  // add the coordinates to the mouse. r is for real
        mouse.ry = this.mouseY
        // save old mouse position
        mouse.oldX = mouse.pos.x
        mouse.oldY = mouse.pos.y
      }
    }
  }
}
