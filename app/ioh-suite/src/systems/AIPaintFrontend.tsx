import React, { useMemo, useState } from 'react'
import { Download, Image as ImageIcon, Loader2, RefreshCcw, Sparkles } from 'lucide-react'

/**
 * AI Paint — Frontend MVP (Stage 3)
 * Goals (minimal acceptance):
 * 1) Text→Image with batch 1–4
 * 2) Visible and complete controls for Count (1–4) & Seed (with Lock + Random)
 * 3) Seed reproducibility on/off
 * 4) Mobile-first layout, pretty default previews with no backend required
 * 5) Simple history list for replay
 */

/* ----------------------------- Presets & Data ----------------------------- */

type Preset = { id: string; name: string; desc?: string; ratio?: '4:5' | '1:1' | '16:9' }

const PRESETS: Preset[] = [
  { id: 'ioh_sunset', name: 'IOH Sunset Poster', desc: 'Warm gradient / promo', ratio: '4:5' },
  { id: 'promo_card', name: 'Promo Card', desc: 'Square product highlight', ratio: '1:1' },
  { id: 'banner_land', name: 'Landing Banner', desc: 'Wide campaign banner', ratio: '16:9' },
]

// Nice royalty-free placeholders (Unsplash) — no backend needed
const PLACEHOLDERS: Record<string, string[]> = {
  ioh_sunset: [
    'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1080&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?q=80&w=1080&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?q=80&w=1080&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?q=80&w=1080&auto=format&fit=crop',
  ],
  promo_card: [
    'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?q=80&w=1080&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=1080&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=1080&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1080&auto=format&fit=crop',
  ],
  banner_land: [
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1080&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1526779259212-939e64788e3c?q=80&w=1080&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?q=80&w=1080&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1496386261271-4f0d1dcd9b46?q=80&w=1080&auto=format&fit=crop',
  ],
}

/* --------------------------------- Types --------------------------------- */

type GenParams = {
  prompt: string;
  negativePrompt: string;
  ratio: '4:5' | '1:1' | '16:9';
  width: number;
  height: number;
  steps: number; // 5–50
  cfg: number; // 0–15
  count: number; // 1–4
  seed: number | null; // null = random
  lockSeed: boolean; // true = use seed
}

type Job = {
  id: string;
  title: string;
  created: string;
  urls: string[];
  params: GenParams;
}

/* --------------------------------- Utils --------------------------------- */

function nowStr() {
  return new Date().toISOString().slice(0, 16).replace('T', ' ')
}
function randId(prefix = 'JOB') {
  return `${prefix}-${Math.floor(Math.random() * 90000 + 10000)}`
}
function randSeed() {
  return Math.floor(Math.random() * 2_000_000_000)
}
function clampCount(n: number) {
  return Math.max(1, Math.min(4, Math.floor(n)))
}
function ratioToSize(r: GenParams['ratio']): { w: number; h: number } {
  if (r === '1:1') return { w: 768, h: 768 }
  if (r === '16:9') return { w: 1024, h: 576 }
  return { w: 768, h: 960 } // 4:5
}

/* --------------------------------- App ----------------------------------- */

export default function AIPaintFrontendMVP() {
  const [tab, setTab] = useState<'presets' | 'generate' | 'history'>('presets')
  const [preset, setPreset] = useState<Preset | null>(null)

  // visible, simple params (ALL controls fully visible by default)
  const [prompt, setPrompt] = useState('')
  const [negative, setNegative] = useState('')
  const [ratio, setRatio] = useState<GenParams['ratio']>('4:5')
  const [steps, setSteps] = useState(20) // keep low for mobile demo
  const [cfg, setCfg] = useState(7)
  const [count, setCount] = useState(4) // 1–4
  const [lockSeed, setLockSeed] = useState(true)
  const [seed, setSeed] = useState<number | null>(123456)
  const size = useMemo(() => ratioToSize(ratio), [ratio])

  const [isRunning, setIsRunning] = useState(false)
  const [job, setJob] = useState<Job | null>(null)
  const [history, setHistory] = useState<Job[]>([])

  // choose preset -> immediately show nice preview (default 4 images)
  const choosePreset = (p: Preset) => {
    setPreset(p)
    const r = (p.ratio || '4:5') as GenParams['ratio']
    setRatio(r)
    const { w, h } = ratioToSize(r)
    const c = clampCount(count)
    const id = randId()
    const demo: Job = {
      id,
      title: `${p.name} — Demo Preview`,
      created: nowStr(),
      urls: (PLACEHOLDERS[p.id] || PLACEHOLDERS.ioh_sunset).slice(0, c),
      params: {
        prompt: '',
        negativePrompt: '',
        ratio: r,
        width: w,
        height: h,
        steps,
        cfg,
        count: c,
        seed: lockSeed ? seed ?? randSeed() : null,
        lockSeed,
      },
    }
    setJob(demo)
    setTab('generate')
  }

  // run generate (mock async)
  const run = async () => {
    if (!preset) return
    setIsRunning(true)
    const r = ratio
    const { w, h } = ratioToSize(r)
    const c = clampCount(count)
    const chosenSeed = lockSeed ? (seed ?? randSeed()) : null // null => random backend

    const newJob: Job = {
      id: randId(),
      title: `${preset.name} — ${prompt ? prompt.slice(0, 24) : 'Untitled'}…`,
      created: nowStr(),
      urls: [],
      params: {
        prompt,
        negativePrompt: negative,
        ratio: r,
        width: w,
        height: h,
        steps: Math.max(5, Math.min(50, steps)),
        cfg: Math.max(0, Math.min(15, cfg)),
        count: c,
        seed: chosenSeed,
        lockSeed,
      },
    }

    setJob(newJob)

    // fake async generation (1.2s) using placeholders (no backend)
    setTimeout(() => {
      const base = PLACEHOLDERS[preset.id] || PLACEHOLDERS.ioh_sunset
      const picks = base.slice(0, c)
      const done: Job = { ...newJob, urls: picks }
      setJob(done)
      setHistory(prev => [done, ...prev])
      setIsRunning(false)
    }, 1200)
  }

  // seed helpers
  const doRandomSeed = () => setSeed(randSeed())

  // grid columns based on count
  const gridCols = useMemo(() => {
    const c = job?.params.count ?? 4
    if (c === 1) return 'grid-cols-1'
    if (c === 2) return 'grid-cols-2'
    return 'grid-cols-2 md:grid-cols-3' // 3 or 4
  }, [job?.params.count])

  return (
    <div className="mx-auto w-full max-w-6xl p-4 md:p-8">
      {/* Header */}
      <header className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-orange-400 to-pink-500 text-white">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold leading-tight">AI Paint (MVP)</h1>
            <p className="text-sm text-zinc-500">Mobile-first · Batch 1–4 · Seed reproducible</p>
          </div>
        </div>

        <nav className="flex gap-2">
          <TabButton active={tab === 'presets'} label="Presets" onClick={() => setTab('presets')} />
          <TabButton active={tab === 'generate'} label="Generate" onClick={() => setTab('generate')} />
          <TabButton active={tab === 'history'} label="History" onClick={() => setTab('history')} />
        </nav>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left column */}
        <section className="lg:col-span-1">
          {tab === 'presets' && (
            <Card>
              <CardHeader icon={<Sparkles />} title="Choose a Preset" subtitle="Pick one to start with preview" />
              <div className="grid grid-cols-1 gap-3 p-4">
                {PRESETS.map(p => (
                  <div key={p.id} className="group rounded-xl border bg-white/50 p-3 transition hover:shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{p.name}</div>
                        {p.desc && <div className="text-sm text-zinc-500">{p.desc}</div>}
                        <div className="mt-1 text-xs text-zinc-400">Default Ratio: {p.ratio || '4:5'}</div>
                      </div>
                      <button onClick={() => choosePreset(p)} className="rounded-lg bg-zinc-900 px-3 py-1.5 text-sm text-white hover:bg-zinc-800">
                        Use
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {tab === 'generate' && (
            <Card>
              <CardHeader icon={<ImageIcon />} title="Generate" subtitle="Fill prompt and click Generate" />
              <div className="space-y-3 p-4">
                <div>
                  <label className="mb-1 block text-sm text-zinc-600">Prompt</label>
                  <textarea
                    value={prompt}
                    onChange={e => setPrompt(e.target.value)}
                    rows={4}
                    placeholder="e.g., Indonesian beach sunset, orange gradient poster, modern typography"
                    className="w-full rounded-xl border p-3 outline-none focus:ring-2 focus:ring-zinc-900/10"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm text-zinc-600">Negative Prompt</label>
                  <input
                    value={negative}
                    onChange={e => setNegative(e.target.value)}
                    placeholder="e.g., low-res, blurry, text artifacts"
                    className="w-full rounded-xl border p-2.5 outline-none focus:ring-2 focus:ring-zinc-900/10"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-sm text-zinc-600">Aspect Ratio</label>
                    <select value={ratio} onChange={e => setRatio(e.target.value as GenParams['ratio'])} className="w-full rounded-xl border p-2.5">
                      {(['4:5', '1:1', '16:9'] as const).map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>
                  <NumberField label="Steps" value={steps} onChange={setSteps} min={5} max={50} hint="5–50" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <NumberField label="CFG Scale" value={cfg} onChange={setCfg} min={0} max={15} step={0.5} hint="0–15 (7 common)" />

                  {/* Count: segmented + input to be FULLY visible */}
                  <div>
                    <label className="mb-1 block text-sm text-zinc-600">Count (1–4)</label>
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="inline-flex overflow-hidden rounded-xl border">
                        {[1, 2, 3, 4].map(n => (
                          <button
                            key={n}
                            type="button"
                            onClick={() => setCount(n)}
                            className={['px-3 py-1.5 text-sm', count === n ? 'bg-zinc-900 text-white' : 'bg-white hover:bg-zinc-50', n !== 4 ? 'border-r' : ''].join(' ')}
                          >
                            {n}
                          </button>
                        ))}
                      </div>
                      <input
                        type="number"
                        min={1}
                        max={4}
                        value={count}
                        onChange={e => setCount(clampCount(Number(e.target.value)))}
                        className="w-20 rounded-xl border p-2.5"
                        title="1–4"
                      />
                    </div>
                  </div>
                </div>

                {/* Seed block: ALWAYS visible */}
                <div>
                  <label className="mb-1 block text-sm text-zinc-600">Seed</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      placeholder={lockSeed ? 'Enter integer' : 'Random (disabled)'}
                      value={lockSeed ? (seed ?? '') : ''}
                      onChange={e => setSeed(e.target.value === '' ? null : Math.max(0, Number(e.target.value)))}
                      className="w-full rounded-xl border p-2.5"
                      disabled={!lockSeed}
                    />
                    <button type="button" onClick={doRandomSeed} className="inline-flex items-center gap-1.5 rounded-xl border px-3">
                      <RefreshCcw className="h-4 w-4" /> Random
                    </button>
                  </div>
                  <label className="mt-2 inline-flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={lockSeed} onChange={e => setLockSeed(e.target.checked)} />
                    Lock Seed (enable reproducibility)
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={run}
                    disabled={isRunning || !preset}
                    className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2 text-white hover:bg-zinc-800 disabled:opacity-50"
                  >
                    {isRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    Generate (x{clampCount(count)})
                  </button>
                  {!preset && <span className="text-xs text-red-500">Pick a preset first</span>}
                </div>
              </div>
            </Card>
          )}

          {tab === 'history' && (
            <Card>
              <CardHeader icon={<ImageIcon />} title="History" subtitle="Click to load params" />
              <div className="p-2">
                {history.length === 0 && <div className="p-3 text-sm text-zinc-500">No history yet.</div>}
                <ul className="divide-y">
                  {history.map(h => (
                    <li
                      key={h.id}
                      className="cursor-pointer p-3 hover:bg-zinc-50"
                      onClick={() => {
                        setJob(h)
                        setPrompt(h.params.prompt)
                        setNegative(h.params.negativePrompt)
                        setRatio(h.params.ratio)
                        setSteps(h.params.steps)
                        setCfg(h.params.cfg)
                        setCount(h.params.count)
                        setLockSeed(h.params.lockSeed)
                        setSeed(h.params.seed)
                        setTab('generate')
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{h.title}</div>
                          <div className="text-xs text-zinc-500">{h.id} · {h.created} · {h.params.ratio} · {h.params.width}×{h.params.height} · x{h.params.count}</div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
          )}
        </section>

        {/* Right column: Output */}
        <section className="lg:col-span-2">
          <Card>
            <CardHeader icon={<ImageIcon />} title="Output" subtitle="Preview and download" />
            <div className="space-y-3 p-4">
              {job?.urls && job.urls.length > 0 ? (
                <>
                  <ParamsBar params={job.params} />
                  <div className={`grid gap-3 ${gridCols}`}>
                    {job.urls.slice(0, job.params.count).map((u, idx) => (
                      <div
                        key={idx}
                        className="overflow-hidden rounded-xl border bg-zinc-50"
                        style={{
                          aspectRatio: job.params.ratio === '1:1' ? '1 / 1' : job.params.ratio === '16:9' ? '16 / 9' : '4 / 5',
                        }}
                      >
                        { }
                        <img src={u} alt={`gen-${idx}`} className="h-full w-full object-cover" />
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex aspect-[4/5] items-center justify-center rounded-xl border bg-gradient-to-br from-yellow-50 to-red-50 text-zinc-500">
                  Image Preview (placeholder)
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2">
                <button className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm">
                  <Download className="h-4 w-4" />
                  Download
                </button>
                <div className="ml-auto text-xs text-zinc-500">{job ? job.created : '—'}</div>
              </div>
            </div>
          </Card>
        </section>
      </div>
    </div>
  )
}

/* ------------------------------- Subcomponents ---------------------------- */

function ParamsBar({ params }: { params: GenParams }) {
  return (
    <div className="flex flex-wrap gap-2 rounded-xl border p-2 text-xs text-zinc-600">
      <span className="rounded border bg-zinc-50 px-2 py-0.5">Ratio {params.ratio}</span>
      <span className="rounded border bg-zinc-50 px-2 py-0.5">Size {params.width}×{params.height}</span>
      <span className="rounded border bg-zinc-50 px-2 py-0.5">Steps {params.steps}</span>
      <span className="rounded border bg-zinc-50 px-2 py-0.5">CFG {params.cfg}</span>
      <span className="rounded border bg-zinc-50 px-2 py-0.5">Seed {params.lockSeed ? params.seed ?? '—' : 'random'}</span>
      <span className="rounded border bg-zinc-50 px-2 py-0.5">Count x{params.count}</span>
    </div>
  )
}

function NumberField({ label, value, onChange, hint, min, max, step }: { label: string; value: number; onChange: (v: number) => void; hint?: string; min?: number; max?: number; step?: number; }) {
  return (
    <div>
      <label className="mb-1 block text-sm text-zinc-600">{label}</label>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step ?? 1}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full rounded-xl border p-2.5"
      />
      {hint && <div className="mt-1 text-[11px] text-zinc-400">{hint}</div>}
    </div>
  )
}

function TabButton({ active, label, onClick }: { active?: boolean; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={['px-3 py-1.5 rounded-lg text-sm transition', active ? 'bg-zinc-900 text-white' : 'bg-zinc-100 hover:bg-zinc-200'].join(' ')}
    >
      {label}
    </button>
  )
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">{children}</div>
}

function CardHeader({ icon, title, subtitle }: { icon?: React.ReactNode; title: string; subtitle?: string }) {
  return (
    <div className="flex items-center gap-3 border-b bg-zinc-50/70 px-4 py-3">
      <div className="grid h-8 w-8 place-items-center rounded-lg border bg-white text-zinc-700">{icon}</div>
      <div>
        <div className="font-medium">{title}</div>
        {subtitle && <div className="text-xs text-zinc-500">{subtitle}</div>}
      </div>
    </div>
  )
}
