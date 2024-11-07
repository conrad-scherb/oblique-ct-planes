import { Scene, Plane, Mesh, BoxHelper, Points, LineLoop } from "three";
import { Volume } from "three/examples/jsm/misc/Volume.js";
import {
  createDot,
  createObliqueCTSlice,
  createPlaneClippedCube,
  createWireframeLoop,
} from "./objects";
import {
  findBoundingRectVerticesForPointsOnPlane,
  findIntersectionsBetweenCubeAndPlane,
} from "./math";

export type DrawnObject = Mesh | BoxHelper | Points | LineLoop;

export function drawCurrentScene(
  scene: Scene,
  volume: Volume,
  cutPlane: Plane
): DrawnObject[] {
  // Keep all meshes we've drawn, as we'll return them so they can be removed
  // from the scene before drawing new ones on the next animation loop
  const drawnMeshes: DrawnObject[] = [];

  function addToScene(...meshes: DrawnObject[]) {
    scene.add(...meshes);
    drawnMeshes.push(...meshes);
  }

  // 1. Draw a green cube clipped by the cut plane to show the position
  //    of the cut plane & a yellow outline to show the extents of the volume
  const { cube, box } = createPlaneClippedCube(volume.RASDimensions, cutPlane);
  addToScene(cube, box);

  // 2. Find the intersection points between the cut plane and the volume bounds.
  //    These points will be used to figure out the dims of the oblique plane to draw.
  const intersectionPoints = findIntersectionsBetweenCubeAndPlane(
    cube,
    cutPlane
  );

  // 3. Draw each intersection point as a red dot
  const dots = intersectionPoints.map((point) => createDot(point));
  addToScene(...dots);

  // 4. Find the bounding box that encloses all the intersection points along
  //    the cut plane. This will be the dimensions of the oblique plane.
  const intersectionBoundingRectDetails =
    findBoundingRectVerticesForPointsOnPlane(
      intersectionPoints,
      cutPlane.normal
    );

  // 5. Draw the bounding box as a red wireframe
  const boundingRect = createWireframeLoop(
    intersectionBoundingRectDetails.boundingVertices
  );
  addToScene(boundingRect);

  // 6. Draw the oblique CT slice PlaneGeometry
  const obliqueSlice = createObliqueCTSlice({
    volume,
    intersectionPoints,
    intersectionsIn2D: intersectionBoundingRectDetails.pointsIn2D,
    xLength: intersectionBoundingRectDetails.xLength,
    yLength: intersectionBoundingRectDetails.yLength,
    minX: intersectionBoundingRectDetails.minX,
    minY: intersectionBoundingRectDetails.minY,
    planeNormal: cutPlane.normal,
  });
  addToScene(obliqueSlice);

  return drawnMeshes;
}
