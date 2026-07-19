// Component that places the cactus where the ground is tapped
export const tapPlaceComponent = {
  schema: {
    min: {default: 6},
    max: {default: 10},
  },
  init() {
    this.modelElement = null
    this.prompt = document.getElementById('promptText')
    
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

        if (this.modelElement) {
          // Smoothly glide to new position
          this.modelElement.setAttribute('animation__pos', {
            property: 'position',
            to: `${touchPoint.x} ${touchPoint.y} ${touchPoint.z}`,
            easing: 'easeOutQuad',
            dur: 500,
          })
          return
        }

        // First placement
        const newElement = document.createElement('a-entity')
        this.modelElement = newElement

        newElement.setAttribute('position', touchPoint)
        newElement.setAttribute('rotation', `0 ${rotationY} 0`)

        // Remove A-Frame animations once done
        newElement.addEventListener('animationcomplete', (e) => {
          newElement.removeAttribute(e.detail.name)
        })

        newElement.setAttribute('visible', 'false')
        newElement.setAttribute('scale', '0.0001 0.0001 0.0001')
        newElement.setAttribute('shadow', { receive: false })
        newElement.setAttribute('gltf-model', '#sofaModel')
        this.el.sceneEl.appendChild(newElement)

        newElement.addEventListener('model-loaded', () => {
          newElement.setAttribute('visible', 'true')
          newElement.setAttribute('animation', {
            property: 'scale',
            to: '1 1 1',
            easing: 'easeOutElastic',
            dur: 800,
          })
        })
      })
    }
    attachListener()
  }
}
