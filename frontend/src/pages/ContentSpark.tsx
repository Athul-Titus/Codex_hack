import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Image, Briefcase, Zap, Copy, CheckCheck, Loader2 } from 'lucide-react'
import AnimatedPage from '../components/AnimatedPage'

// ---------- Mock data ----------
const MOCK_OUTPUTS: Record<string, { instagram: string; linkedin: string; tagline: string }> = {
  default: {
    instagram:
      '✨ Fresh cuts, fresh vibes. Come in and glow up this weekend! Our team is ready to give you the look you\'ve been dreaming of. Book your slot now 📲\n\n#FreshCut #SalonVibes #GlowUp #HairGoals #BookNow',
    linkedin:
      'At [Your Business], we believe great service starts with great people. This month, our team has served over 200 clients — all with the same care and attention to detail we\'ve always been proud of. Whether you\'re looking for a quick refresh or a full transformation, we\'d love to welcome you in. Drop us a message to schedule.',
    tagline: 'Look good. Feel great. Every single time.',
  },
  promo: {
    instagram:
      '🎉 Weekend Flash Sale! Get 20% off all services this Saturday & Sunday only. Limited slots available — grab yours before they\'re gone! DM us to book instantly 💬\n\n#FlashSale #WeekendVibes #SalonDeals #LimitedOffer #BookNow',
    linkedin:
      'Exciting news for our clients this weekend: we\'re running an exclusive 20% discount on all services — Saturday and Sunday only. This is our way of saying thank you for the incredible support this month. Spots are limited, so reach out early to secure your booking.',
    tagline: 'Premium service. Weekend price.',
  },
}

function pickMock(input: string) {
  const lower = input.toLowerCase()
  if (lower.includes('sale') || lower.includes('discount') || lower.includes('promo') || lower.includes('offer')) {
    return MOCK_OUTPUTS.promo
  }
  return MOCK_OUTPUTS.default
}

// ---------- Copy button ----------
function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button
      onClick={handleCopy}
      className="btn-ghost px-2.5 py-1.5 text-xs gap-1.5"
    >
      {copied ? <CheckCheck size={12} className="text-emerald-400" /> : <Copy size={12} />}
      {copied ? 'Copied!' : 'Copy'}
    </button>
  )
}

// ---------- Output card ----------
interface OutputCardProps {
  icon: React.ElementType
  label: string
  content: string
  iconColor: string
  delay: number
}
function OutputCard({ icon: Icon, label, content, iconColor, delay }: OutputCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35, ease: 'easeOut' }}
      className="card p-5 flex flex-col gap-3"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon size={15} className={iconColor} />
          <span className="text-sm font-semibold text-white">{label}</span>
        </div>
        <CopyBtn text={content} />
      </div>
      <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line flex-1 bg-surface-700 rounded-xl p-4">
        {content}
      </p>
    </motion.div>
  )
}

// ---------- Main ----------
export default function ContentSpark() {
  const [input, setInput] = useState('')
  const [result, setResult] = useState<typeof MOCK_OUTPUTS.default | null>(null)
  const [loading, setLoading] = useState(false)

  const handleGenerate = () => {
    if (!input.trim()) return
    setLoading(true)
    setResult(null)
    // Simulate 1.2s "generation" delay
    setTimeout(() => {
      setResult(pickMock(input))
      setLoading(false)
    }, 1200)
  }

  const examples = [
    "Weekend hair salon promo — 20% off all cuts",
    "New dessert café opening next Friday in Koramangala",
    "Local gym — summer membership drive with free PT session",
  ]

  return (
    <AnimatedPage>
      <div className="p-8 max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Sparkles size={22} className="text-violet-400" />
            Content Spark
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Generate marketing copy for Instagram, LinkedIn, and beyond — in one click.</p>
        </div>

        {/* Input card */}
        <div className="card p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Describe your product, service, or promo idea
            </label>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="e.g. Weekend flash sale — 20% off all haircuts at our Bangalore salon…"
              rows={3}
              className="w-full bg-surface-700 border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-brand-500/50 resize-none transition-colors"
            />
          </div>

          {/* Example chips */}
          <div className="flex flex-wrap gap-2">
            <span className="text-xs text-slate-600 mr-1 self-center">Try:</span>
            {examples.map(ex => (
              <button
                key={ex}
                onClick={() => setInput(ex)}
                className="text-xs px-3 py-1.5 rounded-full border border-white/[0.08] text-slate-400 hover:text-slate-200 hover:border-brand-500/30 transition-all"
              >
                {ex}
              </button>
            ))}
          </div>

          <button
            onClick={handleGenerate}
            disabled={!input.trim() || loading}
            className="btn-primary w-full justify-center disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading
              ? <><Loader2 size={15} className="animate-spin" /> Generating…</>
              : <><Zap size={15} /> Generate Copy</>
            }
          </button>
        </div>

        {/* Output */}
        <AnimatePresence>
          {result && (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              <p className="text-xs text-slate-500 flex items-center gap-1.5">
                <Sparkles size={11} className="text-violet-400" />
                3 content variants generated
                <span className="ml-auto text-slate-600">Mocked · Live LLM tomorrow</span>
              </p>

              <OutputCard
                icon={Image}
                label="Instagram Caption"
                content={result.instagram}
                iconColor="text-pink-400"
                delay={0.05}
              />
              <OutputCard
                icon={Briefcase}
                label="LinkedIn Post"
                content={result.linkedin}
                iconColor="text-blue-400"
                delay={0.15}
              />
              <OutputCard
                icon={Zap}
                label="One-line Tagline"
                content={result.tagline}
                iconColor="text-amber-400"
                delay={0.25}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AnimatedPage>
  )
}
