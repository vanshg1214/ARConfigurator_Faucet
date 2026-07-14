// Component that places the turbofan engine where the ground is tapped
// Smooth gestures and exploded view offsets are handled manually with lerping.

export const tapPlaceComponent = {
  schema: {
    min: { default: 0.05 },
    max: { default: 5.0 },
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
    this.explodeProgress = 1.0 // Initialize at 1.0 so it auto-assembles on spawn
    this.transitionDuration = 7500.0 // Ultra slow for initial placement assembly
    this.isInitialAssemble = true

    this.isExploded = false
    this.bladeSpinVelocity = 0.0
    this.targetBladeSpinVelocity = 0.0
    this.bladeRotationAngle = 0.0

    this.hotspots = []
    this.hasSelectedHotspot = false
    this.partInfo = {
      tube_front: {
        title: "Front Fan Shroud",
        desc: "Aerodynamic intake casing designed to direct airflow smoothly into the compressor blades while minimizing drag."
      },
      blades: {
        title: "Titanium Fan Blades",
        desc: "High-bypass fan blades that compress and propel massive volumes of air to generate primary propulsion thrust."
      },
      turbine_hull: {
        title: "Outer Engine Casing",
        desc: "Structural protective housing engineered to contain high-energy mechanical components and channel bypass airflow."
      },
      turbine_hull_middle: {
        title: "Compressor Casing",
        desc: "High-pressure compressor housing designed to maintain thermal stability under extreme mechanical pressure cycles."
      },
      electronics_side: {
        title: "Sensor & Control Array",
        desc: "Control instrumentation and optical sensors that monitor exhaust temperature, pressure, fuel flow, and rotor speed."
      },
      flaps: {
        title: "Variable Exhaust Flaps",
        desc: "Exhaust nozzle flaps that adjust the exhaust exit area to optimize engine pressure ratio and thrust output."
      },
      plates_back: {
        title: "Exhaust Tail Cone",
        desc: "Aerodynamic exhaust cone that guides hot exhaust gases smoothly back into the atmosphere, reducing wake turbulence."
      },
      fins_outside: {
        title: "Stabilization Pylon Mounts",
        desc: "External stabilization mounts and structural ribs that secure the engine assembly to the aircraft fuselage or wing pylon."
      },
      containers: {
        title: "Modular Accessory Box",
        desc: "Accessory compartments housing auxiliary power units, main fuel pumps, oil filters, and hydraulic controllers."
      }
    }

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

    // --- Hide watermark using MutationObserver ---
    const hidePoweredBy = () => {
      const selectors = [
        '#poweredby', '.poweredby',
        '[class*="powered"]', '[id*="powered"]',
        '[class*="xrextras-powered"]',
        'a[href*="' + ['8th', 'wall'].join('') + '"]',
      ]
      selectors.forEach(sel => {
        document.querySelectorAll(sel).forEach(el => { el.style.display = 'none' })
      })
      document.querySelectorAll('div, span, a, p').forEach(el => {
        if (el.children.length === 0 && el.textContent.includes(['8' + 'th', 'Wa' + 'll'].join(' '))) {
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
      const card = document.getElementById('detailsCard')
      if (card && card.style.display === 'block' && card.classList.contains('show')) return

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
      const card = document.getElementById('detailsCard')
      if (card && card.style.display === 'block' && card.classList.contains('show')) return

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

      const spinCheckbox = document.getElementById('spinToggleCheckbox')
      if (spinCheckbox) {
        spinCheckbox.addEventListener('change', (e) => {
          // Target velocity: ~1.5 rotations per second (approx 9.4 radians/sec) when ON
          this.targetBladeSpinVelocity = e.target.checked ? 10.0 : 0.0
        })
      }

      g.addEventListener('click', (event) => {
        const card = document.getElementById('detailsCard')
        if (card && card.style.display === 'block' && card.classList.contains('show')) return

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
            to: `${touchPoint.x} ${touchPoint.y + 2.0} ${touchPoint.z}`,
            easing: 'easeOutQuad',
            dur: 500,
          })
          return
        }

        // First placement
        const newElement = document.createElement('a-entity')
        this.engineElement = newElement

        newElement.setAttribute('position', `${touchPoint.x} ${touchPoint.y + 2.0} ${touchPoint.z}`)
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
          // Define hotspot offsets relative to part centers
          const THREE = AFRAME.THREE
          this.hotspotOffsets = {
            tube_front: new THREE.Vector3(0, 1.4, 0),
            blades: new THREE.Vector3(0, 1.2, 0.4),
            turbine_hull: new THREE.Vector3(0, 1.4, 0),
            turbine_hull_middle: new THREE.Vector3(0, 1.4, 0),
            electronics_side: new THREE.Vector3(0.6, 1.1, 0),
            flaps: new THREE.Vector3(0, 1.3, 0),
            plates_back: new THREE.Vector3(0, 1.2, 0),
            fins_outside: new THREE.Vector3(0, 1.4, 0),
            containers: new THREE.Vector3(0, -1.3, 0),
          }

          // Create reference 3D entities and HTML markers
          this.hotspots3D = []
          this.hotspotHTMLs = []
          const container = document.getElementById('hotspotMarkersContainer')
          const keys = ['tube_front', 'blades', 'turbine_hull', 'turbine_hull_middle', 'electronics_side', 'flaps', 'plates_back', 'fins_outside', 'containers']

          keys.forEach(key => {
            // 3D Reference point (dummy invisible entity)
            const refEl = document.createElement('a-entity')
            refEl.setAttribute('visible', 'false')
            refEl.dataset.key = key
            this.el.sceneEl.appendChild(refEl)
            this.hotspots3D.push(refEl)

            // HTML Marker Button
            const markerDiv = document.createElement('div')
            markerDiv.className = 'hotspot-marker'
            markerDiv.innerText = 'i'
            markerDiv.style.display = 'none'
            markerDiv.dataset.key = key

            markerDiv.addEventListener('click', (e) => {
              e.stopPropagation()
              this.showPartDetails(key)
            })

            if (container) {
              container.appendChild(markerDiv)
            }
            this.hotspotHTMLs.push(markerDiv)
          })

          // Generate environment map
          const sceneEl = this.el.sceneEl
          if (sceneEl && sceneEl.object3D && !sceneEl.object3D.environment) {
            const canvas = document.createElement('canvas')
            canvas.width = 64; canvas.height = 32
            const ctx = canvas.getContext('2d')
            const grad = ctx.createLinearGradient(0, 0, 0, 32)
            grad.addColorStop(0, '#ffffff')     // Sky glow
            grad.addColorStop(0.3, '#bbdefb')   // Soft sky blue
            grad.addColorStop(0.5, '#263238')   // Dark horizon line
            grad.addColorStop(0.7, '#cfd8dc')   // Warm ground reflection
            grad.addColorStop(1, '#1a1a1a')     // Ground shadow
            ctx.fillStyle = grad; ctx.fillRect(0, 0, 64, 32)
            const texture = new AFRAME.THREE.CanvasTexture(canvas)
            texture.mapping = AFRAME.THREE.EquirectangularReflectionMapping
            sceneEl.object3D.environment = texture
          }

          // Apply envMap and boost material reflections
          const modelMesh = newElement.getObject3D('mesh')
          if (modelMesh) {
            modelMesh.traverse((node) => {
              if (node.isMesh && node.material) {
                const mats = Array.isArray(node.material) ? node.material : [node.material]
                mats.forEach((mat) => {
                  mat.envMap = sceneEl.object3D.environment
                  mat.envMapIntensity = 0.85 // Satin, realistic metal specular reflect
                  if (mat.metalness !== undefined) {
                    // Turn up metallic look but diffuse with higher roughness for satin/brushed steel
                    mat.metalness = Math.max(mat.metalness, 0.85)
                    mat.roughness = Math.max(mat.roughness, 0.35)
                  }
                  mat.needsUpdate = true
                })
              }
            })
          }

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
                } else if (name === 'tube' || name === 'tube_0' || name === 'tube_middle' || name === 'tube_middle_0' || name === 'fins' || name === 'fins_0') {
                  // Internal shaft/spool parts that don't explode but should spin
                  key = 'center_shaft'
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
                node.userData.originalLocalRot = node.rotation.clone()
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

        // Hide details card if we are assembling back
        if (!this.isExploded) {
          this.hidePartDetails()
        }
      })
    }

    this.activePartKey = null

    // Connect close click listener to the projected details card
    const closeDetailsBtn = document.getElementById('closeDetailsBtn')
    if (closeDetailsBtn) {
      closeDetailsBtn.addEventListener('click', (e) => {
        e.stopPropagation()
        this.hidePartDetails()
      })
    }
  },

  tick(time, timeDelta) {
    // 1. Scale and Rotate Lerps (runs regardless of explosion state)
    if (this.engineElement) {
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
    }

    // 2. Continuous Spin Update for Blades
    const spinAccel = 0.02 * timeDelta // Slow ramp-up acceleration
    if (this.bladeSpinVelocity < this.targetBladeSpinVelocity) {
      this.bladeSpinVelocity = Math.min(this.targetBladeSpinVelocity, this.bladeSpinVelocity + spinAccel)
    } else if (this.bladeSpinVelocity > this.targetBladeSpinVelocity) {
      this.bladeSpinVelocity = Math.max(this.targetBladeSpinVelocity, this.bladeSpinVelocity - spinAccel)
    }

    // Add to continuous rotation angle
    this.bladeRotationAngle += this.bladeSpinVelocity * (timeDelta / 1000)

    // 3. Exploded view calculations
    if (this.explosionNodes && this.explosionNodes.length > 0 && this.engineElement) {
      const rate = timeDelta / this.transitionDuration
      if (this.isExploded) {
        this.explodeProgress = Math.min(1.0, this.explodeProgress + rate)
      } else {
        this.explodeProgress = Math.max(0.0, this.explodeProgress - rate)
      }

      // Once the initial assembly finishes, reset transition speed for future interactions
      if (!this.isExploded && this.isInitialAssemble && this.explodeProgress === 0.0) {
        this.isInitialAssemble = false
        this.transitionDuration = 4500.0
      }

      // Quintic Ease-in-out formula
      const easeInOutQuint = (x) => {
        return x < 0.5 ? 16 * x * x * x * x * x : 1 - Math.pow(-2 * x + 2, 5) / 2
      }

      const t = easeInOutQuint(this.explodeProgress)

      // Update animated offsets and sliders
      const keys = ['tube_front', 'blades', 'turbine_hull', 'turbine_hull_middle', 'electronics_side', 'flaps', 'plates_back', 'fins_outside', 'containers']
      keys.forEach((key, index) => {
        // Calculate staggered progress
        // Total sequence has 9 parts. We delay each part slightly.
        const staggerDelay = index * 0.09; // Increased delay for more dramatic staggering
        const partDuration = 0.35; // Each part takes 35% of the total 1.0 progress time
        
        let partProgress = (this.explodeProgress - staggerDelay) / partDuration;
        partProgress = Math.max(0.0, Math.min(1.0, partProgress));
        
        const t = easeInOutQuint(partProgress)

        if (this.explodeProgress < 1.0 || !this.isExploded) {
          this.currentOffsets[key] = t * this.sliderOffsets[key]
        }

        // Store partProgress in userData so we can use it for rotation later
        const node = this.explosionNodes.find(n => n.userData.key === key)
        if (node) {
          node.userData.partProgress = partProgress;
        }

        const sliderEl = this.sliderElements[key]
        const displayEl = this.displayElements[key]
        if (sliderEl) sliderEl.value = this.currentOffsets[key]
        if (displayEl) displayEl.innerText = this.currentOffsets[key].toFixed(3)
      })

      // Apply offsets to 3D nodes
      const obj = this.engineElement.getObject3D('mesh')
      if (obj) {
        this.engineElement.object3D.updateMatrixWorld(true)
        obj.updateMatrixWorld(true)

        const worldDir = new THREE.Vector3(0, 0, 1).transformDirection(obj.matrixWorld)

        this.explosionNodes.forEach(node => {
          if (node.parent) {
            const key = node.userData.key
            const offset = this.currentOffsets[key]

            const originalWorldPos = node.userData.originalLocalPos.clone().applyMatrix4(node.parent.matrixWorld)
            const targetWorldPos = originalWorldPos.clone().addScaledVector(worldDir, offset)

            const targetLocalPos = targetWorldPos.clone()
            node.parent.worldToLocal(targetLocalPos)

            node.position.copy(targetLocalPos)

            // Linear mechanical rotation along Z-axis (ignores the ease curve)
            // Based on its max offset distance, map it to a rotation amount
            // We use the staggered partProgress for a linear feel
            const maxOffset = this.sliderOffsets[key] || 0
            const maxRotZ = maxOffset * 0.8 // Spin amount scales with distance traveled
            const partProgress = node.userData.partProgress !== undefined ? node.userData.partProgress : this.explodeProgress
            let linearRotZ = partProgress * maxRotZ

            node.rotation.copy(node.userData.originalLocalRot)
            node.rotation.z += linearRotZ

            // Apply continuous test spin if it's the blades or center shaft
            if (key === 'blades' || key === 'center_shaft') {
              // Use rotateY to apply rotation in local quaternion space and prevent wobbling/gimbal lock
              node.rotateY(-this.bladeRotationAngle)
            }

            node.updateMatrix()
          }
        })

        // 3. Update hotspots (opacity, visibility, and screen projection)
        // Wait until parts are in their final place (explodeProgress > 0.95) before showing
        const hotspotOpacity = this.explodeProgress > 0.95 ? Math.max(0.0, Math.min(1.0, (this.explodeProgress - 0.95) * 20)) : 0.0
        const camera = this.el.sceneEl.camera
        const card = document.getElementById('detailsCard')
        const isCardVisible = card && card.style.display === 'block' && card.classList.contains('show')

        this.hotspots3D.forEach(ref => {
          const key = ref.dataset.key
          const markerDiv = this.hotspotHTMLs.find(m => m.dataset.key === key)
          if (!markerDiv) return

          if (hotspotOpacity <= 0.0) {
            markerDiv.style.display = 'none'
          } else {
            // Update 3D reference node position first
            const node = this.explosionNodes.find(n => n.userData.key === key)
            if (node) {
              const worldPos = new THREE.Vector3()
              node.getWorldPosition(worldPos)

              const localOffset = this.hotspotOffsets[key] || new THREE.Vector3(0, 1.2, 0)

              // Apply offset based on the overall engine's rotation, NOT the specific rotating node's rotation,
              // so that the 'i' button stays hovered above the part and doesn't orbit around it as it spins.
              const engineQuat = this.engineElement.object3D.getWorldQuaternion(new THREE.Quaternion())
              const worldOffset = localOffset.clone().applyQuaternion(engineQuat)
              worldPos.add(worldOffset)

              ref.object3D.position.copy(worldPos)

              // Project to 2D Screen
              if (camera) {
                const screenPos = worldPos.clone()
                screenPos.project(camera)

                const isBehindCamera = screenPos.z > 1

                if (isBehindCamera) {
                  markerDiv.style.display = 'none'
                } else {
                  markerDiv.style.display = 'flex'

                  // Convert NDC to CSS pixels
                  const x = (screenPos.x * 0.5 + 0.5) * window.innerWidth
                  const y = (-(screenPos.y * 0.5) + 0.5) * window.innerHeight

                  markerDiv.style.left = `${x}px`
                  markerDiv.style.top = `${y}px`

                  // Calculate opacity based on select highlighting
                  let baseOpacity = 0.8
                  if (this.hasSelectedHotspot && isCardVisible) {
                    if (this.activePartKey === key) {
                      markerDiv.classList.add('active')
                      markerDiv.classList.remove('dimmed')
                      baseOpacity = 1.0
                    } else {
                      markerDiv.classList.remove('active')
                      markerDiv.classList.add('dimmed')
                      baseOpacity = 0.2
                    }
                  } else {
                    markerDiv.classList.remove('active')
                    markerDiv.classList.remove('dimmed')
                  }

                  markerDiv.style.opacity = baseOpacity * hotspotOpacity
                }
              }
            }
          }
        })

        // 4. Update projected screen coordinates for details card and connection line (ray)
        const svg = document.getElementById('connectorSvg')
        const line = document.getElementById('connectorLine')
        const joint = document.getElementById('connectorJoint')

        if (isCardVisible && this.activePartKey) {
          const ref = this.hotspots3D.find(h => h.dataset.key === this.activePartKey)
          if (ref && camera) {
            const worldPos = new THREE.Vector3()
            ref.object3D.getWorldPosition(worldPos)

            worldPos.project(camera)
            const isBehindCamera = worldPos.z > 1

            if (isBehindCamera) {
              if (svg) svg.style.display = 'none'
              card.style.opacity = '0'
            } else {
              if (svg) svg.style.display = 'block'
              card.style.opacity = '1'

              const x = (worldPos.x * 0.5 + 0.5) * window.innerWidth
              const y = (-(worldPos.y * 0.5) + 0.5) * window.innerHeight

              const isMobile = window.innerWidth <= 500
              let targetX = x
              let targetY = y

              if (isMobile) {
                const cardRect = card.getBoundingClientRect()
                targetX = cardRect.left + cardRect.width / 2
                targetY = cardRect.top
              } else {
                const cardWidth = 280
                const cardHeight = card.offsetHeight || 100

                let cardX = x + 40
                let cardY = y - 90

                cardX = Math.max(20, Math.min(window.innerWidth - cardWidth - 20, cardX))
                cardY = Math.max(80, Math.min(window.innerHeight - cardHeight - 20, cardY))

                card.style.left = `${cardX}px`
                card.style.top = `${cardY}px`
                card.style.bottom = 'auto'

                targetX = cardX
                targetY = cardY + cardHeight / 2

                if (x > cardX + cardWidth) {
                  targetX = cardX + cardWidth
                } else if (x > cardX) {
                  targetX = x
                  targetY = cardY + cardHeight
                }
              }

              // Calculate start position on the edge of the circle (radius = 14px to clear outer ring)
              const dx = targetX - x
              const dy = targetY - y
              const dist = Math.hypot(dx, dy)
              let startX = x
              let startY = y
              if (dist > 0) {
                startX = x + (dx / dist) * 14
                startY = y + (dy / dist) * 14
              }

              if (line) {
                line.setAttribute('x1', startX)
                line.setAttribute('y1', startY)
                line.setAttribute('x2', targetX)
                line.setAttribute('y2', targetY)
              }
              if (joint) {
                joint.setAttribute('cx', startX)
                joint.setAttribute('cy', startY)
              }
            }
          }
        } else {
          if (svg) svg.style.display = 'none'
        }
      }
    }
  },
  showPartDetails(key) {
    const details = this.partInfo[key]
    if (!details) return

    this.activePartKey = key

    const card = document.getElementById('detailsCard')
    const title = document.getElementById('detailsTitle')
    const desc = document.getElementById('detailsDesc')

    if (card && title && desc) {
      title.innerText = details.title
      desc.innerText = details.desc

      const spinToggleContainer = document.getElementById('spinToggleContainer')
      if (spinToggleContainer) {
        spinToggleContainer.style.display = key === 'blades' ? 'flex' : 'none'
      }

      card.style.display = 'block'
      card.offsetHeight // Force reflow
      card.classList.add('show')
    }

    this.hasSelectedHotspot = true
  },
  hidePartDetails() {
    this.activePartKey = null

    const card = document.getElementById('detailsCard')
    const svg = document.getElementById('connectorSvg')

    // Reset spin if open
    this.targetBladeSpinVelocity = 0.0
    const spinCheckbox = document.getElementById('spinToggleCheckbox')
    if (spinCheckbox) spinCheckbox.checked = false

    if (card) {
      card.classList.remove('show')
      setTimeout(() => {
        if (!card.classList.contains('show')) {
          card.style.display = 'none'
          if (svg) svg.style.display = 'none'
        }
      }, 200)
    }

    this.hasSelectedHotspot = false
  },
}
