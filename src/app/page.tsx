"use client"

import { useState, useEffect, useRef } from "react"
import { Home, Bell, Moon, Loader2, Smile, Meh, Frown, AlertTriangle } from "lucide-react"

const RADIUS = 90
const CIRCUMFERENCE = 2 * Math.PI * RADIUS
const ZONE_MAX_BAC = 0.08

const MINI_RADIUS = 32
const MINI_CIRCUMFERENCE = 2 * Math.PI * MINI_RADIUS

const HEALTH_STATS = [
  { label: "Heart Rate",       value: "80",    unit: "bpm", status: "Healthy"     },
  { label: "HRV",              value: "116",   unit: "ms",  status: "Healthy"     },
  { label: "SpO2",             value: "98",    unit: "%",   status: "Normal"      },
  { label: "Skin Temp",        value: "98.9",  unit: "°F",  status: "Normal"      },
  { label: "Resp. Rate",       value: "16",    unit: "rpm", status: "Normal"      },
  { label: "Motion",           value: "Low",   unit: "act", status: "Resting"     },
]

function getBacColor(bac: number): string {
  if (bac <= 0.04) return "#22c55e"
  if (bac <= 0.06) return "#eab308"
  if (bac < ZONE_MAX_BAC) return "#f97316"
  return "#ef4444"
}

function getBacStatus(bac: number): string {
  if (bac <= 0.04) return "Feeling good"
  if (bac <= 0.06) return "Take it easy"
  if (bac < ZONE_MAX_BAC) return "Slow down"
  return "Time to stop"
}

function getZoneIcon(bac: number, size: number) {
  if (bac <= 0.04) return <Smile size={size} strokeWidth={1.5} color="#22c55e" />
  if (bac <= 0.06) return <Meh size={size} strokeWidth={1.5} color="#eab308" />
  if (bac < ZONE_MAX_BAC) return <Frown size={size} strokeWidth={1.5} color="#f97316" />
  return <AlertTriangle size={size} strokeWidth={1.5} color="#ef4444" />
}

function toZoneScore(bac: number): number {
  return Math.round((bac / ZONE_MAX_BAC) * 100)
}

function getZoneNumber(score: number): number {
  if (score <= 50) return 1
  if (score <= 75) return 2
  if (score < 100) return 3
  return 4
}

function getDateHeader(): string {
  const now = new Date()
  const day   = now.toLocaleDateString("en-US", { weekday: "long" })
  const month = now.toLocaleDateString("en-US", { month: "long" })
  const date  = now.getDate()
  return `${day}  ·  ${month} ${date}`
}

const ICON_SIZE_BREAKPOINTS: [number, number][] = [
  [360, 88],
  [375, 92],
  [390, 100],
  [414, 108],
  [430, 116],
]

function interpolateIconSize(w: number): number {
  if (w <= ICON_SIZE_BREAKPOINTS[0][0]) return ICON_SIZE_BREAKPOINTS[0][1]
  const last = ICON_SIZE_BREAKPOINTS[ICON_SIZE_BREAKPOINTS.length - 1]
  if (w >= last[0]) return last[1]
  for (let i = 0; i < ICON_SIZE_BREAKPOINTS.length - 1; i++) {
    const [x0, y0] = ICON_SIZE_BREAKPOINTS[i]
    const [x1, y1] = ICON_SIZE_BREAKPOINTS[i + 1]
    if (w >= x0 && w <= x1) {
      return Math.round(y0 + ((w - x0) / (x1 - x0)) * (y1 - y0))
    }
  }
  return 100
}

function useZoneIconSize(): number {
  const [size, setSize] = useState(100)
  useEffect(() => {
    function calc() {
      setSize(interpolateIconSize(window.innerWidth))
    }
    calc()
    window.addEventListener("resize", calc)
    return () => window.removeEventListener("resize", calc)
  }, [])
  return size
}

export default function Dashboard() {
  const [bac, setBac] = useState(0)
  const [simulating, setSimulating] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const iconSize = useZoneIconSize()

  function simulateNight() {
    if (simulating) return
    setBac(0)
    setSimulating(true)

    const startBac = 0
    const endBac = 0.12       // 150% zone score
    const totalSteps = 450    // 450 steps × 200ms = 90 seconds
    const stepDuration = 200
    const increment = (endBac - startBac) / totalSteps
    let step = 0

    intervalRef.current = setInterval(() => {
      step++
      setBac(Math.round((startBac + increment * step) * 1000) / 1000)
      if (step >= totalSteps) {
        clearInterval(intervalRef.current!)
        setSimulating(false)
      }
    }, stepDuration)
  }

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  const deviceConnected = true
  const [showIntegrations, setShowIntegrations] = useState(false)
  const color     = getBacColor(bac)
  const status    = getBacStatus(bac)
  const isOverLimit = bac > ZONE_MAX_BAC
  const zoneScore = toZoneScore(bac)
  const dashOffset = CIRCUMFERENCE * (1 - Math.min(bac / ZONE_MAX_BAC, 1))

  return (
    <div className="min-h-svh bg-[oklch(20.8%_0.042_265.755)] text-white flex flex-col w-full pb-24">
      <style>{`
        @keyframes zoneAlert {
          0%, 100% { opacity: 0.3; }
          50%       { opacity: 1; }
        }
        .scrollbar-none::-webkit-scrollbar { display: none; }
        .scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 sm:px-6 pt-8 sm:pt-10 pb-4">
        <img src="/assets/buzzd-logo.svg" alt="buzzd" className="h-5 w-auto sm:h-6 md:h-7" />
        <div
          className="flex items-center gap-1.5 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full px-3 sm:px-4 py-1 sm:py-2 cursor-pointer"
          onClick={() => { setShowIntegrations(true); console.log("integrations") }}
        >
          <span className="size-2 rounded-full animate-pulse" style={{ backgroundColor: deviceConnected ? "#22c55e" : "#ef4444" }} />
          <span className="text-xs sm:text-sm text-white/70 font-medium" style={{ fontFamily: 'Aeonik, sans-serif' }}>
            {deviceConnected ? "Devices Connected" : "Devices Disconnected"}
          </span>
        </div>
      </div>

      {/* Date Header */}
      <p className="font-aeonik px-4 sm:px-6 pt-1 pb-3 text-sm sm:text-base text-white/50 font-medium" style={{ fontFamily: 'Aeonik, sans-serif' }}>
        {getDateHeader()}
      </p>

      {/* Scrollable main content */}
      <div className="flex flex-1 flex-col min-h-0 overflow-y-auto scrollbar-none">

        {/* Zone Gauge section */}
        <div className="flex flex-col items-center px-4 sm:px-6 pt-2 pb-6">
          <p className="font-righteous text-2xl sm:text-3xl font-bold tracking-widest uppercase text-center mb-8 sm:mb-10" style={{ color: '#FFBB00' }}>
            Your Zone
          </p>

          {/* Ring */}
          <div className="relative inline-flex items-center justify-center overflow-hidden rounded-full">
            <svg
              className="w-[72vw] h-[72vw] max-w-[340px] max-h-[340px]"
              viewBox="0 0 200 200"
              aria-hidden="true"
            >
              <defs>
                <filter id="arcGlow" x="-15%" y="-15%" width="130%" height="130%">
                  <feGaussianBlur stdDeviation="3.5" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <filter id="arcGlowAlert" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="7" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Track */}
              <circle cx="100" cy="100" r={RADIUS} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="20" strokeLinecap="round" />

              {/* Alert pulse layer */}
              {isOverLimit && (
                <circle
                  cx="100" cy="100" r={RADIUS}
                  fill="none" stroke="#ef4444" strokeWidth="24"
                  strokeLinecap="round"
                  strokeDasharray={CIRCUMFERENCE} strokeDashoffset={0}
                  transform="rotate(-90, 100, 100)"
                  filter="url(#arcGlowAlert)"
                  style={{ animation: "zoneAlert 1.2s ease-in-out infinite" }}
                />
              )}

              {/* Progress arc */}
              <circle
                cx="100" cy="100" r={RADIUS}
                fill="none" stroke={color} strokeWidth="20"
                strokeLinecap="round"
                strokeDasharray={CIRCUMFERENCE} strokeDashoffset={dashOffset}
                transform="rotate(-90, 100, 100)"
                filter="url(#arcGlow)"
                style={{ transition: "stroke-dashoffset 0.25s ease, stroke 0.4s ease" }}
              />
            </svg>

            {/* Center: zone icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              {getZoneIcon(bac, iconSize)}
            </div>
          </div>

          {/* Zone label + status below the ring */}
          <div className="flex flex-col items-center gap-1 mt-6 sm:mt-10">
            <span
              className="font-righteous text-lg sm:text-xl font-bold tracking-wide"
              style={{ color }}
            >
              Zone {getZoneNumber(zoneScore)} · {zoneScore}%
            </span>
            <span className="font-aeonik text-sm sm:text-base text-white/60 text-center" style={{ fontFamily: 'Aeonik, sans-serif' }}>
              {status}
            </span>
          </div>
        </div>

        {/* Health Stats */}
        <div className="pb-6">
          <p className="font-righteous text-lg font-bold tracking-widest px-4 sm:px-6 mb-3" style={{ color: '#FFBB00' }}>HEALTH STATS</p>
          <div className="flex overflow-x-auto gap-3 px-4 sm:px-6 pb-1 scrollbar-none">
            {HEALTH_STATS.map((stat) => (
              <div
                key={stat.label}
                className="flex-shrink-0 rounded-2xl bg-white/5 backdrop-blur-sm p-4 flex flex-col items-center gap-2 min-w-[120px] border border-white/10 shadow-lg"
              >
                {/* Mini ring */}
                <div className="relative inline-flex items-center justify-center">
                  <svg width="80" height="80" viewBox="0 0 80 80" aria-hidden="true">
                    <circle cx="40" cy="40" r={MINI_RADIUS} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="7" strokeLinecap="round" />
                    <circle
                      cx="40" cy="40" r={MINI_RADIUS}
                      fill="none" stroke="#FFBB00" strokeOpacity="0.6" strokeWidth="7"
                      strokeLinecap="round"
                      strokeDasharray={MINI_CIRCUMFERENCE}
                      strokeDashoffset={0}
                      transform="rotate(-90, 40, 40)"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="font-aeonik text-sm font-extrabold text-white/70 leading-none" style={{ fontFamily: 'Aeonik, sans-serif' }}>{stat.value}</span>
                    <span className="font-aeonik text-[10px] text-white/30 leading-none mt-0.5" style={{ fontFamily: 'Aeonik, sans-serif' }}>{stat.unit}</span>
                  </div>
                </div>
                <span className="font-aeonik text-xs font-medium text-white/60 text-center" style={{ fontFamily: 'Aeonik, sans-serif' }}>{stat.label}</span>
                <span className="font-aeonik text-xs text-white/40" style={{ fontFamily: 'Aeonik, sans-serif' }}>{stat.status}</span>
              </div>
            ))}
          </div>
        </div>

      </div>{/* end scrollable content */}

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-[oklch(20.8%_0.042_265.755)]/95 backdrop-blur-sm">
        <div className="flex items-center justify-around py-3 sm:py-4 pb-7">
          <button className="flex flex-col items-center gap-1 transition-colors" style={{ color: "#FFBB00" }}>
            <Home className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          <button
            onClick={simulateNight}
            disabled={simulating}
            className="flex flex-col items-center gap-1 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span className="rounded-full bg-white/5 border border-white/20 p-3 text-white/40">
              {simulating
                ? <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" />
                : <Moon className="w-5 h-5 sm:w-6 sm:h-6" />
              }
            </span>
          </button>
          <button className="flex flex-col items-center gap-1 text-white/30 hover:text-white/60 transition-colors">
            <Bell className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>
      </nav>
    </div>
  )
}
