const fs = require('fs');

function calcBounds(filePath) {
  const buffer = fs.readFileSync(filePath);
  const chunk0Length = buffer.readUInt32LE(12);
  const jsonString = buffer.toString('utf8', 20, 20 + chunk0Length);
  const gltf = JSON.parse(jsonString);

  let globalMin = [Infinity, Infinity, Infinity];
  let globalMax = [-Infinity, -Infinity, -Infinity];

  gltf.meshes.forEach(mesh => {
    mesh.primitives.forEach(prim => {
      const posAccessorIdx = prim.attributes.POSITION;
      if (posAccessorIdx !== undefined) {
        const accessor = gltf.accessors[posAccessorIdx];
        if (accessor.min && accessor.max) {
          for (let i = 0; i < 3; i++) {
            if (accessor.min[i] < globalMin[i]) globalMin[i] = accessor.min[i];
            if (accessor.max[i] > globalMax[i]) globalMax[i] = accessor.max[i];
          }
        }
      }
    });
  });

  console.log('Global Min:', globalMin);
  console.log('Global Max:', globalMax);
  
  const size = [
    globalMax[0] - globalMin[0],
    globalMax[1] - globalMin[1],
    globalMax[2] - globalMin[2]
  ];
  console.log('Size:', size);
  
  const center = [
    globalMin[0] + size[0] / 2,
    globalMin[1] + size[1] / 2,
    globalMin[2] + size[2] / 2
  ];
  console.log('Center:', center);
}

calcBounds(process.argv[2]);
