'use client';

import React, { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import * as THREE from 'three';

export default function ConfiguratorScene({ hitPosition }: { hitPosition: THREE.Vector3 | null }) {
  const groupRef = useRef<THREE.Group>(null);
  const reticleRef = useRef<THREE.Mesh>(null);
  const targetPos = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  const [hasPlaced, setHasPlaced] = useState(false);

  useEffect(() => {
    if (hitPosition) {
      targetPos.current.copy(hitPosition);
      if (!hasPlaced) {
        setHasPlaced(true);
        if (groupRef.current) {
          groupRef.current.position.copy(hitPosition);
        }
      }
    }
  }, [hitPosition, hasPlaced]);

  useFrame((state, delta) => {
    // 1. Smooth Cactus Movement
    if (hasPlaced && groupRef.current) {
      // Smoothly interpolate to the new target position for a gliding effect
      groupRef.current.position.lerp(targetPos.current, 10 * delta);
    }

    // 2. Reticle Continuous Tracking
    if ((window as any).XR8 && reticleRef.current && !hasPlaced) {
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
    } else if (hasPlaced && reticleRef.current) {
       // Hide reticle once placed
       reticleRef.current.visible = false;
    }
  });

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 10, 5]} intensity={1.5} castShadow />

      {/* Reticle Ring */}
      <mesh ref={reticleRef} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
        <ringGeometry args={[0.15, 0.2, 32]} />
        <meshBasicMaterial color="#ffffff" side={THREE.DoubleSide} transparent opacity={0.8} />
      </mesh>

      {/* Programmatic Cactus */}
      <group ref={groupRef} visible={hasPlaced}>
        {/* Main Body */}
        <mesh position={[0, 0.4, 0]}>
          <cylinderGeometry args={[0.1, 0.1, 0.8, 16]} />
          <meshStandardMaterial color="#2d5a27" roughness={0.7} />
        </mesh>
        <mesh position={[0, 0.8, 0]}>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshStandardMaterial color="#2d5a27" roughness={0.7} />
        </mesh>
        
        {/* Left Arm */}
        <mesh position={[-0.15, 0.4, 0]} rotation={[0, 0, Math.PI / 4]}>
          <cylinderGeometry args={[0.06, 0.06, 0.3, 16]} />
          <meshStandardMaterial color="#2d5a27" roughness={0.7} />
        </mesh>
        <mesh position={[-0.25, 0.55, 0]}>
          <cylinderGeometry args={[0.06, 0.06, 0.2, 16]} />
          <meshStandardMaterial color="#2d5a27" roughness={0.7} />
        </mesh>
        <mesh position={[-0.25, 0.65, 0]}>
          <sphereGeometry args={[0.06, 16, 16]} />
          <meshStandardMaterial color="#2d5a27" roughness={0.7} />
        </mesh>

        {/* Right Arm */}
        <mesh position={[0.15, 0.3, 0]} rotation={[0, 0, -Math.PI / 4]}>
          <cylinderGeometry args={[0.06, 0.06, 0.3, 16]} />
          <meshStandardMaterial color="#2d5a27" roughness={0.7} />
        </mesh>
        <mesh position={[0.25, 0.45, 0]}>
          <cylinderGeometry args={[0.06, 0.06, 0.2, 16]} />
          <meshStandardMaterial color="#2d5a27" roughness={0.7} />
        </mesh>
        <mesh position={[0.25, 0.55, 0]}>
          <sphereGeometry args={[0.06, 16, 16]} />
          <meshStandardMaterial color="#2d5a27" roughness={0.7} />
        </mesh>

        {/* Pot */}
        <mesh position={[0, 0.05, 0]}>
          <cylinderGeometry args={[0.15, 0.12, 0.1, 16]} />
          <meshStandardMaterial color="#c17244" roughness={0.9} />
        </mesh>
      </group>

      <Environment preset="city" />
    </>
  );
}
