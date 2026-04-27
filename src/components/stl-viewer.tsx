import { useEffect, useRef, useState, useCallback } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { OrbitControls, Center, Environment, Grid } from "@react-three/drei"
import * as THREE from "three"
import Icon from "@/components/ui/icon"

// ─── типы настроек ────────────────────────────────────────────────────────────
export interface ViewerSettings {
  color: string
  bgColor: string
  wireframe: boolean
  autoRotate: boolean
  showGrid: boolean
  roughness: number
  metalness: number
  lightIntensity: number
}

const DEFAULT_SETTINGS: ViewerSettings = {
  color: "#cc2200",
  bgColor: "#09090b",
  wireframe: false,
  autoRotate: true,
  showGrid: false,
  roughness: 0.3,
  metalness: 0.6,
  lightIntensity: 1.5,
}

// ─── 3D меш ───────────────────────────────────────────────────────────────────
function STLMesh({ url, settings, scale }: { url: string; settings: ViewerSettings; scale: number }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const [geometry, setGeometry] = useState<THREE.BufferGeometry | null>(null)

  useEffect(() => {
    let cancelled = false
    async function loadSTL() {
      const { STLLoader } = await import("three/examples/jsm/loaders/STLLoader.js")
      const loader = new STLLoader()
      loader.load(url, (geo) => {
        if (cancelled) return
        geo.computeVertexNormals()
        setGeometry(geo)
      })
    }
    loadSTL()
    return () => { cancelled = true }
  }, [url])

  useFrame((_, delta) => {
    if (meshRef.current && settings.autoRotate) {
      meshRef.current.rotation.y += delta * 0.4
    }
  })

  if (!geometry) return null

  return (
    <Center>
      <mesh ref={meshRef} geometry={geometry} castShadow receiveShadow scale={scale}>
        <meshStandardMaterial
          color={settings.color}
          roughness={settings.roughness}
          metalness={settings.metalness}
          wireframe={settings.wireframe}
          side={THREE.DoubleSide}
        />
      </mesh>
    </Center>
  )
}

function SceneBackground({ color }: { color: string }) {
  const { scene } = useThree()
  useEffect(() => { scene.background = new THREE.Color(color) }, [color, scene])
  return null
}

// ─── Slider компонент ─────────────────────────────────────────────────────────
function SettingSlider({ label, value, min, max, step, onChange }: {
  label: string; value: number; min: number; max: number; step: number
  onChange: (v: number) => void
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between text-xs text-gray-400">
        <span>{label}</span>
        <span className="text-white">{value.toFixed(2)}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-red-500 bg-white/10"
      />
    </div>
  )
}

// ─── Toggle кнопка ────────────────────────────────────────────────────────────
function ToggleBtn({ active, onClick, icon, label }: {
  active: boolean; onClick: () => void; icon: string; label: string
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl text-xs font-medium transition-all
        ${active ? "bg-red-500 text-white" : "bg-white/10 text-gray-400 hover:bg-white/15"}`}
    >
      <Icon name={icon as "Box"} size={14} />
      {label}
    </button>
  )
}

// ─── Основной компонент ────────────────────────────────────────────────────────
export interface STLViewerProps {
  url: string
  onClose: () => void
  onRegenerate?: (settings: ConvertSettings) => void
  convertSettings?: ConvertSettings
}

export interface ConvertSettings {
  polycount: number
  topology: "quad" | "triangle"
  enablePbr: boolean
}

const DEFAULT_CONVERT: ConvertSettings = {
  polycount: 30000,
  topology: "quad",
  enablePbr: false,
}

export function STLViewer({ url, onClose, onRegenerate, convertSettings }: STLViewerProps) {
  const [settings, setSettings] = useState<ViewerSettings>(DEFAULT_SETTINGS)
  const [modelScale, setModelScale] = useState(1)
  const [activeTab, setActiveTab] = useState<"view" | "convert">("view")
  const [localConvert, setLocalConvert] = useState<ConvertSettings>(convertSettings ?? DEFAULT_CONVERT)

  const set = useCallback(<K extends keyof ViewerSettings>(key: K, val: ViewerSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: val }))
  }, [])

  const BG_PRESETS = ["#09090b", "#0a0a1a", "#0d1a0d", "#1a0d0d", "#f0f0f0"]

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-5xl bg-zinc-900 border border-red-500/30 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[95vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
              <Icon name="Box" size={16} className="text-red-400" />
            </div>
            <div>
              <p className="text-white font-semibold text-sm">3D-просмотр модели</p>
              <p className="text-gray-400 text-xs">Вращение · Масштаб · Настройки</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-1">
            <Icon name="X" size={20} />
          </button>
        </div>

        {/* Body: canvas + sidebar */}
        <div className="flex flex-1 overflow-hidden min-h-0">

          {/* Canvas */}
          <div className="flex-1 min-w-0 bg-zinc-950 relative">
            <Canvas
              camera={{ position: [0, 0, 150], fov: 45 }}
              gl={{ antialias: true }}
              shadows
            >
              <SceneBackground color={settings.bgColor} />
              <ambientLight intensity={0.4} />
              <directionalLight position={[10, 20, 10]} intensity={settings.lightIntensity} castShadow />
              <directionalLight position={[-10, -10, -5]} intensity={0.3} />
              <pointLight position={[0, 0, 50]} intensity={0.5} color="#ff3300" />
              {settings.bgColor !== "#f0f0f0" && <Environment preset="studio" />}
              {settings.showGrid && <Grid infiniteGrid fadeDistance={300} cellColor="#444" sectionColor="#666" />}
              <STLMesh url={url} settings={settings} scale={modelScale} />
              <OrbitControls enablePan={true} enableZoom={true} minDistance={5} maxDistance={800} />
            </Canvas>

            {/* Overlay подсказка */}
            <p className="absolute bottom-3 left-1/2 -translate-x-1/2 text-gray-500 text-xs pointer-events-none">
              ЛКМ — вращение · ПКМ — перемещение · Колёсико — масштаб
            </p>
          </div>

          {/* Sidebar */}
          <div className="w-64 flex-shrink-0 bg-zinc-900 border-l border-white/10 flex flex-col overflow-y-auto">

            {/* Tabs */}
            <div className="flex border-b border-white/10">
              {(["view", "convert"] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-3 text-xs font-semibold transition-colors
                    ${activeTab === tab ? "text-red-400 border-b-2 border-red-500" : "text-gray-500 hover:text-gray-300"}`}
                >
                  {tab === "view" ? "Отображение" : "Конвертация"}
                </button>
              ))}
            </div>

            <div className="p-4 flex flex-col gap-5 flex-1">

              {/* ── TAB: Отображение ─────────────────────────── */}
              {activeTab === "view" && <>

                {/* Быстрые тоглы */}
                <div>
                  <p className="text-gray-500 text-xs mb-2 uppercase tracking-wider">Режим</p>
                  <div className="flex gap-2 flex-wrap">
                    <ToggleBtn active={settings.wireframe} onClick={() => set("wireframe", !settings.wireframe)} icon="Grid3x3" label="Сетка" />
                    <ToggleBtn active={settings.autoRotate} onClick={() => set("autoRotate", !settings.autoRotate)} icon="RotateCw" label="Авто" />
                    <ToggleBtn active={settings.showGrid} onClick={() => set("showGrid", !settings.showGrid)} icon="AlignJustify" label="Пол" />
                  </div>
                </div>

                {/* Цвет модели */}
                <div>
                  <p className="text-gray-500 text-xs mb-2 uppercase tracking-wider">Цвет модели</p>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={settings.color}
                      onChange={e => set("color", e.target.value)}
                      className="w-10 h-10 rounded-lg cursor-pointer border-0 bg-transparent"
                    />
                    <span className="text-white text-sm font-mono">{settings.color}</span>
                  </div>
                </div>

                {/* Фон */}
                <div>
                  <p className="text-gray-500 text-xs mb-2 uppercase tracking-wider">Фон</p>
                  <div className="flex gap-2">
                    {BG_PRESETS.map(c => (
                      <button
                        key={c}
                        onClick={() => set("bgColor", c)}
                        style={{ background: c }}
                        className={`w-8 h-8 rounded-lg border-2 transition-all ${settings.bgColor === c ? "border-red-500 scale-110" : "border-white/20"}`}
                      />
                    ))}
                  </div>
                </div>

                {/* Материал */}
                <div className="flex flex-col gap-3">
                  <p className="text-gray-500 text-xs uppercase tracking-wider">Материал</p>
                  <SettingSlider label="Шероховатость" value={settings.roughness} min={0} max={1} step={0.01} onChange={v => set("roughness", v)} />
                  <SettingSlider label="Металличность" value={settings.metalness} min={0} max={1} step={0.01} onChange={v => set("metalness", v)} />
                  <SettingSlider label="Освещение" value={settings.lightIntensity} min={0.1} max={4} step={0.1} onChange={v => set("lightIntensity", v)} />
                </div>

                {/* Масштаб */}
                <div className="flex flex-col gap-3">
                  <p className="text-gray-500 text-xs uppercase tracking-wider">Масштаб модели</p>
                  <SettingSlider label="Размер" value={modelScale} min={0.1} max={5} step={0.1} onChange={setModelScale} />
                  <button
                    onClick={() => setModelScale(1)}
                    className="text-xs text-gray-400 hover:text-white transition-colors text-left"
                  >
                    ↺ Сбросить масштаб
                  </button>
                </div>

                {/* Сброс настроек */}
                <button
                  onClick={() => setSettings(DEFAULT_SETTINGS)}
                  className="mt-auto text-xs text-gray-500 hover:text-red-400 transition-colors text-center py-2"
                >
                  Сбросить все настройки
                </button>
              </>}

              {/* ── TAB: Конвертация ─────────────────────────── */}
              {activeTab === "convert" && <>
                <div>
                  <p className="text-gray-500 text-xs mb-2 uppercase tracking-wider">Детализация</p>
                  <SettingSlider
                    label="Полигонов"
                    value={localConvert.polycount}
                    min={5000} max={100000} step={5000}
                    onChange={v => setLocalConvert(p => ({ ...p, polycount: v }))}
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Быстро</span><span>Детально</span>
                  </div>
                </div>

                <div>
                  <p className="text-gray-500 text-xs mb-2 uppercase tracking-wider">Топология сетки</p>
                  <div className="flex gap-2">
                    {(["quad", "triangle"] as const).map(t => (
                      <button
                        key={t}
                        onClick={() => setLocalConvert(p => ({ ...p, topology: t }))}
                        className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all
                          ${localConvert.topology === t ? "bg-red-500 text-white" : "bg-white/10 text-gray-400 hover:bg-white/15"}`}
                      >
                        {t === "quad" ? "Квады" : "Треуголь."}
                      </button>
                    ))}
                  </div>
                  <p className="text-gray-500 text-xs mt-1">
                    {localConvert.topology === "quad" ? "Лучше для органических форм" : "Лучше для технических деталей"}
                  </p>
                </div>

                <div>
                  <p className="text-gray-500 text-xs mb-2 uppercase tracking-wider">Физический материал</p>
                  <button
                    onClick={() => setLocalConvert(p => ({ ...p, enablePbr: !p.enablePbr }))}
                    className={`w-full py-2 rounded-xl text-xs font-semibold transition-all
                      ${localConvert.enablePbr ? "bg-red-500 text-white" : "bg-white/10 text-gray-400 hover:bg-white/15"}`}
                  >
                    PBR-текстуры {localConvert.enablePbr ? "включены" : "выключены"}
                  </button>
                  <p className="text-gray-500 text-xs mt-1">Дольше, но более реалистичный результат</p>
                </div>

                {onRegenerate && (
                  <button
                    onClick={() => { onRegenerate(localConvert); onClose() }}
                    className="mt-auto flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white text-sm font-bold px-4 py-3 rounded-xl transition-colors"
                  >
                    <Icon name="RefreshCw" size={15} />
                    Перегенерировать
                  </button>
                )}
              </>}

            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-white/10 flex-shrink-0">
          <p className="text-gray-500 text-xs">Модель создана с помощью Meshy.ai</p>
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
