'use client'
import { Suspense, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Stars, Float } from '@react-three/drei'
import * as THREE from 'three'
import OctopusMascot from './OctopusMascot'
import { useSimStore } from '@/lib/store'

function Bubble({ position }: { position: [number, number, number] }) {
  const ref = useRef<THREE.Mesh>(null)
  const speed = 0.2 + Math.random() * 0.3
  useFrame((_, delta) => {
    if (!ref.current) return
    ref.current.position.y += delta * speed
    if (ref.current.position.y > 6) ref.current.position.y = -4
  })
  return (
    <mesh ref={ref} position={position}>
      <sphereGeometry args={[0.04 + Math.random() * 0.04, 8, 8]} />
      <meshStandardMaterial color="#90e0ef" transparent opacity={0.3} />
    </mesh>
  )
}

function OceanFloor() {
  return (
    <mesh position={[0, -4, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[20, 20, 20, 20]} />
      <meshStandardMaterial color="#0d1b2a" wireframe opacity={0.3} transparent />
    </mesh>
  )
}

export default function OceanScene() {
  const { crisisActive, skuStates, status } = useSimStore()

  const avgHealth = skuStates.length
    ? skuStates.reduce((s, sk) => s + sk.healthPct, 0) / skuStates.length
    : 70

  const mood =
    crisisActive ? 'crisis' :
    status === 'running' && avgHealth > 60 ? 'happy' :
    status === 'running' ? 'worried' :
    'idle'

  const bubblePositions: [number, number, number][] = Array.from({ length: 20 }, (_, i) => [
    (Math.random() - 0.5) * 8,
    (Math.random() - 0.5) * 6,
    (Math.random() - 0.5) * 4,
  ])

  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 50 }}
      style={{ background: 'transparent' }}
      gl={{ alpha: true, antialias: true }}
    >
      <ambientLight intensity={0.4} color="#1b3a5c" />
      <directionalLight position={[5, 5, 5]} intensity={0.8} color="#90e0ef" />
      <pointLight position={[-3, 2, 2]} intensity={0.5} color="#7b2fff" />

      <Stars radius={50} depth={20} count={300} factor={2} saturation={0} fade />
      <OceanFloor />

      {bubblePositions.map((pos, i) => (
        <Bubble key={i} position={pos} />
      ))}

      <Float speed={1.2} rotationIntensity={0.1} floatIntensity={0.3}>
        <OctopusMascot mood={mood} stockHealth={avgHealth} />
      </Float>

      <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.3} />
    </Canvas>
  )
}
