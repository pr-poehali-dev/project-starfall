import { useEffect, useRef, useState } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { OrbitControls, Center, Environment } from "@react-three/drei"
import * as THREE from "three"
import Icon from "@/components/ui/icon"

function STLMesh({ url }: { url: string }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const [geometry, setGeometry] = useState<THREE.BufferGeometry | null>(null)

  useEffect(() => {
    let cancelled = false
    async function loadSTL() {
      const { STLLoader } = await import("three/examples/jsm/loaders/STLLoader.js")
      const loader = new STLLoader()
      loader.load(
        url,
        (geo) => {
          if (cancelled) return
          geo.computeVertexNormals()
          setGeometry(geo)
        },
        undefined,
        (err) => console.error("STL load error", err)
      )
    }
    loadSTL()
    return () => { cancelled = true }
  }, [url])

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.3
    }
  })

  if (!geometry) return null

  return (
    <Center>
      <mesh ref={meshRef} geometry={geometry} castShadow receiveShadow>
        <meshStandardMaterial
          color="#cc2200"
          roughness={0.3}
          metalness={0.6}
          side={THREE.DoubleSide}
        />
      </mesh>
    </Center>
  )
}

interface STLViewerProps {
  url: string
  onClose: () => void
}

export function STLViewer({ url, onClose }: STLViewerProps) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-3xl mx-4 bg-zinc-900 border border-red-500/30 rounded-3xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
              <Icon name="Box" size={16} className="text-red-400" />
            </div>
            <div>
              <p className="text-white font-semibold text-sm">3D-просмотр модели</p>
              <p className="text-gray-400 text-xs">Зажмите и тяните для вращения · Колёсико для масштаба</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1"
          >
            <Icon name="X" size={20} />
          </button>
        </div>

        {/* Canvas */}
        <div className="w-full h-[480px] bg-zinc-950">
          <Canvas
            camera={{ position: [0, 0, 150], fov: 45 }}
            gl={{ antialias: true, alpha: false }}
            style={{ background: "#09090b" }}
            shadows
          >
            <ambientLight intensity={0.4} />
            <directionalLight position={[10, 20, 10]} intensity={1.5} castShadow />
            <directionalLight position={[-10, -10, -5]} intensity={0.3} />
            <pointLight position={[0, 0, 50]} intensity={0.5} color="#ff3300" />
            <Environment preset="studio" />
            <STLMesh url={url} />
            <OrbitControls
              enablePan={false}
              enableZoom={true}
              autoRotate={false}
              minDistance={10}
              maxDistance={500}
            />
          </Canvas>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/10">
          <p className="text-gray-400 text-xs">Модель создана с помощью Meshy.ai</p>
          <a
            href={url}
            download="model.stl"
            className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white text-sm font-bold px-5 py-2 rounded-xl transition-colors"
          >
            <Icon name="Download" size={16} />
            Скачать STL
          </a>
        </div>
      </div>
    </div>
  )
}
