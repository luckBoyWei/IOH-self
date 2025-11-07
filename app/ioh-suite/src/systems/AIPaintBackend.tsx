import React, { useState } from 'react'
import { Activity, Cpu, Database, Download, History, Image as ImageIcon, KeyRound, Palette, Settings, Shield } from 'lucide-react'

/**
 * AI Paint — Admin Backend MVP (Stage 3)
 * Scope: match the Frontend MVP for minimal acceptance
 * - Queue visibility + job params (incl. Seed) + replay
 * - Style Presets & Prompt Templates aligned with frontend preset ids
 * - Model defaults (steps/cfg/resolution)
 * - Metrics snapshot (P95 ≤ 12s, Fail ≤ 1%)
 * - API & Keys (placeholders)
 * - Audit log (placeholders)
 * All sections ship with demo data and NO backend needed.
 */

/* ----------------------------- Demo Data ----------------------------- */

const KPIS = [
  { label: 'Image P95', value: '10.9 s', tip: '≤ 12 s', ok: true },
  { label: 'Throughput', value: '82 img/min', tip: 'sustained', ok: true },
  { label: 'Success', value: '99.1%', tip: 'Fail ≤ 1%', ok: true },
  { label: 'Auto‑pass', value: '93.0%', tip: '>= 92%', ok: true },
]

const MODELS = [
  { id: 'sdxl_1', name: 'SDXL 1.0', scheduler: 'DPM++ 2M Karras', steps: 20, cfg: 7, res: '768×960 (4:5)', status: 'Active' },
  { id: 'flux_dev', name: 'FLUX Dev', scheduler: 'Euler a', steps: 15, cfg: 6, res: '768×768 (1:1)', status: 'Frozen' },
]

const STYLES = [
  { id: 'ioh_sunset', name: 'IOH Sunset', palette: 'yellow→red', seed: 123456, rules: 'Warm gradient, high contrast' },
  { id: 'promo_card', name: 'Promo Card', palette: 'neutral', seed: 777, rules: 'Centered product, big CTA' },
  { id: 'banner_land', name: 'Landing Banner', palette: 'blue→violet', seed: 202501, rules: 'Wide 16:9, minimal text' },
]

const PROMPTS = [
  { id: 'poster_default', positive: 'studio lighting, brand gradient, clean background', negative: 'lowres, blurry, watermark, text artifact' },
  { id: 'product_on_white', positive: 'isolated product on white, soft shadow, high detail', negative: 'background clutter, watermark' },
]

const JOBS = Array.from({ length: 10 }).map((_, i) => ({
  id: `IMG‑2025‑10‑30‑0${i}`,
  model: i % 2 === 0 ? 'SDXL 1.0' : 'FLUX Dev',
  style: i % 3 === 0 ? 'IOH Sunset' : i % 3 === 1 ? 'Promo Card' : 'Landing Banner',
  state: i % 4 === 0 ? 'Done' : i % 4 === 1 ? 'Running' : i % 4 === 2 ? 'Queued' : 'Error',
  latency: `${(9.8 + (i % 4) * 0.4).toFixed(1)}s`,
  user: 'yoan@ioh',
  created: `2025‑10‑30 11:${(10 + i).toString().padStart(2, '0')}`,
  params: {
    prompt: i % 2 === 0 ? 'Indonesian beach sunset, orange gradient poster' : 'Minimal telecom plan banner',
    negative: 'lowres, text artifacts',
    ratio: i % 3 === 2 ? '16:9' : i % 3 === 1 ? '1:1' : '4:5',
    steps: i % 2 === 0 ? 20 : 15,
    cfg: i % 2 === 0 ? 7 : 6,
    count: (i % 4) + 1 > 4 ? 4 : (i % 4) + 1,
    seed: i % 2 === 0 ? 123456 : null,
    lockSeed: i % 2 === 0,
  },
}))

const API_KEYS = [
  { id: 'key_img_****92f', system: 'Imaging', quota: '120 rps', scope: ['image'], status: 'Active' },
]

/* ------------------------------ Component ----------------------------- */

export default function AIPaintAdminMVP() {
  const [tab, setTab] = useState<
    'overview' | 'queue' | 'presets' | 'models' | 'monitor' | 'api' | 'audit'
  >('overview')
  const [jobs, setJobs] = useState(JOBS)
  const [selected, setSelected] = useState<typeof JOBS[number] | null>(jobs[0])

  return (
    <div className="mx-auto w-full max-w-7xl p-4 md:p-8">
      {/* Header */}
      <header className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-yellow-400 to-red-500"/>
          <div>
            <h1 className="text-xl font-semibold leading-tight">AI Paint — Admin (MVP)</h1>
            <p className="text-sm text-zinc-500">Matches Frontend MVP · Mobile‑aware</p>
          </div>
        </div>
        <nav className="flex flex-wrap gap-2">
          <Tab label="Overview" active={tab === 'overview'} onClick={() => setTab('overview')} />
          <Tab label="Queue" active={tab === 'queue'} onClick={() => setTab('queue')} />
          <Tab label="Presets" active={tab === 'presets'} onClick={() => setTab('presets')} />
          <Tab label="Models" active={tab === 'models'} onClick={() => setTab('models')} />
          <Tab label="Monitoring" active={tab === 'monitor'} onClick={() => setTab('monitor')} />
          <Tab label="API & Keys" active={tab === 'api'} onClick={() => setTab('api')} />
          <Tab label="Audit" active={tab === 'audit'} onClick={() => setTab('audit')} />
        </nav>
      </header>

      {tab === 'overview' && <Overview />}
      {tab === 'queue' && (
        <QueuePane jobs={jobs} onSelect={setSelected} selected={selected} onReplay={j => alert(`Replay ${j.id} with seed=${j.params.lockSeed ? j.params.seed : 'random'}`)} />
      )}
      {tab === 'presets' && <PresetsPane />}
      {tab === 'models' && <ModelsPane />}
      {tab === 'monitor' && <MonitorPane />}
      {tab === 'api' && <ApiPane />}
      {tab === 'audit' && <AuditPane />}

      <div className="pt-3 text-[12px] text-zinc-500">Prototype • Targets: Image P95 ≤12s · Success ≥99% · Fail ≤1%</div>
    </div>
  )
}

/* ------------------------------ Subsections ---------------------------- */

function Overview() {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-4">{KPIS.map(k => <KPI key={k.label} {...k} />)}</div>
      <Card>
        <CardHeader icon={<ImageIcon />} title="Active Models" subtitle="Schedulers & defaults" />
        <div className="grid gap-3 p-4 md:grid-cols-2">
          {MODELS.map(m => (
            <div key={m.id} className="rounded-xl border p-3">
              <div className="font-semibold">{m.name}</div>
              <div className="text-xs text-zinc-500">{m.scheduler}</div>
              <div className="mt-1 text-sm">Steps {m.steps} · CFG {m.cfg} · {m.res}</div>
              <div className="mt-2 text-xs text-emerald-600">{m.status}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

function QueuePane({ jobs, onSelect, selected, onReplay }: { jobs: any[]; onSelect: (j: any) => void; selected: any; onReplay: (j: any) => void; }) {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader icon={<Cpu />} title="Job Queue" subtitle="Recent jobs and states" />
        <div className="p-2">
          <div className="grid grid-cols-12 px-3 text-[12px] text-zinc-500">
            <div className="col-span-3">Job ID</div>
            <div className="col-span-2">Model</div>
            <div className="col-span-2">Style</div>
            <div className="col-span-2">State</div>
            <div className="col-span-2">Latency</div>
            <div className="col-span-1"/>
          </div>
          {jobs.map(j => (
            <div key={j.id} className={`grid grid-cols-12 items-center rounded-xl px-3 py-2 hover:bg-zinc-50 ${selected?.id === j.id ? 'bg-zinc-50' : ''}`}>
              <div className="col-span-3 truncate font-medium" title={j.id}>{j.id}</div>
              <div className="col-span-2 text-sm">{j.model}</div>
              <div className="col-span-2 text-sm">{j.style}</div>
              <div className="col-span-2 text-xs"><StateBadge state={j.state}/></div>
              <div className="col-span-2 text-sm">{j.latency}</div>
              <div className="col-span-1 justify-self-end">
                <button className="rounded-lg border px-2 py-1 text-xs" onClick={() => onSelect(j)}>Details</button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader icon={<History />} title="Job Details" subtitle="Params & actions" />
        <div className="space-y-3 p-4">
          {!selected && <div className="text-sm text-zinc-500">Select a job…</div>}
          {selected && (
            <>
              <div className="text-sm"><span className="text-zinc-500">ID:</span> {selected.id}</div>
              <ParamsBar params={selected.params} />
              <div className="flex items-center gap-2">
                <button className="rounded-lg border px-3 py-1.5 text-sm" onClick={() => onReplay(selected)}>Replay</button>
                <button className="rounded-lg border px-3 py-1.5 text-sm">Cancel</button>
                <button className="rounded-lg border px-3 py-1.5 text-sm"><Download className="mr-1 inline h-4 w-4"/>Export JSON</button>
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  )
}

function PresetsPane() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader icon={<Palette />} title="Style Presets" subtitle="Palette, seed & rules" />
        <div className="p-2">
          <div className="grid grid-cols-12 px-3 text-[12px] text-zinc-500">
            <div className="col-span-3">Name</div>
            <div className="col-span-3">Palette</div>
            <div className="col-span-2">Seed</div>
            <div className="col-span-3">Rules</div>
            <div className="col-span-1"/>
          </div>
          {STYLES.map(s => (
            <div key={s.id} className="grid grid-cols-12 items-center rounded-xl px-3 py-2 hover:bg-zinc-50">
              <div className="col-span-3 font-medium">{s.name}</div>
              <div className="col-span-3 text-sm">{s.palette}</div>
              <div className="col-span-2 text-sm">{s.seed}</div>
              <div className="col-span-3 truncate text-sm text-zinc-600" title={s.rules}>{s.rules}</div>
              <div className="col-span-1 justify-self-end"><button className="rounded-lg border px-2 py-1 text-xs">Edit</button></div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader icon={<Palette />} title="Edit Style" subtitle="Brand palette & composition" />
        <div className="grid gap-4 p-4 md:grid-cols-2">
          <TextField label="Name" placeholder="IOH Sunset" />
          <SelectField label="Palette" options={['IOH‑Sunset', 'IOH‑Neutral', 'IOH‑Blue']} />
          <NumberField label="Seed" value={123456} />
          <TextAreaField label="Rules" placeholder="Warm gradient, high contrast, CTA area reserved" />
          <div className="md:col-span-2"><button className="rounded-lg bg-zinc-900 px-3 py-1.5 text-sm text-white">Save</button></div>
        </div>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader icon={<Database />} title="Prompt Templates" subtitle="Positive / Negative" />
        <div className="grid gap-4 p-4 md:grid-cols-2">
          <div>
            <div className="mb-2 text-xs text-zinc-500">Library</div>
            <ul className="divide-y overflow-hidden rounded-xl border">
              {PROMPTS.map(p => (
                <li key={p.id} className="p-3 hover:bg-zinc-50">
                  <div className="text-sm font-medium">{p.id}</div>
                  <div className="truncate text-xs text-zinc-600" title={p.positive}>{p.positive}</div>
                </li>
              ))}
            </ul>
          </div>
          <div className="grid gap-3">
            <TextField label="ID" placeholder="poster_default" />
            <TextAreaField label="Positive" placeholder="studio lighting, brand gradient, clean background" />
            <TextAreaField label="Negative" placeholder="lowres, blurry, text artifacts" />
            <div><button className="rounded-lg bg-zinc-900 px-3 py-1.5 text-sm text-white">Save</button></div>
          </div>
        </div>
      </Card>
    </div>
  )
}

function ModelsPane() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader icon={<Settings />} title="Model Defaults" subtitle="Backends, scheduler, steps & cfg" />
        <div className="grid gap-4 p-4 md:grid-cols-2">
          <div className="grid gap-3">
            <SelectField label="Model" options={['SDXL 1.0', 'FLUX Dev']} />
            <SelectField label="Scheduler" options={['DPM++ 2M Karras', 'Euler a', 'UniPC']} />
            <NumberField label="Steps (5–50)" value={20} hint="Mobile default 15–20" />
            <NumberField label="CFG (0–15)" value={7} hint="7 common" />
          </div>
          <div className="grid gap-3">
            <SelectField label="Resolution" options={['768×960 (4:5)', '768×768 (1:1)', '1024×576 (16:9)']} />
            <TextAreaField label="Default Negative" placeholder="lowres, watermark, text artifact" />
            <div><button className="rounded-lg bg-zinc-900 px-3 py-1.5 text-sm text-white">Save as Default</button></div>
          </div>
        </div>
      </Card>
    </div>
  )
}

function MonitorPane() {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-4">{KPIS.map(k => <KPI key={k.label} {...k} />)}</div>
      <Card>
        <CardHeader icon={<Activity />} title="Throughput & Latency" subtitle="Realtime charts placeholder" />
        <div className="grid h-40 place-items-center rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-red-50 p-4 text-sm text-amber-700">Charts placeholder</div>
      </Card>
    </div>
  )
}

function ApiPane() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader icon={<KeyRound />} title="API & Keys" subtitle="Endpoints · quotas · scopes" />
        <div className="grid gap-4 p-4 md:grid-cols-2">
          <div className="grid gap-3">
            <TextField label="Image API" placeholder="https://img.api.ioh/generate" />
            <TextField label="Webhook" placeholder="https://img.ioh/hooks" />
            <TextField label="Quota" placeholder="120 rps" />
          </div>
          <div className="space-y-2 rounded-xl border p-3">
            <div className="grid grid-cols-12 px-3 text-[12px] text-zinc-500">
              <div className="col-span-4">Key</div>
              <div className="col-span-3">System</div>
              <div className="col-span-2">Quota</div>
              <div className="col-span-2">Scopes</div>
              <div className="col-span-1">State</div>
            </div>
            {API_KEYS.map(k => (
              <div key={k.id} className="grid grid-cols-12 items-center rounded-xl px-3 py-2 hover:bg-zinc-50">
                <div className="col-span-4 font-medium">{k.id}</div>
                <div className="col-span-3 text-sm">{k.system}</div>
                <div className="col-span-2"><span className="rounded border bg-zinc-100 px-2 py-0.5 text-xs">{k.quota}</span></div>
                <div className="col-span-2 text-xs text-zinc-600">{k.scope.join(', ')}</div>
                <div className="col-span-1"><StateBadge state={k.status} /></div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  )
}

function AuditPane() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader icon={<History />} title="Audit Logs" subtitle="Model/style/safety/queue changes" />
        <div className="overflow-hidden rounded-xl border p-0">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-zinc-500">
              <tr>
                <th className="p-2 text-left">Time</th>
                <th className="p-2 text-left">Actor</th>
                <th className="p-2 text-left">Action</th>
                <th className="p-2 text-left">Target</th>
                <th className="p-2 text-left">Result</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="odd:bg-white even:bg-zinc-50">
                  <td className="p-2">2025‑10‑30 11:{(30 + i).toString().padStart(2, '0')}</td>
                  <td className="p-2">img-admin@ioh</td>
                  <td className="p-2">Update Style</td>
                  <td className="p-2">ioh_sunset</td>
                  <td className="p-2"><StateBadge state="OK"/></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

/* ------------------------------ UI helpers ---------------------------- */

function KPI({ label, value, tip, ok }: any) {
  return (
    <div className="rounded-2xl border bg-white shadow-sm">
      <div className="px-4 pt-3"><div className="text-xs text-zinc-500">{label}</div></div>
      <div className="px-4 pb-1 text-2xl font-semibold">{value}</div>
      <div className="flex items-center gap-2 px-4 pb-3 text-xs text-zinc-500">
        <Shield className={`h-3 w-3 ${ok ? 'text-emerald-600' : 'text-red-600'}`} /> {tip}
      </div>
    </div>
  )
}

function StateBadge({ state }: { state: string }) {
  const cls = state === 'Done' || state === 'Active' || state === 'OK'
    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
    : state === 'Running'
      ? 'bg-amber-50 text-amber-700 border-amber-200'
      : state === 'Queued'
        ? 'bg-zinc-50 text-zinc-700 border-zinc-200'
        : 'bg-red-50 text-red-700 border-red-200'
  return <span className={`rounded border px-2 py-0.5 text-xs ${cls}`}>{state}</span>
}

function ParamsBar({ params }: { params: any }) {
  return (
    <div className="flex flex-wrap gap-2 rounded-xl border p-2 text-xs text-zinc-600">
      <span className="rounded border bg-zinc-50 px-2 py-0.5">Ratio {params.ratio}</span>
      <span className="rounded border bg-zinc-50 px-2 py-0.5">Steps {params.steps}</span>
      <span className="rounded border bg-zinc-50 px-2 py-0.5">CFG {params.cfg}</span>
      <span className="rounded border bg-zinc-50 px-2 py-0.5">Seed {params.lockSeed ? params.seed ?? '—' : 'random'}</span>
      <span className="rounded border bg-zinc-50 px-2 py-0.5">Count x{params.count}</span>
    </div>
  )
}

function Tab({ label, active, onClick }: { label: string; active?: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={['px-3 py-1.5 rounded-lg text-sm transition', active ? 'bg-zinc-900 text-white' : 'bg-zinc-100 hover:bg-zinc-200'].join(' ')}>{label}</button>
  )
}

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={['rounded-2xl border bg-white shadow-sm overflow-hidden', className].filter(Boolean).join(' ')}>{children}</div>
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

function TextField({ label, placeholder }: { label: string; placeholder?: string }) {
  return (
    <div>
      <label className="mb-1 block text-sm text-zinc-600">{label}</label>
      <input placeholder={placeholder} className="w-full rounded-xl border p-2.5" />
    </div>
  )
}
function NumberField({ label, value, hint }: { label: string; value: number; hint?: string }) {
  return (
    <div>
      <label className="mb-1 block text-sm text-zinc-600">{label}</label>
      <input type="number" defaultValue={value} className="w-full rounded-xl border p-2.5" />
      {hint && <div className="mt-1 text-[11px] text-zinc-400">{hint}</div>}
    </div>
  )
}
function TextAreaField({ label, placeholder }: { label: string; placeholder?: string }) {
  return (
    <div>
      <label className="mb-1 block text-sm text-zinc-600">{label}</label>
      <textarea rows={3} placeholder={placeholder} className="w-full rounded-xl border p-2.5" />
    </div>
  )
}
function SelectField({ label, options }: { label: string; options: string[] }) {
  return (
    <div>
      <label className="mb-1 block text-sm text-zinc-600">{label}</label>
      <select className="w-full rounded-xl border p-2.5">{options.map(o => <option key={o}>{o}</option>)}</select>
    </div>
  )
}
