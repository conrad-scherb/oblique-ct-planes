import { Vector2, Vector3 } from "three";

export interface Projected2DPlaneUnitVectors {
  xAxisUnitVector: Vector3;
  yAxisUnitVector: Vector3;
}

export function find2DProjectionUnitVectors(
  points: Vector3[],
  planeNormal: Vector3
): Projected2DPlaneUnitVectors {
  // Center the 2D coordinate system on the first point
  const origin = points[0];

  // The x-axis will be projected on the first to second intersection
  const xAxisUnitVector = points[1].clone().sub(origin).normalize();

  // The y-axis will be the cross product of the normal and x-axis
  const yAxisUnitVector = planeNormal
    .clone()
    .cross(xAxisUnitVector)
    .normalize();

  return { xAxisUnitVector, yAxisUnitVector };
}

export function project3DPointsOnto2DPlane(
  pointsToProject: Vector3[],
  unitVectors: Projected2DPlaneUnitVectors
) {
  const origin = pointsToProject[0];

  // Represent each pt in the 2D coordinate system defined by the unit vectors
  const points = pointsToProject.map((pt) => {
    const x = pt.clone().sub(origin).dot(unitVectors.xAxisUnitVector);
    const y = pt.clone().sub(origin).dot(unitVectors.yAxisUnitVector);

    return new Vector2(x, y);
  });

  return points;
}

export function convert2DPointsOnPlaneTo3D(
  originalOrigin: Vector3,
  points: Vector2[],
  unitVectors: Projected2DPlaneUnitVectors
) {
  return points.map((point) => {
    const x = unitVectors.xAxisUnitVector.clone().multiplyScalar(point.x);
    const y = unitVectors.yAxisUnitVector.clone().multiplyScalar(point.y);

    return originalOrigin.clone().add(x).add(y);
  });
}
