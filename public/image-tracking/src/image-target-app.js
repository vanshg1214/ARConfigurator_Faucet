import './index.css'

const onxrloaded = () => {
  console.log('DEBUG: XR8 Engine Loaded. Registering image target data...')
  XR8.XrController.configure({
    imageTargetData: [
      require('../image-targets/watch-img.json'),
    ],
  })
  console.log('DEBUG: Custom Image Target registered in XR8:', require('../image-targets/watch-img.json'))
}

// A real-time debug overlay to display scale, rotation, and position
AFRAME.registerComponent('transform-logger', {
  init() {
    this.debugDiv = document.createElement('div')
    this.debugDiv.style.position = 'fixed'
    this.debugDiv.style.bottom = '20px'
    this.debugDiv.style.left = '20px'
    this.debugDiv.style.backgroundColor = 'rgba(0,0,0,0.8)'
    this.debugDiv.style.color = '#00ff00'
    this.debugDiv.style.padding = '15px'
    this.debugDiv.style.borderRadius = '8px'
    this.debugDiv.style.fontFamily = 'monospace'
    this.debugDiv.style.fontSize = '14px'
    this.debugDiv.style.zIndex = '9999'
    this.debugDiv.style.pointerEvents = 'none'
    document.body.appendChild(this.debugDiv)
  },
  tick() {
    const p = this.el.object3D.position
    const r = this.el.object3D.rotation
    const s = this.el.object3D.scale
    
    // Convert radians to degrees for easy reading
    const rx = (r.x * 180 / Math.PI).toFixed(1)
    const ry = (r.y * 180 / Math.PI).toFixed(1)
    const rz = (r.z * 180 / Math.PI).toFixed(1)

    this.debugDiv.innerHTML = `
      <b>Current Watch Settings:</b><br><br>
      Scale: ${s.x.toFixed(2)} ${s.y.toFixed(2)} ${s.z.toFixed(2)}<br>
      Rotation: ${rx} ${ry} ${rz}<br>
      Position: ${p.x.toFixed(3)} ${p.y.toFixed(3)} ${p.z.toFixed(3)}
    `
  }
})

// Register debugging component for image target events
AFRAME.registerComponent('log-image-target', {
  init() {
    console.log('DEBUG: log-image-target component initialized on entity', this.el)
    
    // xrextras-named-image-target emits xrextrasfound/xrextraslost on the entity itself
    this.el.addEventListener('xrextrasfound', (e) => {
      console.log(`%c[ENTITY: IMAGE TARGET FOUND] Target: ${this.el.getAttribute('name')}`, 'background: #222; color: #bada55; font-size: 14px;')
    })
    this.el.addEventListener('xrextraslost', (e) => {
      console.log(`%c[ENTITY: IMAGE TARGET LOST] Target: ${this.el.getAttribute('name')}`, 'background: #222; color: #ff5555; font-size: 14px;')
    })
  }
})

// Custom component for Extended Tracking (SLAM + Image Target)
AFRAME.registerComponent('persisting-image-target', {
  schema: {
    name: { type: 'string' }
  },
  init() {
    const object3D = this.el.object3D
    const name = this.data.name
    
    // Hide the object initially until the image is found
    object3D.visible = false

    const updatePosition = ({detail}) => {
      if (name !== detail.name) return
      
      // Update the 3D object to match the image target's real-world position
      object3D.position.copy(detail.position)
      object3D.quaternion.copy(detail.rotation)
      object3D.scale.set(detail.scale, detail.scale, detail.scale)
      
      // Make it visible once found
      object3D.visible = true
    }

    // Update position when found and when tracking updates
    this.el.sceneEl.addEventListener('xrimagefound', updatePosition)
    this.el.sceneEl.addEventListener('xrimageupdated', updatePosition)
    
    // We intentionally DO NOT listen to 'xrimagelost' to hide the object!
    // Because SLAM is active, the object will stay at its last known physical location in the real world.
  }
})

// Listen for the general session and tracking events on DOM ready (before session starts)
document.addEventListener('DOMContentLoaded', () => {
  const scene = document.querySelector('a-scene')
  if (scene) {
    console.log('DEBUG: Registering scene-level XR event listeners.')
    
    scene.addEventListener('xrsessionstart', () => {
      console.log('DEBUG: XR Session Started Successfully!')
    })
    
    // Scene element receives raw events from the XR8 engine
    scene.addEventListener('xrimagefound', (e) => {
      console.log(`%c[SCENE: IMAGE TARGET FOUND] Name: ${e.detail.name}`, 'background: #111; color: #00ff00; font-size: 14px;', e.detail)
    })
    scene.addEventListener('xrimagelost', (e) => {
      console.log(`%c[SCENE: IMAGE TARGET LOST] Name: ${e.detail.name}`, 'background: #111; color: #ff0000; font-size: 14px;', e.detail)
    })
    scene.addEventListener('xrimagescanning', (e) => {
      console.log('DEBUG: XR8 is scanning targets...', e.detail.imageTargets)
    })
  }
})

// Ensure the XR runtime is initialized with the targets
if (window.XR8) {
  onxrloaded()
} else {
  window.addEventListener('xrloaded', onxrloaded)
}
