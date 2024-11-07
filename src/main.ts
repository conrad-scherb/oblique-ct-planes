import { NRRDLoader } from "three/addons/loaders/NRRDLoader.js";
import { setupThreeCanvas } from "./three-setup";
import { Volume } from "three/examples/jsm/misc/Volume.js";

const loader = new NRRDLoader();

async function loadNRRD(url: string): Promise<Volume> {
  return new Promise((resolve, reject) => {
    loader.load(url, resolve, undefined, reject);
  });
}

async function main() {
  const volume = await loadNRRD("./I.nrrd");

  setupThreeCanvas(volume);
}

void main();
