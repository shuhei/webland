var camera, scene, renderer;
var geometry, material, mesh, points;

init();
animate();

var distance = 1000;
var distanceTarget = 1000;

function init() {
  // Create camera
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 10000);
  camera.position.z = distance;

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
  renderer.setClearColorHex(0xffffff, 1);

  document.body.appendChild(renderer.domElement);
}

function animate() {
  // note: three.js includes requestAnimationFrame shim
  requestAnimationFrame(animate);

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
  var lat, lng, price, i, j;
  var latCenter = 37;
  var lngCenter = 140;

  console.log(data.length);

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

    for (j = 0; j < mesh.geometry.faces.length; j++) {
      mesh.geometry.faces[j].color = 0xff0000;
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

function onMouseWheel(event) {
  event.preventDefault();
  zoom(event.wheelDeltaY * 0.3);
  return false;
}

function zoom(delta) {
  distanceTarget -= delta;
  distanceTarget = distanceTarget > 3000 ? 3000 : distanceTarget;
  distanceTarget = distanceTarget < 150 ? 150 : distanceTarget;
}
