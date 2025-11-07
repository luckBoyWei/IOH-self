import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  BookMarked, ClipboardCheck, Gauge, KeyRound,
  Rocket, Settings, ShieldCheck, Tag, Wand2,
} from 'lucide-react'

// shadcn/ui
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TooltipProvider } from '@/components/ui/tooltip'

/**
 * IOH · Content Factory — Admin Console (MVP)
 * ---------------------------------------------------
 * 与前台（ContentFactoryFrontend_MVP）对齐的最简后台原型：
 * 1) Templates（模板中心）
 * 2) Brand & Compliance（品牌/合规）
 * 3) Models & Routing（文本/出图与路由）
 * 4) Review Queue（前台“Submit Review”对接队列）
 * 5) Metrics（吞吐/时延占位）
 * 6) Access & Keys（接口地址与密钥占位）
 *
 * 所有面板均内置演示数据，开箱即可“看效果”。
 */

const KPIS = [
  { label: 'Text P95', value: '2.6 s', tip: '≤ 3 s', ok: true },
  { label: 'Image P95', value: '10.8 s', tip: '≤ 12 s', ok: true },
  { label: 'Auto‑pass', value: '93.2%', tip: '>= 92%', ok: true },
  { label: 'Fail Rate', value: '0.7%', tip: '≤ 1%', ok: true },
]

const DEFAULT_TEMPLATES = [
  { id: 'T-post-id', name: 'Social Post (Bahasa)', type: 'Text', fields: 'title, keywords, tone, cta', lang: 'id' },
  { id: 'T-poster-ioh', name: 'Promo Poster (IOH Brand)', type: 'Image', fields: 'headline, sub, price, bg', lang: 'multi' },
  { id: 'T-email-care', name: 'Care Email (EN)', type: 'Text', fields: 'audience, issue, cta', lang: 'en' },
]

const DEFAULT_BRAND = {
  tones: ['Friendly', 'Concise', 'Action‑oriented'],
  palettes: ['IOH‑Sunset (yellow→red)', 'IOH‑Neutral (zinc)'],
  slogans: ['Grow with IOH', 'Meranti Cloud AI'],
  whitelist: ['IOH', 'Meranti', 'Tri', 'IM3', 'Indosat Ooredoo Hutchison'],
  blocklist: ['free iPhone', '100% guarantee', 'Adult Content', 'Gambling Content'],
}

const DEFAULT_REVIEW = [
  { id: 'R-2025-1001', type: 'Text', template: 'Social Post (Bahasa)', risk: 0.12, status: 'Pending', issues: [], ts: '2025-10-24 10:40' },
  { id: 'R-2025-1002', type: 'Image', template: 'Promo Poster (IOH Brand)', risk: 0.31, status: 'Flagged', issues: ['Brand color deviation', 'Possible price guarantee claim'], ts: '2025-10-24 10:38' },
  { id: 'R-2025-1003', type: 'Text', template: 'Care Email (EN)', risk: 0.07, status: 'Pending', issues: [], ts: '2025-10-24 10:35' },
]

const DEFAULT_KEYS = [
  { id: 'key_cf_****a1b', system: 'ContentFactory', quota: '200 rps', scope: ['text', 'image'], status: 'Active' },
]

function Header() {
  return (
    <div className="sticky top-0 z-40 border-b border-zinc-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-xl bg-gradient-to-r from-yellow-300 to-red-500" />
          <div>
            <div className="text-sm text-zinc-500">IOH · Meranti Cloud</div>
            <div className="font-semibold">Content Factory Admin</div>
          </div>
          <Badge className="ml-2">Text ≤ 3s · Image ≤ 12s</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm"><Settings className="mr-1 size-4"/>Settings</Button>
        </div>
      </div>
    </div>
  )
}

function KPI({ label, value, tip, ok }: any) {
  return (
    <Card className="border-zinc-200 shadow-sm">
      <CardHeader className="pb-2">
        <CardDescription className="text-xs text-zinc-500">{label}</CardDescription>
        <CardTitle className="text-2xl">{value}</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center gap-2 text-xs text-zinc-500">
        <ShieldCheck className={`size-3 ${ok ? 'text-emerald-600' : 'text-red-600'}`} /> {tip}
      </CardContent>
    </Card>
  )
}

function OverviewPane() {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-4">{KPIS.map(k => <KPI key={k.label} {...k} />)}</div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><BookMarked className="size-4"/>Templates</CardTitle>
          <CardDescription>Text & Image presets</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          {DEFAULT_TEMPLATES.map(t => (
            <div key={t.id} className="rounded-xl border p-3">
              <div className="font-semibold">{t.name}</div>
              <div className="text-xs text-zinc-500">{t.type} · {t.lang}</div>
              <div className="mt-2 text-xs text-zinc-600">Fields: {t.fields}</div>
              <div className="mt-2 flex gap-2"><Button size="sm" variant="outline">Edit</Button><Button size="sm">Publish</Button></div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

function TemplatesPane() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Template List</CardTitle>
          <CardDescription>Versioning · fields · publish state</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-12 px-3 text-[12px] text-zinc-500">
            <div className="col-span-4">Name</div>
            <div className="col-span-2">Type</div>
            <div className="col-span-3">Fields</div>
            <div className="col-span-2">Language</div>
            <div className="col-span-1"/>
          </div>
          {DEFAULT_TEMPLATES.map(t => (
            <div key={t.id} className="grid grid-cols-12 items-center rounded-xl px-3 py-2 hover:bg-zinc-50">
              <div className="col-span-4 font-medium">{t.name}</div>
              <div className="col-span-2 text-sm">{t.type}</div>
              <div className="col-span-3 text-sm text-zinc-600">{t.fields}</div>
              <div className="col-span-2 text-sm">{t.lang}</div>
              <div className="col-span-1 justify-self-end"><Button size="sm" variant="outline">Edit</Button></div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Edit Template</CardTitle>
          <CardDescription>Fields · prompts · output rules</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-3">
            <div className="grid grid-cols-3 items-center gap-2"><Label>Name</Label><Input className="col-span-2" placeholder="Promotional poster (IOH brand)"/></div>
            <div className="grid grid-cols-3 items-center gap-2"><Label>Type</Label><Select defaultValue="image"><SelectTrigger className="col-span-2"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="text">Text</SelectItem><SelectItem value="image">Image</SelectItem></SelectContent></Select></div>
            <div className="grid grid-cols-3 items-center gap-2"><Label>Fields</Label><Textarea className="col-span-2" placeholder={'headline, sub, price, bg'}/></div>
            <div className="grid grid-cols-3 items-center gap-2"><Label>Language</Label><Select defaultValue="multi"><SelectTrigger className="col-span-2"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="id">Bahasa Indonesia</SelectItem><SelectItem value="en">English</SelectItem><SelectItem value="zh">中文</SelectItem><SelectItem value="multi">Multi</SelectItem></SelectContent></Select></div>
          </div>
          <div className="grid gap-3">
            <div className="grid grid-cols-3 items-center gap-2"><Label>Prompt</Label><Textarea className="col-span-2" placeholder={'You are IOH brand writer. Tone=Friendly, concise...'}/></div>
            <div className="grid grid-cols-3 items-center gap-2"><Label>Output Rules</Label><Textarea className="col-span-2" placeholder={'No price guarantee; Use brand terms; Max 120 words.'}/></div>
            <Button>Save</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function BrandPane() {
  return (
    <div className="space-y-4">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Brand Terms</CardTitle>
          <CardDescription>Whitelist for product/brand words</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-3">
            <Textarea defaultValue={DEFAULT_BRAND.whitelist.join('\n')} className="h-40"/>
            <Button>Save</Button>
          </div>
          <div className="space-y-2 rounded-xl border p-3 text-sm text-zinc-600">
            <div className="font-medium">Tone & Slogan</div>
            <div>Preferred Tones: {DEFAULT_BRAND.tones.join(', ')}</div>
            <div>Palettes: {DEFAULT_BRAND.palettes.join(', ')}</div>
            <div>Slogans: {DEFAULT_BRAND.slogans.join(', ')}</div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Blocklist & Compliance</CardTitle>
          <CardDescription>Forbidden words/claims • regex rules</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-3">
            <Textarea defaultValue={DEFAULT_BRAND.blocklist.join('\n')} className="h-40"/>
            <div className="grid grid-cols-3 items-center gap-2"><Label>Regex Rules</Label><Textarea className="col-span-2" placeholder={'price\s*(guarantee|guaranteed)\nfree\s*iPhone'}/></div>
            <Button>Save</Button>
          </div>
          <div className="grid gap-3">
            <div className="grid grid-cols-3 items-center gap-2"><Label>Legal Footer</Label><Textarea className="col-span-2" placeholder={'* T&C apply. Images are for illustration...'}/></div>
            <div className="grid grid-cols-3 items-center gap-2"><Label>Low‑Conf Fallback</Label><Switch className="col-span-2" defaultChecked/></div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function ModelsPane() {
  return (
    <div className="space-y-4">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Text Models</CardTitle>
          <CardDescription>LLM, temperature, max tokens</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-3">
            <div className="grid grid-cols-3 items-center gap-2"><Label>LLM</Label><Select defaultValue="llama"><SelectTrigger className="col-span-2"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="llama">LLaMA 70B</SelectItem><SelectItem value="qwen">Qwen 72B</SelectItem><SelectItem value="gemma">Gemma 27B</SelectItem></SelectContent></Select></div>
            <div className="grid grid-cols-3 items-center gap-2"><Label>Max Tokens</Label><Input className="col-span-2" placeholder="512"/></div>
            <div className="grid grid-cols-3 items-center gap-2"><Label>Temperature</Label><Input className="col-span-2" placeholder="0.7"/></div>
          </div>
          <div className="grid gap-3">
            <div className="grid grid-cols-3 items-center gap-2"><Label>Style</Label><Select defaultValue="friendly"><SelectTrigger className="col-span-2"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="friendly">Friendly</SelectItem><SelectItem value="concise">Concise</SelectItem><SelectItem value="formal">Formal</SelectItem></SelectContent></Select></div>
            <div className="grid grid-cols-3 items-center gap-2"><Label>Language</Label><Select defaultValue="id"><SelectTrigger className="col-span-2"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="id">Bahasa</SelectItem><SelectItem value="en">English</SelectItem><SelectItem value="zh">中文</SelectItem></SelectContent></Select></div>
            <Button>Save</Button>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Image Models</CardTitle>
          <CardDescription>Diffusion presets & brand palette</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-3">
            <div className="grid grid-cols-3 items-center gap-2"><Label>Model</Label><Select defaultValue="sdxl"><SelectTrigger className="col-span-2"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="sdxl">SDXL</SelectItem><SelectItem value="flux">FLUX</SelectItem><SelectItem value="koala">Koala‑Diffusion</SelectItem></SelectContent></Select></div>
            <div className="grid grid-cols-3 items-center gap-2"><Label>Steps</Label><Input className="col-span-2" placeholder="30"/></div>
            <div className="grid grid-cols-3 items-center gap-2"><Label>CFG Scale</Label><Input className="col-span-2" placeholder="7.5"/></div>
          </div>
          <div className="grid gap-3">
            <div className="grid grid-cols-3 items-center gap-2"><Label>Seed</Label><Input className="col-span-2" placeholder="12345"/></div>
            <div className="grid grid-cols-3 items-center gap-2"><Label>Palette</Label><Select defaultValue="sunset"><SelectTrigger className="col-span-2"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="sunset">IOH‑Sunset</SelectItem><SelectItem value="neutral">IOH‑Neutral</SelectItem></SelectContent></Select></div>
            <Button>Save</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function ReviewPane() {
  return (
    <div className="space-y-4">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Review Queue</CardTitle>
          <CardDescription>Auto checks → manual approval</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-12 px-3 text-[12px] text-zinc-500">
            <div className="col-span-3">ID</div>
            <div className="col-span-2">Type</div>
            <div className="col-span-3">Template</div>
            <div className="col-span-2">Risk</div>
            <div className="col-span-1">Status</div>
            <div className="col-span-1"/>
          </div>
          {DEFAULT_REVIEW.map(r => (
            <div key={r.id} className="grid grid-cols-12 items-center rounded-xl px-3 py-2 hover:bg-zinc-50">
              <div className="col-span-3 font-medium">{r.id}</div>
              <div className="col-span-2 text-sm">{r.type}</div>
              <div className="col-span-3 text-sm">{r.template}</div>
              <div className="col-span-2 text-sm">{Math.round(r.risk * 100)}%</div>
              <div className="col-span-1">{r.status === 'Pending' ? <Badge>Pending</Badge> : <Badge variant="secondary">Flagged</Badge>}</div>
              <div className="col-span-1 justify-self-end"><Button size="sm" variant="outline">Actions</Button></div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Auto Checks</CardTitle>
          <CardDescription>Brand palette · tone · blocklist · NSFW</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-3">
            <div className="grid grid-cols-3 items-center gap-2"><Label>Brand Palette</Label><Switch className="col-span-2" defaultChecked/></div>
            <div className="grid grid-cols-3 items-center gap-2"><Label>Blocklist</Label><Switch className="col-span-2" defaultChecked/></div>
            <div className="grid grid-cols-3 items-center gap-2"><Label>NSFW</Label><Switch className="col-span-2" defaultChecked/></div>
          </div>
          <div className="grid gap-3">
            <div className="grid grid-cols-3 items-center gap-2"><Label>Min Score</Label><Input className="col-span-2" placeholder="0.85"/></div>
            <div className="grid grid-cols-3 items-center gap-2"><Label>Human Sample</Label><Input className="col-span-2" placeholder="10%"/></div>
            <Button>Save</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function MetricsPane() {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-4">{KPIS.map(k => <KPI key={k.label} {...k} />)}</div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Rocket className="size-4"/>Throughput & Latency</CardTitle>
          <CardDescription>Realtime charts placeholder</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-32 items-center justify-center rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-red-50 text-sm text-amber-700">Charts placeholder</div>
        </CardContent>
      </Card>
    </div>
  )
}

function AccessPane() {
  return (
    <div className="space-y-4">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Endpoints</CardTitle>
          <CardDescription>Match Frontend mock API contract</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-3">
            <div className="grid grid-cols-3 items-center gap-2"><Label>Text API</Label><Input className="col-span-2" placeholder="/api/content/jobs/:id/generate"/></div>
            <div className="grid grid-cols-3 items-center gap-2"><Label>Image API</Label><Input className="col-span-2" placeholder="/api/image/tasks"/></div>
            <div className="grid grid-cols-3 items-center gap-2"><Label>Webhook</Label><Input className="col-span-2" placeholder="/api/hooks/review-callback"/></div>
          </div>
          <div className="space-y-2 rounded-xl border p-3">
            <div className="grid grid-cols-12 px-3 text-[12px] text-zinc-500">
              <div className="col-span-4">Key</div>
              <div className="col-span-3">System</div>
              <div className="col-span-2">Quota</div>
              <div className="col-span-2">Scopes</div>
              <div className="col-span-1">State</div>
            </div>
            {DEFAULT_KEYS.map(k => (
              <div key={k.id} className="grid grid-cols-12 items-center rounded-xl px-3 py-2 hover:bg-zinc-50">
                <div className="col-span-4 flex items-center gap-2 font-medium"><KeyRound className="size-4" />{k.id}</div>
                <div className="col-span-3 text-sm">{k.system}</div>
                <div className="col-span-2"><Badge variant="secondary">{k.quota}</Badge></div>
                <div className="col-span-2 text-xs text-zinc-600">{k.scope.join(', ')}</div>
                <div className="col-span-1">{k.status === 'Active' ? <Badge>Active</Badge> : <Badge variant="secondary">Suspended</Badge>}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function ContentFactoryAdminMVP() {
  const [tab, setTab] = useState('overview')

  return (
    <TooltipProvider>
      <div className="flex min-h-dvh flex-col bg-white">
        <Header />
        <main className="mx-auto w-full max-w-7xl space-y-4 p-4 lg:p-6">
          <motion.div layout className="rounded-3xl border border-amber-200 bg-gradient-to-r from-yellow-100 via-amber-100 to-red-100 p-4">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-2xl bg-gradient-to-r from-yellow-400 to-red-500"/>
              <div>
                <div className="text-sm text-zinc-600">IOH · Meranti Cloud AI</div>
                <div className="text-lg font-semibold">Content Factory Admin</div>
              </div>
            </div>
          </motion.div>

          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="overview"><Gauge className="mr-1 size-3"/>Overview</TabsTrigger>
              <TabsTrigger value="templates"><BookMarked className="mr-1 size-3"/>Templates</TabsTrigger>
              <TabsTrigger value="brand"><Tag className="mr-1 size-3"/>Brand & Compliance</TabsTrigger>
              <TabsTrigger value="models"><Wand2 className="mr-1 size-3"/>Models & Routing</TabsTrigger>
              <TabsTrigger value="review"><ClipboardCheck className="mr-1 size-3"/>Review Queue</TabsTrigger>
              <TabsTrigger value="metrics"><Rocket className="mr-1 size-3"/>Metrics</TabsTrigger>
              <TabsTrigger value="access"><KeyRound className="mr-1 size-3"/>Access & Keys</TabsTrigger>
            </TabsList>

            <TabsContent value="overview"><OverviewPane /></TabsContent>
            <TabsContent value="templates"><TemplatesPane /></TabsContent>
            <TabsContent value="brand"><BrandPane /></TabsContent>
            <TabsContent value="models"><ModelsPane /></TabsContent>
            <TabsContent value="review"><ReviewPane /></TabsContent>
            <TabsContent value="metrics"><MetricsPane /></TabsContent>
            <TabsContent value="access"><AccessPane /></TabsContent>
          </Tabs>

          <div className="pt-2 text-[12px] text-zinc-500">Prototype • Targets: Text ≤3s · Image ≤12s · Auto‑pass ≥92% · Fail ≤1%</div>
        </main>
      </div>
    </TooltipProvider>
  )
}
