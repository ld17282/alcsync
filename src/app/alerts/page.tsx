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
          <svg className="h-5 w-auto sm:h-6" viewBox="0 0 601 157" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="buzzd">
            <path d="M500.368 18.85C491.073 19.417 488.707 32.049 492.429 40.585C513.511 74.383 487.511 102.883 467.287 104.363C460.767 106.241 456.483 112.797 461.393 117.48C475.67 131.096 505.526 145.736 538.011 137.383C580.511 126.454 595.772 78.383 573.511 46.383C557.443 23.285 524.453 17.38 500.368 18.85Z" stroke="white" strokeWidth="34" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M106.976 93.09C106.976 101.304 105.574 108.801 102.771 115.581C99.968 122.361 96.155 128.195 91.331 133.084C86.506 137.908 80.835 141.657 74.316 144.33C67.862 147.002 60.92 148.339 53.488 148.339C46.122 148.339 39.179 146.97 32.66 144.232C26.206 141.494 20.535 137.68 15.645 132.791C10.821 127.902 7.00799 122.1 4.20499 115.385C1.40099 108.606 0 101.174 0 93.09V0H26.793V48.892C28.227 47.067 29.954 45.437 31.975 44.003C34.061 42.568 36.278 41.395 38.625 40.482C41.037 39.57 43.514 38.885 46.056 38.429C48.599 37.907 51.076 37.647 53.488 37.647C60.92 37.647 67.862 39.048 74.316 41.851C80.835 44.589 86.506 48.436 91.331 53.39C96.155 58.344 99.968 64.211 102.771 70.991C105.574 77.706 106.976 85.072 106.976 93.09ZM80.085 93.09C80.085 89.049 79.368 85.3 77.934 81.845C76.565 78.325 74.675 75.294 72.263 72.751C69.851 70.209 67.015 68.221 63.755 66.786C60.561 65.352 57.139 64.635 53.488 64.635C49.837 64.635 46.382 65.45 43.123 67.08C39.928 68.644 37.125 70.763 34.713 73.436C32.301 76.043 30.411 79.075 29.042 82.53C27.673 85.92 26.988 89.44 26.988 93.09C26.988 97.132 27.673 100.881 29.042 104.336C30.411 107.791 32.301 110.789 34.713 113.332C37.125 115.874 39.928 117.895 43.123 119.394C46.382 120.829 49.837 121.546 53.488 121.546C57.139 121.546 60.561 120.829 63.755 119.394C67.015 117.895 69.851 115.874 72.263 113.332C74.675 110.789 76.565 107.791 77.934 104.336C79.368 100.881 80.085 97.132 80.085 93.09ZM198.796 134.16C196.644 136.116 194.33 137.974 191.853 139.734C189.441 141.429 186.899 142.928 184.226 144.232C181.553 145.47 178.782 146.448 175.914 147.165C173.111 147.948 170.243 148.339 167.309 148.339C160.855 148.339 154.793 147.198 149.121 144.916C143.45 142.635 138.463 139.408 134.16 135.236C129.923 130.998 126.566 125.881 124.088 119.883C121.676 113.821 120.47 107.041 120.47 99.544V41.656H147.068V99.544C147.068 103.064 147.589 106.226 148.632 109.029C149.74 111.767 151.207 114.082 153.033 115.972C154.858 117.863 156.977 119.297 159.389 120.275C161.866 121.252 164.506 121.741 167.309 121.741C170.047 121.741 172.622 121.122 175.034 119.883C177.511 118.58 179.663 116.885 181.488 114.799C183.313 112.713 184.747 110.366 185.79 107.758C186.833 105.085 187.355 102.347 187.355 99.544V41.656H214.05V146.383H207.596L198.796 134.16ZM316.235 146.383H228.913L273.014 68.449H228.913V41.851H316.235L272.134 119.786H316.235V146.383ZM412.846 146.383H325.524L369.625 68.449H325.524V41.851H412.846L368.745 119.786H412.846V146.383Z" fill="white"/>
            <path d="M454.953 23.006C454.953 25.875 454.66 28.971 454.073 32.296C453.552 35.555 452.672 38.815 451.433 42.074C450.26 45.269 448.695 48.333 446.739 51.266C445.769 52.722 444.701 54.066 443.538 55.297C441.432 57.526 438.007 57.507 435.499 55.742L435.031 55.413C431.863 53.184 431.463 48.789 433.147 45.301C434.06 43.411 434.777 41.52 435.299 39.63C433.343 39.304 431.518 38.652 429.823 37.674C428.128 36.696 426.661 35.49 425.422 34.056C424.249 32.557 423.304 30.862 422.587 28.971C421.87 27.081 421.511 25.092 421.511 23.006C421.511 20.79 421.935 18.671 422.782 16.65C423.695 14.629 424.901 12.869 426.4 11.37C427.965 9.805 429.725 8.59901 431.681 7.75201C433.701 6.83901 435.853 6.383 438.134 6.383C440.481 6.383 442.665 6.83901 444.686 7.75201C446.772 8.59901 448.565 9.805 450.064 11.37C451.563 12.869 452.737 14.629 453.584 16.65C454.497 18.671 454.953 20.79 454.953 23.006Z" fill="url(#paint0_linear_alerts)"/>
            <defs>
              <linearGradient id="paint0_linear_alerts" x1="438.232" y1="6.383" x2="438.232" y2="58.698" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FFBB00"/>
              </linearGradient>
            </defs>
          </svg>
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
              <svg className="w-5 h-5 sm:w-6 sm:h-6" viewBox="0 0 159 156" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="simulate"><path d="M58.1007 17.2107C48.8057 17.7777 46.4398 30.4098 50.1618 38.9458C71.2438 72.7438 45.2437 101.244 25.0197 102.724C18.4997 104.602 14.2158 111.158 19.1258 115.841C33.4028 129.457 63.2587 144.097 95.7437 135.744C138.244 124.815 153.505 76.7438 131.244 44.7438C115.176 21.6458 82.1857 15.7407 58.1007 17.2107Z" stroke="white" strokeWidth="34" strokeLinecap="round" strokeLinejoin="round"/></svg>
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
