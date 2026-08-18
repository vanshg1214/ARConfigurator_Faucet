const fs = require('fs');

function inspectBBox(filePath) {
  const buffer = fs.readFileSync(filePath);
  const chunk0Length = buffer.readUInt32LE(12);
  const jsonString = buffer.toString('utf8', 20, 20 + chunk0Length);
  const gltf = JSON.parse(jsonString);
  
  console.log("Analyzing: " + filePath);
  
  if (!gltf.accessors) return console.log("No accessors found.");
  
  gltf.accessors.forEach((acc, i) => {
    if (acc.min && acc.max) {
      console.log(`Accessor ${i}: type=${acc.type}`);
      console.log(`  Min: ${JSON.stringify(acc.min)}`);
      console.log(`  Max: ${JSON.stringify(acc.max)}`);
    }
  });
}

inspectBBox(process.argv[2]);
