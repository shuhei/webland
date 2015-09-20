(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.getPrices = getPrices;

function getPrices() {
  return fetch('./prices.data').then(function (res) {
    return res.arrayBuffer();
  }).then(parseBinary);
}

function parseBinary(buffer) {
  var result = [];
  var view = new DataView(buffer);
  var len = buffer.byteLength;
  for (var i = 0; i < len; i += 12) {
    // Big Endian float 32
    var float1 = view.getFloat32(i, false);
    // Big Endian float 32
    var float2 = view.getFloat32(i + 4, false);
    // Big Endian integer 32
    var integer = view.getInt32(i + 8, false);
    result.push(float1, float2, integer);
  }
  return result;
}

},{}],2:[function(require,module,exports){
'use strict';

require('whatwg-fetch');

var _data = require('./data');

var _webland = require('./webland');

if (Detector.webgl) {
  (function () {
    var container = document.getElementById('container');
    var webland = new _webland.Webland(container);
    (0, _data.getPrices)().then(function (data) {
      return webland.addData(data);
    });
  })();
} else {
  Detector.addGetWebGLMessage();
}

},{"./data":1,"./webland":3,"whatwg-fetch":4}],3:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.Webland = Webland;

function Webland(container) {
  var loading = document.createElement('div');
  loading.classList.add('loading');
  loading.appendChild(document.createTextNode('Loading...'));

  var camera, scene, renderer;
  var geometry, material, mesh, points;

  var target = { x: 0, y: 0 };
  var targetOnDown = { x: 0, y: 0 };
  var mouse = { x: 0, y: 0 };
  var mouseOnDown = { x: 0, y: 0 };

  var distance = 1000;
  var distanceTarget = 1000;

  var lastClickTime = new Date().getTime();
  var isBirdView = true;

  var touchEnabled = false;
  var downEventName, upEventName, outEventName, moveEventName;
  if ('ontouchstart' in document.documentElement) {
    touchEnabled = true;
    downEventName = 'touchstart';
    upEventName = 'touchend';
    outEventName = 'touchcancel';
    moveEventName = 'touchmove';
  } else {
    downEventName = 'mousedown';
    upEventName = 'mouseup';
    outEventName = 'mouseout';
    moveEventName = 'mousemove';
  }

  // For pinch gesture on touch devices.
  var previousScale = null;

  function init() {
    // Create camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 10000);
    camera.position.z = distance;

    target.x = camera.position.x;
    target.y = camera.position.y;

    // Create scene
    scene = new THREE.Scene();

    // Create a mesh to contain all data points.
    // One merged large mesh performs better than lots of tiny meshes.
    geometry = new THREE.CubeGeometry(0.75, 0.75, 1, 1, 1, 1, null, false, { px: true, nx: true, py: true, ny: true, pz: false, nz: true });
    for (var i = 0; i < geometry.vertices.length; i++) {
      var vertex = geometry.vertices[i];
      vertex.z += 0.5;
    }
    mesh = new THREE.Mesh(geometry);

    // Create WebGL renderer.
    // Canvas renderer is too slow to render 30k data points.
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColorHex(0x000000, 1);

    renderer.domElement.style.position = 'absolute';
    container.appendChild(renderer.domElement);

    // Loading.
    container.appendChild(loading);
  }

  function animate() {
    requestAnimationFrame(animate);
    render();
  }

  function render() {
    camera.position.x += (target.x - camera.position.x) * 0.1;
    camera.position.y += (target.y - camera.position.y) * 0.1;

    distance += (distanceTarget - distance) * 0.3;
    camera.position.z = distance;

    if (points) {
      if (isBirdView) {
        points.rotation.x = 0;
        points.rotation.z = 0;
        points.position.z = 0;
      } else {
        points.rotation.x = -Math.PI / 2;
        points.rotation.z = -Math.PI / 4;
        points.position.z = 100;
      }
    }

    renderer.render(scene, camera);
  }

  function addData(data) {
    var lat, lng, price, i, j, color, subgeo, max;
    var latCenter = 37;
    var lngCenter = 140;

    console.log(data.length / 3, 'data points.');

    max = 0;
    for (i = 0; i < data.length; i += 3) {
      price = data[i + 2];
      if (price > max) max = price;
    }
    console.log("max", max);

    subgeo = new THREE.Geometry();
    for (i = 0; i < data.length; i += 3) {
      lat = data[i];
      lng = data[i + 1];
      price = data[i + 2];

      mesh.position.x = lngCenter + (lng - lngCenter) * 50;
      mesh.position.y = latCenter + (lat - latCenter) * 70;
      mesh.position.z = 0;

      mesh.scale.z = price / 10000;
      // mesh.scale.z = Math.log(price);

      mesh.updateMatrix();

      // Set color for price.
      var c = new THREE.Color();
      var hue = price / 1000000;
      if (hue > 1.0) hue = 1.0;
      c.setHSL(0.6 - hue / 0.6, 1.0, 0.8);
      for (j = 0; j < mesh.geometry.faces.length; j++) {
        mesh.geometry.faces[j].color = c;
      }
      THREE.GeometryUtils.merge(subgeo, mesh);
    }

    // Create points
    points = new THREE.Mesh(subgeo, new THREE.MeshBasicMaterial({
      color: 0xffffff,
      vertexColors: THREE.FaceColors,
      morphTargets: false
    }));
    scene.add(points);

    // Hide loading.
    container.removeChild(loading);
  }

  //
  // Event handlers
  //

  function onMouseDown(event) {
    event.preventDefault();

    // Check if it's double click/tap.
    var currentTime = new Date().getTime();
    var diff = currentTime - lastClickTime;
    var isSingleTap = touchEnabled && event.targetTouches.length === 1;
    lastClickTime = currentTime;
    if ((!touchEnabled || isSingleTap) && diff < 300) {
      isBirdView = !isBirdView;
      return;
    }

    container.addEventListener(moveEventName, onMouseMove, false);
    container.addEventListener(upEventName, onMouseUp, false);
    container.addEventListener(outEventName, onMouseOut, false);

    if (touchEnabled) {
      if (event.targetTouches.length !== 1) {
        return;
      }
      var touchItem = event.targetTouches[0];
      mouseOnDown.x = -touchItem.pageX;
      mouseOnDown.y = touchItem.pageY;
    } else {
      mouseOnDown.x = -event.clientX;
      mouseOnDown.y = event.clientY;
    }

    targetOnDown.x = target.x;
    targetOnDown.y = target.y;

    container.style.cursor = 'move';
  }

  function onMouseUp(event) {
    container.removeEventListener(moveEventName, onMouseMove, false);
    container.removeEventListener(upEventName, onMouseUp, false);
    container.removeEventListener(outEventName, onMouseOut, false);
    container.style.cursor = 'auto';
  }

  function onMouseOut(event) {
    container.removeEventListener(outEventName, onMouseMove, false);
    container.removeEventListener(upEventName, onMouseUp, false);
    container.removeEventListener(outEventName, onMouseOut, false);
  }

  function onMouseMove(event) {
    if (touchEnabled) {
      if (event.targetTouches.length !== 1) {
        return;
      }
      var touchItem = event.targetTouches[0];
      mouse.x = -touchItem.pageX;
      mouse.y = touchItem.pageY;
    } else {
      mouse.x = -event.clientX;
      mouse.y = event.clientY;
    }

    var zoomDamp = distance / 500;

    target.x = targetOnDown.x + (mouse.x - mouseOnDown.x) * zoomDamp;
    target.y = targetOnDown.y + (mouse.y - mouseOnDown.y) * zoomDamp;
  }

  function onMouseWheel(event) {
    // mousewheel -> wheelDeltaY, wheel -> deltaY
    var deltaY = event.wheelDeltaY || event.deltaY || 0;
    event.preventDefault();
    zoom(deltaY * 0.3);
    return false;
  }

  function onResize(event) {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  function onKeyDown(event) {
    if (event.keyCode === 32) {
      isBirdView = !isBirdView;
    }
  }

  function onGestureStart(event) {
    previousScale = event.scale;
  }

  function onGestureChange(event) {
    var scale = event.scale / previousScale;
    zoom(0.1 * distanceTarget * (scale - 1) / scale);
    previsousScale = event.scale;
  }

  function onGestureEnd(event) {
    var scale = event.scale / previousScale;
    zoom(0.1 * distanceTarget * (scale - 1) / scale);
    previousScale = null;
  }

  function zoom(delta) {
    distanceTarget -= delta;
    distanceTarget = distanceTarget > 3000 ? 3000 : distanceTarget;
    distanceTarget = distanceTarget < 30 ? 30 : distanceTarget;
  }

  init();
  animate();

  window.addEventListener('resize', onResize);
  window.addEventListener('keydown', onKeyDown, false);
  container.addEventListener(downEventName, onMouseDown, false);
  container.addEventListener('mousewheel', onMouseWheel, false); // For Chrome
  container.addEventListener('wheel', onMouseWheel, false); // For Firefox
  // For iOS touch devices
  container.addEventListener('gesturestart', onGestureStart, false);
  container.addEventListener('gesturechange', onGestureChange, false);
  container.addEventListener('gestureend', onGestureEnd, false);

  this.addData = addData;
}

;

},{}],4:[function(require,module,exports){
(function() {
  'use strict';

  if (self.fetch) {
    return
  }

  function normalizeName(name) {
    if (typeof name !== 'string') {
      name = name.toString();
    }
    if (/[^a-z0-9\-#$%&'*+.\^_`|~]/i.test(name)) {
      throw new TypeError('Invalid character in header field name')
    }
    return name.toLowerCase()
  }

  function normalizeValue(value) {
    if (typeof value !== 'string') {
      value = value.toString();
    }
    return value
  }

  function Headers(headers) {
    this.map = {}

    if (headers instanceof Headers) {
      headers.forEach(function(value, name) {
        this.append(name, value)
      }, this)

    } else if (headers) {
      Object.getOwnPropertyNames(headers).forEach(function(name) {
        this.append(name, headers[name])
      }, this)
    }
  }

  Headers.prototype.append = function(name, value) {
    name = normalizeName(name)
    value = normalizeValue(value)
    var list = this.map[name]
    if (!list) {
      list = []
      this.map[name] = list
    }
    list.push(value)
  }

  Headers.prototype['delete'] = function(name) {
    delete this.map[normalizeName(name)]
  }

  Headers.prototype.get = function(name) {
    var values = this.map[normalizeName(name)]
    return values ? values[0] : null
  }

  Headers.prototype.getAll = function(name) {
    return this.map[normalizeName(name)] || []
  }

  Headers.prototype.has = function(name) {
    return this.map.hasOwnProperty(normalizeName(name))
  }

  Headers.prototype.set = function(name, value) {
    this.map[normalizeName(name)] = [normalizeValue(value)]
  }

  Headers.prototype.forEach = function(callback, thisArg) {
    Object.getOwnPropertyNames(this.map).forEach(function(name) {
      this.map[name].forEach(function(value) {
        callback.call(thisArg, value, name, this)
      }, this)
    }, this)
  }

  function consumed(body) {
    if (body.bodyUsed) {
      return Promise.reject(new TypeError('Already read'))
    }
    body.bodyUsed = true
  }

  function fileReaderReady(reader) {
    return new Promise(function(resolve, reject) {
      reader.onload = function() {
        resolve(reader.result)
      }
      reader.onerror = function() {
        reject(reader.error)
      }
    })
  }

  function readBlobAsArrayBuffer(blob) {
    var reader = new FileReader()
    reader.readAsArrayBuffer(blob)
    return fileReaderReady(reader)
  }

  function readBlobAsText(blob) {
    var reader = new FileReader()
    reader.readAsText(blob)
    return fileReaderReady(reader)
  }

  var support = {
    blob: 'FileReader' in self && 'Blob' in self && (function() {
      try {
        new Blob();
        return true
      } catch(e) {
        return false
      }
    })(),
    formData: 'FormData' in self
  }

  function Body() {
    this.bodyUsed = false


    this._initBody = function(body) {
      this._bodyInit = body
      if (typeof body === 'string') {
        this._bodyText = body
      } else if (support.blob && Blob.prototype.isPrototypeOf(body)) {
        this._bodyBlob = body
      } else if (support.formData && FormData.prototype.isPrototypeOf(body)) {
        this._bodyFormData = body
      } else if (!body) {
        this._bodyText = ''
      } else {
        throw new Error('unsupported BodyInit type')
      }
    }

    if (support.blob) {
      this.blob = function() {
        var rejected = consumed(this)
        if (rejected) {
          return rejected
        }

        if (this._bodyBlob) {
          return Promise.resolve(this._bodyBlob)
        } else if (this._bodyFormData) {
          throw new Error('could not read FormData body as blob')
        } else {
          return Promise.resolve(new Blob([this._bodyText]))
        }
      }

      this.arrayBuffer = function() {
        return this.blob().then(readBlobAsArrayBuffer)
      }

      this.text = function() {
        var rejected = consumed(this)
        if (rejected) {
          return rejected
        }

        if (this._bodyBlob) {
          return readBlobAsText(this._bodyBlob)
        } else if (this._bodyFormData) {
          throw new Error('could not read FormData body as text')
        } else {
          return Promise.resolve(this._bodyText)
        }
      }
    } else {
      this.text = function() {
        var rejected = consumed(this)
        return rejected ? rejected : Promise.resolve(this._bodyText)
      }
    }

    if (support.formData) {
      this.formData = function() {
        return this.text().then(decode)
      }
    }

    this.json = function() {
      return this.text().then(JSON.parse)
    }

    return this
  }

  // HTTP methods whose capitalization should be normalized
  var methods = ['DELETE', 'GET', 'HEAD', 'OPTIONS', 'POST', 'PUT']

  function normalizeMethod(method) {
    var upcased = method.toUpperCase()
    return (methods.indexOf(upcased) > -1) ? upcased : method
  }

  function Request(url, options) {
    options = options || {}
    this.url = url

    this.credentials = options.credentials || 'omit'
    this.headers = new Headers(options.headers)
    this.method = normalizeMethod(options.method || 'GET')
    this.mode = options.mode || null
    this.referrer = null

    if ((this.method === 'GET' || this.method === 'HEAD') && options.body) {
      throw new TypeError('Body not allowed for GET or HEAD requests')
    }
    this._initBody(options.body)
  }

  function decode(body) {
    var form = new FormData()
    body.trim().split('&').forEach(function(bytes) {
      if (bytes) {
        var split = bytes.split('=')
        var name = split.shift().replace(/\+/g, ' ')
        var value = split.join('=').replace(/\+/g, ' ')
        form.append(decodeURIComponent(name), decodeURIComponent(value))
      }
    })
    return form
  }

  function headers(xhr) {
    var head = new Headers()
    var pairs = xhr.getAllResponseHeaders().trim().split('\n')
    pairs.forEach(function(header) {
      var split = header.trim().split(':')
      var key = split.shift().trim()
      var value = split.join(':').trim()
      head.append(key, value)
    })
    return head
  }

  Body.call(Request.prototype)

  function Response(bodyInit, options) {
    if (!options) {
      options = {}
    }

    this._initBody(bodyInit)
    this.type = 'default'
    this.url = null
    this.status = options.status
    this.ok = this.status >= 200 && this.status < 300
    this.statusText = options.statusText
    this.headers = options.headers instanceof Headers ? options.headers : new Headers(options.headers)
    this.url = options.url || ''
  }

  Body.call(Response.prototype)

  self.Headers = Headers;
  self.Request = Request;
  self.Response = Response;

  self.fetch = function(input, init) {
    // TODO: Request constructor should accept input, init
    var request
    if (Request.prototype.isPrototypeOf(input) && !init) {
      request = input
    } else {
      request = new Request(input, init)
    }

    return new Promise(function(resolve, reject) {
      var xhr = new XMLHttpRequest()

      function responseURL() {
        if ('responseURL' in xhr) {
          return xhr.responseURL
        }

        // Avoid security warnings on getResponseHeader when not allowed by CORS
        if (/^X-Request-URL:/m.test(xhr.getAllResponseHeaders())) {
          return xhr.getResponseHeader('X-Request-URL')
        }

        return;
      }

      xhr.onload = function() {
        var status = (xhr.status === 1223) ? 204 : xhr.status
        if (status < 100 || status > 599) {
          reject(new TypeError('Network request failed'))
          return
        }
        var options = {
          status: status,
          statusText: xhr.statusText,
          headers: headers(xhr),
          url: responseURL()
        }
        var body = 'response' in xhr ? xhr.response : xhr.responseText;
        resolve(new Response(body, options))
      }

      xhr.onerror = function() {
        reject(new TypeError('Network request failed'))
      }

      xhr.open(request.method, request.url, true)

      if (request.credentials === 'include') {
        xhr.withCredentials = true
      }

      if ('responseType' in xhr && support.blob) {
        xhr.responseType = 'blob'
      }

      request.headers.forEach(function(value, name) {
        xhr.setRequestHeader(name, value)
      })

      xhr.send(typeof request._bodyInit === 'undefined' ? null : request._bodyInit)
    })
  }
  self.fetch.polyfill = true
})();

},{}]},{},[2]);
