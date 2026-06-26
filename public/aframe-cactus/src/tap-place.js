// Component that places cacti where the ground is clicked

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
    const ground = document.getElementById('ground')
    this.prompt = document.getElementById('promptText')
    this.faucetElement = null

    const attachListener = () => {
      const g = document.getElementById('ground')
      if (!g) {
        setTimeout(attachListener, 100);
        return;
      }
      g.addEventListener('click', (event) => {
        // Dismiss the prompt text.
        if (this.prompt) this.prompt.style.display = 'none'

        const touchPoint = event.detail.intersection.point

        // Calculate rotation to face the camera
        const camera = document.getElementById('camera')
        let rotationY = 0
        if (camera) {
          const cameraPos = camera.object3D.position
          const dx = cameraPos.x - touchPoint.x
          const dz = cameraPos.z - touchPoint.z
          // Calculate angle so the model's front faces the camera (adding 180 deg offset)
          rotationY = (Math.atan2(dx, -dz) * (180 / Math.PI)) + 180
        }

        if (this.faucetElement) {
          // Move the existing faucet to the new tap location smoothly, 
          // but preserve the user's custom rotation
          this.faucetElement.setAttribute('animation__pos', {
            property: 'position',
            to: `${touchPoint.x} ${touchPoint.y} ${touchPoint.z}`,
            easing: 'easeOutQuad',
            dur: 500,
          })
          return
        }

        // Create new entity for the new object
        const newElement = document.createElement('a-entity')
        this.faucetElement = newElement

        // The raycaster gives a location of the touch in the scene
        newElement.setAttribute('position', touchPoint)
        newElement.setAttribute('rotation', `0 ${rotationY} 0`)

        // Allow gestures
        newElement.classList.add('cantap')
        newElement.setAttribute('xrextras-hold-drag', '')
        newElement.setAttribute('xrextras-two-finger-rotate', '')
        newElement.setAttribute('xrextras-pinch-scale', 'min: 0.05; max: 0.4')

        // Clean up animations when they finish so they don't fight with touch gestures
        newElement.addEventListener('animationcomplete', (e) => {
          newElement.removeAttribute(e.detail.name)
        })

        newElement.setAttribute('visible', 'false')
        newElement.setAttribute('scale', '0.0001 0.0001 0.0001')

        newElement.setAttribute('shadow', {
          receive: false,
        })

        newElement.setAttribute('gltf-model', '#faucetModel')
        this.el.sceneEl.appendChild(newElement)

        newElement.addEventListener('model-loaded', () => {
          // Show UI
          const actionContainer = document.getElementById('actionContainer')
          if (actionContainer) actionContainer.style.display = 'block'
          const buttonContainer = document.getElementById('buttonContainer')
          if (buttonContainer) buttonContainer.style.display = 'flex'

          // Hide the water meshes and joints from the model, and tune lighting
          const obj = newElement.getObject3D('mesh')
          if (obj) {
            // Setup animations if any
            if (obj.animations && obj.animations.length > 0) {
              this.mixer = new THREE.AnimationMixer(obj)
              this.action = this.mixer.clipAction(obj.animations[0])
            }

            // Create a procedural gold environment map if not already set on the scene
            const sceneEl = this.el.sceneEl
            if (sceneEl && sceneEl.object3D && !sceneEl.object3D.environment) {
              const canvas = document.createElement('canvas')
              canvas.width = 64
              canvas.height = 32
              const ctx = canvas.getContext('2d')
              // Sky to ground gradient with a warm gold tone for reflections
              const grad = ctx.createLinearGradient(0, 0, 0, 32)
              grad.addColorStop(0, '#ffffff') // white sky highlights
              grad.addColorStop(0.3, '#ffecb3') // soft gold
              grad.addColorStop(0.5, '#4e3629') // dark bronze horizon separator
              grad.addColorStop(0.7, '#d4af37') // polished gold ground reflection
              grad.addColorStop(1, '#110c00') // bottom reflection
              ctx.fillStyle = grad
              ctx.fillRect(0, 0, 64, 32)

              const texture = new AFRAME.THREE.CanvasTexture(canvas)
              texture.mapping = AFRAME.THREE.EquirectangularReflectionMapping
              sceneEl.object3D.environment = texture
            }

            obj.traverse((node) => {
              if (node.name && node.name.toLowerCase().includes('water')) {
                node.visible = false
                this.waterNodes.push(node)
                
                // Force water to be white and glassy
                if (node.isMesh && node.material) {
                  const materials = Array.isArray(node.material) ? node.material : [node.material]
                  materials.forEach((mat) => {
                    if (mat.color) mat.color.setHex(0xffffff)
                    if (mat.metalness !== undefined) mat.metalness = 0.1
                    if (mat.roughness !== undefined) mat.roughness = 0.1
                    mat.transparent = true
                    mat.opacity = 0.8
                  })
                }
              } else if (node.isMesh && node.material) {
                const materials = Array.isArray(node.material) ? node.material : [node.material]
                materials.forEach((mat) => {
                  // Fully metallic
                  if (mat.metalness !== undefined) {
                    mat.metalness = 1.0
                  }
                  // Highly polished/shiny surface
                  if (mat.roughness !== undefined) {
                    mat.roughness = 0.15
                  }
                  // Tint to a premium polished gold color
                  if (mat.color) {
                    mat.color.setHex(0xd4af37)
                  }
                  // Disable emissive wash
                  if (mat.emissive) {
                    mat.emissive.setHex(0x000000)
                  }
                })
              }
            })
          }

          // Once the model is loaded, we are ready to show it popping in using an animation
          newElement.setAttribute('visible', 'true')
          newElement.setAttribute('animation', {
            property: 'scale',
            to: '0.15 0.15 0.15',
            easing: 'easeOutElastic',
            dur: 800,
          })
        })
      })
    };
    attachListener();

    // Water flow logic
    const btnWater = document.getElementById('btnWater')
    const waterBtnText = document.getElementById('waterBtnText')
    if (btnWater) {
      btnWater.addEventListener('click', (e) => {
        e.stopPropagation()
        this.waterActive = !this.waterActive
        
        // Update styling and text
        if (this.waterActive) {
          btnWater.classList.add('active')
          if (waterBtnText) waterBtnText.innerText = 'Stop Flow'
        } else {
          btnWater.classList.remove('active')
          if (waterBtnText) waterBtnText.innerText = 'Flow'
        }

        // Toggle water nodes visibility
        this.waterNodes.forEach(node => {
          node.visible = this.waterActive
        })

        // Play/Stop animation
        if (this.mixer && this.action) {
          if (this.waterActive) {
            this.action.reset()
            this.action.play()
          } else {
            this.action.stop()
          }
        }
      })
    }

    // Color switching logic for buttons
    const applyColor = (hexColor, metalness, roughness) => {
      if (!this.faucetElement) return
      const obj = this.faucetElement.getObject3D('mesh')
      if (obj) {
        obj.traverse((node) => {
          if (node.isMesh && node.material && (!node.name || !node.name.toLowerCase().includes('water'))) {
            const materials = Array.isArray(node.material) ? node.material : [node.material]
            materials.forEach((mat) => {
              if (mat.color) mat.color.setHex(hexColor)
              if (mat.metalness !== undefined) mat.metalness = metalness
              if (mat.roughness !== undefined) mat.roughness = roughness
            })
          }
        })
      }
    }

    const btnGold = document.getElementById('btnGold')
    if (btnGold) {
      btnGold.addEventListener('click', (e) => {
        e.stopPropagation()
        applyColor(0xd4af37, 1.0, 0.15)
      })
    }
    
    const btnSilver = document.getElementById('btnSilver')
    if (btnSilver) {
      btnSilver.addEventListener('click', (e) => {
        e.stopPropagation()
        applyColor(0xe0e0e0, 1.0, 0.1)
      })
    }
    
    const btnBlack = document.getElementById('btnBlack')
    if (btnBlack) {
      btnBlack.addEventListener('click', (e) => {
        e.stopPropagation()
        applyColor(0x222222, 0.3, 0.6)
      })
    }
  },
  tick(time, timeDelta) {
    if (this.mixer) {
      this.mixer.update(timeDelta / 1000)
    }
  },
}
