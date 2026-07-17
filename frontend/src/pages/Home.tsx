import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Users, Sparkles, Calendar, AlertTriangle, ArrowRight, TrendingUp } from 'lucide-react'
import AnimatedPage from '../components/AnimatedPage'

interface FlagSummary {
  total_flags: number
  red: number
  yellow: number
}

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.35, ease: 'easeOut' },
  }),
}

export default function Home() {
  const [summary, setSummary] = useState<FlagSummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/pulse/flags')
      .then(r => r.json())
      .then(d => setSummary(d.summary))
      .catch(() => setSummary({ total_flags: 3, red: 2, yellow: 1 }))
      .finally(() => setLoading(false))
  }, [])

  const modules = [
    {
      to: '/content',
      icon: Sparkles,
      color: 'from-violet-600 to-purple-700',
      glow: 'rgba(139,92,246,0.2)',
      title: 'Content Spark',
      desc: 'Generate Instagram captions, LinkedIn posts, and pitch taglines in seconds.',
      cta: 'Generate copy →',
    },
    {
      to: '/scheduler',
      icon: Calendar,
      color: 'from-emerald-600 to-teal-700',
      glow: 'rgba(16,185,129,0.2)',
      title: 'Smart Scheduler',
      desc: 'AI-suggested shifts powered by live Workforce Pulse attendance data.',
      cta: 'View suggestions →',
    },
  ]

  return (
    <AnimatedPage>
      <div className="p-8 max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-white mb-1">Good morning 👋</h1>
          <p className="text-slate-400 text-sm">Here's what needs your attention today.</p>
        </motion.div>

        {/* Top Insight — Workforce Pulse */}
        <motion.div
          custom={0}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          className="mb-6"
        >
          <Link to="/pulse" className="block group">
            <div className="card-glow p-6 flex items-start gap-5 hover:border-brand-500/40 transition-all duration-300 relative overflow-hidden">
              {/* Background gradient accent */}
              <div className="absolute inset-0 bg-gradient-to-br from-brand-600/10 to-transparent pointer-events-none" />

              <div className="w-14 h-14 rounded-2xl bg-brand-600/20 border border-brand-500/30 flex items-center justify-center flex-shrink-0">
                <Users size={24} className="text-brand-100" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="badge-red">
                    <AlertTriangle size={10} />
                    {loading ? '…' : summary?.red ?? 0} Red Flags
                  </span>
                  <span className="badge-yellow">
                    {loading ? '…' : summary?.yellow ?? 0} Yellow
                  </span>
                  <span className="text-xs text-slate-500 ml-auto">This week</span>
                </div>
                <h2 className="text-xl font-bold text-white mb-1">
                  {loading
                    ? 'Loading Workforce Pulse…'
                    : `${summary?.total_flags ?? 0} anomalies detected this week`
                  }
                </h2>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Priya is late most Mondays. Arun &amp; Faisal show buddy-punch signals. Deepa is absent every Friday.
                  Click to see the full report →
                </p>
              </div>

              <ArrowRight
                size={20}
                className="text-slate-600 group-hover:text-brand-400 group-hover:translate-x-1 transition-all duration-200 flex-shrink-0 mt-1"
              />
            </div>
          </Link>
        </motion.div>

        {/* Stat row */}
        <motion.div
          custom={1}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-3 gap-4 mb-8"
        >
          {[
            { label: 'Total Staff', value: '5', icon: Users, color: 'text-brand-400' },
            { label: 'Flags This Week', value: loading ? '…' : String(summary?.total_flags ?? 0), icon: AlertTriangle, color: 'text-red-400' },
            { label: 'Modules Active', value: '3', icon: TrendingUp, color: 'text-emerald-400' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="card p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-white/[0.04] flex items-center justify-center">
                <Icon size={18} className={color} />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{value}</p>
                <p className="text-xs text-slate-500 mt-0.5">{label}</p>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Module preview cards */}
        <div className="grid grid-cols-2 gap-5">
          {modules.map(({ to, icon: Icon, color, glow, title, desc, cta }, i) => (
            <motion.div
              key={to}
              custom={i + 2}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
            >
              <Link to={to} className="block group">
                <div
                  className="card p-6 hover:border-white/10 transition-all duration-300 relative overflow-hidden"
                  style={{ boxShadow: `0 4px 24px 0 ${glow}` }}
                >
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-4 shadow-lg`}>
                    <Icon size={20} className="text-white" />
                  </div>
                  <h3 className="text-base font-semibold text-white mb-1.5">{title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed mb-4">{desc}</p>
                  <span className="text-xs font-medium text-brand-400 group-hover:gap-2 transition-all">{cta}</span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </AnimatedPage>
  )
}
