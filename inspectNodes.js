const fs = require('fs');

function inspectGLB(filePath) {
  const buffer = fs.readFileSync(filePath);
  const chunk0Length = buffer.readUInt32LE(12);
  const jsonString = buffer.toString('utf8', 20, 20 + chunk0Length);
  const gltf = JSON.parse(jsonString);

  console.log('Meshes:');
  gltf.meshes.forEach((mesh, index) => {
    console.log(`[${index}] Name: ${mesh.name}`);
  });

  console.log('\nNodes:');
  gltf.nodes.forEach((node, index) => {
    console.log(`[${index}] Name: ${node.name}, Mesh: ${node.mesh}`);
  });
}

inspectGLB(process.argv[2]);
