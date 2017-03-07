var AMBIENT_LIGHT_COLOR = 0x808080;
var DIRECTIONAL_LIGHT_COLOR = 0xffffff;

var camera, container, controls, scene, renderer;

var windowHalfX = window.innerWidth / 2;
var windowHalfY = window.innerHeight / 2;

init();
animate();

function init() {
  container = document.createElement('div');
  document.body.appendChild(container);

  // Initialize the camera.
  camera = new THREE.PerspectiveCamera(45,
    window.innerWidth / window.innerHeight, 1, 2000);

  // Initialize the scene.
  scene = new THREE.Scene();

  var ambient = new THREE.AmbientLight(AMBIENT_LIGHT_COLOR);
  scene.add( ambient );

  var directionalLight = new THREE.DirectionalLight(DIRECTIONAL_LIGHT_COLOR);
  directionalLight.position.set(0, 0, 1).normalize();
  scene.add(directionalLight);

  // Initialize the model.
  var onProgress = function (xhr) {
    if (xhr.lengthComputable) {
      //var percentComplete = xhr.loaded / xhr.total * 100;
      //console.log(Math.round(percentComplete, 2) + '% downloaded');
    }
  };

  var onError = function (xhr) { };

  THREE.Loader.Handlers.add(/\.dds$/i, new THREE.DDSLoader());

  var mtlLoader = new THREE.MTLLoader();
  mtlLoader.setPath('2004_120991_014_3D_model/');
  mtlLoader.load('120991_014.mtl', function(materials) {
    materials.preload();

    var objLoader = new THREE.OBJLoader();
    objLoader.setMaterials(materials);
    objLoader.setPath('2004_120991_014_3D_model/');
    objLoader.load('120991_014.OBJ', function(object) {
      // Find the object's bounding box in order to compute the camera Z.
      var bbox = new THREE.Box3().setFromObject(object);
      var maxBound = Math.max(bbox.max.x, bbox.max.y);
      var fov = camera.fov * (Math.PI / 180);
      var distance = Math.abs(maxBound / Math.sin(fov / 2));
      // distance / 2.0 will fill the view. Pull back a bit.
      camera.position.x = object.position.y + (distance / (2.0 - 0.12));
      object.position.y = - bbox.max.y / 2;
      scene.add(object);
    }, onProgress, onError);
  });

  renderer = new THREE.WebGLRenderer();
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.appendChild(renderer.domElement);

  controls = new THREE.OrbitControls(camera, renderer.domElement);

  window.addEventListener('resize', onWindowResize, false);
}

function onWindowResize() {
  windowHalfX = window.innerWidth / 2;
  windowHalfY = window.innerHeight / 2;

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  render();
}

function render() {
  renderer.render(scene, camera);
}
