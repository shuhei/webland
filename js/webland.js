var LAND = LAND || {};

LAND.Japan = function (container) {

  var camera, scene, renderer;
  var geometry, material, mesh, points;

  var target = { x: 0, y: 0 };
  var targetOnDown = { x: 0, y: 0};
  var mouse = { x: 0, y: 0 };
  var mouseOnDown = { x: 0, y: 0 };

  var distance = 1000;
  var distanceTarget = 1000;

  init();
  animate();

  function init() {
    // Create camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 10000);
    camera.position.z = distance;

    target.x = camera.position.x;
    target.y = camera.position.y;

    // Create scene
    scene = new THREE.Scene();

    // Create point mesh
    geometry = new THREE.CubeGeometry(0.75, 0.75, 1, 1, 1, 1, null, false,
      { px: true, nx: true, py: true, ny: true, pz: false, nz: true});
    for (var i = 0; i < geometry.vertices.length; i++) {
      var vertex = geometry.vertices[i];
      vertex.z += 0.5;
    }
    mesh = new THREE.Mesh(geometry);

    // Create renderer.
    // renderer = new THREE.CanvasRenderer();
    // renderer.setSize(window.innerWidth, window.innerHeight);
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColorHex(0x000000, 1);

    document.body.appendChild(renderer.domElement);
  }

  function animate() {
    // note: three.js includes requestAnimationFrame shim
    requestAnimationFrame(animate);

    camera.position.x += (target.x - camera.position.x) * 0.1;
    camera.position.y += (target.y - camera.position.y) * 0.1;

    distance += (distanceTarget - distance) * 0.3;
    camera.position.z = distance;

    if (points) {
      // points.rotation.x += 0.005;
      // points.rotation.y += 0.01;

      // points.rotation.x = -Math.PI / 4;
      // points.rotation.y = 0;
    }

    renderer.render(scene, camera);
  }

  function addData(data) {
    var lat, lng, price, i, j, color;
    var latCenter = 37;
    var lngCenter = 140;

    console.log(data.length);

    var max = 0;
    for (i = 0; i < data.length; i += 3) {
      price = data[i + 2];
      if (price > max) max = price;
    }
    console.log("max", max);

    var subgeo = new THREE.Geometry();
    for (i = 0; i < data.length; i += 3) {
    // for (i = 0; i < 9000; i += 3) {
      lat = data[i];
      lng = data[i + 1];
      price = data[i + 2];

      mesh.position.x = lngCenter + (lng - lngCenter) * 50;
      mesh.position.y = latCenter + (lat - latCenter) * 70;
      mesh.position.z = 0;

      mesh.scale.z = price / 10000;
      mesh.scale.x = 1;
      mesh.scale.y = 1;

      mesh.updateMatrix();

      var c = new THREE.Color();
      var hue = price / 1000000;
      if (hue > 1.0) hue = 1.0;
      c.setHSL(0.6 - hue / 0.6, 1.0, 0.8);
      // c.setHex(0xff0000);
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
  }

  function onMouseDown(event) {
    event.preventDefault();

    container.addEventListener('mousemove', onMouseMove, false);
    container.addEventListener('mouseup', onMouseUp, false);
    container.addEventListener('mouseout', onMouseOut, false);

    mouseOnDown.x = - event.clientX;
    mouseOnDown.y = event.clientY;

    targetOnDown.x = target.x;
    targetOnDown.y = target.y;

    container.style.cursor = 'move';
  }

  function onMouseUp(event) {
    container.removeEventListener('mousemove', onMouseMove, false);
    container.removeEventListener('mouseup', onMouseUp, false);
    container.removeEventListener('mouseout', onMouseOut, false);
    container.style.cursor = 'auto';
  }

  function onMouseOut(event) {
    container.removeEventListener('mousemove', onMouseMove, false);
    container.removeEventListener('mouseup', onMouseUp, false);
    container.removeEventListener('mouseout', onMouseOut, false);
  }

  function onMouseMove(event) {
    mouse.x = - event.clientX;
    mouse.y = event.clientY;

    var zoomDamp = distance / 500;

    target.x = targetOnDown.x + (mouse.x - mouseOnDown.x) * zoomDamp;
    target.y = targetOnDown.y + (mouse.y - mouseOnDown.y) * zoomDamp;

    console.log(target);
  }

  function onMouseWheel(event) {
    event.preventDefault();
    zoom(event.wheelDeltaY * 0.3);
    return false;
  }

  function onResize(event) {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  function zoom(delta) {
    distanceTarget -= delta;
    distanceTarget = distanceTarget > 3000 ? 3000 : distanceTarget;
    distanceTarget = distanceTarget < 30 ? 30 : distanceTarget;
  }

  window.addEventListener('resize', onResize);
  container.addEventListener('mousewheel', onMouseWheel, false);
  container.addEventListener('mousedown', onMouseDown, false);

  this.addData = addData;
  return this;
};
