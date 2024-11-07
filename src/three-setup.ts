import { Scene, PerspectiveCamera, WebGLRenderer, Plane, Vector3 } from "three";
import { TrackballControls } from "three/examples/jsm/controls/TrackballControls.js";
import { drawCurrentScene, DrawnObject } from "./current-scene";
import { Volume } from "three/examples/jsm/misc/Volume.js";
import { GUI } from "three/addons/libs/lil-gui.module.min.js";

export function setupThreeCanvas(volume: Volume) {
  const scene = new Scene();
  const camera = new PerspectiveCamera(75, 1, 0.1, 1000);
  camera.position.z = 5;

  const renderer = new WebGLRenderer();
  renderer.localClippingEnabled = true;
  renderer.setSize(500, 500);
  document.body.appendChild(renderer.domElement);

  const controls = new TrackballControls(camera, renderer.domElement);
  controls.minDistance = 300;
  controls.maxDistance = 400;
  controls.rotateSpeed = 5.0;
  controls.zoomSpeed = 5;
  controls.panSpeed = 2;

  const plane = new Plane(new Vector3(1, 0, 0), 0);

  const gui = new GUI();

  function normalisePlaneNormal() {
    const normalised = plane.normal.clone().normalize();
    plane.normal.set(normalised.x, normalised.y, normalised.z);
  }

  gui.add(plane.normal, "x", -1, 1).onChange(normalisePlaneNormal);
  gui.add(plane.normal, "y", -1, 1).onChange(normalisePlaneNormal);
  gui.add(plane.normal, "z", -1, 1).onChange(normalisePlaneNormal);

  const meshes: DrawnObject[] = [];

  function animate() {
    controls.update();

    meshes.forEach((mesh) => scene.remove(mesh));
    const newMeshes = drawCurrentScene(scene, volume, plane);
    meshes.splice(0, meshes.length, ...newMeshes);

    renderer.render(scene, camera);
  }

  renderer.setAnimationLoop(animate);
}
