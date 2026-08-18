// Component that places the object where the ground is tapped.
// Both models are loaded upfront at the same normalized size.
// Switching is an instant visibility toggle — no reload, no flicker.

AFRAME.registerComponent('exclusive-two-finger-transform', {
  init: function() {
    this.mode = 'none'; // 'none', 'pending', 'scale', 'rotate'
    this.startDist = 0;
    this.startAngle = 0;
    this.lastDist = 0;
    this.lastAngle = 0;
    
    // Thresholds to lock into a specific mode
    this.scaleThreshold = 15; // pixels
    this.rotateThreshold = 8; // degrees

    this.onTouchStart = this.onTouchStart.bind(this);
    this.onTouchMove = this.onTouchMove.bind(this);
    this.onTouchEnd = this.onTouchEnd.bind(this);

    // Use capture to intercept before other components see the touches
    window.addEventListener('touchstart', this.onTouchStart, {capture: true, passive: false});
    window.addEventListener('touchmove', this.onTouchMove, {capture: true, passive: false});
    window.addEventListener('touchend', this.onTouchEnd, {capture: true, passive: false});
    window.addEventListener('touchcancel', this.onTouchEnd, {capture: true, passive: false});
  },
  remove: function() {
    window.removeEventListener('touchstart', this.onTouchStart, {capture: true});
    window.removeEventListener('touchmove', this.onTouchMove, {capture: true});
    window.removeEventListener('touchend', this.onTouchEnd, {capture: true});
    window.removeEventListener('touchcancel', this.onTouchEnd, {capture: true});
  },
  getDistance: function(t1, t2) {
    const dx = t1.clientX - t2.clientX;
    const dy = t1.clientY - t2.clientY;
    return Math.sqrt(dx*dx + dy*dy);
  },
  getAngle: function(t1, t2) {
    return Math.atan2(t2.clientY - t1.clientY, t2.clientX - t1.clientX) * 180 / Math.PI;
  },
  onTouchStart: function(e) {
    if (e.touches.length >= 2) {
      if (this.mode === 'none') {
        this.mode = 'pending';
        this.startDist = this.getDistance(e.touches[0], e.touches[1]);
        this.startAngle = this.getAngle(e.touches[0], e.touches[1]);
        this.lastDist = this.startDist;
        this.lastAngle = this.startAngle;
        
        // COMPLETELY obliterate drag so the object cannot jump!
        this.el.removeAttribute('xrextras-hold-drag');
      }
    }
  },
  onTouchMove: function(e) {
    if (this.mode !== 'none' && e.touches.length >= 2) {
      const currentDist = this.getDistance(e.touches[0], e.touches[1]);
      const currentAngle = this.getAngle(e.touches[0], e.touches[1]);
      
      if (this.mode === 'pending') {
        const distDelta = Math.abs(currentDist - this.startDist);
        let angleDelta = Math.abs(currentAngle - this.startAngle);
        if (angleDelta > 180) angleDelta = 360 - angleDelta;

        if (distDelta > this.scaleThreshold && distDelta > angleDelta * 3) {
          this.mode = 'scale';
        } else if (angleDelta > this.rotateThreshold) {
          this.mode = 'rotate';
        }
      }
      
      if (this.mode === 'scale') {
        const scaleMultiplier = currentDist / this.lastDist;
        const currentScale = this.el.object3D.scale;
        this.el.setAttribute('scale', `${currentScale.x * scaleMultiplier} ${currentScale.y * scaleMultiplier} ${currentScale.z * scaleMultiplier}`);
        e.preventDefault();
        e.stopPropagation();
      } else if (this.mode === 'rotate') {
        let angleDiff = currentAngle - this.lastAngle;
        if (angleDiff > 180) angleDiff -= 360;
        if (angleDiff < -180) angleDiff += 360;
        
        // Rotate around Y axis
        this.el.object3D.rotation.y -= angleDiff * (Math.PI / 180);
        e.preventDefault();
        e.stopPropagation();
      }
      
      this.lastDist = currentDist;
      this.lastAngle = currentAngle;
    } else if (this.mode !== 'none') {
      // If we are in scale/rotate, block rogue single finger drags!
      e.preventDefault();
      e.stopPropagation();
    }
  },
  onTouchEnd: function(e) {
    if (e.touches.length === 0) {
      if (this.mode !== 'none') {
        // Only re-enable drag once ALL fingers are off the screen!
        // This guarantees no trailing 1-finger drag jumps.
        this.el.setAttribute('xrextras-hold-drag', '');
      }
      this.mode = 'none';
    } else if (this.mode !== 'none') {
      // A finger lifted, but 1 is still on screen. 
      // Block this event so xrextras doesn't glitch!
      e.preventDefault();
      e.stopPropagation();
    }
  }
});

export const tapPlaceComponent = {
  init() {
    this.currentModelId = '#washingMachineModel'

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
        // Enforce exclusive transformations: hold-drag (1 finger), our custom scale/rotate (2 fingers)
        this.wrapperEntity.setAttribute('xrextras-hold-drag', '')
        this.wrapperEntity.setAttribute('exclusive-two-finger-transform', '')
        
        // Add cantap class so the raycaster can intersect the object for dragging
        this.wrapperEntity.classList.add('cantap')

        // Dynamic auto-center and auto-scale function
        // Scales models to true physical height and exactly centers them based on their bounding box.
        const autoCenterAndScale = (entity, targetHeight) => {
          entity.setAttribute('scale', '1 1 1')
          entity.addEventListener('model-loaded', () => {
            const mesh = entity.getObject3D('mesh')
            if (!mesh) return
            
            // Force matrix update before measuring raw geometry bounds
            entity.object3D.updateMatrixWorld(true)
            
            // Calculate native physical size
            const nativeBox = new AFRAME.THREE.Box3().setFromObject(mesh)
            const nativeSize = new AFRAME.THREE.Vector3()
            nativeBox.getSize(nativeSize)
            
            // Apply scale factor based on true raw height
            const scaleFactor = targetHeight / nativeSize.y
            entity.setAttribute('scale', `${scaleFactor} ${scaleFactor} ${scaleFactor}`)
            
            // CRITICAL: Force matrix update AGAIN because we changed the scale!
            // Without this, the bounding box and world-to-local math will use stale unscaled matrices
            // causing models to disappear or have massive offsets.
            entity.object3D.updateMatrixWorld(true)
            
            // Recalculate bounding box with new scale applied
            const scaledBox = new AFRAME.THREE.Box3().setFromObject(mesh)
            const worldCenter = new AFRAME.THREE.Vector3()
            scaledBox.getCenter(worldCenter)
            
            // Find bottom-center point in world space
            const bottomCenterWorld = new AFRAME.THREE.Vector3(worldCenter.x, scaledBox.min.y, worldCenter.z)
            
            // Convert to local space and shift mesh to rest perfectly on the entity's ground origin
            const localBottomCenter = entity.object3D.worldToLocal(bottomCenterWorld)
            mesh.position.set(-localBottomCenter.x, -localBottomCenter.y, -localBottomCenter.z)
          })
        }

        const createModel = (id, height) => {
          const entity = document.createElement('a-entity')
          entity.setAttribute('gltf-model', id)
          entity.setAttribute('shadow', 'receive: false')
          autoCenterAndScale(entity, height)
          return entity
        }

        // Washing Machine: Increased additional 50% (3.4 * 1.5 = 5.1 meters)
        this.machineEntity = createModel('#washingMachineModel', 5.1)
        
        // Air Cooler: Increased additional 50% (4.0 * 1.5 = 6.0 meters)
        this.coolerEntity = createModel('#airCoolerModel', 6.0)
        this.coolerEntity.setAttribute('visible', 'false')

        // We don't need manual recentering since autoCenterAndScale handles it perfectly natively
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
