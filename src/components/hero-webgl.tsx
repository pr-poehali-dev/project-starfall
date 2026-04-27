import { Canvas, extend, useFrame } from "@react-three/fiber"
import { useAspect, useTexture } from "@react-three/drei"
import { useMemo, useRef, useState, useEffect, useCallback } from "react"
import * as THREE from "three"
import Icon from "@/components/ui/icon"
import { STLViewer, type ConvertSettings } from "@/components/stl-viewer"

const TEXTUREMAP = { src: "https://i.postimg.cc/XYwvXN8D/img-4.png" }
const DEPTHMAP = { src: "https://i.postimg.cc/2SHKQh2q/raw-4.webp" }

extend(THREE as unknown as Record<string, unknown>)

const WIDTH = 300
const HEIGHT = 300

const Scene = () => {
  const [rawMap, depthMap] = useTexture([TEXTUREMAP.src, DEPTHMAP.src])
  const meshRef = useRef<THREE.Mesh>(null)

  const material = useMemo(() => {
    const vertexShader = `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `

    const fragmentShader = `
      uniform sampler2D uTexture;
      uniform sampler2D uDepthMap;
      uniform vec2 uPointer;
      uniform float uProgress;
      uniform float uTime;
      varying vec2 vUv;

      // Simple noise function
      float random(vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
      }

      float noise(vec2 st) {
        vec2 i = floor(st);
        vec2 f = fract(st);
        float a = random(i);
        float b = random(i + vec2(1.0, 0.0));
        float c = random(i + vec2(0.0, 1.0));
        float d = random(i + vec2(1.0, 1.0));
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(a, b, u.x) + (c - a)* u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
      }

      void main() {
        vec2 uv = vUv;

        // Depth-based displacement
        float depth = texture2D(uDepthMap, uv).r;
        vec2 displacement = depth * uPointer * 0.01;
        vec2 distortedUv = uv + displacement;

        // Base texture
        vec4 baseColor = texture2D(uTexture, distortedUv);

        // Create scanning effect
        float aspect = ${WIDTH}.0 / ${HEIGHT}.0;
        vec2 tUv = vec2(uv.x * aspect, uv.y);
        vec2 tiling = vec2(120.0);
        vec2 tiledUv = mod(tUv * tiling, 2.0) - 1.0;

        float brightness = noise(tUv * tiling * 0.5);
        float dist = length(tiledUv);
        float dot = smoothstep(0.5, 0.49, dist) * brightness;

        // Flow effect based on progress
        float flow = 1.0 - smoothstep(0.0, 0.02, abs(depth - uProgress));

        // Red scanning overlay
        vec3 mask = vec3(dot * flow * 10.0, 0.0, 0.0);

        // Combine effects
        vec3 final = baseColor.rgb + mask;

        gl_FragColor = vec4(final, 1.0);
      }
    `

    return new THREE.ShaderMaterial({
      uniforms: {
        uTexture: { value: rawMap },
        uDepthMap: { value: depthMap },
        uPointer: { value: new THREE.Vector2(0, 0) },
        uProgress: { value: 0 },
        uTime: { value: 0 },
      },
      vertexShader,
      fragmentShader,
    })
  }, [rawMap, depthMap])

  const [w, h] = useAspect(WIDTH, HEIGHT)

  useFrame(({ clock, pointer }) => {
    if (material.uniforms) {
      material.uniforms.uProgress.value = Math.sin(clock.getElapsedTime() * 0.5) * 0.5 + 0.5
      material.uniforms.uPointer.value = pointer
      material.uniforms.uTime.value = clock.getElapsedTime()
    }
  })

  const scaleFactor = 0.3
  return (
    <mesh ref={meshRef} scale={[w * scaleFactor, h * scaleFactor, 1]} material={material}>
      <planeGeometry />
    </mesh>
  )
}

export const Hero3DWebGL = () => {
  const titleWords = "STL Forge".split(" ")
  const subtitle = "Генератор 3D-моделей в формате STL на базе искусственного интеллекта."
  const [visibleWords, setVisibleWords] = useState(0)
  const [subtitleVisible, setSubtitleVisible] = useState(false)
  const [delays, setDelays] = useState<number[]>([])
  const [subtitleDelay, setSubtitleDelay] = useState(0)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [converting, setConverting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [stlUrl, setStlUrl] = useState<string | null>(null)
  const [convertError, setConvertError] = useState<string | null>(null)
  const [viewerOpen, setViewerOpen] = useState(false)
  const [convertSettings, setConvertSettings] = useState<ConvertSettings>({
    polycount: 30000,
    topology: "quad",
    enablePbr: false,
  })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const IMAGE_TO_STL_URL = "https://functions.poehali.dev/c811f56d-4d43-4d8d-9864-222b81d18350"
  const STL_STATUS_URL = "https://functions.poehali.dev/168a548d-9aac-441c-9fa7-f7e51c194b89"

  const handleFile = useCallback((file: File) => {
    if (file && file.type.startsWith("image/")) {
      setUploadedFile(file)
      setStlUrl(null)
      setConvertError(null)
      setProgress(0)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback(() => setIsDragging(false), [])

  const runConvert = useCallback(async (file: File, settings: ConvertSettings) => {
    setConverting(true)
    setConvertError(null)
    setStlUrl(null)
    setProgress(0)
    if (pollRef.current) clearInterval(pollRef.current)

    const reader = new FileReader()
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string
      const res = await fetch(IMAGE_TO_STL_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: dataUrl,
          polycount: settings.polycount,
          topology: settings.topology,
          enable_pbr: settings.enablePbr,
        }),
      })
      const data = await res.json()

      if (!res.ok || !data.task_id) {
        setConvertError(data.error || "Ошибка запуска конвертации")
        setConverting(false)
        return
      }

      const taskId = data.task_id
      pollRef.current = setInterval(async () => {
        const statusRes = await fetch(`${STL_STATUS_URL}?task_id=${taskId}`)
        const statusData = await statusRes.json()
        if (statusData.progress) setProgress(statusData.progress)
        if (statusData.status === "succeeded" && statusData.stl_url) {
          clearInterval(pollRef.current!)
          setStlUrl(statusData.stl_url)
          setConverting(false)
          setProgress(100)
        } else if (statusData.status === "failed") {
          clearInterval(pollRef.current!)
          setConvertError("Конвертация не удалась. Попробуйте другое фото.")
          setConverting(false)
        }
      }, 3000)
    }
    reader.readAsDataURL(file)
  }, [])

  const handleConvert = useCallback(() => {
    if (uploadedFile) runConvert(uploadedFile, convertSettings)
  }, [uploadedFile, convertSettings, runConvert])

  const handleRegenerate = useCallback((newSettings: ConvertSettings) => {
    setConvertSettings(newSettings)
    if (uploadedFile) runConvert(uploadedFile, newSettings)
  }, [uploadedFile, runConvert])

  useEffect(() => {
    setDelays(titleWords.map(() => Math.random() * 0.07))
    setSubtitleDelay(Math.random() * 0.1)
  }, [titleWords.length])

  useEffect(() => {
    if (visibleWords < titleWords.length) {
      const timeout = setTimeout(() => setVisibleWords(visibleWords + 1), 600)
      return () => clearTimeout(timeout)
    } else {
      const timeout = setTimeout(() => setSubtitleVisible(true), 800)
      return () => clearTimeout(timeout)
    }
  }, [visibleWords, titleWords.length])

  return (
    <div className="h-screen bg-black relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none z-10">
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent" />
        <div className="absolute top-0 bottom-0 left-0 w-32 bg-gradient-to-r from-black to-transparent" />
        <div className="absolute top-0 bottom-0 right-0 w-32 bg-gradient-to-l from-black to-transparent" />
      </div>

      <div className="h-screen uppercase items-center w-full absolute z-[60] pointer-events-none px-10 flex justify-center flex-col">
        <div className="text-3xl md:text-5xl xl:text-6xl 2xl:text-7xl font-extrabold font-orbitron">
          <div className="flex space-x-2 lg:space-x-6 overflow-hidden text-white">
            {titleWords.map((word, index) => (
              <div
                key={index}
                className={index < visibleWords ? "fade-in" : ""}
                style={{
                  animationDelay: `${index * 0.13 + (delays[index] || 0)}s`,
                  opacity: index < visibleWords ? undefined : 0,
                }}
              >
                {word}
              </div>
            ))}
          </div>
        </div>
        <div className="text-xs md:text-xl xl:text-2xl 2xl:text-3xl mt-2 overflow-hidden text-white font-bold max-w-4xl mx-auto text-center px-4">
          <div
            className={subtitleVisible ? "fade-in-subtitle" : ""}
            style={{
              animationDelay: `${titleWords.length * 0.13 + 0.2 + subtitleDelay}s`,
              opacity: subtitleVisible ? undefined : 0,
            }}
          >
            {subtitle}
          </div>
        </div>

        {/* Upload block */}
        <div className="pointer-events-auto mt-10 w-full max-w-lg mx-auto normal-case">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />

          {uploadedFile ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-4 bg-white/10 border border-red-500/60 backdrop-blur-sm rounded-2xl px-6 py-4">
                <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center flex-shrink-0">
                  <Icon name="ImageIcon" size={20} className="text-red-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm truncate">{uploadedFile.name}</p>
                  <p className="text-gray-400 text-xs mt-0.5">
                    {converting ? `Конвертация... ${progress}%` : stlUrl ? "Готово! Скачайте STL-файл" : "Фото загружено — готово к конвертации"}
                  </p>
                </div>
                {!converting && (
                  <button
                    onClick={() => { setUploadedFile(null); setStlUrl(null); setConvertError(null); if (fileInputRef.current) fileInputRef.current.value = "" }}
                    className="text-gray-400 hover:text-white transition-colors flex-shrink-0"
                  >
                    <Icon name="X" size={18} />
                  </button>
                )}
                {stlUrl ? (
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => setViewerOpen(true)}
                      className="bg-white/15 hover:bg-white/25 text-white text-sm font-bold px-3 py-2 rounded-xl transition-colors flex items-center gap-1.5"
                    >
                      <Icon name="Eye" size={15} />
                      Просмотр
                    </button>
                    <a
                      href={stlUrl}
                      download="model.stl"
                      className="bg-green-500 hover:bg-green-600 text-white text-sm font-bold px-3 py-2 rounded-xl transition-colors flex items-center gap-1.5"
                    >
                      <Icon name="Download" size={15} />
                      STL
                    </a>
                  </div>
                ) : (
                  <button
                    onClick={handleConvert}
                    disabled={converting}
                    className="bg-red-500 hover:bg-red-600 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors flex-shrink-0 flex items-center gap-2"
                  >
                    {converting ? <Icon name="Loader2" size={16} className="animate-spin" /> : <Icon name="Cpu" size={16} />}
                    {converting ? "Обработка" : "В STL"}
                  </button>
                )}
              </div>
              {converting && (
                <div className="w-full bg-white/10 rounded-full h-1.5">
                  <div className="bg-red-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                </div>
              )}
              {convertError && (
                <p className="text-red-400 text-xs text-center">{convertError}</p>
              )}
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`cursor-pointer border-2 border-dashed rounded-2xl px-8 py-8 text-center transition-all duration-200 backdrop-blur-sm
                ${isDragging
                  ? "border-red-400 bg-red-500/20 scale-[1.02]"
                  : "border-white/30 bg-white/5 hover:border-red-500/60 hover:bg-white/10"
                }`}
            >
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                  <Icon name="Upload" size={24} className="text-red-400" />
                </div>
                <div>
                  <p className="text-white font-semibold text-base">Загрузите фото объекта</p>
                  <p className="text-gray-400 text-sm mt-1">Перетащите или нажмите для выбора · JPG, PNG, WebP</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <Canvas
        flat
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: "high-performance",
        }}
        camera={{ position: [0, 0, 1] }}
        style={{ background: "#000000" }}
      >
        <Scene />
      </Canvas>
    </div>
  )
}

export default Hero3DWebGL