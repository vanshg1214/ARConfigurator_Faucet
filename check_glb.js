const fs = require('fs');
const THREE = require('three');
require('./node_modules/three/examples/jsm/loaders/GLTFLoader.js');

// We need a DOM environment to use GLTFLoader in Node
const { JSDOM } = require('jsdom');
const dom = new JSDOM();
global.window = dom.window;
global.document = window.document;

// Wait, doing GLTFLoader in node is tricky. Let's just read the binary buffer to get the min/max from the accessors!
// Better yet, just use a quick gltf parser
