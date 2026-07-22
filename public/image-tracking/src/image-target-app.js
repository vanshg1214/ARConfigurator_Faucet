import './index.css'

const onxrloaded = () => {
  console.log('DEBUG: XR8 Engine Loaded. Registering image target data...')
  XR8.XrController.configure({
    imageTargetData: [
      require('../image-targets/watch-img.json'),
    ],
  })
}



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

// A real-time interactive debug overlay to modify transform & dimensions of Card Overlay and Watch Model live on mobile
AFRAME.registerComponent('transform-logger', {
  init() {
    this.selectedTarget = 'card' // 'card' or 'watch'

    this.panel = document.createElement('div')
    this.panel.style.position = 'fixed'
    this.panel.style.bottom = '10px'
    this.panel.style.left = '2vw'
    this.panel.style.width = '96vw'
    this.panel.style.maxWidth = '450px'
    this.panel.style.boxSizing = 'border-box'
    this.panel.style.backgroundColor = 'rgba(0, 0, 0, 0.88)'
    this.panel.style.color = '#fff'
    this.panel.style.padding = '8px'
    this.panel.style.borderRadius = '10px'
    this.panel.style.fontFamily = 'monospace, sans-serif'
    this.panel.style.fontSize = '11px'
    this.panel.style.zIndex = '9999'
    this.panel.style.display = 'flex'
    this.panel.style.flexDirection = 'column'
    this.panel.style.gap = '6px'
    this.panel.style.border = '1px solid rgba(255,255,255,0.2)'

    document.body.appendChild(this.panel)

    this.cardEl = document.querySelector('#cardOverlay')
    this.watchEl = document.querySelector('#watchEntity')

    this.renderUI()
    
    const updateLoop = () => {
      this.syncInputsFromEntity()
      requestAnimationFrame(updateLoop)
    }
    setTimeout(updateLoop, 1000)
  },

  getTargetEl() {
    return this.selectedTarget === 'card' 
      ? document.querySelector('#cardOverlay') 
      : document.querySelector('#watchEntity')
  },

  renderUI() {
    this.panel.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; background: #222; padding: 4px 8px; border-radius: 6px;">
        <span style="font-weight: bold; color: #00ffcc;">TARGET:</span>
        <button id="toggleTargetBtn" style="background: #0088ff; color: #fff; border: none; padding: 4px 10px; border-radius: 4px; font-weight: bold; cursor: pointer; font-size: 11px;">
          ${this.selectedTarget === 'card' ? '📷 CARD OVERLAY' : '⌚ WATCH MODEL'}
        </button>
      </div>

      <!-- POS ROW -->
      <div style="display: flex; align-items: center; gap: 4px; box-sizing: border-box;">
        <span style="width: 32px; font-weight: bold; color: #ff9900;">POS:</span>
        ${['x','y','z'].map(axis => `
          <div style="flex: 1; min-width: 0; display: flex; align-items: center; background: #1a1a1a; border-radius: 4px; padding: 2px;">
            <span style="color: #aaa; padding: 0 2px;">${axis.toUpperCase()}:</span>
            <button id="pos_${axis}_minus" style="background:#333; color:#fff; border:none; width:18px; height:20px; border-radius:2px;">-</button>
            <input id="pos_${axis}_val" type="number" step="0.01" style="width: 100%; min-width: 0; background: transparent; border: none; color: #fff; text-align: center; font-size: 10px; -moz-appearance: textfield;" />
            <button id="pos_${axis}_plus" style="background:#333; color:#fff; border:none; width:18px; height:20px; border-radius:2px;">+</button>
          </div>
        `).join('')}
      </div>

      <!-- ROT ROW -->
      <div style="display: flex; align-items: center; gap: 4px; box-sizing: border-box;">
        <span style="width: 32px; font-weight: bold; color: #00ccff;">ROT:</span>
        ${['x','y','z'].map(axis => `
          <div style="flex: 1; min-width: 0; display: flex; align-items: center; background: #1a1a1a; border-radius: 4px; padding: 2px;">
            <span style="color: #aaa; padding: 0 2px;">${axis.toUpperCase()}:</span>
            <button id="rot_${axis}_minus" style="background:#333; color:#fff; border:none; width:18px; height:20px; border-radius:2px;">-</button>
            <input id="rot_${axis}_val" type="number" step="1" style="width: 100%; min-width: 0; background: transparent; border: none; color: #fff; text-align: center; font-size: 10px; -moz-appearance: textfield;" />
            <button id="rot_${axis}_plus" style="background:#333; color:#fff; border:none; width:18px; height:20px; border-radius:2px;">+</button>
          </div>
        `).join('')}
      </div>

      <!-- SCL / DIM ROW -->
      <div style="display: flex; align-items: center; gap: 4px; box-sizing: border-box;">
        <span style="width: 32px; font-weight: bold; color: #ff3399;">${this.selectedTarget === 'card' ? 'SIZE' : 'SCL'}:</span>
        ${['x','y','z'].map(axis => `
          <div style="flex: 1; min-width: 0; display: flex; align-items: center; background: #1a1a1a; border-radius: 4px; padding: 2px;">
            <span style="color: #aaa; padding: 0 2px;">${axis.toUpperCase()}:</span>
            <button id="scl_${axis}_minus" style="background:#333; color:#fff; border:none; width:18px; height:20px; border-radius:2px;">-</button>
            <input id="scl_${axis}_val" type="number" step="0.05" style="width: 100%; min-width: 0; background: transparent; border: none; color: #fff; text-align: center; font-size: 10px; -moz-appearance: textfield;" />
            <button id="scl_${axis}_plus" style="background:#333; color:#fff; border:none; width:18px; height:20px; border-radius:2px;">+</button>
          </div>
        `).join('')}
      </div>
    `

    // Add toggle listener
    this.panel.querySelector('#toggleTargetBtn').onclick = () => {
      this.selectedTarget = this.selectedTarget === 'card' ? 'watch' : 'card'
      this.renderUI()
      this.syncInputsFromEntity()
    }

    // Attach +/- and InputListeners
    ;['pos', 'rot', 'scl'].forEach(type => {
      ;['x', 'y', 'z'].forEach(axis => {
        const input = this.panel.querySelector(`#${type}_${axis}_val`)
        const btnMinus = this.panel.querySelector(`#${type}_${axis}_minus`)
        const btnPlus = this.panel.querySelector(`#${type}_${axis}_plus`)

        const step = type === 'pos' ? 0.01 : type === 'rot' ? 1 : 0.05

        btnMinus.onclick = () => {
          let val = parseFloat(input.value) || 0
          val = parseFloat((val - step).toFixed(4))
          input.value = val
          this.applyValueToEntity(type, axis, val)
        }

        btnPlus.onclick = () => {
          let val = parseFloat(input.value) || 0
          val = parseFloat((val + step).toFixed(4))
          input.value = val
          this.applyValueToEntity(type, axis, val)
        }

        input.onchange = () => {
          let val = parseFloat(input.value) || 0
          this.applyValueToEntity(type, axis, val)
        }
      })
    })
  },

  syncInputsFromEntity() {
    const el = this.getTargetEl()
    if (!el) return

    // If focused on an input, don't overwrite user typing
    if (document.activeElement && document.activeElement.tagName === 'INPUT') return

    if (this.selectedTarget === 'card') {
      // Card overlay: Position, Rotation, Width/Height
      const pos = el.getAttribute('position') || {x:0, y:0, z:0}
      const rot = el.getAttribute('rotation') || {x:0, y:0, z:0}
      const w = parseFloat(el.getAttribute('width')) || 1
      const h = parseFloat(el.getAttribute('height')) || 1.7918

      this.setValue('pos', 'x', pos.x)
      this.setValue('pos', 'y', pos.y)
      this.setValue('pos', 'z', pos.z)

      this.setValue('rot', 'x', rot.x)
      this.setValue('rot', 'y', rot.y)
      this.setValue('rot', 'z', rot.z)

      this.setValue('scl', 'x', w)
      this.setValue('scl', 'y', h)
      this.setValue('scl', 'z', 0)
    } else {
      // Watch entity: Position, Rotation, Scale
      const pos = el.getAttribute('position') || {x:0, y:0, z:0}
      const rot = el.getAttribute('rotation') || {x:0, y:0, z:0}
      const scl = el.getAttribute('scale') || {x:1, y:1, z:1}

      this.setValue('pos', 'x', pos.x)
      this.setValue('pos', 'y', pos.y)
      this.setValue('pos', 'z', pos.z)

      this.setValue('rot', 'x', rot.x)
      this.setValue('rot', 'y', rot.y)
      this.setValue('rot', 'z', rot.z)

      this.setValue('scl', 'x', typeof scl === 'object' ? scl.x : scl)
      this.setValue('scl', 'y', typeof scl === 'object' ? scl.y : scl)
      this.setValue('scl', 'z', typeof scl === 'object' ? scl.z : scl)
    }
  },

  setValue(type, axis, value) {
    const input = this.panel.querySelector(`#${type}_${axis}_val`)
    if (input) {
      input.value = Number(value).toFixed(2)
    }
  },

  applyValueToEntity(type, axis, val) {
    const el = this.getTargetEl()
    if (!el) return

    if (this.selectedTarget === 'card') {
      if (type === 'pos') {
        const pos = el.getAttribute('position') || {x:0, y:0, z:0}
        pos[axis] = val
        el.setAttribute('position', `${pos.x} ${pos.y} ${pos.z}`)
      } else if (type === 'rot') {
        const rot = el.getAttribute('rotation') || {x:0, y:0, z:0}
        rot[axis] = val
        el.setAttribute('rotation', `${rot.x} ${rot.y} ${rot.z}`)
      } else if (type === 'scl') {
        if (axis === 'x') el.setAttribute('width', val)
        if (axis === 'y') el.setAttribute('height', val)
      }
    } else {
      if (type === 'pos') {
        const pos = el.getAttribute('position') || {x:0, y:0, z:0}
        pos[axis] = val
        el.setAttribute('position', `${pos.x} ${pos.y} ${pos.z}`)
      } else if (type === 'rot') {
        const rot = el.getAttribute('rotation') || {x:0, y:0, z:0}
        rot[axis] = val
        el.setAttribute('rotation', `${rot.x} ${rot.y} ${rot.z}`)
      } else if (type === 'scl') {
        const scl = el.getAttribute('scale') || {x:1, y:1, z:1}
        if (typeof scl === 'object') {
          scl[axis] = val
          el.setAttribute('scale', `${scl.x} ${scl.y} ${scl.z}`)
        } else {
          el.setAttribute('scale', `${val} ${val} ${val}`)
        }
      }
    }
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
