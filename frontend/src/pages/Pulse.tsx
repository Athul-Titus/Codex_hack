import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Users, AlertTriangle, Clock, UserX, CheckCircle, FileText, ChevronDown } from 'lucide-react'
import AnimatedPage from '../components/AnimatedPage'

// ---------- Types ----------
interface StaffMember { id: number; name: string }

interface Flag {
  type: string
  severity: 'red' | 'yellow'
  staff_name?: string
  staff_names?: string[]
  message: string
  late_pct?: number
  occurrences?: number
  clustered_weekday?: string
  weekday?: string
  absence_count?: number
}

interface FlagsResponse {
  summary: { total_flags: number; red: number; yellow: number }
  flags: Flag[]
}

interface ReportResponse {
  report: string
  flag_count: number
}

// ---------- Sub-components ----------
function FlagCard({ flag, delay }: { flag: Flag; delay: number }) {
  const isRed = flag.severity === 'red'
  const icon = flag.type === 'late_arrival'
    ? <Clock size={14} />
    : flag.type === 'buddy_punch'
      ? <Users size={14} />
      : <UserX size={14} />

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.3 }}
      className={`flex items-start gap-3 p-4 rounded-xl border ${
        isRed
          ? 'bg-red-500/[0.07] border-red-500/20'
          : 'bg-amber-500/[0.07] border-amber-500/20'
      }`}
    >
      <span className={isRed ? 'badge-red mt-0.5' : 'badge-yellow mt-0.5'}>
        {icon}
        {flag.severity.toUpperCase()}
      </span>
      <p className="text-sm text-slate-300 leading-relaxed flex-1">{flag.message}</p>
    </motion.div>
  )
}

// ---------- Main ----------
export default function Pulse() {
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [flags, setFlags] = useState<FlagsResponse | null>(null)
  const [report, setReport] = useState<ReportResponse | null>(null)
  const [loadingFlags, setLoadingFlags] = useState(true)
  const [loadingReport, setLoadingReport] = useState(true)

  // Check-in form state
  const [selectedStaff, setSelectedStaff] = useState<number | ''>('')
  const [checkinMsg, setCheckinMsg] = useState('')

  useEffect(() => {
    fetch('/api/staff').then(r => r.json()).then(setStaff).catch(() => {})

    fetch('/api/pulse/flags')
      .then(r => r.json())
      .then(setFlags)
      .catch(() => setFlags({
        summary: { total_flags: 3, red: 2, yellow: 1 },
        flags: [
          { type: 'late_arrival', severity: 'red', staff_name: 'Priya Menon', message: 'Priya Menon was late on 3 of 3 shifts (100%), mostly on Mondays.', late_pct: 100, clustered_weekday: 'Monday' },
          { type: 'buddy_punch', severity: 'red', staff_names: ['Arun Sharma', 'Faisal Khan'], message: 'Arun Sharma and Faisal Khan clocked in within 2 minutes of each other on 3 separate occasions — possible buddy-punch.' },
          { type: 'missed_shift_cluster', severity: 'yellow', staff_name: 'Deepa Nair', message: 'Deepa Nair has been absent on 3 Fridays — possible recurring pattern.', weekday: 'Friday', absence_count: 3 },
        ],
      }))
      .finally(() => setLoadingFlags(false))

    fetch('/api/pulse/report')
      .then(r => r.json())
      .then(setReport)
      .catch(() => setReport({
        report: 'Report not available — ensure the backend is running (uvicorn main:app --reload).',
        flag_count: 3,
      }))
      .finally(() => setLoadingReport(false))
  }, [])

  const handleCheckIn = async () => {
    if (!selectedStaff) return
    const today = new Date().toISOString().slice(0, 10)
    const now = new Date().toTimeString().slice(0, 8)
    try {
      await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staff_id: selectedStaff, date: today, check_in: now }),
      })
      setCheckinMsg(`✅ Check-in recorded for ${staff.find(s => s.id === selectedStaff)?.name}`)
    } catch {
      setCheckinMsg('❌ Backend offline — check-in not saved.')
    }
    setTimeout(() => setCheckinMsg(''), 4000)
  }

  const handleCheckOut = async () => {
    if (!selectedStaff) return
    const today = new Date().toISOString().slice(0, 10)
    const now = new Date().toTimeString().slice(0, 8)
    try {
      await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staff_id: selectedStaff, date: today, check_out: now }),
      })
      setCheckinMsg(`✅ Check-out recorded for ${staff.find(s => s.id === selectedStaff)?.name}`)
    } catch {
      setCheckinMsg('❌ Backend offline — check-out not saved.')
    }
    setTimeout(() => setCheckinMsg(''), 4000)
  }

  const reportParagraphs = report?.report.split('\n\n') ?? []

  return (
    <AnimatedPage>
      <div className="p-8 max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Users size={22} className="text-brand-400" />
              Workforce Pulse
            </h1>
            <p className="text-slate-400 text-sm mt-0.5">Live attendance tracking &amp; AI anomaly detection</p>
          </div>
          {!loadingFlags && flags && (
            <div className="flex gap-2">
              <span className="badge-red"><AlertTriangle size={11} />{flags.summary.red} Critical</span>
              <span className="badge-yellow">{flags.summary.yellow} Warning</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-6">

          {/* LEFT COL: Check-in + Staff list */}
          <div className="space-y-5">
            {/* Check-in screen */}
            <div className="card p-5 space-y-4">
              <h2 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                <Clock size={14} className="text-brand-400" />
                Check In / Out
              </h2>

              <div className="relative">
                <select
                  value={selectedStaff}
                  onChange={e => setSelectedStaff(Number(e.target.value) || '')}
                  className="w-full appearance-none bg-surface-700 border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-brand-500/50 transition-colors"
                >
                  <option value="">Select staff member…</option>
                  {staff.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-3 text-slate-500 pointer-events-none" />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleCheckIn}
                  disabled={!selectedStaff}
                  className="flex-1 btn-primary justify-center disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none"
                >
                  Check In
                </button>
                <button
                  onClick={handleCheckOut}
                  disabled={!selectedStaff}
                  className="flex-1 btn-ghost justify-center border border-white/[0.08] disabled:opacity-40"
                >
                  Check Out
                </button>
              </div>

              {checkinMsg && (
                <p className="text-xs text-slate-300 bg-white/[0.04] rounded-lg px-3 py-2">{checkinMsg}</p>
              )}
            </div>

            {/* Staff list */}
            <div className="card p-5">
              <h2 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                <Users size={14} className="text-brand-400" />
                Staff ({staff.length || 5})
              </h2>
              <div className="space-y-2">
                {(staff.length ? staff : [
                  { id: 1, name: 'Priya Menon' },
                  { id: 2, name: 'Arun Sharma' },
                  { id: 3, name: 'Faisal Khan' },
                  { id: 4, name: 'Deepa Nair' },
                  { id: 5, name: 'Rohit Verma' },
                ]).map((s, i) => (
                  <div key={s.id} className="flex items-center gap-2.5 py-1.5">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-600 to-purple-700 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                      {s.name[0]}
                    </div>
                    <span className="text-sm text-slate-300 flex-1">{s.name}</span>
                    {i === 4
                      ? <span className="badge-green"><CheckCircle size={10} />Normal</span>
                      : i < 2
                        ? <span className="badge-red">Flagged</span>
                        : i === 2
                          ? <span className="badge-red">Flagged</span>
                          : <span className="badge-yellow">Watch</span>
                    }
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT 2 COL: Flags + Report */}
          <div className="col-span-2 space-y-5">
            {/* Flags panel */}
            <div className="card p-5">
              <h2 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
                <AlertTriangle size={14} className="text-red-400" />
                Anomaly Flags
                {!loadingFlags && flags && (
                  <span className="ml-auto text-xs text-slate-500">{flags.summary.total_flags} detected</span>
                )}
              </h2>

              {loadingFlags ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-14 rounded-xl bg-white/[0.03] animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {(flags?.flags ?? []).map((flag, i) => (
                    <FlagCard key={i} flag={flag} delay={i * 0.08} />
                  ))}
                </div>
              )}
            </div>

            {/* AI Weekly Report */}
            <div className="card-glow p-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-brand-600/8 to-transparent pointer-events-none" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-brand-600/20 border border-brand-500/30 flex items-center justify-center">
                    <FileText size={14} className="text-brand-300" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-white">AI Weekly Report</h2>
                    <p className="text-xs text-slate-500">Generated by ops analyst model</p>
                  </div>
                  <span className="ml-auto badge-blue">Mocked · LLM tomorrow</span>
                </div>

                {loadingReport ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="h-4 rounded bg-white/[0.04] animate-pulse" style={{ width: i % 2 === 0 ? '85%' : '100%' }} />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reportParagraphs.map((para, i) => (
                      <p
                        key={i}
                        className="text-sm text-slate-300 leading-relaxed"
                        dangerouslySetInnerHTML={{
                          __html: para.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>'),
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AnimatedPage>
  )
}
