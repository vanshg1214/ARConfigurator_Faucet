// Component that places the faucet where the ground is tapped
// Smooth gestures are handled manually with lerping for a premium feel.

export const tapPlaceComponent = {
  schema: {
    min: {default: 6},
    max: {default: 10},
  },
  init() {
    this.mixer = null
    this.waterNodes = []
    this.waterActive = false
    this.action = null
    this.prompt = document.getElementById('promptText')
    this.faucetElement = null

    // --- Smooth Gesture State ---
    // Target values (set directly from touch input)
    this._targetScale = 0.15
    this._targetRotY = 0
    // Current values (lerped toward target every frame)
    this._currentScale = 0.15
    this._currentRotY = 0

    // Touch tracking for custom gesture handling
    this._touches = {}
    this._lastPinchDist = null
    this._lastTwistAngle = null
    this._gestureActive = false

    // --- Remove 8th Wall "Powered By" logo using MutationObserver ---
    const hidePoweredBy = () => {
      // Target common selectors used by 8th Wall / XRExtras
      const selectors = [
        '#poweredby', '.poweredby',
        '[class*="powered"]', '[id*="powered"]',
        '[class*="xrextras-powered"]',
        'a[href*="8thwall"]',
      ]
      selectors.forEach(sel => {
        document.querySelectorAll(sel).forEach(el => { el.style.display = 'none' })
      })
      // Also hide any element containing the text "Powered by 8th Wall"
      document.querySelectorAll('*').forEach(el => {
        if (el.children.length === 0 && el.textContent.includes('8th Wall')) {
          let parent = el
          // Walk up max 4 levels to hide the containing badge
          for (let i = 0; i < 4; i++) {
            if (parent && parent !== document.body) {
              parent.style.display = 'none'
              parent = parent.parentElement
            }
          }
        }
      })
    }

    // Run immediately and watch for dynamic DOM injection
    hidePoweredBy()
    const observer = new MutationObserver(hidePoweredBy)
    observer.observe(document.body, { childList: true, subtree: true })

    // --- Touch Gesture Handlers ---
    const canvas = document.querySelector('canvas')

    const getTouches = (e) => Array.from(e.touches).filter(t => {
      // Only count touches not on UI buttons
      return !t.target.closest('#buttonContainer, #actionContainer')
    })

    const onTouchStart = (e) => {
      const touches = getTouches(e)
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
      if (!this.faucetElement || !this._gestureActive) return
      const touches = getTouches(e)
      if (touches.length < 2) return

      e.preventDefault()

      const dx = touches[1].clientX - touches[0].clientX
      const dy = touches[1].clientY - touches[0].clientY
      const dist = Math.hypot(dx, dy)
      const angle = Math.atan2(dy, dx)

      // --- Pinch to Scale ---
      if (this._lastPinchDist !== null) {
        const scaleDelta = dist / this._lastPinchDist
        const newTarget = Math.min(0.5, Math.max(0.04, this._targetScale * scaleDelta))
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
      const touches = getTouches(e)
      if (touches.length < 2) {
        this._lastPinchDist = null
        this._lastTwistAngle = null
        this._gestureActive = false
      }
      Array.from(e.changedTouches).forEach(t => { delete this._touches[t.identifier] })
    }

    // Attach to document so gestures work everywhere on screen
    document.addEventListener('touchstart', onTouchStart, { passive: true })
    document.addEventListener('touchmove', onTouchMove, { passive: false })
    document.addEventListener('touchend', onTouchEnd, { passive: true })

    // --- Place / Move Faucet on Ground Tap ---
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
          rotationY = (Math.atan2(dx, -dz) * (180 / Math.PI)) + 180
        }

        if (this.faucetElement) {
          // Smoothly glide to new position, preserve user's custom rotation/scale
          this.faucetElement.setAttribute('animation__pos', {
            property: 'position',
            to: `${touchPoint.x} ${touchPoint.y} ${touchPoint.z}`,
            easing: 'easeOutQuad',
            dur: 500,
          })
          return
        }

        // First placement
        const newElement = document.createElement('a-entity')
        this.faucetElement = newElement

        newElement.setAttribute('position', touchPoint)
        newElement.setAttribute('rotation', `0 ${rotationY} 0`)

        // Remove A-Frame animations once done so they don't fight gestures
        newElement.addEventListener('animationcomplete', (e) => {
          newElement.removeAttribute(e.detail.name)
        })

        newElement.setAttribute('visible', 'false')
        newElement.setAttribute('scale', '0.0001 0.0001 0.0001')
        newElement.setAttribute('shadow', { receive: false })
        newElement.setAttribute('gltf-model', '#faucetModel')
        this.el.sceneEl.appendChild(newElement)

        newElement.addEventListener('model-loaded', () => {
          // Show UI
          const actionContainer = document.getElementById('actionContainer')
          if (actionContainer) actionContainer.style.display = 'block'
          const buttonContainer = document.getElementById('buttonContainer')
          if (buttonContainer) buttonContainer.style.display = 'flex'

          const obj = newElement.getObject3D('mesh')
          if (obj) {
            if (obj.animations && obj.animations.length > 0) {
              this.mixer = new THREE.AnimationMixer(obj)
              this.action = this.mixer.clipAction(obj.animations[0])
            }

            // Premium environment map for reflections
            const sceneEl = this.el.sceneEl
            if (sceneEl && sceneEl.object3D && !sceneEl.object3D.environment) {
              const canvas = document.createElement('canvas')
              canvas.width = 64; canvas.height = 32
              const ctx = canvas.getContext('2d')
              const grad = ctx.createLinearGradient(0, 0, 0, 32)
              grad.addColorStop(0, '#ffffff')
              grad.addColorStop(0.3, '#ffecb3')
              grad.addColorStop(0.5, '#4e3629')
              grad.addColorStop(0.7, '#d4af37')
              grad.addColorStop(1, '#110c00')
              ctx.fillStyle = grad; ctx.fillRect(0, 0, 64, 32)
              const texture = new AFRAME.THREE.CanvasTexture(canvas)
              texture.mapping = AFRAME.THREE.EquirectangularReflectionMapping
              sceneEl.object3D.environment = texture
            }

            obj.traverse((node) => {
              if (node.name && node.name.toLowerCase().includes('water')) {
                node.visible = false
                this.waterNodes.push(node)
                if (node.isMesh && node.material) {
                  const mats = Array.isArray(node.material) ? node.material : [node.material]
                  mats.forEach((mat) => {
                    if (mat.color) mat.color.setHex(0xffffff)
                    if (mat.metalness !== undefined) mat.metalness = 0.1
                    if (mat.roughness !== undefined) mat.roughness = 0.1
                    mat.transparent = true
                    mat.opacity = 0.8
                  })
                }
              } else if (node.isMesh && node.material) {
                const mats = Array.isArray(node.material) ? node.material : [node.material]
                mats.forEach((mat) => {
                  if (mat.metalness !== undefined) mat.metalness = 1.0
                  if (mat.roughness !== undefined) mat.roughness = 0.15
                  if (mat.color) mat.color.setHex(0xd4af37)
                  if (mat.emissive) mat.emissive.setHex(0x000000)
                })
              }
            })
          }

          // Init gesture targets from actual placed values
          this._targetRotY = rotationY
          this._currentRotY = rotationY
          this._targetScale = 0.15
          this._currentScale = 0.0001

          newElement.setAttribute('visible', 'true')
          newElement.setAttribute('animation', {
            property: 'scale',
            to: '0.15 0.15 0.15',
            easing: 'easeOutElastic',
            dur: 800,
          })
        })
      })
    }
    attachListener()

    // --- Water Flow ---
    const btnWater = document.getElementById('btnWater')
    const waterBtnText = document.getElementById('waterBtnText')
    if (btnWater) {
      btnWater.addEventListener('click', (e) => {
        e.stopPropagation()
        this.waterActive = !this.waterActive
        btnWater.classList.toggle('active', this.waterActive)
        if (waterBtnText) waterBtnText.innerText = this.waterActive ? 'Stop Flow' : 'Flow'
        this.waterNodes.forEach(node => { node.visible = this.waterActive })
        if (this.mixer && this.action) {
          if (this.waterActive) { this.action.reset(); this.action.play() }
          else { this.action.stop() }
        }
      })
    }

    // --- Color Buttons ---
    const applyColor = (hexColor, metalness, roughness) => {
      if (!this.faucetElement) return
      const obj = this.faucetElement.getObject3D('mesh')
      if (obj) {
        obj.traverse((node) => {
          if (node.isMesh && node.material && (!node.name || !node.name.toLowerCase().includes('water'))) {
            const mats = Array.isArray(node.material) ? node.material : [node.material]
            mats.forEach((mat) => {
              if (mat.color) mat.color.setHex(hexColor)
              if (mat.metalness !== undefined) mat.metalness = metalness
              if (mat.roughness !== undefined) mat.roughness = roughness
            })
          }
        })
      }
    }

    const btnGold = document.getElementById('btnGold')
    if (btnGold) btnGold.addEventListener('click', (e) => { e.stopPropagation(); applyColor(0xd4af37, 1.0, 0.15) })
    const btnSilver = document.getElementById('btnSilver')
    if (btnSilver) btnSilver.addEventListener('click', (e) => { e.stopPropagation(); applyColor(0xe0e0e0, 1.0, 0.1) })
    const btnBlack = document.getElementById('btnBlack')
    if (btnBlack) btnBlack.addEventListener('click', (e) => { e.stopPropagation(); applyColor(0x222222, 0.3, 0.6) })
  },

  tick(time, timeDelta) {
    // Update animation mixer
    if (this.mixer) this.mixer.update(timeDelta / 1000)

    // Smoothly lerp scale and rotation toward gesture targets every frame
    if (!this.faucetElement) return

    const lerpFactor = 1 - Math.pow(0.05, timeDelta / 1000) // smooth damping

    const prevScale = this._currentScale
    const prevRotY = this._currentRotY

    this._currentScale += (this._targetScale - this._currentScale) * lerpFactor
    this._currentRotY += (this._targetRotY - this._currentRotY) * lerpFactor

    // Only update DOM if values meaningfully changed (avoid unnecessary dirty checks)
    if (Math.abs(this._currentScale - prevScale) > 0.0001 ||
        Math.abs(this._currentRotY - prevRotY) > 0.01) {
      const s = this._currentScale
      this.faucetElement.object3D.scale.set(s, s, s)
      this.faucetElement.object3D.rotation.y = this._currentRotY * (Math.PI / 180)
    }
  },
}
