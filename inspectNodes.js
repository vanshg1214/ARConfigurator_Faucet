const fs = require('fs');

function inspectGlb(filePath) {
  const buffer = fs.readFileSync(filePath);
  const magic = buffer.readUInt32LE(0);
  if (magic !== 0x46546C67) {
    throw new Error('Not a GLB file');
  }
  const chunk0Length = buffer.readUInt32LE(12);
  const jsonString = buffer.toString('utf8', 20, 20 + chunk0Length);
  const json = JSON.parse(jsonString);
  
  console.log("Nodes:");
  if (json.nodes) {
    json.nodes.forEach((node, idx) => {
      console.log(`[${idx}] Name: ${node.name || 'unnamed'}`);
    });
  }
}

inspectGlb('C:\\Users\\Sujal\\Desktop\\Freelance\\8thwallDemo\\public\\configurator\\src\\assets\\Faucet glb (1).glb');
