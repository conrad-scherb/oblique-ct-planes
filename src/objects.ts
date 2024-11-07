import {
  BoxGeometry,
  BoxHelper,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  ClampToEdgeWrapping,
  DoubleSide,
  LinearFilter,
  LineBasicMaterial,
  LineLoop,
  Mesh,
  MeshBasicMaterial,
  Plane,
  PlaneGeometry,
  Points,
  PointsMaterial,
  SRGBColorSpace,
  Vector2,
  Vector3,
} from "three";
import {
  convert2DPointsOnPlaneTo3D,
  find2DProjectionUnitVectors,
} from "./projection";
import { calculateSpacingInDirection } from "./math";
import { Volume } from "three/examples/jsm/Addons.js";
import Flatten from "@flatten-js/core";

export function createPlaneClippedCube(
  dims: number[],
  cutPlane?: Plane
): { cube: Mesh; box: BoxHelper } {
  const geometry = new BoxGeometry(dims[0], dims[1], dims[2]);
  const material = new MeshBasicMaterial({ color: 0x00ff00 });

  if (cutPlane) {
    material.clippingPlanes = [cutPlane];
  }

  const cube = new Mesh(geometry, material);
  const box = new BoxHelper(cube);

  return { cube, box };
}

export function createDot(point: Vector3): Points {
  const dotGeometry = new BufferGeometry();
  dotGeometry.setAttribute(
    "position",
    new BufferAttribute(new Float32Array([point.x, point.y, point.z]), 3)
  );

  const dotMaterial = new PointsMaterial({
    size: 25,
    color: 0xff0000,
  });
  const dot = new Points(dotGeometry, dotMaterial);

  return dot;
}

export function createWireframeLoop(vertices: Vector3[]): LineLoop {
  const boundingRectGeometry = new BufferGeometry();
  const boundingRectVertices = new Float32Array(12);

  for (let i = 0; i < vertices.length; i++) {
    const offset = i * 3;

    boundingRectVertices[offset] = vertices[i].x;
    boundingRectVertices[offset + 1] = vertices[i].y;
    boundingRectVertices[offset + 2] = vertices[i].z;
  }

  boundingRectGeometry.setAttribute(
    "position",
    new BufferAttribute(boundingRectVertices, 3)
  );

  const boundingRectMaterial = new LineBasicMaterial({ color: 0xff0000 });
  const boundingRectLoop = new LineLoop(
    boundingRectGeometry,
    boundingRectMaterial
  );

  return boundingRectLoop;
}

export function createObliqueCTSlice(args: {
  volume: Volume;
  intersectionPoints: Vector3[];
  intersectionsIn2D: Vector2[];
  xLength: number;
  yLength: number;
  minX: number;
  minY: number;
  planeNormal: Vector3;
}): Mesh {
  const {
    volume,
    intersectionPoints,
    intersectionsIn2D,
    xLength,
    yLength,
    minX,
    minY,
    planeNormal,
  } = args;

  const { xAxisUnitVector, yAxisUnitVector } = find2DProjectionUnitVectors(
    intersectionPoints,
    planeNormal
  );

  // Find the spacing in the projected X & Y directions along the cut plane so
  // we can map the physical position to a pixel in the CT data
  const xAxisSpacing = calculateSpacingInDirection(
    xAxisUnitVector,
    volume.spacing
  );
  const yAxisSpacing = calculateSpacingInDirection(
    yAxisUnitVector,
    volume.spacing
  );

  // Convert this length from mm in realspace to pixels based on the spacing
  const xLengthInPixels = Math.ceil(xLength / xAxisSpacing);
  const yLengthInPixels = Math.ceil(yLength / yAxisSpacing);

  // Create a temporary canvas, which we will draw the slice to and then
  // apply as a texture on a PlaneGeometry which gets rendered in the viewer
  const canvas = document.createElement("canvas");
  canvas.width = xLengthInPixels;
  canvas.height = yLengthInPixels;

  const ctx = canvas.getContext("2d")!;

  const imageData = ctx.createImageData(xLengthInPixels, yLengthInPixels);
  const data = imageData.data;

  // Use the full windowing space for now
  const windowLow = 0;
  const windowHigh = 3952;

  const pointsPolygon = new Flatten.Polygon(
    intersectionsIn2D.map((point) => new Flatten.Point(point.x, point.y))
  );

  // Generate the canvas image data buffer
  for (let i = 0; i < data.length; i += 4) {
    // Check if this point in 2D is inside the intersectionsIn2D
    const x = ((i / 4) % xLengthInPixels) * xAxisSpacing + minX;
    const y = Math.floor(i / 4 / xLengthInPixels) * yAxisSpacing + minY;

    // Check if this point is inside the polygon
    const isInside = pointsPolygon.contains(new Flatten.Point(x, y));

    if (isInside) {
      // Convert the point from 2D space back to 3D space
      const pointIn3D = convert2DPointsOnPlaneTo3D(
        intersectionPoints[0],
        [new Vector2(x, y)],
        { xAxisUnitVector, yAxisUnitVector }
      )[0];

      // Shift the point by 1/2 RASDimensions in each dimension, so it
      // is properly centered in the volume
      pointIn3D.x += volume.RASDimensions[0] / 2;
      pointIn3D.y += volume.RASDimensions[1] / 2;
      pointIn3D.z += volume.RASDimensions[2] / 2;

      // 11. Convert from 3D RAS space to ijk voxel space
      const ijk = [
        Math.floor(pointIn3D.x / volume.spacing[0]),
        Math.floor(pointIn3D.y / volume.spacing[1]),
        Math.floor(pointIn3D.z / volume.spacing[2]),
      ];

      // Get the voxel value at this ijk coordinate
      const voxelValue = volume.getData(ijk[0], ijk[1], ijk[2]);

      // Apply windowing to voxel value
      const windowedValue = Math.floor(
        (255 * (voxelValue - windowLow)) / (windowHigh - windowLow)
      );

      // Set the pixel color based on the voxel value
      data[i] = windowedValue;
      data[i + 1] = windowedValue;
      data[i + 2] = windowedValue;
      data[i + 3] = 255;
    } else {
      // make pixel blue to clearly show outside bounds
      data[i] = 0;
      data[i + 1] = 0;
      data[i + 2] = 255;
      data[i + 3] = 255;
    }
  }

  ctx.putImageData(imageData, 0, 0);

  // 1Create a new texture from the canvas
  const canvasMap = new CanvasTexture(canvas);
  canvasMap.minFilter = LinearFilter;
  canvasMap.generateMipmaps = true;
  canvasMap.wrapS = canvasMap.wrapT = ClampToEdgeWrapping;
  canvasMap.colorSpace = SRGBColorSpace;

  // Create a new PlaneGeometry with the dimensions calculated
  const planeGeometry = new PlaneGeometry(xLength, yLength);
  const planeMaterial = new MeshBasicMaterial({
    map: canvasMap,
    side: DoubleSide,
    transparent: true,
  });

  // !!! Make the planeGeometry look at the plane normal
  planeGeometry.lookAt(planeNormal);

  const obliqueSlice = new Mesh(planeGeometry, planeMaterial);

  return obliqueSlice;
}
