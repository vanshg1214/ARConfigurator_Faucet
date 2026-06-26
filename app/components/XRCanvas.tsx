'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import * as THREE from 'three';

const XR8PipelineModule = () => {
  const { gl, camera } = useThree();
  
  useEffect(() => {
    if (!(window as any).XR8) return;
    const XR8 = (window as any).XR8;

    const pipelineModule = () => ({
      name: 'r3f-bridge',
      onStart: () => {
        // Prevent R3F from clearing the camera feed rendered by 8th Wall
        gl.autoClear = false;
      },
      onUpdate: ({ processCpuResult }: any) => {
        const camData = processCpuResult.camera;
        if (!camData) return;
        
        // Sync R3F camera with 8th Wall camera tracking
        camera.position.set(camData.position.x, camData.position.y, camData.position.z);
        camera.quaternion.set(camData.rotation.x, camData.rotation.y, camData.rotation.z, camData.rotation.w);
        camera.projectionMatrix.fromArray(camData.projectionMatrix);
      }
    });

    XR8.addCameraPipelineModule(pipelineModule());
    
    return () => {
      XR8.removeCameraPipelineModule('r3f-bridge');
    };
  }, [camera, gl]);

  return null;
};

export default function XRCanvas({ children }: { children: (hitPosition: THREE.Vector3 | null) => React.ReactNode }) {
  const [xrReady, setXrReady] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hitPosition, setHitPosition] = useState<THREE.Vector3 | null>(null);

  // Wait for 8th Wall to load
  useEffect(() => {
    const onXrLoaded = () => setXrReady(true);
    if ((window as any).XR8) {
      onXrLoaded();
    } else {
      window.addEventListener('xrloaded', onXrLoaded);
    }
    return () => window.removeEventListener('xrloaded', onXrLoaded);
  }, []);

  // Initialize 8th Wall when ready
  useEffect(() => {
    if (xrReady && canvasRef.current) {
      const XR8 = (window as any).XR8;
      XR8.run({
        canvas: canvasRef.current,
        allowedDevices: XR8.XrConfig.device.ANY,
      });
    }
    return () => {
      if ((window as any).XR8) (window as any).XR8.stop();
    };
  }, [xrReady]);

  // Handle click/touch events and trigger hit testing
  const handlePointerDown = (e: React.PointerEvent) => {
    if (!xrReady || !(window as any).XR8) return;
    
    // Normalize coordinates for both mouse and touch
    const x = e.clientX / window.innerWidth;
    const y = e.clientY / window.innerHeight;

    try {
      // Call 8th Wall hit test
      const results = (window as any).XR8.XrController.hitTest(x, y, ['ESTIMATED_SURFACE']);
      
      if (results && results.length > 0) {
        const { position } = results[0];
        setHitPosition(new THREE.Vector3(position.x, position.y, position.z));
      } else {
        // Fallback if no surface found
        setHitPosition(new THREE.Vector3(0, -0.5, -2));
      }
    } catch (e) {
      console.warn("8th Wall hitTest crashed (common on desktop/simulator without SLAM memory). Using fallback position.", e);
      // Fallback for desktop computer testing
      setHitPosition(new THREE.Vector3((x - 0.5) * 4, -1, -3));
    }
  };

  return (
    <div 
      style={{ width: '100vw', height: '100vh', position: 'relative' }}
      onPointerDown={handlePointerDown}
    >
      {/* 8th Wall Camera Feed Canvas */}
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', display: 'block', position: 'absolute', top: 0, left: 0, zIndex: -1 }}
      />
      {/* React Three Fiber Scene Overlay */}
      {xrReady && (
        <Canvas style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }} gl={{ alpha: true }}>
          <XR8PipelineModule />
          {children(hitPosition)}
        </Canvas>
      )}
      {!xrReady && (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'white', fontFamily: 'sans-serif' }}>
          Initializing AR...
        </div>
      )}
    </div>
  );
}
