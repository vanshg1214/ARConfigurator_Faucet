'use client';

import React, { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Environment, useGLTF, useTexture, useAnimations } from '@react-three/drei';
import * as THREE from 'three';

const DesktopSimulatorEnv = () => {
  const isMobile = typeof window !== 'undefined' && /Mobi|Android/i.test(window.navigator.userAgent);
  if (isMobile) return null;

  return (
    <>
      <color attach="background" args={['#5ac8fa']} />
      <fog attach="fog" args={['#B4C4CC', 10, 50]} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.01, 0]} receiveShadow>
        <planeGeometry args={[1000, 1000]} />
        <meshStandardMaterial color="#FFF" />
      </mesh>
    </>
  );
};

interface ConfiguratorSceneProps {
  hitPosition: THREE.Vector3 | null;
  metalColor: number;
  metalness: number;
  roughness: number;
  isFlowing: boolean;
}

export default function ConfiguratorScene({ 
  hitPosition, 
  metalColor, 
  metalness, 
  roughness, 
  isFlowing 
}: ConfiguratorSceneProps) {
  const reticleRef = useRef<THREE.Mesh>(null);
  const [placements, setPlacements] = useState<{id: number, pos: THREE.Vector3, rotY: number}[]>([]);

  // Load the Faucet model
  const { scene, animations } = useGLTF('/aframe-cactus/src/assets/DeltaFaucet_V5_Decimated_Animated.glb');

  // Trigger a new placement every time hitPosition updates
  useEffect(() => {
    if (hitPosition) {
      setPlacements(prev => [...prev, {
        id: Date.now() + Math.random(),
        pos: hitPosition.clone(),
        rotY: Math.random() * Math.PI * 2 // Random Y rotation
      }]);
    }
  }, [hitPosition]);

  useFrame((state, delta) => {
    // Reticle Continuous Tracking
    if ((window as any).XR8 && reticleRef.current) {
      try {
        // Hit test at center of screen (0.5, 0.5)
        const results = (window as any).XR8.XrController.hitTest(0.5, 0.5, ['ESTIMATED_SURFACE']);
        if (results && results.length > 0) {
          const { position, rotation } = results[0];
          reticleRef.current.position.set(position.x, position.y, position.z);
          reticleRef.current.quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w);
          reticleRef.current.visible = true;
        } else {
          reticleRef.current.visible = false;
        }
      } catch (e) {
        // Fallback for desktop testing simulator
        reticleRef.current.position.set(0, -1, -3);
        reticleRef.current.rotation.x = -Math.PI / 2;
        reticleRef.current.visible = true;
      }
    }
  });

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 10, 5]} intensity={1.5} castShadow />

      <DesktopSimulatorEnv />

      {/* Reticle Ring */}
      <mesh ref={reticleRef} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
        <ringGeometry args={[0.15, 0.2, 32]} />
        <meshBasicMaterial color="#ffffff" side={THREE.DoubleSide} transparent opacity={0.8} />
      </mesh>

      {/* Render all placed models */}
      {placements.map(p => (
        <BouncyModel 
          key={p.id} 
          position={p.pos} 
          rotY={p.rotY} 
          originalScene={scene} 
          animations={animations}
          metalColor={metalColor}
          metalness={metalness}
          roughness={roughness}
          isFlowing={isFlowing}
        />
      ))}

      <Environment preset="city" />
    </>
  );
}

// BouncyModel handles the elastic scale animation, material updates, and water flow
function BouncyModel({ 
  position, rotY, originalScene, animations, metalColor, metalness, roughness, isFlowing 
}: { 
  position: THREE.Vector3, rotY: number, originalScene: THREE.Group, animations: THREE.AnimationClip[],
  metalColor: number, metalness: number, roughness: number, isFlowing: boolean
}) {
  const ref = useRef<THREE.Group>(null);
  
  // Clone scene for individual manipulation
  const scene = React.useMemo(() => originalScene.clone(), [originalScene]);
  const { actions } = useAnimations(animations, ref);

  const velocity = useRef(0);
  const currentScale = useRef(0.0001);
  const targetScale = 0.15; // Adjust this based on how big you want the faucet

  // Handle elastic scale
  useFrame((state, delta) => {
    if (ref.current && currentScale.current !== targetScale) {
      const diff = targetScale - currentScale.current;
      velocity.current += diff * 200 * delta; 
      velocity.current *= 0.85; 
      currentScale.current += velocity.current * delta;
      
      const s = Math.max(0.0001, currentScale.current);
      ref.current.scale.set(s, s, s);
      
      if (Math.abs(diff) < 0.001 && Math.abs(velocity.current) < 0.001) {
        currentScale.current = targetScale;
        ref.current.scale.set(targetScale, targetScale, targetScale);
      }
    }
  });

  // Apply materials and flow state
  useEffect(() => {
    scene.traverse((node: any) => {
      if (node.isMesh && node.material) {
        const mats = Array.isArray(node.material) ? node.material : [node.material];
        mats.forEach((mat: any) => {
          // Clone material to avoid shared state across instances
          node.material = mat.clone(); 
          if (node.name.toLowerCase().includes('water')) {
            node.visible = isFlowing;
            node.material.color.setHex(0xffffff);
            node.material.metalness = 0.1;
            node.material.roughness = 0.1;
            node.material.transparent = true;
            node.material.opacity = 0.8;
          } else {
            node.material.color.setHex(metalColor);
            node.material.metalness = metalness;
            node.material.roughness = roughness;
            if (node.material.emissive) node.material.emissive.setHex(0x000000);
          }
        });
      }
    });
  }, [scene, metalColor, metalness, roughness, isFlowing]);

  // Handle flow animation
  useEffect(() => {
    if (!actions) return;
    const action = Object.values(actions)[0];
    if (action) {
      if (isFlowing) {
        action.reset().play();
      } else {
        action.stop();
      }
    }
  }, [isFlowing, actions]);

  return (
    <group ref={ref} position={position} rotation={[0, rotY, 0]}>
      <primitive object={scene} />
    </group>
  );
}

useGLTF.preload('/aframe-cactus/src/assets/DeltaFaucet_V5_Decimated_Animated.glb');
