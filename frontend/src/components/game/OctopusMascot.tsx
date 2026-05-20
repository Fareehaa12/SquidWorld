'use client'
import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface OctopusMascotProps {
  mood?: 'happy' | 'worried' | 'crisis' | 'idle'
  stockHealth?: number  // 0-100 average
}

function Tentacle({ index, mood }: { index: number; mood: string }) {
  const ref = useRef<THREE.Mesh>(null)
  const angle = (index / 8) * Math.PI * 2
  const r = 0.55

  const curve = useMemo(() => {
    const pts = []
    for (let i = 0; i <= 20; i++) {
      const t = i / 20
      pts.push(new THREE.Vector3(
        Math.sin(angle) * r * (1 + t * 0.3),
        -t * 1.2 - 0.3,
        Math.cos(angle) * r * (1 + t * 0.3)
      ))
    }
    return new THREE.CatmullRomCurve3(pts)
  }, [angle, r])

  const geometry = useMemo(() => new THREE.TubeGeometry(curve, 20, 0.055, 8, false), [curve])

  useFrame((state) => {
    if (!ref.current) return
    const t = state.clock.elapsedTime
    const speed = mood === 'crisis' ? 4 : mood === 'happy' ? 1.5 : 1
    const amp = mood === 'crisis' ? 0.25 : 0.1
    ref.current.rotation.y = Math.sin(t * speed + index) * amp
    ref.current.rotation.x = Math.cos(t * speed * 0.7 + index) * amp * 0.5
  })

  const color = mood === 'crisis' ? '#ff6b6b' : mood === 'happy' ? '#2dc653' : '#00b4d8'

  return (
    <mesh ref={ref} geometry={geometry}>
      <meshStandardMaterial color={color} roughness={0.3} metalness={0.1} />
    </mesh>
  )
}

export default function OctopusMascot({ mood = 'idle', stockHealth = 70 }: OctopusMascotProps) {
  const bodyRef = useRef<THREE.Group>(null)
  const eyeL = useRef<THREE.Mesh>(null)
  const eyeR = useRef<THREE.Mesh>(null)

  const bodyColor = mood === 'crisis' ? '#cc3333' : mood === 'happy' ? '#1a8c3c' : '#1b5e96'
  const glowColor = mood === 'crisis' ? '#ff4444' : '#00b4d8'

  useFrame((state) => {
    if (!bodyRef.current) return
    const t = state.clock.elapsedTime
    const floatAmp = mood === 'crisis' ? 0.08 : 0.05
    bodyRef.current.position.y = Math.sin(t * 0.8) * floatAmp
    bodyRef.current.rotation.y = Math.sin(t * 0.3) * 0.15

    if (eyeL.current && eyeR.current) {
      const blink = Math.sin(t * 0.5) > 0.97 ? 0.1 : 1
      eyeL.current.scale.y = blink
      eyeR.current.scale.y = blink
    }
  })

  return (
    <group ref={bodyRef}>
      {/* Body */}
      <mesh>
        <sphereGeometry args={[0.7, 32, 32]} />
        <meshStandardMaterial color={bodyColor} roughness={0.4} metalness={0.2} />
      </mesh>
      {/* Head dome */}
      <mesh position={[0, 0.5, 0]}>
        <sphereGeometry args={[0.6, 32, 32, 0, Math.PI * 2, 0, Math.PI * 0.6]} />
        <meshStandardMaterial color={bodyColor} roughness={0.4} metalness={0.15} />
      </mesh>
      {/* Eyes */}
      <mesh ref={eyeL} position={[-0.22, 0.35, 0.55]}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.3} />
      </mesh>
      <mesh ref={eyeR} position={[0.22, 0.35, 0.55]}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.3} />
      </mesh>
      {/* Pupils */}
      <mesh position={[-0.22, 0.35, 0.65]}>
        <sphereGeometry args={[0.06, 16, 16]} />
        <meshStandardMaterial color="#0a0a1a" />
      </mesh>
      <mesh position={[0.22, 0.35, 0.65]}>
        <sphereGeometry args={[0.06, 16, 16]} />
        <meshStandardMaterial color="#0a0a1a" />
      </mesh>
      {/* Glow sphere */}
      <mesh>
        <sphereGeometry args={[0.85, 16, 16]} />
        <meshStandardMaterial color={glowColor} transparent opacity={0.04} side={THREE.BackSide} />
      </mesh>
      {/* 8 Tentacles */}
      {Array.from({ length: 8 }).map((_, i) => (
        <Tentacle key={i} index={i} mood={mood} />
      ))}
      {/* Point light for glow */}
      <pointLight color={glowColor} intensity={1.5} distance={3} />
    </group>
  )
}
