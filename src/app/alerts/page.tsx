"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import type { AlertLog } from "../page"

const ZONE_COLORS: Record<number, string> = {
  1: "#eab308",
  2: "#f97316",
  3: "#ef4444",
}

const ZONE_LABELS: Record<number, string> = {
  1: "Zone 1 → 2",
  2: "Zone 2 → 3",
  3: "Zone 3 → 4",
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
}

export default function AlertsPage() {
  const router = useRouter()
  const [logs, setLogs] = useState<AlertLog[]>([])

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("buzzd_alert_logs") ?? "[]") as AlertLog[]
      setLogs(stored)
    } catch { /* ignore */ }
  }, [])

  return (
    <div className="h-[100dvh] bg-[oklch(20.8%_0.042_265.755)] text-white flex flex-col w-full">
      <style>{`
        .scrollbar-none::-webkit-scrollbar { display: none; }
        .scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 sm:px-6 pt-8 sm:pt-10 pb-4 border-b border-[#FFBB00]/30">
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-2 cursor-pointer"
        >
          <img src="/assets/home-icon.svg" alt="back" className="h-5 w-5"
            style={{ filter: 'brightness(0) invert(1)', opacity: 0.6 }} />
          <img src="/assets/buzzd-logo.svg" alt="buzzd" className="h-5 w-auto sm:h-6"
            loading="eager" fetchPriority="high" />
        </button>
        <p className="font-righteous text-sm tracking-widest text-white/60 uppercase">Alerts</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto scrollbar-none px-4 sm:px-6 py-4 flex flex-col gap-3">
        {logs.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 py-24">
            <img src="/assets/alert-icon.svg" alt="" className="h-12 w-12 opacity-20"
              style={{ filter: 'brightness(0) invert(1)' }} />
            <p className="font-righteous text-xl text-white/40 text-center tracking-wide">
              No alerts yet.
            </p>
            <p className="text-white/30 text-sm text-center" style={{ fontFamily: 'Aeonik, sans-serif' }}>
              Stay in the green.
            </p>
          </div>
        ) : (
          <>
            <p className="font-righteous text-xs tracking-widest text-white/40 uppercase mb-1">
              {logs.length} alert{logs.length !== 1 ? "s" : ""} this session
            </p>
            {logs.map(log => {
              const zoneColor = ZONE_COLORS[log.zone] ?? "#ffffff"
              return (
                <div
                  key={log.id}
                  className="rounded-2xl border p-4 flex flex-col gap-3"
                  style={{
                    borderColor: `${zoneColor}40`,
                    background: `${zoneColor}0a`,
                  }}
                >
                  {/* Header row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: zoneColor, boxShadow: `0 0 6px ${zoneColor}` }} />
                      <span className="font-righteous text-sm tracking-wide" style={{ color: zoneColor }}>
                        {ZONE_LABELS[log.zone]}
                      </span>
                    </div>
                    <span className="text-white/30 text-xs" style={{ fontFamily: 'Aeonik, sans-serif' }}>
                      {log.zoneScore}%
                    </span>
                  </div>

                  {/* Timestamp */}
                  <div className="flex items-center gap-2 text-white/40 text-xs" style={{ fontFamily: 'Aeonik, sans-serif' }}>
                    <span>{formatDate(log.triggeredAt)}</span>
                    <span>·</span>
                    <span>Triggered {formatTime(log.triggeredAt)}</span>
                    <span>·</span>
                    <span>Dismissed {formatTime(log.dismissedAt)}</span>
                  </div>

                  {/* Actions taken */}
                  {log.actionsSelected.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {log.actionsSelected.map(action => (
                        <span
                          key={action}
                          className="text-xs px-2.5 py-1 rounded-full border"
                          style={{
                            borderColor: `${zoneColor}50`,
                            color: 'rgba(255,255,255,0.6)',
                            fontFamily: 'Aeonik, sans-serif',
                            backgroundColor: `${zoneColor}15`,
                          }}
                        >
                          {action}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </>
        )}
      </div>

      {/* Bottom Nav */}
      <nav className="flex-none border-t border-[#FFBB00]/30 bg-[oklch(20.8%_0.042_265.755)]/95 backdrop-blur-sm">
        <div className="flex items-center justify-around py-3 sm:py-4" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 12px)' }}>
          <button onClick={() => router.push("/")} className="flex flex-col items-center gap-1 transition-colors cursor-pointer">
            <img src="/assets/home-icon.svg" alt="home" className="h-6 w-6"
              style={{ filter: 'brightness(0) invert(1)', opacity: 0.4 }} />
          </button>
          <button className="flex flex-col items-center gap-1">
            <span className="rounded-full bg-white/5 border border-white/20 p-3 opacity-30">
              <img src="/assets/pictorial-mark-white.svg" alt="simulate" className="w-5 h-5 sm:w-6 sm:h-6" />
            </span>
          </button>
          <button className="flex flex-col items-center gap-1 transition-colors">
            <img src="/assets/alert-icon.svg" alt="alerts" className="h-6 w-6"
              style={{ filter: 'brightness(0) saturate(100%) invert(75%) sepia(69%) saturate(600%) hue-rotate(358deg) brightness(103%) contrast(103%)' }} />
          </button>
        </div>
      </nav>
    </div>
  )
}
