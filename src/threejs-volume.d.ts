import "three/examples/jsm/misc/Volume.js";

declare module "three/examples/jsm/misc/Volume.js" {
  export interface Volume {
    dimensions: [number, number, number];
    RASDimensions: [number, number, number];
    windowHigh: number;
    windowLow: number;
  }
}
