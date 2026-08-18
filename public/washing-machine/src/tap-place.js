// Component that places the object where the ground is tapped.
// Both models are loaded upfront at the same normalized size.
// Switching is an instant visibility toggle — no reload, no flicker.

// ---------------------------------------------------------------------------
// Shared gesture state — single source of truth used by BOTH components below
// ---------------------------------------------------------------------------
const GestureState = {
  twoFingerActive: false,
  twoFingerEndTime: 0, // Timestamp when the last 2-finger gesture ended
};

// ---------------------------------------------------------------------------
// Custom 1-finger surface drag — replaces xrextras-hold-drag entirely.
// Reads GestureState.twoFingerActive to freeze position during 2-finger ops.
// ---------------------------------------------------------------------------
AFRAME.registerComponent('custom-hold-drag', {
  schema: {
    groundId: { type: 'string', default: 'ground' },
  },
  init: function() {
    this.dragging = false;
    this.touchId = null;
    this.dragOffset = new AFRAME.THREE.Vector3();

    this.onTouchStart = this.onTouchStart.bind(this);
    this.onTouchMove  = this.onTouchMove.bind(this);
    this.onTouchEnd   = this.onTouchEnd.bind(this);

    window.addEventListener('touchstart', this.onTouchStart, { passive: false });
    window.addEventListener('touchmove',  this.onTouchMove,  { passive: false });
    window.addEventListener('touchend',   this.onTouchEnd,   { passive: false });
    window.addEventListener('touchcancel',this.onTouchEnd,   { passive: false });

    // Cache raycaster + camera
    this._raycaster = new AFRAME.THREE.Raycaster();
    this._plane = null;
  },
  remove: function() {
    window.removeEventListener('touchstart', this.onTouchStart);
    window.removeEventListener('touchmove',  this.onTouchMove);
    window.removeEventListener('touchend',   this.onTouchEnd);
    window.removeEventListener('touchcancel',this.onTouchEnd);
  },

  _hitGround: function(clientX, clientY) {
    const camera = this.el.sceneEl.camera;
    if (!camera) return null;

    const canvas = this.el.sceneEl.canvas;
    const rect = canvas.getBoundingClientRect();
    const x =  ((clientX - rect.left) / rect.width)  * 2 - 1;
    const y = -((clientY - rect.top)  / rect.height) * 2 + 1;

    this._raycaster.setFromCamera({ x, y }, camera);

    // Lazy-build the infinite ground plane at y=0
    if (!this._plane) {
      this._plane = new AFRAME.THREE.Plane(new AFRAME.THREE.Vector3(0, 1, 0), 0);
    }
    const hit = new AFRAME.THREE.Vector3();
    const ok = this._raycaster.ray.intersectPlane(this._plane, hit);
    return ok ? hit : null;
  },
  
  _hitObject: function(clientX, clientY) {
    const camera = this.el.sceneEl.camera;
    if (!camera) return false;

    const canvas = this.el.sceneEl.canvas;
    const rect = canvas.getBoundingClientRect();
    const x =  ((clientX - rect.left) / rect.width)  * 2 - 1;
    const y = -((clientY - rect.top)  / rect.height) * 2 + 1;

    this._raycaster.setFromCamera({ x, y }, camera);
    const intersects = this._raycaster.intersectObject(this.el.object3D, true);
    // THREE.Raycaster respects object3D.visible automatically
    return intersects.length > 0;
  },

  onTouchStart: function(e) {
    // Only handle if it's a single-finger touch AND two-finger mode is not active
    if (GestureState.twoFingerActive) return;
    // Block drag for 0.5 seconds after a scale/rotate finishes!
    if (Date.now() - GestureState.twoFingerEndTime < 500) return;
    
    if (e.touches.length !== 1) return;
    const t = e.touches[0];
    
    // MUST physically touch the object to initiate a drag
    if (!this._hitObject(t.clientX, t.clientY)) return;

    const hit = this._hitGround(t.clientX, t.clientY);
    if (!hit) return;
    
    this.dragging = true;
    this.touchId = t.identifier;
    
    // Calculate the offset between the object's current center and the tap point
    // This totally prevents the "snapping to center" bug!
    const curPos = this.el.object3D.position.clone();
    this.dragOffset.subVectors(curPos, hit);
  },

  onTouchMove: function(e) {
    if (!this.dragging || GestureState.twoFingerActive) return;

    // Find the tracked finger
    let t = null;
    for (let i = 0; i < e.touches.length; i++) {
      if (e.touches[i].identifier === this.touchId) { t = e.touches[i]; break; }
    }
    if (!t) return;

    const hit = this._hitGround(t.clientX, t.clientY);
    if (!hit) return;

    // Move the entity to the hit point + offset, keeping Y from existing position
    const newPos = hit.add(this.dragOffset);
    const cur = this.el.object3D.position;
    this.el.setAttribute('position', { x: newPos.x, y: cur.y, z: newPos.z });
    e.preventDefault();
  },

  onTouchEnd: function(e) {
    if (!this.dragging) return;
    // Check if our tracked finger is still present
    for (let i = 0; i < e.touches.length; i++) {
      if (e.touches[i].identifier === this.touchId) return; // still down
    }
    this.dragging = false;
    this.touchId = null;
  },
});

// ---------------------------------------------------------------------------
// Exclusive 2-finger transform — scale OR rotate, never simultaneously.
// Sets GestureState.twoFingerActive so custom-hold-drag freezes position.
// ---------------------------------------------------------------------------
AFRAME.registerComponent('exclusive-two-finger-transform', {
  init: function() {
    this.mode = 'none'; // 'none' | 'pending' | 'scale' | 'rotate'
    this.startDist = 0;
    this.startAngle = 0;
    this.lastDist = 0;
    this.lastAngle = 0;

    this.scaleThreshold  = 15; // px change before locking to scale
    this.rotateThreshold = 8;  // deg change before locking to rotate

    this.onTouchStart = this.onTouchStart.bind(this);
    this.onTouchMove  = this.onTouchMove.bind(this);
    this.onTouchEnd   = this.onTouchEnd.bind(this);

    // Capture phase so we intercept before custom-hold-drag
    window.addEventListener('touchstart',  this.onTouchStart, { capture: true, passive: false });
    window.addEventListener('touchmove',   this.onTouchMove,  { capture: true, passive: false });
    window.addEventListener('touchend',    this.onTouchEnd,   { capture: true, passive: false });
    window.addEventListener('touchcancel', this.onTouchEnd,   { capture: true, passive: false });
  },
  remove: function() {
    window.removeEventListener('touchstart',  this.onTouchStart, { capture: true });
    window.removeEventListener('touchmove',   this.onTouchMove,  { capture: true });
    window.removeEventListener('touchend',    this.onTouchEnd,   { capture: true });
    window.removeEventListener('touchcancel', this.onTouchEnd,   { capture: true });
  },
  _dist: function(t1, t2) {
    const dx = t1.clientX - t2.clientX;
    const dy = t1.clientY - t2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  },
  _angle: function(t1, t2) {
    return Math.atan2(t2.clientY - t1.clientY, t2.clientX - t1.clientX) * 180 / Math.PI;
  },
  onTouchStart: function(e) {
    if (e.touches.length >= 2 && this.mode === 'none') {
      // Activate 2-finger lock — this freezes custom-hold-drag immediately
      GestureState.twoFingerActive = true;
      this.mode = 'pending';
      this.startDist  = this._dist(e.touches[0], e.touches[1]);
      this.startAngle = this._angle(e.touches[0], e.touches[1]);
      this.lastDist   = this.startDist;
      this.lastAngle  = this.startAngle;
      // Consume the event so nothing else reacts
      e.stopPropagation();
    }
  },
  onTouchMove: function(e) {
    if (!GestureState.twoFingerActive || e.touches.length < 2) return;

    const curDist  = this._dist(e.touches[0], e.touches[1]);
    const curAngle = this._angle(e.touches[0], e.touches[1]);

    if (this.mode === 'pending') {
      const dd = Math.abs(curDist - this.startDist);
      let   da = Math.abs(curAngle - this.startAngle);
      if (da > 180) da = 360 - da;
      if      (dd > this.scaleThreshold  && dd > da * 3) this.mode = 'scale';
      else if (da > this.rotateThreshold)                 this.mode = 'rotate';
    }

    if (this.mode === 'scale') {
      const ratio = curDist / this.lastDist;
      const s = this.el.object3D.scale;
      this.el.object3D.scale.set(s.x * ratio, s.y * ratio, s.z * ratio);
    } else if (this.mode === 'rotate') {
      let diff = curAngle - this.lastAngle;
      if (diff >  180) diff -= 360;
      if (diff < -180) diff += 360;
      this.el.object3D.rotation.y -= diff * (Math.PI / 180);
    }

    this.lastDist  = curDist;
    this.lastAngle = curAngle;

    e.preventDefault();
    e.stopPropagation();
  },
  onTouchEnd: function(e) {
    if (!GestureState.twoFingerActive) return;
    // Release only when truly no fingers remain
    if (e.touches.length === 0) {
      GestureState.twoFingerActive = false;
      GestureState.twoFingerEndTime = Date.now(); // Start the 0.5s cooldown block!
      this.mode = 'none';
    } else {
      // A finger lifted but at least one still down — keep blocking
      e.preventDefault();
      e.stopPropagation();
    }
  },
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
        // Custom 1-finger drag (position-locked during 2-finger ops via GestureState)
        this.wrapperEntity.setAttribute('custom-hold-drag', '')
        // Custom 2-finger exclusive scale / rotate (sets GestureState.twoFingerActive)
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
