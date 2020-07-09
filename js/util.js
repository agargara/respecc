export function get (url, callback) {
  var xhr = new XMLHttpRequest()
  xhr.open('GET', url, true)
  xhr.onload = function () {
    callback(xhr.responseXML)
  }
  xhr.send('')
}
