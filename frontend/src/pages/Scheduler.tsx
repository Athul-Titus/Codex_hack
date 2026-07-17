import { motion } from 'framer-motion'
import { Calendar, Users, Clock, AlertTriangle } from 'lucide-react'
import AnimatedPage from '../components/AnimatedPage'

const suggestions = [
  {
    staff: 'Priya Menon',
    shift: 'Monday 9:45 AM – 6:30 PM',
    suggestion: 'Priya trends late on Mondays — consider a 15-min buffer on her Monday shift start.',
    insight: 'Late arrival pattern: 3 of 3 Mondays, avg 35 min late',
    severity: 'red' as const,
    icon: Clock,
  },
  {
    staff: 'Arun Sharma & Faisal Khan',
    shift: 'Mon / Wed / Fri staggered starts',
    suggestion: "Arun and Faisal's shifts overlap heavily on Mon/Wed/Fri — consider staggering their start times by 20 mins to reduce the punch-time proximity flagged in Workforce Pulse.",
    insight: 'Buddy-punch signal: 3 occasions with <2 min check-in gap',
    severity: 'red' as const,
    icon: Users,
  },
  {
    staff: 'Deepa Nair',
    shift: 'Thursday → Friday cover reassignment',
    suggestion: 'Deepa has been absent every Friday for 3 weeks. Until the pattern is resolved, consider scheduling backup coverage on Fridays or shifting her key tasks to Thursday.',
    insight: 'Missed-shift cluster: 3 consecutive Friday absences',
    severity: 'yellow' as const,
    icon: AlertTriangle,
  },
]

export default function Scheduler() {
  return (
    <AnimatedPage>
      <div className="p-8 max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Calendar size={22} className="text-emerald-400" />
              Smart Scheduler
            </h1>
            <p className="text-slate-400 text-sm mt-0.5">Suggested shifts for next week — powered by Workforce Pulse data.</p>
          </div>
          <span className="badge-yellow"><AlertTriangle size={11} />Vision stub — live logic next</span>
        </div>

        {/* Info banner */}
        <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-500/[0.07] border border-emerald-500/20">
          <Users size={16} className="text-emerald-400 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-slate-300">
            These suggestions are generated from real anomaly flags in Workforce Pulse.
            Each card references a specific detected pattern — tomorrow these will be driven live by the LLM scheduler.
          </p>
        </div>

        {/* Suggestion cards */}
        <div className="space-y-4">
          {suggestions.map(({ staff, shift, suggestion, insight, severity, icon: Icon }, i) => (
            <motion.div
              key={staff}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.12, duration: 0.35, ease: 'easeOut' }}
              className="card p-6 space-y-4"
            >
              {/* Top row */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    severity === 'red'
                      ? 'bg-red-500/15 border border-red-500/20'
                      : 'bg-amber-500/15 border border-amber-500/20'
                  }`}>
                    <Icon size={18} className={severity === 'red' ? 'text-red-400' : 'text-amber-400'} />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-white">{staff}</h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <Clock size={10} /> {shift}
                    </p>
                  </div>
                </div>

                {/* Powered-by badge */}
                <div className="flex-shrink-0">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold
                    bg-gradient-to-r from-brand-600/20 to-purple-600/20
                    border border-brand-500/30 text-brand-100">
                    <Users size={10} />
                    Powered by Workforce Pulse data
                  </span>
                </div>
              </div>

              {/* Suggestion text */}
              <p className="text-sm text-slate-300 leading-relaxed">{suggestion}</p>

              {/* Pulse insight chip */}
              <div className="flex items-center gap-2 pt-1">
                <div className={`h-1 w-1 rounded-full ${severity === 'red' ? 'bg-red-400' : 'bg-amber-400'}`} />
                <span className="text-xs text-slate-500 font-mono">{insight}</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Coming soon card */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="card p-5 border-dashed border-white/[0.08] text-center"
        >
          <Calendar size={22} className="text-slate-600 mx-auto mb-2" />
          <p className="text-sm text-slate-500 font-medium">Full shift calendar coming tomorrow</p>
          <p className="text-xs text-slate-600 mt-1">
            Live LLM-generated schedule based on real Pulse data, staff preferences, and coverage rules.
          </p>
        </motion.div>
      </div>
    </AnimatedPage>
  )
}
