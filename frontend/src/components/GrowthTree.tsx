import { useEffect, useState } from 'react'
import { fetchGrowthTree, type GrowthTree as GrowthTreeData } from '../api/api'
import { isDarkTheme } from '../utils/theme'

/**
 * Animated SVG tree that grows based on total study hours.
 * Each stage adds more branches, leaves, and height.
 */
export default function GrowthTree() {
    const [tree, setTree] = useState<GrowthTreeData | null>(null)
    const dark = isDarkTheme()

    useEffect(() => {
        fetchGrowthTree().then(setTree).catch(console.error)
    }, [])

    if (!tree) return null

    const { stage, stage_name, stage_message, total_hours, progress_to_next,
        next_stage_name, next_stage_hours } = tree

    // Tree dimensions scale with stage
    const trunkH = 30 + stage * 22
    const trunkW = 4 + stage * 1.5
    const canopyR = stage * 18
    const leafCount = stage * 6

    return (
        <div className="tree-container p-6">
            <div className="flex items-start justify-between mb-4">
                <div>
                    <p className="section-label mb-1">Growth Tree</p>
                    <p className="text-xl font-semibold tracking-tight">{stage_name}</p>
                    <p className="text-sm opacity-40 mt-0.5">{stage_message}</p>
                </div>
                <div className="text-right">
                    <p className="text-2xl font-bold tabular-nums">{total_hours}h</p>
                    <p className="text-xs opacity-30">Total studied</p>
                </div>
            </div>

            {/* SVG Tree */}
            <div className="flex justify-center py-6">
                <div className="animate-tree-sway" style={{ transformOrigin: 'bottom center' }}>
                    <svg width="200" height="220" viewBox="0 0 200 220">
                        {/* Ground */}
                        <ellipse cx="100" cy="210" rx="70" ry="8" fill={dark ? 'rgba(34,197,94,.08)' : 'rgba(16,185,129,.12)'} />

                        {/* Roots (stage >= 2) */}
                        {stage >= 2 && (
                            <g opacity="0.3">
                                <path d={`M${100 - trunkW / 2} 210 Q${80} 215 ${65} 218`} stroke="#22c55e" strokeWidth="2" fill="none" />
                                <path d={`M${100 + trunkW / 2} 210 Q${120} 215 ${135} 218`} stroke="#22c55e" strokeWidth="2" fill="none" />
                            </g>
                        )}

                        {/* Trunk */}
                        <rect
                            x={100 - trunkW / 2}
                            y={210 - trunkH}
                            width={trunkW}
                            height={trunkH}
                            rx={trunkW / 3}
                            fill={stage === 0 ? '#a3a3a3' : '#854d0e'}
                            opacity={stage === 0 ? 0.3 : 0.7}
                        />

                        {/* Branches (stage >= 3) */}
                        {stage >= 3 && (
                            <g opacity="0.5">
                                <line x1="100" y1={210 - trunkH * 0.6} x2={100 - 30} y2={210 - trunkH * 0.8}
                                    stroke="#854d0e" strokeWidth={trunkW * 0.5} strokeLinecap="round" />
                                <line x1="100" y1={210 - trunkH * 0.5} x2={100 + 35} y2={210 - trunkH * 0.7}
                                    stroke="#854d0e" strokeWidth={trunkW * 0.5} strokeLinecap="round" />
                            </g>
                        )}

                        {/* More branches (stage >= 5) */}
                        {stage >= 5 && (
                            <g opacity="0.4">
                                <line x1="100" y1={210 - trunkH * 0.75} x2={100 - 40} y2={210 - trunkH * 0.95}
                                    stroke="#854d0e" strokeWidth={trunkW * 0.4} strokeLinecap="round" />
                                <line x1="100" y1={210 - trunkH * 0.7} x2={100 + 45} y2={210 - trunkH * 0.9}
                                    stroke="#854d0e" strokeWidth={trunkW * 0.4} strokeLinecap="round" />
                            </g>
                        )}

                        {/* Canopy */}
                        {stage >= 1 && (
                            <g>
                                <circle cx="100" cy={210 - trunkH - canopyR * 0.3}
                                    r={canopyR} fill="#22c55e" opacity="0.15" />
                                <circle cx="100" cy={210 - trunkH - canopyR * 0.3}
                                    r={canopyR * 0.75} fill="#22c55e" opacity="0.2" />
                                {stage >= 4 && (
                                    <>
                                        <circle cx={100 - canopyR * 0.5} cy={210 - trunkH - canopyR * 0.1}
                                            r={canopyR * 0.5} fill="#22c55e" opacity="0.15" />
                                        <circle cx={100 + canopyR * 0.5} cy={210 - trunkH - canopyR * 0.1}
                                            r={canopyR * 0.5} fill="#22c55e" opacity="0.15" />
                                    </>
                                )}
                            </g>
                        )}

                        {/* Leaves */}
                        {Array.from({ length: leafCount }).map((_, i) => {
                            const angle = (i / leafCount) * Math.PI * 2
                            const r = canopyR * (0.3 + Math.random() * 0.6)
                            const lx = 100 + Math.cos(angle) * r
                            const ly = (210 - trunkH - canopyR * 0.3) + Math.sin(angle) * r * 0.7
                            const size = 3 + Math.random() * 4
                            return (
                                <circle key={i} cx={lx} cy={ly} r={size}
                                    fill="#22c55e"
                                    opacity={0.3 + Math.random() * 0.4}
                                    style={{ animation: `leafGrow 0.5s ease-out ${i * 0.05}s both` }}
                                />
                            )
                        })}

                        {/* Seed (stage 0) */}
                        {stage === 0 && (
                            <g>
                                <ellipse cx="100" cy="205" rx="6" ry="4" fill="#a3a3a3" opacity="0.4" />
                                <text x="100" y="198" textAnchor="middle" fontSize="20">🌱</text>
                            </g>
                        )}

                        {/* Crown (stage 6) */}
                        {stage >= 6 && (
                            <text x="100" y={210 - trunkH - canopyR * 1.2} textAnchor="middle" fontSize="24">👑</text>
                        )}
                    </svg>
                </div>
            </div>

            {/* Progress bar to next stage */}
            <div className="mt-2">
                <div className="flex justify-between text-xs mb-2">
                    <span className="opacity-40">{stage_name}</span>
                    <span className="opacity-40">{next_stage_name} ({next_stage_hours}h)</span>
                </div>
                <div className="theme-progress-track h-1.5 rounded-full overflow-hidden">
                    <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-1000"
                        style={{ width: `${progress_to_next * 100}%` }}
                    />
                </div>
                <p className="text-xs opacity-30 mt-2 text-center">
                    {Math.round(progress_to_next * 100)}% to next stage
                </p>
            </div>
        </div>
    )
}
