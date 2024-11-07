import { Scene, Plane, Mesh, BoxHelper } from "three";
import { Volume } from "three/examples/jsm/misc/Volume.js";
import { createPlaneClippedCube } from "./objects";

export type DrawnObject = Mesh | BoxHelper;

export function drawCurrentScene(
  scene: Scene,
  volume: Volume,
  cutPlane: Plane
): DrawnObject[] {
  // Keep all meshes we've drawn, as we'll return them so they can be removed
  // from the scene before drawing new ones on the next animation loop
  const meshes: DrawnObject[] = [];

  function addToScene(...meshes: DrawnObject[]) {
    scene.add(...meshes);
    meshes.push(...meshes);
  }

  // 1. Draw a green cube clipped by the cut plane to show the position
  //    of the cut plane & a yellow outline to show the extents of the volume
  const { cube, box } = createPlaneClippedCube(volume.RASDimensions, cutPlane);
  addToScene(cube, box);

  return meshes;
}
