"use client";

import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF, Stage } from "@react-three/drei";
import { Mesh } from "three";

interface ModelViewerProps {
  modelUrl?: string;
  className?: string;
}

function Model({ url }: { url: string }) {
  const meshRef = useRef<Mesh>(null);
  
  // Always call hooks at the top level - no conditional hook calls
  const gltf = useGLTF(url);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.2;
    }
  });

  // Handle missing scene
  if (!gltf?.scene) {
    return (
      <mesh>
        <boxGeometry args={[2, 1, 0.1]} />
        <meshStandardMaterial color="#8B7355" />
      </mesh>
    );
  }

  return <primitive ref={meshRef} object={gltf.scene} scale={1} />;
}

function DefaultDesk() {
  const meshRef = useRef<Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.2;
    }
  });

  return (
    <group ref={meshRef}>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[3, 0.1, 1.5]} />
        <meshStandardMaterial color="#DEB887" />
      </mesh>
      <mesh position={[-1.3, -0.4, 0.6]}>
        <boxGeometry args={[0.1, 0.8, 0.1]} />
        <meshStandardMaterial color="#8B7355" />
      </mesh>
      <mesh position={[1.3, -0.4, 0.6]}>
        <boxGeometry args={[0.1, 0.8, 0.1]} />
        <meshStandardMaterial color="#8B7355" />
      </mesh>
      <mesh position={[-1.3, -0.4, -0.6]}>
        <boxGeometry args={[0.1, 0.8, 0.1]} />
        <meshStandardMaterial color="#8B7355" />
      </mesh>
      <mesh position={[1.3, -0.4, -0.6]}>
        <boxGeometry args={[0.1, 0.8, 0.1]} />
        <meshStandardMaterial color="#8B7355" />
      </mesh>
    </group>
  );
}

export function ModelViewer({ modelUrl, className = "" }: ModelViewerProps) {
  return (
    <div className={`w-full h-full min-h-[300px] ${className}`}>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        style={{ background: "transparent" }}
      >
        <Suspense fallback={null}>
          <Stage
            adjustCamera={1.2}
            intensity={0.5}
            shadows="contact"
            environment="city"
          >
            {modelUrl ? <Model url={modelUrl} /> : <DefaultDesk />}
          </Stage>
          <OrbitControls
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            minDistance={2}
            maxDistance={10}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}