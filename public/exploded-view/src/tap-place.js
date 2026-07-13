// Component that places the turbofan engine where the ground is tapped
// Smooth gestures and exploded view offsets are handled manually with lerping.

export const tapPlaceComponent = {
  schema: {
    min: {default: 0.05},
    max: {default: 5.0},
  },
  init() {
    this.prompt = document.getElementById('promptText')
    this.engineElement = null
    this.isExploded = false
    this.explosionNodes = []

    this.sliderOffsets = {
      tube_front: -6.40,
      blades: -3.70,
      turbine_hull: 0.00,
      turbine_hull_middle: 5.45,
      electronics_side: 0.00,
      flaps: 2.80,
      plates_back: 3.95,
      fins_outside: 6.15,
      containers: -4.85
    }
    this.currentOffsets = {
      tube_front: 0,
      blades: 0,
      turbine_hull: 0,
      turbine_hull_middle: 0,
      electronics_side: 0,
      flaps: 0,
      plates_back: 0,
      fins_outside: 0,
      containers: 0
    }
    this.sliderElements = {}
    this.displayElements = {}
    this.explodeProgress = 0.0
    this.transitionDuration = 1800 // 1.8 seconds for an ultra-premium, slow ease-in-out transition

    // --- Smooth Gesture State ---
    this._targetScale = 1.0
    this._targetRotY = 0
    this._currentScale = 1.0
    this._currentRotY = 0

    // Touch tracking for custom gesture handling
    this._touches = {}
    this._lastPinchDist = null
    this._lastTwistAngle = null
    this._gestureActive = false

    // --- Remove 8th Wall "Powered By" logo using MutationObserver ---
    const hidePoweredBy = () => {
      const selectors = [
        '#poweredby', '.poweredby',
        '[class*="powered"]', '[id*="powered"]',
        '[class*="xrextras-powered"]',
        'a[href*="8thwall"]',
      ]
      selectors.forEach(sel => {
        document.querySelectorAll(sel).forEach(el => { el.style.display = 'none' })
      })
      document.querySelectorAll('div, span, a, p').forEach(el => {
        if (el.children.length === 0 && el.textContent.includes('8th Wall')) {
          let parent = el
          for (let i = 0; i < 4; i++) {
            if (parent && parent !== document.body && parent !== document.documentElement && parent.tagName !== 'HEAD') {
              parent.style.display = 'none'
              parent = parent.parentElement
            }
          }
        }
      })
    }

    hidePoweredBy()
    const observer = new MutationObserver(hidePoweredBy)
    observer.observe(document.body, { childList: true, subtree: true })

    // --- Touch Gesture Handlers ---
    const onTouchStart = (e) => {
      const touches = Array.from(e.touches)
      touches.forEach(t => { this._touches[t.identifier] = { x: t.clientX, y: t.clientY } })

      if (touches.length === 2) {
        const dx = touches[1].clientX - touches[0].clientX
        const dy = touches[1].clientY - touches[0].clientY
        this._lastPinchDist = Math.hypot(dx, dy)
        this._lastTwistAngle = Math.atan2(dy, dx)
        this._gestureActive = true
      }
    }

    const onTouchMove = (e) => {
      if (!this.engineElement || !this._gestureActive) return
      const touches = Array.from(e.touches)
      if (touches.length < 2) return

      e.preventDefault()

      const dx = touches[1].clientX - touches[0].clientX
      const dy = touches[1].clientY - touches[0].clientY
      const dist = Math.hypot(dx, dy)
      const angle = Math.atan2(dy, dx)

      // --- Pinch to Scale ---
      if (this._lastPinchDist !== null) {
        const scaleDelta = dist / this._lastPinchDist
        const newTarget = Math.min(5.0, Math.max(0.1, this._targetScale * scaleDelta))
        this._targetScale = newTarget
      }

      // --- Twist to Rotate ---
      if (this._lastTwistAngle !== null) {
        const angleDelta = (angle - this._lastTwistAngle) * (180 / Math.PI)
        this._targetRotY += angleDelta
      }

      this._lastPinchDist = dist
      this._lastTwistAngle = angle
    }

    const onTouchEnd = (e) => {
      const touches = Array.from(e.touches)
      if (touches.length < 2) {
        this._lastPinchDist = null
        this._lastTwistAngle = null
        this._gestureActive = false
      }
      Array.from(e.changedTouches).forEach(t => { delete this._touches[t.identifier] })
    }

    document.addEventListener('touchstart', onTouchStart, { passive: true })
    document.addEventListener('touchmove', onTouchMove, { passive: false })
    document.addEventListener('touchend', onTouchEnd, { passive: true })

    // --- Place / Move Engine on Ground Tap ---
    const attachListener = () => {
      const g = document.getElementById('ground')
      if (!g) { setTimeout(attachListener, 100); return; }

      g.addEventListener('click', (event) => {
        if (this.prompt) this.prompt.style.display = 'none'
        const touchPoint = event.detail.intersection.point

        // Face camera on first placement
        const camera = document.getElementById('camera')
        let rotationY = 0
        if (camera) {
          const cameraPos = camera.object3D.position
          const dx = cameraPos.x - touchPoint.x
          const dz = cameraPos.z - touchPoint.z
          rotationY = (Math.atan2(dx, -dz) * (180 / Math.PI)) + 180 + 90
        }

        if (this.engineElement) {
          // Smoothly glide to new position, preserve user's custom rotation/scale
          this.engineElement.setAttribute('animation__pos', {
            property: 'position',
            to: `${touchPoint.x} ${touchPoint.y + 1.6} ${touchPoint.z}`,
            easing: 'easeOutQuad',
            dur: 500,
          })
          return
        }

        // First placement
        const newElement = document.createElement('a-entity')
        this.engineElement = newElement

        newElement.setAttribute('position', `${touchPoint.x} ${touchPoint.y + 1.6} ${touchPoint.z}`)
        newElement.setAttribute('rotation', `0 ${rotationY} 0`)

        newElement.addEventListener('animationcomplete', (e) => {
          newElement.removeAttribute(e.detail.name)
        })

        newElement.setAttribute('visible', 'false')
        newElement.setAttribute('scale', '0.0001 0.0001 0.0001')
        newElement.setAttribute('shadow', { receive: false })
        newElement.setAttribute('gltf-model', '#engineModel')
        this.el.sceneEl.appendChild(newElement)

        newElement.addEventListener('model-loaded', () => {
          // Show UI Explode Button and Controls Panel
          const actionContainer = document.getElementById('actionContainer')
          if (actionContainer) actionContainer.style.display = 'flex'
          
          const controlsPanel = document.getElementById('controlsPanel')
          if (controlsPanel) controlsPanel.style.display = 'none'

          // Cache elements and bind slider events (safe to query DOM now)
          const sliderIds = {
            tube_front: { slide: 'slide_front_shroud', val: 'val_front_shroud' },
            blades: { slide: 'slide_blades', val: 'val_blades' },
            turbine_hull: { slide: 'slide_hull', val: 'val_hull' },
            turbine_hull_middle: { slide: 'slide_hull_middle', val: 'val_hull_middle' },
            electronics_side: { slide: 'slide_electronics', val: 'val_electronics' },
            flaps: { slide: 'slide_flaps', val: 'val_flaps' },
            plates_back: { slide: 'slide_plates_back', val: 'val_plates_back' },
            fins_outside: { slide: 'slide_fins_outside', val: 'val_fins_outside' },
            containers: { slide: 'slide_containers', val: 'val_containers' }
          }

          Object.keys(sliderIds).forEach(key => {
            const ids = sliderIds[key]
            this.sliderElements[key] = document.getElementById(ids.slide)
            this.displayElements[key] = document.getElementById(ids.val)
          })

          const bindSlider = (sliderId, valId, key) => {
            const slider = document.getElementById(sliderId)
            if (slider) {
              slider.addEventListener('input', (e) => {
                const val = parseFloat(e.target.value)
                this.sliderOffsets[key] = val
                this.currentOffsets[key] = val
                
                // Snap transition to fully exploded for instant response
                this.explodeProgress = 1.0
                
                // Auto-trigger Explode UI state on manual slider drag
                if (!this.isExploded) {
                  this.isExploded = true
                  const btnExplode = document.getElementById('btnExplode')
                  if (btnExplode) btnExplode.classList.add('active')
                  const explodeBtnText = document.getElementById('explodeBtnText')
                  if (explodeBtnText) explodeBtnText.innerText = 'Assemble'
                }
              })
            }
          }

          bindSlider('slide_front_shroud', 'val_front_shroud', 'tube_front')
          bindSlider('slide_blades', 'val_blades', 'blades')
          bindSlider('slide_hull', 'val_hull', 'turbine_hull')
          bindSlider('slide_hull_middle', 'val_hull_middle', 'turbine_hull_middle')
          bindSlider('slide_electronics', 'val_electronics', 'electronics_side')
          bindSlider('slide_flaps', 'val_flaps', 'flaps')
          bindSlider('slide_plates_back', 'val_plates_back', 'plates_back')
          bindSlider('slide_fins_outside', 'val_fins_outside', 'fins_outside')
          bindSlider('slide_containers', 'val_containers', 'containers')

          const obj = newElement.getObject3D('mesh')
          if (obj) {

            obj.traverse((node) => {
              if (node.name && node.type !== 'Bone' && node.type !== 'Scene') {
                let key = ''
                const name = node.name.toLowerCase()

                if (name.includes('tube_front')) {
                  key = 'tube_front'
                } else if (name.includes('blades')) {
                  key = 'blades'
                } else if (name === 'turbine_hull' || name === 'turbine_hull_0') {
                  key = 'turbine_hull'
                } else if (name === 'turbine_hull_middle' || name === 'turbine_hull_middle_0') {
                  key = 'turbine_hull_middle'
                } else if (name.includes('electonics_side_1') || name.includes('electronics_side')) {
                  key = 'electronics_side'
                } else if (name.includes('flaps') || name.includes('flaps_ring') || name.includes('flaps_stabiliser')) {
                  key = 'flaps'
                } else if (name.includes('plates_back')) {
                  key = 'plates_back'
                } else if (name.includes('fins_outside')) {
                  key = 'fins_outside'
                } else if (name.includes('container')) {
                  key = 'containers'
                }

                if (!key) {
                  return
                }

                // Prevent double-transforms: if an ancestor is already animated, skip this node
                let parent = node.parent
                let hasAncestor = false
                while (parent) {
                  if (this.explosionNodes.includes(parent)) {
                    hasAncestor = true
                    break
                  }
                  parent = parent.parent
                }
                if (hasAncestor) {
                  return
                }

                node.matrixAutoUpdate = true

                node.userData.originalLocalPos = node.position.clone()
                node.userData.key = key

                this.explosionNodes.push(node)
              }
            })
          }

          // Init gesture targets from actual placed values
          this._targetRotY = rotationY
          this._currentRotY = rotationY
          this._targetScale = 1.0
          this._currentScale = 0.0001

          newElement.setAttribute('visible', 'true')
          newElement.setAttribute('animation', {
            property: 'scale',
            to: '1.0 1.0 1.0',
            easing: 'easeOutElastic',
            dur: 800,
          })
        })
      })
    }
    attachListener()

    // --- Explode View ---
    const btnExplode = document.getElementById('btnExplode')
    const explodeBtnText = document.getElementById('explodeBtnText')
    if (btnExplode) {
      btnExplode.addEventListener('click', (e) => {
        e.stopPropagation()
        this.isExploded = !this.isExploded
        btnExplode.classList.toggle('active', this.isExploded)
        if (explodeBtnText) {
          explodeBtnText.innerText = this.isExploded ? 'Assemble' : 'Expand Engine'
        }
      })
    }


  },

  tick(time, timeDelta) {
    // Update mesh separation coordinates smoothly
    if (this.explosionNodes && this.explosionNodes.length > 0 && this.engineElement) {
      // Update global transition progress
      const rate = timeDelta / this.transitionDuration
      if (this.isExploded) {
        this.explodeProgress = Math.min(1.0, this.explodeProgress + rate)
      } else {
        this.explodeProgress = Math.max(0.0, this.explodeProgress - rate)
      }

      // Quintic Ease-in-out formula (slow start, acceleration, soft landing)
      const easeInOutQuint = (x) => {
        return x < 0.5 ? 16 * x * x * x * x * x : 1 - Math.pow(-2 * x + 2, 5) / 2
      }

      const t = easeInOutQuint(this.explodeProgress)
      
      // Update animated offsets and sliders
      const keys = ['tube_front', 'blades', 'turbine_hull', 'turbine_hull_middle', 'electronics_side', 'flaps', 'plates_back', 'fins_outside', 'containers']
      keys.forEach(key => {
        // If not snapping, update the offset
        if (this.explodeProgress < 1.0 || !this.isExploded) {
          this.currentOffsets[key] = t * this.sliderOffsets[key]
        }
        
        // Sync UI slider handle and numbers
        const sliderEl = this.sliderElements[key]
        const displayEl = this.displayElements[key]
        if (sliderEl) {
          sliderEl.value = this.currentOffsets[key]
        }
        if (displayEl) {
          displayEl.innerText = this.currentOffsets[key].toFixed(3)
        }
      })

      // Apply offsets to 3D nodes
      const obj = this.engineElement.getObject3D('mesh')
      if (obj) {
        // Ensure world matrices are fully updated
        this.engineElement.object3D.updateMatrixWorld(true)
        obj.updateMatrixWorld(true)

        // Get direction of root's Z-axis (blue line) in world space
        const worldDir = new THREE.Vector3(0, 0, 1).transformDirection(obj.matrixWorld)

        this.explosionNodes.forEach(node => {
          if (node.parent) {
            const key = node.userData.key
            const offset = this.currentOffsets[key]
            
            // Convert original local position to world space
            const originalWorldPos = node.userData.originalLocalPos.clone().applyMatrix4(node.parent.matrixWorld)

            // Shift along the world Z-axis of the root
            const targetWorldPos = originalWorldPos.clone().addScaledVector(worldDir, offset)

            // Convert target world position back to parent's local space
            const targetLocalPos = targetWorldPos.clone()
            node.parent.worldToLocal(targetLocalPos)

            node.position.copy(targetLocalPos)
            node.updateMatrix()
          }
        })
      }
    }

    if (!this.engineElement) return

    const lerpFactor = 1 - Math.pow(0.05, timeDelta / 1000)

    const prevScale = this._currentScale
    const prevRotY = this._currentRotY

    this._currentScale += (this._targetScale - this._currentScale) * lerpFactor
    this._currentRotY += (this._targetRotY - this._currentRotY) * lerpFactor

    if (Math.abs(this._currentScale - prevScale) > 0.0001 ||
        Math.abs(this._currentRotY - prevRotY) > 0.01) {
      const s = this._currentScale
      this.engineElement.object3D.scale.set(s, s, s)
      this.engineElement.object3D.rotation.y = this._currentRotY * (Math.PI / 180)
    }
  },
}
