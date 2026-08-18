// Component that places the object where the ground is tapped.
// Both models are loaded upfront at the same normalized size.
// Switching is an instant visibility toggle — no reload, no flicker.

export const tapPlaceComponent = {
  init() {
    this.currentModelId = '#washingMachineModel'

    // Base scales that were previously determined to look correct in AR
    this.baseScales = {
      '#washingMachineModel': 3.0,
      '#airCoolerModel':      3.0,
    }

    this.prompt = document.getElementById('promptText')
    this.wrapperEntity = null
    this.machineEntity = null
    this.coolerEntity = null

    // --- Hide watermark ---
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
        if (el.children.length === 0 && (el.textContent.includes('8th Wall') || el.textContent.includes('8thWall'))) {
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

    // --- Place on Ground Tap ---
    const attachListener = () => {
      const g = document.getElementById('ground')
      if (!g) { setTimeout(attachListener, 100); return }

      g.addEventListener('click', (event) => {
        const touchPoint = event.detail.intersection.point

        if (this.wrapperEntity) {
          // Already placed — glide to new position
          this.wrapperEntity.removeAttribute('animation__pos')
          this.wrapperEntity.setAttribute('animation__pos', {
            property: 'position',
            to: `${touchPoint.x} ${touchPoint.y} ${touchPoint.z}`,
            easing: 'easeOutQuad',
            dur: 400,
          })
          return
        }

        // First placement
        if (this.prompt) this.prompt.style.display = 'none'

        // Face camera
        const camera = document.getElementById('camera')
        let rotationY = 0
        if (camera) {
          const cam = camera.object3D.position
          const dx = cam.x - touchPoint.x
          const dz = cam.z - touchPoint.z
          rotationY = (Math.atan2(dx, -dz) * (180 / Math.PI)) + 180
        }

        this.wrapperEntity = document.createElement('a-entity')
        this.wrapperEntity.setAttribute('position', touchPoint)
        this.wrapperEntity.setAttribute('rotation', `0 ${rotationY} 0`)
        this.wrapperEntity.setAttribute('xrextras-two-finger-rotate', '')
        this.wrapperEntity.setAttribute('xrextras-pinch-scale', `min: 0.1; max: 10`)
        this.wrapperEntity.setAttribute('scale', '1 1 1')

        // Washing machine — use predetermined base scale
        const mScale = this.baseScales['#washingMachineModel']
        this.machineEntity = document.createElement('a-entity')
        this.machineEntity.setAttribute('gltf-model', '#washingMachineModel')
        this.machineEntity.setAttribute('scale', `${mScale} ${mScale} ${mScale}`)
        this.machineEntity.setAttribute('shadow', { receive: false })
        this.machineEntity.setAttribute('visible', 'true')

        // Air cooler — use predetermined base scale
        const cScale = this.baseScales['#airCoolerModel']
        this.coolerEntity = document.createElement('a-entity')
        this.coolerEntity.setAttribute('gltf-model', '#airCoolerModel')
        this.coolerEntity.setAttribute('scale', `${cScale} ${cScale} ${cScale}`)
        this.coolerEntity.setAttribute('shadow', { receive: false })
        this.coolerEntity.setAttribute('visible', 'false')

        // Auto-center function to fix models with off-center origins
        const autoCenter = (entity) => {
          entity.addEventListener('model-loaded', () => {
            const mesh = entity.getObject3D('mesh')
            if (!mesh) return
            
            // Calculate bounding box in world space
            const box = new AFRAME.THREE.Box3().setFromObject(mesh)
            const worldCenter = new AFRAME.THREE.Vector3()
            box.getCenter(worldCenter)
            
            // Find the bottom-center point in world space
            const bottomCenterWorld = new AFRAME.THREE.Vector3(worldCenter.x, box.min.y, worldCenter.z)
            
            // Convert to local space of the entity
            const localBottomCenter = entity.object3D.worldToLocal(bottomCenterWorld)
            
            // Shift the mesh so its bottom-center sits exactly at the entity's origin
            mesh.position.set(-localBottomCenter.x, -localBottomCenter.y, -localBottomCenter.z)
          })
        }

        autoCenter(this.machineEntity)
        autoCenter(this.coolerEntity)

        // Add them to wrapper and scene
        this.wrapperEntity.appendChild(this.machineEntity)
        this.wrapperEntity.appendChild(this.coolerEntity)
        this.el.sceneEl.appendChild(this.wrapperEntity)

        // Show UI immediately
        const modelSwitcher = document.getElementById('modelSwitcher')
        if (modelSwitcher) modelSwitcher.style.display = 'flex'

        // Environment map for reflections (Neutral Grey to prevent black metals and blown-out whites)
        const sceneEl = this.el.sceneEl
        if (sceneEl && sceneEl.object3D && !sceneEl.object3D.environment) {
          const cnv = document.createElement('canvas')
          cnv.width = 64; cnv.height = 32
          const ctx = cnv.getContext('2d')
          const grad = ctx.createLinearGradient(0, 0, 0, 32)
          grad.addColorStop(0, '#555555') // Darker grey top
          grad.addColorStop(0.5, '#333333') // Dark grey middle
          grad.addColorStop(1, '#111111') // Almost black bottom
          ctx.fillStyle = grad; ctx.fillRect(0, 0, 64, 32)
          const texture = new AFRAME.THREE.CanvasTexture(cnv)
          texture.mapping = AFRAME.THREE.EquirectangularReflectionMapping
          sceneEl.object3D.environment = texture
        }
      })
    }
    attachListener()

    // --- Model Switching ---
    const switchModel = (newId, btnOn, btnOff) => {
      if (this.currentModelId === newId) return
      this.currentModelId = newId
      if (btnOn)  btnOn.classList.add('active')
      if (btnOff) btnOff.classList.remove('active')

      if (!this.wrapperEntity) return

      if (newId === '#washingMachineModel') {
        this.machineEntity.setAttribute('visible', 'true')
        this.coolerEntity.setAttribute('visible', 'false')
      } else {
        this.machineEntity.setAttribute('visible', 'false')
        this.coolerEntity.setAttribute('visible', 'true')
      }
    }

    const btnMachine = document.getElementById('btnMachine')
    const btnCooler  = document.getElementById('btnCooler')
    if (btnMachine) btnMachine.addEventListener('click', (e) => { e.stopPropagation(); switchModel('#washingMachineModel', btnMachine, btnCooler) })
    if (btnCooler)  btnCooler.addEventListener('click',  (e) => { e.stopPropagation(); switchModel('#airCoolerModel',       btnCooler,  btnMachine) })
  },
}
