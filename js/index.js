import 'whatwg-fetch';
import { getPrices } from './data';
import { Webland } from './webland';

if (Detector.webgl) {
  const container = document.getElementById('container');
  const webland = new Webland(container);
  getPrices()
    .then((data) => webland.addData(data));
} else {
  Detector.addGetWebGLMessage();
}
