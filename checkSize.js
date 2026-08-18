const fs = require('fs');

function readGlbSize(filePath) {
  const buffer = fs.readFileSync(filePath);
  const magic = buffer.readUInt32LE(0);
  if (magic !== 0x46546C67) {
    throw new Error('Not a GLB file');
  }
  const version = buffer.readUInt32LE(4);
  const length = buffer.readUInt32LE(8);
  
  const chunk0Length = buffer.readUInt32LE(12);
  const chunk0Type = buffer.readUInt32LE(16);
  if (chunk0Type !== 0x4E4F534A) {
    throw new Error('First chunk is not JSON');
  }
  
  const jsonString = buffer.toString('utf8', 20, 20 + chunk0Length);
  const json = JSON.parse(jsonString);
  
  let minBox = [Infinity, Infinity, Infinity];
  let maxBox = [-Infinity, -Infinity, -Infinity];

  if (!json.accessors) {
    console.log(filePath, "No accessors found");
    return;
  }
  
  for (const accessor of json.accessors) {
    if (accessor.type === 'VEC3' && accessor.min && accessor.max) {
      // Typically POSITION or NORMAL, we only care about POSITION but checking all VEC3s min/max usually gives the bounding box
      minBox[0] = Math.min(minBox[0], accessor.min[0]);
      minBox[1] = Math.min(minBox[1], accessor.min[1]);
      minBox[2] = Math.min(minBox[2], accessor.min[2]);
      
      maxBox[0] = Math.max(maxBox[0], accessor.max[0]);
      maxBox[1] = Math.max(maxBox[1], accessor.max[1]);
      maxBox[2] = Math.max(maxBox[2], accessor.max[2]);
    }
  }
  
  const sizeX = maxBox[0] - minBox[0];
  const sizeY = maxBox[1] - minBox[1];
  const sizeZ = maxBox[2] - minBox[2];
  
  console.log('File:', filePath);
  console.log('Min:', minBox);
  console.log('Max:', maxBox);
  console.log('Size:', [sizeX, sizeY, sizeZ]);
  console.log('Max Dimension:', Math.max(sizeX, sizeY, sizeZ));
  console.log('---');
}

const dir = 'C:\\Users\\Sujal\\Desktop\\Freelance\\8thwallDemo\\public\\washing-machine\\src\\assets\\';
readGlbSize(dir + 'drum_washing_machine.glb');
readGlbSize(dir + 'orient_air_cooler.glb');
