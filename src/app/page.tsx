"use client"

import { useState, useEffect, useRef } from "react"
import { Loader2, Smile, Meh, Frown, AlertTriangle, Check } from "lucide-react"

const RADIUS = 90
const CIRCUMFERENCE = 2 * Math.PI * RADIUS
const ZONE_MAX_BAC = 0.08

const MINI_RADIUS = 32
const MINI_CIRCUMFERENCE = 2 * Math.PI * MINI_RADIUS

// ─── Alert trigger thresholds (zone score %) ─────────────────────────────────
const ALERT_THRESHOLDS = [51, 76, 100] as const

// ─── Shared types ─────────────────────────────────────────────────────────────
export type AlertLog = {
  id: string
  zone: number
  zoneScore: number
  triggeredAt: string
  dismissedAt: string
  actionsSelected: string[]
}

// ─── Health stats helpers ─────────────────────────────────────────────────────
function lerpVal(a: number, b: number, t: number): number {
  return a + (b - a) * Math.min(Math.max(t, 0), 1)
}

type HealthStat = { label: string; value: string; unit: string; status: string; color: string }

function statColor(val: number, thresholds: [number, string][]): string {
  for (const [limit, color] of thresholds) if (val <= limit) return color
  return thresholds[thresholds.length - 1][1]
}

function statusLabel(color: string, defaultGreen = "Healthy", defaultYellow = "Elevated"): string {
  if (color === "#22c55e") return defaultGreen
  if (color === "#eab308") return defaultYellow
  if (color === "#f97316") return "Concerning"
  return "Dangerous"
}

function computeHealthStats(score: number): HealthStat[] {
  const t = score / 150
  const hr = Math.round(lerpVal(68, 125, t))
  const hrColor = hr <= 90 ? "#22c55e" : hr <= 110 ? "#eab308" : hr <= 130 ? "#f97316" : "#ef4444"
  const hrv = Math.round(lerpVal(95, 28, t))
  const hrvColor = hrv >= 80 ? "#22c55e" : hrv >= 50 ? "#eab308" : hrv >= 30 ? "#f97316" : "#ef4444"
  const spo2 = Math.round(lerpVal(99, 92, t))
  const spo2Color = spo2 >= 97 ? "#22c55e" : spo2 >= 94 ? "#eab308" : spo2 >= 91 ? "#f97316" : "#ef4444"
  const tempNum = Math.round(lerpVal(981, 1018, t)) / 10
  const tempColor = statColor(tempNum, [[98.99, "#22c55e"], [100.49, "#eab308"], [101.99, "#f97316"], [999, "#ef4444"]])
  const rr = Math.round(lerpVal(13, 26, t))
  const rrColor = rr <= 18 ? "#22c55e" : rr <= 22 ? "#eab308" : rr <= 26 ? "#f97316" : "#ef4444"
  return [
    { label: "Heart Rate", value: String(hr),     unit: "bpm", status: statusLabel(hrColor),                         color: hrColor  },
    { label: "HRV",        value: String(hrv),     unit: "ms",  status: statusLabel(hrvColor, "Healthy", "Declining"), color: hrvColor },
    { label: "Blood O₂",   value: String(spo2),    unit: "%",   status: statusLabel(spo2Color, "Normal", "Declining"), color: spo2Color },
    { label: "Temp",       value: String(tempNum), unit: "°F",  status: statusLabel(tempColor, "Normal"),              color: tempColor },
    { label: "Breathing",  value: String(rr),      unit: "rpm", status: statusLabel(rrColor, "Normal"),                color: rrColor  },
  ]
}

// ─── Zone helpers ─────────────────────────────────────────────────────────────
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

// ─── Icon size hook ───────────────────────────────────────────────────────────
const ICON_SIZE_BREAKPOINTS: [number, number][] = [
  [360, 88], [375, 92], [390, 100], [414, 108], [430, 116],
]

function interpolateIconSize(w: number): number {
  if (w <= ICON_SIZE_BREAKPOINTS[0][0]) return ICON_SIZE_BREAKPOINTS[0][1]
  const last = ICON_SIZE_BREAKPOINTS[ICON_SIZE_BREAKPOINTS.length - 1]
  if (w >= last[0]) return last[1]
  for (let i = 0; i < ICON_SIZE_BREAKPOINTS.length - 1; i++) {
    const [x0, y0] = ICON_SIZE_BREAKPOINTS[i]
    const [x1, y1] = ICON_SIZE_BREAKPOINTS[i + 1]
    if (w >= x0 && w <= x1) return Math.round(y0 + ((w - x0) / (x1 - x0)) * (y1 - y0))
  }
  return 100
}

function useZoneIconSize(): number {
  const [size, setSize] = useState(100)
  useEffect(() => {
    function calc() { setSize(interpolateIconSize(window.innerWidth)) }
    calc()
    window.addEventListener("resize", calc)
    return () => window.removeEventListener("resize", calc)
  }, [])
  return size
}

// ─── Math problem generator ───────────────────────────────────────────────────
function generateMathProblem(): { question: string; answer: number } {
  const ops = [
    { a: Math.floor(Math.random() * 10) + 5, b: Math.floor(Math.random() * 10) + 5, op: "+" },
    { a: Math.floor(Math.random() * 10) + 10, b: Math.floor(Math.random() * 10) + 1, op: "-" },
    { a: Math.floor(Math.random() * 5) + 2, b: Math.floor(Math.random() * 5) + 2, op: "×" },
  ]
  const choice = ops[Math.floor(Math.random() * ops.length)]
  const answer = choice.op === "+" ? choice.a + choice.b
                : choice.op === "-" ? choice.a - choice.b
                : choice.a * choice.b
  return { question: `${choice.a} ${choice.op} ${choice.b}`, answer }
}

// ─── Alert Overlay Components ─────────────────────────────────────────────────

type AlertBaseProps = {
  zoneColor: string
  onDismiss: (actions: string[]) => void
}

function Zone12Alert({ zoneColor, onDismiss }: AlertBaseProps) {
  const [selected, setSelected] = useState<string | null>(null)
  const actions = ["I drank water", "Switching to zero proof", "I'm good"]
  return (
    <AlertShell zoneColor={zoneColor} heading="You're entering Zone 2." subtext="Time to slow down.">
      <div className="flex flex-col gap-3 w-full">
        {actions.map(a => (
          <ActionButton key={a} label={a} zoneColor={zoneColor} checked={selected === a}
            onClick={() => { setSelected(a); setTimeout(() => onDismiss([a]), 300) }} />
        ))}
      </div>
    </AlertShell>
  )
}

function Zone23Alert({ zoneColor, onDismiss }: AlertBaseProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const required = ["I drank water", "Switching to zero proof"]
  const toggle = (a: string) => setSelected(prev => { const s = new Set(prev); s.has(a) ? s.delete(a) : s.add(a); return s })
  const canDismiss = required.every(a => selected.has(a))
  return (
    <AlertShell zoneColor={zoneColor} heading="You're entering Zone 3." subtext="Your body is feeling it.">
      <div className="flex flex-col gap-3 w-full">
        {required.map(a => (
          <ActionButton key={a} label={a} zoneColor={zoneColor} checked={selected.has(a)} onClick={() => toggle(a)} />
        ))}
      </div>
      <DismissButton zoneColor={zoneColor} disabled={!canDismiss}
        onClick={() => onDismiss([...selected])} />
    </AlertShell>
  )
}

function Zone34Alert({ zoneColor, onDismiss }: AlertBaseProps) {
  const [mathProblem, setMathProblem] = useState<{ question: string; answer: number } | null>(null)
  const [mathInput, setMathInput] = useState("")
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const required = ["I drank water", "Calling a ride", "Getting help"]
  const toggle = (a: string) => setSelected(prev => { const s = new Set(prev); s.has(a) ? s.delete(a) : s.add(a); return s })

  useEffect(() => { setMathProblem(generateMathProblem()) }, [])

  const mathCorrect = mathProblem !== null && parseInt(mathInput.trim(), 10) === mathProblem.answer
  const canDismiss = mathCorrect && required.every(a => selected.has(a))
  return (
    <AlertShell zoneColor={zoneColor} heading="You're entering Zone 4." subtext="You need to stop now.">
      {/* Math challenge */}
      <div className="w-full rounded-2xl border border-white/10 bg-white/5 p-4 mb-1">
        <p className="text-white/60 text-xs mb-2 text-center" style={{ fontFamily: 'Aeonik, sans-serif' }}>
          Solve this to continue
        </p>
        {mathProblem ? (
          <>
            <p className="font-righteous text-2xl text-white text-center mb-3">
              What is {mathProblem.question}?
            </p>
            <input
              type="number"
              inputMode="numeric"
              value={mathInput}
              onChange={e => setMathInput(e.target.value)}
              placeholder="Your answer"
              className="w-full bg-white/10 border rounded-xl px-4 py-2 text-white text-center text-lg outline-none placeholder-white/30"
              style={{
                borderColor: mathInput && mathCorrect ? zoneColor : mathInput ? '#ef4444' : 'rgba(255,255,255,0.15)',
                fontFamily: 'Aeonik, sans-serif',
              }}
            />
            {mathInput && !mathCorrect && (
              <p className="text-[#ef4444] text-xs text-center mt-1" style={{ fontFamily: 'Aeonik, sans-serif' }}>Not quite — try again</p>
            )}
            {mathCorrect && (
              <p className="text-[#22c55e] text-xs text-center mt-1" style={{ fontFamily: 'Aeonik, sans-serif' }}>✓ Correct</p>
            )}
          </>
        ) : (
          <div className="h-[88px]" />
        )}
      </div>
      {/* Actions */}
      <div className="flex flex-col gap-3 w-full">
        {required.map(a => (
          <ActionButton key={a} label={a} zoneColor={zoneColor} checked={selected.has(a)} onClick={() => toggle(a)} />
        ))}
      </div>
      <DismissButton zoneColor={zoneColor} disabled={!canDismiss}
        onClick={() => onDismiss([...selected])} />
    </AlertShell>
  )
}

// ─── Shared sub-components ────────────────────────────────────────────────────

function AlertShell({ zoneColor, heading, subtext, children }: {
  zoneColor: string; heading: string; subtext: string; children: React.ReactNode
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center px-6 py-10"
      style={{ background: `radial-gradient(ellipse at center, ${zoneColor}22 0%, oklch(20.8% 0.042 265.755) 70%)` }}
    >
      <style>{`
        @keyframes alertPulse {
          0%, 100% { box-shadow: 0 0 0 0 ${zoneColor}55; }
          50%       { box-shadow: 0 0 0 16px ${zoneColor}00; }
        }
        .alert-ring { animation: alertPulse 2s ease-in-out infinite; }
      `}</style>

      {/* Pulsing border ring */}
      <div
        className="alert-ring w-full max-w-sm rounded-3xl border-2 p-6 flex flex-col items-center gap-5"
        style={{
          borderColor: zoneColor,
          background: 'rgba(255,255,255,0.04)',
          backdropFilter: 'blur(16px)',
        }}
      >
        {/* Zone color dot */}
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: zoneColor, boxShadow: `0 0 12px ${zoneColor}` }} />

        {/* Heading */}
        <p className="font-righteous text-xl sm:text-2xl text-white text-center leading-tight tracking-wide">
          {heading}
        </p>

        {/* Subtext */}
        <p className="text-white/60 text-sm sm:text-base text-center" style={{ fontFamily: 'Aeonik, sans-serif' }}>
          {subtext}
        </p>

        {children}
      </div>
    </div>
  )
}

function ActionButton({ label, zoneColor, checked, onClick }: {
  label: string; zoneColor: string; checked: boolean; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all cursor-pointer"
      style={{
        borderColor: checked ? zoneColor : 'rgba(255,255,255,0.15)',
        backgroundColor: checked ? `${zoneColor}22` : 'rgba(255,255,255,0.04)',
        fontFamily: 'Aeonik, sans-serif',
        color: checked ? '#ffffff' : 'rgba(255,255,255,0.7)',
      }}
    >
      <span className="text-sm font-medium">{label}</span>
      {checked && <Check size={16} color={zoneColor} strokeWidth={2.5} />}
    </button>
  )
}

function DismissButton({ zoneColor, disabled, onClick }: {
  zoneColor: string; disabled: boolean; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full py-3 rounded-xl font-righteous text-sm tracking-widest transition-all"
      style={{
        backgroundColor: disabled ? 'rgba(255,255,255,0.08)' : zoneColor,
        color: disabled ? 'rgba(255,255,255,0.3)' : '#000000',
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      {disabled ? "COMPLETE ALL STEPS" : "I UNDERSTAND"}
    </button>
  )
}

// ─── Alert log helpers (used by inline alerts tab) ───────────────────────────
const ZONE_COLORS: Record<number, string> = { 1: "#eab308", 2: "#f97316", 3: "#ef4444" }
const ZONE_LABELS: Record<number, string> = { 1: "Zone 2 Alert", 2: "Zone 3 Alert", 3: "Zone 4 Alert" }
function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
}
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<"home" | "alerts">("home")
  const [bac, setBac] = useState(0)
  const [simulating, setSimulating] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const stepRef = useRef(0)
  const iconSize = useZoneIconSize()

  // Alert state
  const [activeAlert, setActiveAlert] = useState<1 | 2 | 3 | null>(null)
  const alertsFiredRef = useRef<Set<number>>(new Set())
  const [alertLogs, setAlertLogs] = useState<AlertLog[]>([])
  const alertTriggerScoreRef = useRef<number>(0)
  const alertTriggerTimeRef = useRef<string>("")

  // Simulation core — increment bac, check thresholds
  function tick(bacRef: React.MutableRefObject<number>) {
    const endBac = 0.12
    const totalSteps = 450
    const increment = endBac / totalSteps

    stepRef.current++
    const next = Math.round((increment * stepRef.current) * 1000) / 1000
    setBac(next)
    bacRef.current = next

    const score = toZoneScore(next)

    // Check each threshold exactly once
    for (const threshold of ALERT_THRESHOLDS) {
      if (!alertsFiredRef.current.has(threshold) && score >= threshold) {
        alertsFiredRef.current.add(threshold)
        clearInterval(intervalRef.current!)
        intervalRef.current = null
        alertTriggerScoreRef.current = score
        alertTriggerTimeRef.current = new Date().toISOString()
        const alertNum = threshold === 51 ? 1 : threshold === 76 ? 2 : 3
        setActiveAlert(alertNum as 1 | 2 | 3)
        return
      }
    }

    if (stepRef.current >= totalSteps) {
      clearInterval(intervalRef.current!)
      intervalRef.current = null
      setSimulating(false)
    }
  }

  function startInterval(bacRef: React.MutableRefObject<number>) {
    intervalRef.current = setInterval(() => tick(bacRef), 200)
  }

  function simulateNight() {
    if (simulating) return
    setBac(0)
    stepRef.current = 0
    alertsFiredRef.current = new Set()
    setSimulating(true)
    const bacRef = { current: 0 }
    startInterval(bacRef)
  }

  function handleAlertDismiss(actions: string[]) {
    const now = new Date().toISOString()
    const score = alertTriggerScoreRef.current
    const log: AlertLog = {
      id: crypto.randomUUID(),
      zone: activeAlert!,
      zoneScore: score,
      triggeredAt: alertTriggerTimeRef.current,
      dismissedAt: now,
      actionsSelected: actions,
    }
    setAlertLogs(prev => [log, ...prev])

    // Save to localStorage for the alerts page
    try {
      const existing = JSON.parse(localStorage.getItem("buzzd_alert_logs") ?? "[]") as AlertLog[]
      localStorage.setItem("buzzd_alert_logs", JSON.stringify([log, ...existing]))
    } catch { /* ignore */ }

    setActiveAlert(null)

    // 8-second stabilization hold then resume
    setTimeout(() => {
      const bacRef = { current: 0 }
      startInterval(bacRef)
    }, 8000)
  }

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [])

  const deviceConnected = true
  const [showIntegrations, setShowIntegrations] = useState(false)
  const color = getBacColor(bac)
  const status = getBacStatus(bac)
  const isOverLimit = bac > ZONE_MAX_BAC
  const zoneScore = toZoneScore(bac)
  const dashOffset = CIRCUMFERENCE * (1 - Math.min(bac / ZONE_MAX_BAC, 1))

  // Alert overlay colors
  const alertZoneColor = activeAlert === 1 ? "#eab308" : activeAlert === 2 ? "#f97316" : "#ef4444"

  return (
    <div className="h-[100dvh] bg-[oklch(20.8%_0.042_265.755)] text-white flex flex-col w-full">
      <style>{`
        @keyframes zoneAlert {
          0%, 100% { opacity: 0.3; }
          50%       { opacity: 1; }
        }
        .scrollbar-none::-webkit-scrollbar { display: none; }
        .scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* ── Alert Overlays — always mounted, faded in/out to prevent flicker ── */}
      <div className={`transition-opacity duration-200 ${activeAlert === 1 ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
        <Zone12Alert zoneColor="#eab308" onDismiss={handleAlertDismiss} />
      </div>
      <div className={`transition-opacity duration-200 ${activeAlert === 2 ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
        <Zone23Alert zoneColor="#f97316" onDismiss={handleAlertDismiss} />
      </div>
      <div className={`transition-opacity duration-200 ${activeAlert === 3 ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
        <Zone34Alert zoneColor="#ef4444" onDismiss={handleAlertDismiss} />
      </div>

      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 sm:px-6 pt-8 sm:pt-10 pb-4 border-b border-[#FFBB00]/30">
        <img src="/assets/buzzd-logo.svg" alt="buzzd" className="h-5 w-auto sm:h-6 md:h-7" loading="eager" fetchPriority="high" />
        <div
          className="flex items-center gap-1.5 bg-white/5 backdrop-blur-sm border border-[#FFBB00]/30 rounded-full px-3 sm:px-4 py-1 sm:py-2 cursor-pointer"
          onClick={() => { setShowIntegrations(true); console.log("integrations") }}
        >
          <span className="size-2 rounded-full animate-pulse" style={{ backgroundColor: deviceConnected ? "#22c55e" : "#ef4444" }} />
          <span className="text-xs sm:text-sm text-white/70 font-medium" style={{ fontFamily: 'Aeonik, sans-serif' }}>
            {deviceConnected ? "Devices Connected" : "Devices Disconnected"}
          </span>
        </div>
      </div>

      {/* ── Home Tab Content ───────────────────────────────────────────────── */}
      <div className={`flex-1 overflow-y-auto scrollbar-none flex flex-col pb-4 ${activeTab === "home" ? "flex" : "hidden"}`}>

        {/* Date Header */}
        <p className="font-aeonik px-4 sm:px-6 pt-1 pb-3 text-sm sm:text-base font-normal" style={{ fontFamily: 'Aeonik, sans-serif', color: '#ffffff' }}>
          {getDateHeader()}
        </p>

        {/* Zone Gauge section */}
        <div className="flex flex-col items-center px-4 sm:px-6 pt-2 pb-6">
          <p className="font-righteous text-2xl sm:text-3xl font-bold tracking-widest uppercase text-center mb-8 sm:mb-10" style={{ color: '#ffffff' }}>
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
                  <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
                <filter id="arcGlowAlert" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="7" result="blur" />
                  <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
              </defs>
              <circle cx="100" cy="100" r={RADIUS} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="20" strokeLinecap="round" />
              {isOverLimit && (
                <circle cx="100" cy="100" r={RADIUS} fill="none" stroke="#ef4444" strokeWidth="24"
                  strokeLinecap="round" strokeDasharray={CIRCUMFERENCE} strokeDashoffset={0}
                  transform="rotate(-90, 100, 100)" filter="url(#arcGlowAlert)"
                  style={{ animation: "zoneAlert 1.2s ease-in-out infinite" }} />
              )}
              <circle cx="100" cy="100" r={RADIUS} fill="none" stroke={color} strokeWidth="20"
                strokeLinecap="round" strokeDasharray={CIRCUMFERENCE} strokeDashoffset={dashOffset}
                transform="rotate(-90, 100, 100)" filter="url(#arcGlow)"
                style={{ transition: "stroke-dashoffset 0.25s ease, stroke 0.4s ease" }} />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              {getZoneIcon(bac, iconSize)}
            </div>
          </div>

          {/* Zone label + status */}
          <div className="flex flex-col items-center gap-1 mt-6 sm:mt-10">
            <span className="font-righteous text-lg sm:text-xl font-bold tracking-wide" style={{ color }}>
              Zone {getZoneNumber(zoneScore)} · {zoneScore}%
            </span>
            <span className="font-aeonik text-sm sm:text-base text-white/60 text-center" style={{ fontFamily: 'Aeonik, sans-serif' }}>
              {status}
            </span>
          </div>
        </div>

        {/* Health Stats */}
        <div className="pb-6">
          <p className="font-righteous text-lg font-bold tracking-widest px-4 sm:px-6 mb-3" style={{ color: '#ffffff' }}>HEALTH STATS</p>
          <div className="flex overflow-x-auto gap-3 px-4 sm:px-6 pb-1 scrollbar-none">
            {computeHealthStats(zoneScore).map((stat) => (
              <div
                key={stat.label}
                className="flex-shrink-0 rounded-2xl bg-white/5 backdrop-blur-sm p-4 flex flex-col items-center gap-2 min-w-[120px] border border-[#FFBB00]/30 shadow-lg"
              >
                <div className="relative inline-flex items-center justify-center">
                  <svg width="80" height="80" viewBox="0 0 80 80" aria-hidden="true">
                    <circle cx="40" cy="40" r={MINI_RADIUS} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="7" strokeLinecap="round" />
                    <circle cx="40" cy="40" r={MINI_RADIUS} fill="none" stroke={stat.color} strokeOpacity="0.8" strokeWidth="7"
                      strokeLinecap="round" strokeDasharray={MINI_CIRCUMFERENCE} strokeDashoffset={0}
                      transform="rotate(-90, 40, 40)" style={{ transition: "stroke 0.4s ease" }} />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    {stat.value === "V.High"
                      ? <AlertTriangle size={20} color={stat.color} strokeWidth={2} />
                      : <span className="font-aeonik text-sm font-extrabold leading-none" style={{ fontFamily: 'Aeonik, sans-serif', color: stat.color }}>{stat.value}</span>
                    }
                    {stat.value !== "V.High" && <span className="font-aeonik text-[10px] text-white/30 leading-none" style={{ fontFamily: 'Aeonik, sans-serif', marginTop: '3px' }}>{stat.unit}</span>}
                  </div>
                </div>
                <span className="font-aeonik text-xs font-medium text-white/60 text-center" style={{ fontFamily: 'Aeonik, sans-serif' }}>{stat.label}</span>
                <span className="font-aeonik text-xs text-white/40" style={{ fontFamily: 'Aeonik, sans-serif' }}>{stat.status}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ── Alerts Tab Content ─────────────────────────────────────────────── */}
      <div className={`flex-1 overflow-y-auto scrollbar-none flex flex-col pb-4 ${activeTab === "alerts" ? "flex" : "hidden"}`}>
        <p className="font-aeonik px-4 sm:px-6 pt-4 pb-3 text-sm sm:text-base font-normal" style={{ fontFamily: 'Aeonik, sans-serif', color: '#ffffff' }}>
          Alert History
        </p>
        {alertLogs.length === 0 ? (
          <div className="flex-1 flex items-center justify-center px-8">
            <p className="text-white/30 text-sm text-center" style={{ fontFamily: 'Aeonik, sans-serif' }}>
              No alerts yet. Stay in the green.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 px-4 sm:px-6 pt-2 pb-4">
            {alertLogs.map((log) => {
              const zoneColor = ZONE_COLORS[log.zone] ?? "#eab308"
              const zoneLabel = ZONE_LABELS[log.zone] ?? `Zone ${log.zone + 1} Alert`
              return (
                <div
                  key={log.id}
                  className="rounded-2xl border p-4 flex flex-col gap-3"
                  style={{ borderColor: `${zoneColor}40`, background: `${zoneColor}0a` }}
                >
                  {/* Header row */}
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: zoneColor, boxShadow: `0 0 6px ${zoneColor}` }} />
                    <span className="font-righteous text-sm tracking-wide text-white">{zoneLabel}</span>
                  </div>

                  {/* Timestamps */}
                  <div className="flex flex-col gap-0.5">
                    <p className="text-xs text-white/40" style={{ fontFamily: 'Aeonik, sans-serif' }}>
                      {formatDate(log.triggeredAt)} · Triggered {formatTime(log.triggeredAt)}
                    </p>
                    <p className="text-xs text-white/30" style={{ fontFamily: 'Aeonik, sans-serif' }}>
                      Dismissed {formatTime(log.dismissedAt)}
                    </p>
                  </div>

                  {/* Actions taken */}
                  {log.actionsSelected.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {log.actionsSelected.map((a) => (
                        <span
                          key={a}
                          className="text-xs px-2.5 py-1 rounded-full border"
                          style={{ fontFamily: 'Aeonik, sans-serif', borderColor: `${zoneColor}50`, color: zoneColor, backgroundColor: `${zoneColor}15` }}
                        >
                          {a}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Bottom Nav */}
      <nav className="flex-none border-t border-[#FFBB00]/30 bg-[oklch(20.8%_0.042_265.755)]/95 backdrop-blur-sm">
        <div className="flex items-center justify-around py-3 sm:py-4" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 12px)' }}>
          <button onClick={() => setActiveTab("home")} className="flex flex-col items-center gap-1 transition-colors">
            <svg width="24" height="24" viewBox="0 0 427 428" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="home">
              <path d="M212.433 0.00249199C213.308 -0.00450801 214.185 0.00323875 215.06 0.0257388C231.138 0.353239 246.92 4.41274 261.16 11.8842C274.93 19.1922 288.245 31.3315 300.418 41.3975L346.828 79.772L380.27 107.416C387.043 113.006 396.118 120.034 401.988 126.222C412.938 137.854 420.615 152.177 424.24 167.735C427.465 181.482 426.715 193.757 426.718 207.767V245.719L426.715 306.867C426.72 317.93 426.955 329.857 426.648 340.829C425.865 364.784 415.67 387.464 398.275 403.949C385.545 415.942 369.165 424.049 351.728 426.154C343.723 427.122 334.8 426.85 326.675 426.87C317.63 426.895 308.46 426.927 299.418 426.814C289.093 426.689 279.483 423.557 271.485 416.835C264.868 411.37 260.073 404.017 257.738 395.757C255.678 388.362 256.058 379.632 256.065 371.93L256.083 333.824C256.085 324.537 256.663 311.217 254.59 302.567C252.728 294.612 248.798 287.29 243.2 281.337C235.598 273.327 225.948 268.532 214.85 268.212C204.047 268.37 196.113 270.55 187.583 277.59C180.247 283.717 175.003 291.982 172.582 301.229C169.993 310.829 170.712 325.712 170.711 336.085L170.72 372.079C170.727 379.169 171.135 387.602 169.468 394.392C167.723 401.252 164.313 407.577 159.541 412.805C151.774 421.32 139.51 427.115 128.024 426.802C111.044 426.34 92.0044 427.989 75.2952 426.127C32.5494 421.367 0.437438 381.634 0.170938 339.417C0.103688 328.752 0.0724371 318.002 0.0716871 307.284L0.0674376 248.979V209.569C0.0676876 194.834 -0.686311 181.139 2.84194 166.731C6.59894 151.517 14.1957 137.521 24.9062 126.081C30.4272 120.213 39.3557 113.302 45.7682 108.013L78.1792 81.2145L125.723 41.9195C155.259 17.4877 171.82 1.30024 212.433 0.00249199Z" fill={activeTab === "home" ? "#FFBB00" : "rgba(255,255,255,0.3)"}/>
            </svg>
          </button>
          <button
            onClick={simulateNight}
            disabled={simulating || activeAlert !== null}
            className="flex flex-col items-center gap-1 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span className="rounded-full bg-white/5 border border-white/20 p-3 text-white/40">
              {simulating
                ? <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" />
                : <img src="/assets/pictorial-mark-white.svg" alt="simulate" className="w-5 h-5 sm:w-6 sm:h-6" loading="eager" fetchPriority="high" />
              }
            </span>
          </button>
          <button
            onClick={() => setActiveTab("alerts")}
            className="flex flex-col items-center gap-1 transition-colors relative cursor-pointer"
          >
            <svg width="24" height="24" viewBox="0 0 401 435" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="alerts"
              style={{ opacity: activeTab === "alerts" ? 1 : alertLogs.length > 0 ? 0.8 : 0.3 }}>
              <path d="M192.307 0.174721C225.243 -1.33788 255.654 6.96801 283.111 25.2001C293.011 31.7759 302.594 40.9399 310.531 49.723C335.808 77.7329 350.335 114.599 350.726 152.341C350.919 171.07 350.071 187.519 356.825 205.378C362.459 220.288 371.57 232.061 379.854 245.513C383.424 251.309 386.615 256.822 390.85 262.235C405.3 284.263 404.476 315.605 387.382 335.863C371.434 354.759 353.231 358.188 330.442 363.322C300.868 370.141 270.801 374.612 240.525 376.701C229.986 377.387 219.433 377.827 208.873 378.023C163.45 378.651 118.11 373.945 73.7838 364C56.3134 360.117 34.9807 356.094 21.4698 344.027C8.36351 332.322 1.48078 319.662 0.202851 301.85C-0.861005 287.019 2.22782 274.417 10.2232 261.899C11.9472 259.054 14.6723 256.42 16.2848 253.547C25.721 236.726 38.3003 222.038 44.6981 203.666C50.7052 186.416 50.1375 170.55 50.2413 152.605C50.489 109.682 69.3605 67.6813 101.15 38.8798C103.781 36.4947 106.163 33.7631 109 31.5652C133.75 12.3887 161.209 2.23516 192.307 0.174721Z" fill={activeTab === "alerts" ? "#FFBB00" : "rgba(255,255,255,1)"}/>
              <path d="M119.537 395.602C122.868 395.362 130.905 396.666 134.523 397.114C176.201 402.259 218.14 402.731 259.868 397.808C262.671 397.477 280.196 395.365 281.382 395.774L281.52 396.191C279.296 397.761 277.818 400.332 275.956 402.296C272.418 406.027 268.968 409.628 264.791 412.639C249.612 425.638 229.524 432.446 209.84 434.31C182.126 436.939 154.516 428.318 133.222 410.381C130.309 407.941 127.567 405.125 124.965 402.356C123.118 400.389 121.608 397.748 119.473 396.124L119.537 395.602Z" fill={activeTab === "alerts" ? "#FFBB00" : "rgba(255,255,255,1)"}/>
            </svg>
            {alertLogs.length > 0 && activeTab !== "alerts" && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#ef4444] flex items-center justify-center text-[9px] font-bold text-white">
                {alertLogs.length}
              </span>
            )}
          </button>
        </div>
      </nav>
    </div>
  )
}
