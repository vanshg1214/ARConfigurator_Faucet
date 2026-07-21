import './index.css'

const onxrloaded = () => {
  console.log('DEBUG: XR8 Engine Loaded. Registering image target data...')
  XR8.XrController.configure({
    imageTargetData: [
      require('../image-targets/watch-img.json'),
    ],
  })
}

// A real-time interactive debug overlay to modify scale, rotation, and position on mobile
AFRAME.registerComponent('transform-logger', {
  init() {
    this.panel = document.createElement('div')
    this.panel.style.position = 'fixed'
    this.panel.style.bottom = '8px'
    this.panel.style.left = '2vw'
    this.panel.style.width = '96vw'
    this.panel.style.boxSizing = 'border-box'
    this.panel.style.backgroundColor = 'rgba(0,0,0,0.88)'
    this.panel.style.color = '#fff'
    this.panel.style.padding = '6px 4px'
    this.panel.style.borderRadius = '8px'
    this.panel.style.fontFamily = 'sans-serif'
    this.panel.style.fontSize = '10px'
    this.panel.style.zIndex = '99999'
    this.panel.style.display = 'flex'
    this.panel.style.flexDirection = 'column'
    this.panel.style.gap = '4px'
    
    // Prevent touch events from bleeding through to A-Frame gestures
    this.panel.addEventListener('touchstart', (e) => e.stopPropagation())
    this.panel.addEventListener('touchmove', (e) => e.stopPropagation())
    this.panel.addEventListener('touchend', (e) => e.stopPropagation())
    
    document.body.appendChild(this.panel)
    
    const title = document.createElement('div')
    title.innerText = '⚙️ AR Inspector ( X | Y | Z )'
    title.style.fontWeight = 'bold'
    title.style.textAlign = 'center'
    title.style.color = '#00ff00'
    title.style.fontSize = '11px'
    title.style.marginBottom = '2px'
    this.panel.appendChild(title)
    
    const createRow = (label, propName, step, type) => {
      const row = document.createElement('div')
      row.style.display = 'flex'
      row.style.alignItems = 'center'
      row.style.justifyContent = 'space-between'
      row.style.gap = '3px'
      row.style.width = '100%'
      row.style.boxSizing = 'border-box'
      
      const lbl = document.createElement('div')
      lbl.innerText = label
      lbl.style.width = '24px'
      lbl.style.fontWeight = 'bold'
      lbl.style.fontSize = '9px'
      lbl.style.flexShrink = '0'
      row.appendChild(lbl)
      
      const axes = ['x', 'y', 'z']
      axes.forEach(axis => {
        const group = document.createElement('div')
        group.style.display = 'flex'
        group.style.alignItems = 'center'
        group.style.backgroundColor = '#222'
        group.style.borderRadius = '4px'
        group.style.padding = '1px'
        group.style.flex = '1'
        group.style.minWidth = '0'
        group.style.boxSizing = 'border-box'
        
        const btnMinus = document.createElement('button')
        btnMinus.innerText = '-'
        btnMinus.style.width = '18px'
        btnMinus.style.height = '22px'
        btnMinus.style.flexShrink = '0'
        btnMinus.style.borderRadius = '3px'
        btnMinus.style.border = 'none'
        btnMinus.style.backgroundColor = '#444'
        btnMinus.style.color = 'white'
        btnMinus.style.fontWeight = 'bold'
        btnMinus.style.padding = '0'
        btnMinus.style.fontSize = '12px'
        btnMinus.style.cursor = 'pointer'
        
        const valDisp = document.createElement('input')
        valDisp.type = 'number'
        valDisp.style.width = '100%'
        valDisp.style.minWidth = '0'
        valDisp.style.textAlign = 'center'
        valDisp.style.fontFamily = 'monospace'
        valDisp.style.backgroundColor = 'transparent'
        valDisp.style.color = 'white'
        valDisp.style.border = 'none'
        valDisp.style.outline = 'none'
        valDisp.style.fontSize = '9px'
        valDisp.style.padding = '0'
        valDisp.style.margin = '0'
        valDisp.style.boxSizing = 'border-box'
        valDisp.style.webkitAppearance = 'none'
        
        // Prevent keypresses from moving camera
        valDisp.addEventListener('keydown', (e) => e.stopPropagation())
        
        // Update 3D model on change
        valDisp.addEventListener('change', (e) => {
          const val = parseFloat(e.target.value)
          if (!isNaN(val)) {
            if (type === 'rotation') {
              this.el.object3D[propName][axis] = val * (Math.PI / 180)
            } else {
              this.el.object3D[propName][axis] = val
            }
          }
        })
        
        const btnPlus = document.createElement('button')
        btnPlus.innerText = '+'
        btnPlus.style.width = '18px'
        btnPlus.style.height = '22px'
        btnPlus.style.flexShrink = '0'
        btnPlus.style.borderRadius = '3px'
        btnPlus.style.border = 'none'
        btnPlus.style.backgroundColor = '#444'
        btnPlus.style.color = 'white'
        btnPlus.style.fontWeight = 'bold'
        btnPlus.style.padding = '0'
        btnPlus.style.fontSize = '12px'
        btnPlus.style.cursor = 'pointer'
        
        const updateVal = (dir) => {
          if (type === 'rotation') {
            this.el.object3D[propName][axis] += dir * step * (Math.PI/180)
          } else {
            this.el.object3D[propName][axis] += dir * step
          }
        }
        
        btnMinus.onclick = () => updateVal(-1)
        btnPlus.onclick = () => updateVal(1)
        
        if (!this.displays) this.displays = {}
        if (!this.displays[propName]) this.displays[propName] = {}
        this.displays[propName][axis] = valDisp
        
        group.appendChild(btnMinus)
        group.appendChild(valDisp)
        group.appendChild(btnPlus)
        row.appendChild(group)
      })
      
      this.panel.appendChild(row)
    }
    
    createRow('POS', 'position', 0.001, 'position') // 1mm steps
    createRow('ROT', 'rotation', 1, 'rotation')    // 1 degree steps
    createRow('SCL', 'scale', 0.1, 'scale')        // 0.1 scale steps
  },
  
  tick() {
    if (!this.displays) return
    const p = this.el.object3D.position
    const r = this.el.object3D.rotation
    const s = this.el.object3D.scale
    
    const active = document.activeElement
    
    if (active !== this.displays.position.x) this.displays.position.x.value = p.x.toFixed(3)
    if (active !== this.displays.position.y) this.displays.position.y.value = p.y.toFixed(3)
    if (active !== this.displays.position.z) this.displays.position.z.value = p.z.toFixed(3)
    
    if (active !== this.displays.rotation.x) this.displays.rotation.x.value = (r.x * 180 / Math.PI).toFixed(0)
    if (active !== this.displays.rotation.y) this.displays.rotation.y.value = (r.y * 180 / Math.PI).toFixed(0)
    if (active !== this.displays.rotation.z) this.displays.rotation.z.value = (r.z * 180 / Math.PI).toFixed(0)
    
    if (active !== this.displays.scale.x) this.displays.scale.x.value = s.x.toFixed(2)
    if (active !== this.displays.scale.y) this.displays.scale.y.value = s.y.toFixed(2)
    if (active !== this.displays.scale.z) this.displays.scale.z.value = s.z.toFixed(2)
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
