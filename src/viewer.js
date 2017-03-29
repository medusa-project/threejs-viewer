/**
 * Instantiable viewer object.
 *
 * @param {Object} options - Configuration options.
 * @param {string} options.containerId - ID of the element to which the viewer
 *                                       will be appended.
 * @param {string} options.modelPath - URL path of the directory containing the
 *                                     model files.
 * @param {string} options.objFile - Filename of the OBJ model residing in
 *                                   options.modelPath.
 * @param {string} options.mtlFile - Filename of the MTL file residing in
 *                                   options.modelPath.
 * @param {number} [options.ambientLightColor] - Ambient light color. Optional.
 *                                               Defaults to 0x808080.
 * @param {number} [options.ambientLightIntensity] - Ambient light intensity.
 *                                                   Optional. Defaults to 1.5.
 * @param {number} [options.directionalLightColor] - Directional light color.
 *                                                   Optional. Defaults to
 *                                                   0xffffff.
 * @param {number} [options.directionalLightIntensity] - Directional light
 *                                                       intensity. Optional.
 *                                                       Defaults to 1.5.
 */
function ThreeJSViewer(options) {

  var AMBIENT_LIGHT_COLOR = (options.ambientLightColor !== undefined) ?
      options.ambientLightColor : 0x808080;
  var AMBIENT_LIGHT_INTENSITY = (options.ambientLightIntensity !== undefined) ?
      options.ambientLightIntensity : 1.5;
  var CONTAINER_ID = options.containerId;
  var DIRECTIONAL_LIGHT_COLOR = (options.directionalLightColor !== undefined) ?
      options.directionalLightColor : 0xffffff;
  var DIRECTIONAL_LIGHT_INTENSITY =
      (options.directionalLightIntensity !== undefined) ?
      options.directionalLightIntensity : 1.5;
  var MODEL_PATH = options.modelPath;
  var MTL_FILE = options.mtlFile;
  var OBJ_FILE = options.objFile;

  var camera, controls, scene, renderer;

  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    render();
  }

  function getContainer() {
    return document.getElementById(CONTAINER_ID);
  }

  function getHeight() {
    return getContainer().offsetHeight;
  };

  function getWidth() {
    return getContainer().offsetWidth;
  };

  this.start = function() {
    // Initialize the camera.
    camera = new THREE.PerspectiveCamera(45, getWidth() / getHeight(), 1, 2000);

    // Initialize the scene.
    scene = new THREE.Scene();

    var ambient = new THREE.AmbientLight(AMBIENT_LIGHT_COLOR);
    ambient.intensity = AMBIENT_LIGHT_INTENSITY;
    scene.add(ambient);

    var directionalLight = new THREE.DirectionalLight(DIRECTIONAL_LIGHT_COLOR);
    directionalLight.intensity = DIRECTIONAL_LIGHT_INTENSITY;
    directionalLight.position.set(0, 0, 1).normalize();
    scene.add(directionalLight);

    // Initialize the model.
    var onProgress = function (xhr) {
      if (xhr.lengthComputable) {
        //var percentComplete = xhr.loaded / xhr.total * 100;
        //console.log(Math.round(percentComplete, 2) + '% downloaded');
      }
    };

    var onError = function (xhr) {};

    THREE.Loader.Handlers.add(/\.dds$/i, new THREE.DDSLoader());

    var mtlLoader = new THREE.MTLLoader();
    mtlLoader.setPath(MODEL_PATH);
    mtlLoader.load(MTL_FILE, function(materials) {
      materials.preload();

      var objLoader = new THREE.OBJLoader();
      objLoader.setMaterials(materials);
      objLoader.setPath(MODEL_PATH);
      objLoader.load(OBJ_FILE, function(object) {
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
    renderer.setSize(getWidth(), getHeight());
    getContainer().appendChild(renderer.domElement);

    controls = new THREE.OrbitControls(camera, renderer.domElement);

    window.addEventListener('resize', onWindowResize, false);

    animate();
  }

  function onWindowResize() {
    var width = getWidth();
    var height = getHeight();

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }

  function render() {
    renderer.render(scene, camera);
  }

}
