import { BoxGeometry, BoxHelper, Mesh, MeshBasicMaterial, Plane } from "three";

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
