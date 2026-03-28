"use client"

import { useState, useEffect, useRef } from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Home, Bell, Users, Plus, Moon, Loader2 } from "lucide-react"

const RADIUS = 90
const CIRCUMFERENCE = 2 * Math.PI * RADIUS
// Zone score hits 100% at 0.08 BAC — ring is full at that point and beyond
const ZONE_MAX_BAC = 0.08

function getBacColor(bac: number): string {
  if (bac <= 0.05) return "#22c55e"
  if (bac <= 0.07) return "#eab308"
  if (bac <= 0.09) return "#f97316"
  return "#ef4444"
}

function getBacStatus(bac: number): string {
  if (bac <= 0.05) return "You're Good"
  if (bac <= 0.07) return "Slow Down"
  if (bac <= 0.09) return "Approaching Limit"
  return "Stop Now"
}

function toZoneScore(bac: number): number {
  return Math.round((bac / ZONE_MAX_BAC) * 100)
}

const FRIENDS = [
  { name: "Jamie", initial: "J", bac: 0.03 },
  { name: "Sam", initial: "S", bac: 0.07 },
  { name: "Riley", initial: "R", bac: 0.11 },
]

export default function Dashboard() {
  const [bac, setBac] = useState(0.04)
  const [simulating, setSimulating] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  function simulateNight() {
    if (simulating) return
    setSimulating(true)

    const startBac = 0.04
    const endBac = 0.12
    const totalSteps = 100
    const stepDuration = 5000 / totalSteps
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

  const color = getBacColor(bac)
  const status = getBacStatus(bac)
  const isOverLimit = bac > ZONE_MAX_BAC
  const zoneScore = toZoneScore(bac)
  // Ring fills to 100% at ZONE_MAX_BAC; clamp so it never exceeds full
  const dashOffset = CIRCUMFERENCE * (1 - Math.min(bac / ZONE_MAX_BAC, 1))

  return (
    <div className="min-h-svh bg-zinc-950 text-white flex flex-col w-full pb-24">
      <style>{`
        @keyframes zoneAlert {
          0%, 100% { opacity: 0.3; }
          50%       { opacity: 1; }
        }
      `}</style>

      {/* Top Bar */}
      <div className="flex items-center justify-between px-5 pt-14 pb-4">
        <div className="flex items-center gap-3">
          <Avatar size="lg" className="size-10">
            <AvatarFallback className="bg-zinc-700 text-white text-sm font-bold">
              A
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-[11px] text-zinc-500 leading-none mb-0.5">Good evening</p>
            <p className="text-sm font-semibold leading-none">Alex</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 rounded-full px-3 py-1.5">
          <span className="size-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[11px] text-zinc-300 font-medium">Device Connected</span>
        </div>
      </div>

      {/* Zone Gauge */}
      <div className="flex flex-col items-center px-5 pt-6 pb-2">
        <p className="text-[11px] text-zinc-500 tracking-widest uppercase font-semibold mb-8">
          Your Zone
        </p>

        <div className="relative inline-flex items-center justify-center overflow-hidden rounded-full">
          <svg
            className="w-64 h-64 sm:w-72 sm:h-72"
            viewBox="0 0 200 200"
            aria-hidden="true"
          >
            <defs>
              {/* Soft glow for normal state — blur follows the stroke shape, not the bounding box */}
              <filter id="arcGlow" x="-15%" y="-15%" width="130%" height="130%">
                <feGaussianBlur stdDeviation="3.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              {/* Stronger blur for the alert pulse layer */}
              <filter id="arcGlowAlert" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="7" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Track — no rotation needed, full circle */}
            <circle
              cx="100"
              cy="100"
              r={RADIUS}
              fill="none"
              stroke="#27272a"
              strokeWidth="11"
              strokeLinecap="round"
            />

            {/* Alert pulse layer — blurred duplicate that fades in/out behind the sharp arc */}
            {isOverLimit && (
              <circle
                cx="100"
                cy="100"
                r={RADIUS}
                fill="none"
                stroke="#ef4444"
                strokeWidth="14"
                strokeLinecap="round"
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={0}
                transform="rotate(-90, 100, 100)"
                filter="url(#arcGlowAlert)"
                style={{ animation: "zoneAlert 1.2s ease-in-out infinite" }}
              />
            )}

            {/* Progress arc */}
            <circle
              cx="100"
              cy="100"
              r={RADIUS}
              fill="none"
              stroke={color}
              strokeWidth="11"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={dashOffset}
              transform="rotate(-90, 100, 100)"
              filter="url(#arcGlow)"
              style={{ transition: "stroke-dashoffset 0.25s ease, stroke 0.4s ease" }}
            />
          </svg>

          {/* Center labels */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
            <span
              className="text-6xl font-extrabold tabular-nums tracking-tight leading-none"
              style={{ color, transition: "color 0.4s ease" }}
            >
              {zoneScore}%
            </span>
            <span
              className="text-base font-bold mt-2"
              style={{ color, transition: "color 0.4s ease" }}
            >
              {status}
            </span>
          </div>
        </div>

      </div>

      {/* Divider */}
      <div className="px-5 py-5">
        <Separator className="bg-zinc-800" />
      </div>

      {/* Friends Row */}
      <div className="px-5">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-semibold">Friends</span>
          <span className="text-[11px] text-zinc-500">3 online</span>
        </div>

        <div className="flex items-center gap-5">
          {/* Add friend */}
          <div className="flex flex-col items-center gap-1.5">
            <button className="size-13 rounded-full border-2 border-dashed border-zinc-700 flex items-center justify-center text-zinc-500 hover:border-zinc-500 hover:text-zinc-400 transition-colors">
              <Plus size={18} />
            </button>
            <span className="text-[10px] text-zinc-600">Add</span>
          </div>

          {FRIENDS.map((friend) => {
            const friendColor = getBacColor(friend.bac)
            const friendScore = toZoneScore(friend.bac)
            return (
              <div key={friend.name} className="flex flex-col items-center gap-1.5">
                <div
                  className="size-13 rounded-full flex items-center justify-center text-sm font-extrabold bg-zinc-900"
                  style={{
                    boxShadow: `0 0 0 2.5px ${friendColor}, 0 0 10px ${friendColor}40`,
                    color: friendColor,
                  }}
                >
                  {friend.initial}
                </div>
                <span className="text-[10px] text-zinc-400 font-medium">{friend.name}</span>
                <span className="text-[10px] font-semibold" style={{ color: friendColor }}>
                  {friendScore}%
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Dev tool — Simulate Night (floating, bottom-left) */}
      <div className="group fixed bottom-6 right-6 z-50">
        <span className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-zinc-800 px-2.5 py-1 text-[11px] font-medium text-zinc-200 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
          Simulate Night
        </span>
        <button
          onClick={simulateNight}
          disabled={simulating}
          aria-label="Simulate Night"
          className="flex size-11 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900/90 text-zinc-400 shadow-lg backdrop-blur-sm transition-colors hover:border-zinc-500 hover:text-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {simulating
            ? <Loader2 size={16} className="animate-spin" />
            : <Moon size={16} />
          }
        </button>
      </div>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-zinc-800 bg-zinc-950/95 backdrop-blur-sm">
        <div className="flex items-center justify-around py-3 pb-7">
          <button className="flex flex-col items-center gap-1 text-white">
            <Home size={22} />
            <span className="text-[10px] font-semibold">Home</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-zinc-500 hover:text-zinc-300 transition-colors">
            <Bell size={22} />
            <span className="text-[10px]">Alerts</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-zinc-500 hover:text-zinc-300 transition-colors">
            <Users size={22} />
            <span className="text-[10px]">Friends</span>
          </button>
        </div>
      </nav>
    </div>
  )
}
