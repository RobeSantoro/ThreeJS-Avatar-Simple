
import * as THREE from 'three'
import Stats from 'three/examples/jsm/libs/stats.module.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'

/****************************************************************************************/
/***************************************************************** THREE.JS SCENE SETUP */
/****************************************************************************************/

// Create a scene
const scene = new THREE.Scene()

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Window. Sizes
const sizes = {
  height: window.innerHeight,
  width: window.innerWidth
}

// Create a camera
const camera = new THREE.PerspectiveCamera(25, sizes.width / sizes.height, 0.1, 1000)
camera.position.set(0, 2, 5)
scene.add(camera)

// Orbit controls
const controls = new OrbitControls(camera, canvas)
controls.target.set(0, 1, 0)
controls.dampingFactor = 0.25
// controls.autoRotate = true

// Renderer
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
  alpha: false,
  preserveDrawingBuffer: false,
  premultipliedAlpha: false,
  
})

renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
renderer.setClearColor(0x101010, 0)
renderer.render(scene, camera)
renderer.outputEncoding = THREE.sRGBEncoding
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap


/*****************************************************************************************/
/********************************************************************* ENVIRONMENT SETUP */
/*****************************************************************************************/

// Load the environment texture
const textureLoader = new THREE.TextureLoader()
const envMap = textureLoader.load('./textures/envMap.jpg')
envMap.mapping = THREE.EquirectangularReflectionMapping

// Create a ground plane
const geometry = new THREE.PlaneBufferGeometry(20, 20, 1, 1)
const material = new THREE.ShadowMaterial({
  opacity: 1,
  color: 0x000000,

})
const plane = new THREE.Mesh(geometry, material)
plane.receiveShadow = true
plane.rotation.x = -Math.PI / 2
scene.add(plane)

/*****************************************************************************************/
/************************************************************************* TEXTURE SETUP */
/*****************************************************************************************/

// Create the Diffuse Map
const DiffuseMap = new THREE.TextureLoader().load('./textures/Avatar_Diffuse.jpg');
DiffuseMap.encoding = THREE.sRGBEncoding
DiffuseMap.flipY = false;

// Create the Normal map
const NormalMap = new THREE.TextureLoader().load('./textures/Avatar_Normal.jpg');
NormalMap.flipY = false;


/*****************************************************************************************/
/********************************************************************* GLTF MODEL LOADER */
/*****************************************************************************************/

// Draco loader
const dracoLoader = new DRACOLoader()
dracoLoader.setDecoderPath('./decoder/')

const gltfLoader = new GLTFLoader()
gltfLoader.setDRACOLoader(dracoLoader)

let loaded = false

gltfLoader.load('./models/Avatar.glb', (gltf) => {

  const model = gltf.scene

  model.traverse(child => {
    if (child.isMesh) {
      child.material.envMap = envMap
      child.material.envMapIntensity = 0.5
      child.material.map = DiffuseMap
      child.material.normalMap = NormalMap      
      child.material.normalScale = new THREE.Vector2(2, 2)    
      child.castShadow = true  
    }
  })

  scene.add(model)

  const animations = gltf.animations
  //console.log(animations)

  window.mixer = new THREE.AnimationMixer(model)
  mixer.clipAction(animations[3]).play()

  loaded = true
},

  // called as loading progresses
  (xhr) => { /*console.log((xhr.loaded / xhr.total * 100) + '% loaded');*/ },
  // called when loading has errors
  (error) => { console.log(error); }
)

/*****************************************************************************************/
/*************************************************************************** LIGHTS ******/
/*****************************************************************************************/

// Create a light
const light = new THREE.DirectionalLight(0xffffff, 1)
light.position.set(1, 3, 1)
light.castShadow = true
scene.add(light)

const lightSize = 1

light.shadow.mapSize.width = 512 // default
light.shadow.mapSize.height = 512 // default
light.shadow.camera.near = 0.5 // default
light.shadow.camera.far = 500 // default
light.shadow.camera.left = -lightSize
light.shadow.camera.right = lightSize
light.shadow.camera.top = lightSize
light.shadow.camera.bottom = -lightSize

//Create a helper for the shadow camera (optional)
//const helper = new THREE.CameraHelper( light.shadow.camera );
//scene.add( helper );

/*****************************************************************************************/
/************************************************************* CLOCK TICK AND STATS ******/
/*****************************************************************************************/

// Stats
const stats = new Stats()
stats.showPanel(0)
document.body.appendChild(stats.dom)

// Initialize the main loop
const clock = new THREE.Clock()
let lastElapsedTime = 0
let FPS = 0

// Create the main loop invoking the tick function
const tick = () => {

  // Call tick again on the next frame
  requestAnimationFrame(tick)

  const elapsedTime = clock.getElapsedTime()
  const deltaTime = elapsedTime - lastElapsedTime
  lastElapsedTime = elapsedTime

  //FPS
  FPS = Math.round(1 / deltaTime)

  // Update controls
  controls.update()

  // Update stats
  stats.update()

  // Mixer update
  if (loaded == true) mixer.update(deltaTime)

  // Render
  renderer.render(scene, camera)

}

tick()

/*****************************************************************************************/
/************************************************************* RESIZE EVENT LISTENER *****/
/*****************************************************************************************/

addEventListener('resize', () => {

  sizes.width = innerWidth
  sizes.height = innerHeight
  camera.aspect = sizes.width / sizes.height
  camera.updateProjectionMatrix()
  renderer.setSize(sizes.width, sizes.height)
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
  renderer.render(scene, camera)

})