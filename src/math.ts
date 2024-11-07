import { BufferGeometry, Line3, Mesh, Plane, Vector2, Vector3 } from "three";
import {
  convert2DPointsOnPlaneTo3D,
  find2DProjectionUnitVectors,
  project3DPointsOnto2DPlane,
} from "./projection";

function getVerticesOfGeometry(geometry: BufferGeometry) {
  const position = geometry.getAttribute("position");
  const vertices = [];

  for (let i = 0; i < position.count / position.itemSize; i++) {
    const vertex = new Vector3(
      position.getX(i),
      position.getY(i),
      position.getZ(i)
    );

    vertices.push(vertex);
  }

  return vertices;
}

export function findIntersectionsBetweenCubeAndPlane(
  cube: Mesh,
  plane: Plane
): Vector3[] {
  const cubeVertices = getVerticesOfGeometry(cube.geometry);

  // Build the edges from the vertices
  const edges = [
    [cubeVertices[0], cubeVertices[1]],
    [cubeVertices[1], cubeVertices[3]],
    [cubeVertices[2], cubeVertices[3]],
    [cubeVertices[3], cubeVertices[6]],
    [cubeVertices[4], cubeVertices[5]],
    [cubeVertices[5], cubeVertices[7]],
    [cubeVertices[6], cubeVertices[7]],
    [cubeVertices[7], cubeVertices[5]],
    [cubeVertices[0], cubeVertices[2]],
    [cubeVertices[0], cubeVertices[5]],
    [cubeVertices[2], cubeVertices[7]],
    [cubeVertices[1], cubeVertices[4]],
    [cubeVertices[4], cubeVertices[6]],
  ].map((edges) => new Line3(...edges));

  const origin = new Vector3(0, 0, 0);

  let intersectionPoints = edges
    .map((edge) => {
      const intersection = new Vector3();
      plane.intersectLine(edge, intersection);
      return intersection;
    })
    .filter((i) => !i.equals(origin));

  // Remove duplicates
  const uniquePoints: Vector3[] = [];
  intersectionPoints.forEach((point) => {
    if (!uniquePoints.some((p) => p.equals(point))) {
      uniquePoints.push(point);
    }
  });

  // Order points by angle centered around (0, 0, 0)
  const sortedPoints = uniquePoints.sort((a, b) => {
    const angleA = Math.atan2(a.y, a.x);
    const angleB = Math.atan2(b.y, b.x);

    return angleA - angleB;
  });

  return sortedPoints;
}

export function findBoundingRectVerticesForPointsOnPlane(
  points: Vector3[],
  planeNormal: Vector3
): {
  boundingVertices: Vector3[];
  pointsIn2D: Vector2[];
  xLength: number;
  yLength: number;
  minX: number;
  minY: number;
} {
  const unitVectors = find2DProjectionUnitVectors(points, planeNormal);

  // Project the points onto a 2D space so we can easily find the extents
  // of the pixels that enclose the points
  const pointsIn2D = project3DPointsOnto2DPlane(points, unitVectors);

  // Find the min and max x and y values to determine the bounding rectangle
  const xValues = pointsIn2D.map((point) => point.x);
  const yValues = pointsIn2D.map((point) => point.y);

  const minX = Math.min(...xValues);
  const maxX = Math.max(...xValues);
  const minY = Math.min(...yValues);
  const maxY = Math.max(...yValues);

  const boundingVerticesIn2D = [
    new Vector2(minX, minY),
    new Vector2(minX, maxY),
    new Vector2(maxX, maxY),
    new Vector2(maxX, minY),
  ];

  // Project the bounding vertices back into 3D space
  const boundingVertices = convert2DPointsOnPlaneTo3D(
    points[0],
    boundingVerticesIn2D,
    unitVectors
  );

  const xLength = maxX - minX;
  const yLength = maxY - minY;

  return { boundingVertices, pointsIn2D, xLength, yLength, minX, minY };
}

// Calculate the spacing between pixels in the provided direction based on
// the orthogonal spacings from the CT DICOM metadata
export function calculateSpacingInDirection(
  directionVector: Vector3,
  orthogonalSpacings: number[]
) {
  const orthogonalDirectionUnitVectors = [
    new Vector3(1, 0, 0),
    new Vector3(0, 1, 0),
    new Vector3(0, 0, 1),
  ];

  const components = orthogonalDirectionUnitVectors.map((unitVector) =>
    unitVector.dot(directionVector)
  );

  const spacingComponents = components.map((component, idx) => {
    return Math.abs(component) * orthogonalSpacings[idx];
  });

  return Math.abs(spacingComponents.reduce((a, b) => a + b, 0));
}
