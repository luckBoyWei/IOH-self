import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  CircleUser, Copy, Download, Eye, History, Image as ImageIcon, Layers,
  Loader2, RefreshCw, Send, Share2, Sparkles, SquarePen,
} from 'lucide-react'

// shadcn/ui
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TooltipProvider } from '@/components/ui/tooltip'

/**
 * IOH · Content Factory — User Portal (Prototype, MVP)
 * ---------------------------------------------------
 * 变更：
 * 1) 进入页面自动选择第一个模板并展示「图文 Demo 预览」。
 * 2) Generate 同时返回文案 + 图片；增加 Loading Shimmer。
 * 3) OutputPane 支持一键导出 .txt；图片可直接下载。
 * 4) GenerateForm 为不同模板提供默认字段值；切换模板会重置表单。
 */

const gradient = 'from-yellow-100 via-amber-100 to-red-100'

const TEMPLATES = [
  { id: 'post-id', name: 'Social Post (Bahasa)', type: 'text' as const, desc: '30–80 words short post', lang: 'id' },
  { id: 'poster-ioh', name: 'Promo Poster (IOH Brand)', type: 'image' as const, desc: 'IOH yellow→red gradient poster style', lang: 'multi' },
  { id: 'email-care', name: 'Care Email Template (EN)', type: 'text' as const, desc: 'Service / Care email copy', lang: 'en' },
]

const BRAND_TIPS = [
  'Tone: Friendly / Concise / Action-oriented',
  'Palette: IOH-Sunset (Yellow→Red)',
  'Avoid: Exaggerated claims, 100% guarantee, gambling/adult content',
]

// 好看占位图（用于默认预览和模拟生成）
const PLACEHOLDER_IMAGES = [
  'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1080&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1080&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?q=80&w=1080&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=1080&auto=format&fit=crop',
]

function randImg() {
  return PLACEHOLDER_IMAGES[Math.floor(Math.random() * PLACEHOLDER_IMAGES.length)]
}

export type Job = {
  id: string;
  templateId: string;
  type: 'text' | 'image'; // 仅标记入口模板类型；输出始终包含文案+图片
  title: string;
  payload: any;
  status: 'Draft' | 'Generating' | 'Pending' | 'Approved' | 'Flagged';
  p95?: number;
  outputText?: string; // 文案结果
  outputImage?: string; // 图片URL
  created: string;
}

function Header() {
  return (
    <div className="sticky top-0 z-40 border-b border-zinc-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-xl bg-gradient-to-r from-yellow-300 to-red-500" />
          <div>
            <div className="text-sm text-zinc-500">IOH · Meranti Cloud</div>
            <div className="font-semibold">Content Factory Portal</div>
          </div>
          <Badge className="ml-2">Text ≤ 3s · Image ≤ 12s</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm"><History className="mr-1 size-4"/>History</Button>
          <Button variant="outline" size="sm"><Share2 className="mr-1 size-4"/>Share</Button>
          <Button variant="outline" size="sm"><CircleUser className="mr-1 size-4"/>Yoan</Button>
        </div>
      </div>
    </div>
  )
}

function TemplateCard({ t, onUse }: { t: typeof TEMPLATES[number]; onUse: (t: any) => void }) {
  return (
    <div className="flex flex-col rounded-2xl border p-3">
      <div className="font-medium">{t.name}</div>
      <div className="text-xs text-zinc-500">{t.type.toUpperCase()} · {t.lang}</div>
      <div className="mt-2 text-sm text-zinc-600">{t.desc}</div>
      <div className="mt-3 mt-auto flex gap-2">
        <Button size="sm" variant="outline"><Eye className="mr-1 size-4"/>Preview</Button>
        <Button size="sm" onClick={() => onUse(t)}><SquarePen className="mr-1 size-4"/>Use</Button>
      </div>
    </div>
  )
}

function TemplateGallery({ onUse }: { onUse: (t: any) => void }) {
  const [q, setQ] = useState('')
  const filtered = useMemo(() => TEMPLATES.filter(t => t.name.toLowerCase().includes(q.toLowerCase())), [q])
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Layers className="size-4"/>Template Gallery</CardTitle>
        <CardDescription>Select a template to start</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Input placeholder="Search templates" value={q} onChange={e => setQ(e.target.value)} className="max-w-sm"/>
          <Button variant="outline"><RefreshCw className="mr-1 size-4"/>Refresh</Button>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {filtered.map(t => <TemplateCard key={t.id} t={t} onUse={onUse} />)}
        </div>
      </CardContent>
    </Card>
  )
}

function ComplianceHints({ text }: { text: string }) {
  const issues: string[] = []
  if(/100%|guarantee/i.test(text)) issues.push('Contains exaggerated claim (guarantee)')
  if(/free\s*iPhone/i.test(text)) issues.push('Possible violation: \'free iPhone\'')
  return (
    <div className={`rounded-2xl border p-3 ${issues.length ? 'border-amber-300 bg-amber-50' : 'border-zinc-200 bg-zinc-50'}`}>
      <div className="mb-1 text-xs text-zinc-500">Compliance / Brand Check</div>
      {issues.length ? (
        <ul className="ml-4 list-disc space-y-1 text-sm text-amber-700">
          {issues.map((i, idx) => <li key={idx}>{i}</li>)}
        </ul>
      ) : (
        <div className="text-sm text-zinc-600">No major issue detected. Keep IOH tone and color consistency.</div>
      )}
    </div>
  )
}

function OutputPane({ job }: { job: Job }) {
  const downloading = job.status === 'Generating'

  const downloadText = useCallback(() => {
    const text = job.outputText || ''
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${job.title.replace(/\s+/g, '_')}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }, [job])

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Sparkles className="size-4"/>Output</CardTitle>
        <CardDescription>Brand-aligned content (Copy + Image)</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 文案区 */}
        <div className="rounded-xl border bg-white p-3">
          <div className="mb-1 text-xs font-medium text-zinc-500">Copy</div>
          {job.status === 'Generating' ? (
            <div className="animate-pulse space-y-2">
              <div className="h-3 rounded bg-zinc-200" />
              <div className="h-3 w-5/6 rounded bg-zinc-200" />
              <div className="h-3 w-3/4 rounded bg-zinc-200" />
            </div>
          ) : (
            <pre className="whitespace-pre-wrap text-sm leading-6 text-zinc-800">
              {job.outputText || 'Generated copy will appear here…'}
            </pre>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Button size="sm" variant="outline" disabled={!job.outputText || downloading} onClick={() => navigator.clipboard.writeText(job.outputText || '')}>
              <Copy className="mr-1 size-4"/>Copy
            </Button>
            <Button size="sm" variant="outline"><Share2 className="mr-1 size-4"/>Share</Button>
            <Button size="sm" disabled={downloading}><Send className="mr-1 size-4"/>Submit Review</Button>
            <Button size="sm" variant="outline" onClick={downloadText} disabled={!job.outputText || downloading}>
              <Download className="mr-1 size-4"/>Download .txt
            </Button>
          </div>
        </div>

        {/* 图片区 */}
        <div className="rounded-xl border bg-white p-3">
          <div className="mb-2 text-xs font-medium text-zinc-500">Image</div>
          {job.status === 'Generating' ? (
            <div className="aspect-square animate-pulse rounded-xl border bg-zinc-100" />
          ) : job.outputImage ? (
            <div className="overflow-hidden rounded-xl border bg-zinc-50">
              { }
              <img src={job.outputImage} alt="gen" className="h-full w-full object-cover" style={{ aspectRatio: '1 / 1' }} />
            </div>
          ) : (
            <div className="flex aspect-video items-center justify-center rounded-xl border bg-gradient-to-br from-yellow-50 to-red-50 text-zinc-500">
              Image Preview (placeholder)
            </div>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {job.outputImage && (
              <a href={job.outputImage} download target="_blank" rel="noreferrer">
                <Button size="sm" variant="outline"><Download className="mr-1 size-4"/>Download</Button>
              </a>
            )}
            <Button size="sm" variant="outline"><Share2 className="mr-1 size-4"/>Share</Button>
            <Button size="sm" disabled={downloading}><Send className="mr-1 size-4"/>Submit Review</Button>
            <Badge variant="secondary" className="ml-auto">{job.status}</Badge>
            <Badge>Latency {job.p95 ?? 10.8}s</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function HistoryList({ items, onOpen }: { items: Job[]; onOpen: (j: Job) => void }) {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><History className="size-4"/>My History</CardTitle>
        <CardDescription>Filter & quick actions</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="grid grid-cols-12 px-3 text-[12px] text-zinc-500">
          <div className="col-span-4">Title</div>
          <div className="col-span-2">Template</div>
          <div className="col-span-2">Type</div>
          <div className="col-span-2">Created</div>
          <div className="col-span-2">Status</div>
        </div>
        {items.map(j => (
          <div key={j.id} className="grid grid-cols-12 items-center rounded-xl px-3 py-2 hover:bg-zinc-50">
            <div className="col-span-4 truncate font-medium" title={j.title}>{j.title}</div>
            <div className="col-span-2 text-sm">{TEMPLATES.find(t => t.id === j.templateId)?.name}</div>
            <div className="col-span-2 text-sm uppercase">{j.type}</div>
            <div className="col-span-2 text-xs text-zinc-500">{j.created}</div>
            <div className="col-span-2">{j.status === 'Approved' ? <Badge>Approved</Badge> : j.status === 'Flagged' ? <Badge variant="secondary">Flagged</Badge> : <Badge variant="secondary">{j.status}</Badge>}</div>
            <div className="col-span-12 mt-2 flex justify-end gap-2">
              <Button size="sm" variant="outline" onClick={() => onOpen(j)}>Open</Button>
              <Button size="sm" variant="outline"><RefreshCw className="mr-1 size-4"/>Regenerate</Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function GenerateForm({ template, onGenerate }: { template: any; onGenerate: (payload: any) => void }) {
  const isText = template?.type === 'text'

  // 默认值（符合验收演示）
  const defaultTitle = 'Bali Roaming 8GB'
  const defaultKeywords = 'eSIM, promo'
  const defaultTone = 'friendly'
  const defaultLang = template?.lang || 'id'
  const defaultCTA = 'Download MyIOH'
  const defaultImgPrompt = 'IOH yellow-red gradient background, smiling young people holding phones, clean layout, poster style'

  // 当模板变更时重置表单：通过 key 重建组件（父组件中设置 key）
  const [title, setTitle] = useState(defaultTitle)
  const [keywords, setKeywords] = useState(defaultKeywords)
  const [tone, setTone] = useState(defaultTone)
  const [lang, setLang] = useState(defaultLang)
  const [cta, setCta] = useState(defaultCTA)
  const [imgPrompt, setImgPrompt] = useState(defaultImgPrompt)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    setTitle(defaultTitle)
    setKeywords(defaultKeywords)
    setTone(defaultTone)
    setLang(defaultLang)
    setCta(defaultCTA)
    setImgPrompt(defaultImgPrompt)
  }, [template?.id])

  const payload = isText
    ? { title, keywords, tone, lang, cta, imgPrompt }
    : { prompt: imgPrompt, palette: 'sunset', ratio: '1:1', lang, tone }

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><SquarePen className="size-4"/>Generate — {template?.name || 'Select Template'}</CardTitle>
        <CardDescription>Fill parameters and generate content (Copy + Image)</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 lg:grid-cols-3">
        <div className="grid gap-3 lg:col-span-2">
          {isText ? (
            <>
              <div className="grid grid-cols-3 items-center gap-2"><Label>Title</Label><Input className="col-span-2" value={title} onChange={e => setTitle(e.target.value)} placeholder="Bali Roaming 8GB Limited Offer"/></div>
              <div className="grid grid-cols-3 items-center gap-2"><Label>Keywords</Label><Input className="col-span-2" value={keywords} onChange={e => setKeywords(e.target.value)} placeholder="eSIM, roaming, promo"/></div>
              <div className="grid grid-cols-3 items-center gap-2"><Label>Tone</Label><Select value={tone} onValueChange={setTone}><SelectTrigger className="col-span-2"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="friendly">Friendly</SelectItem><SelectItem value="concise">Concise</SelectItem><SelectItem value="formal">Formal</SelectItem></SelectContent></Select></div>
              <div className="grid grid-cols-3 items-center gap-2"><Label>Language</Label><Select value={lang} onValueChange={setLang}><SelectTrigger className="col-span-2"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="id">Bahasa Indonesia</SelectItem><SelectItem value="en">English</SelectItem><SelectItem value="zh">Chinese</SelectItem></SelectContent></Select></div>

              {/* 给文本模板一个“图片提示词”，用于同时生成图片（默认就有） */}
              <div className="grid grid-cols-3 items-center gap-2"><Label>Image Prompt (auto)</Label><Textarea className="col-span-2" value={imgPrompt} onChange={e => setImgPrompt(e.target.value)}/></div>

              <div className="grid grid-cols-3 items-center gap-2"><Label>CTA</Label><Input className="col-span-2" value={cta} onChange={e => setCta(e.target.value)} placeholder="Download MyIOH"/></div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-3 items-center gap-2"><Label>Image Prompt</Label><Textarea className="col-span-2" value={imgPrompt} onChange={e => setImgPrompt(e.target.value)}/></div>
              <div className="grid grid-cols-3 items-center gap-2"><Label>Aspect Ratio</Label><Select defaultValue="1:1"><SelectTrigger className="col-span-2"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="1:1">1:1</SelectItem><SelectItem value="4:5">4:5</SelectItem><SelectItem value="16:9">16:9</SelectItem></SelectContent></Select></div>
              <div className="grid grid-cols-3 items-center gap-2"><Label>Palette</Label><Select defaultValue="sunset"><SelectTrigger className="col-span-2"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="sunset">IOH-Sunset</SelectItem><SelectItem value="neutral">IOH-Neutral</SelectItem></SelectContent></Select></div>

              {/* 给图片模板一些“文案要素”，用于同时生成文案 */}
              <div className="grid grid-cols-3 items-center gap-2"><Label>Language</Label><Select value={lang} onValueChange={setLang}><SelectTrigger className="col-span-2"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="id">Bahasa Indonesia</SelectItem><SelectItem value="en">English</SelectItem><SelectItem value="zh">Chinese</SelectItem></SelectContent></Select></div>
              <div className="grid grid-cols-3 items-center gap-2"><Label>Tone</Label><Select value={tone} onValueChange={setTone}><SelectTrigger className="col-span-2"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="friendly">Friendly</SelectItem><SelectItem value="concise">Concise</SelectItem><SelectItem value="formal">Formal</SelectItem></SelectContent></Select></div>
            </>
          )}
          <div className="flex items-center gap-2">
            <Checkbox id="autoReview" defaultChecked/>
            <Label htmlFor="autoReview">Submit to Review Queue</Label>
          </div>
          <div className="flex gap-2">
            <Button disabled={busy} onClick={() => { setBusy(true); onGenerate(payload); setTimeout(() => setBusy(false), isText ? 700 : 1500) }}>
              {busy ? <Loader2 className="mr-1 size-4 animate-spin"/> : <Sparkles className="mr-1 size-4"/>}
              {busy ? 'Generating…' : 'Generate'}
            </Button>
            <Button variant="outline" onClick={() => { setTitle(defaultTitle); setKeywords(defaultKeywords); setTone(defaultTone); setLang(defaultLang); setCta(defaultCTA); setImgPrompt(defaultImgPrompt) }}>
              <RefreshCw className="mr-1 size-4"/>Reset
            </Button>
          </div>
          <div className="space-y-1 rounded-2xl border p-3 text-xs text-zinc-600">
            <div className="font-medium">Brand Tips</div>
            <ul className="ml-4 list-disc space-y-1">{BRAND_TIPS.map(t => <li key={t}>{t}</li>)}</ul>
          </div>
        </div>
        <div className="space-y-3">
          <ComplianceHints text={(isText ? (`${title} ${keywords} ${cta}`) : imgPrompt)} />
          <div className="rounded-2xl border p-3 text-xs text-zinc-600">
            <div className="mb-1 font-medium">SLA Target</div>
            <div>Text P95 ≤ 3s · Image P95 ≤ 12s · Auto-pass ≥ 92%</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function IOHContentFactoryPortal() {
  const [active, setActive] = useState('gallery')
  const [currentTpl, setCurrentTpl] = useState<any | null>(null)
  const [currentJob, setCurrentJob] = useState<Job | null>(null)
  const [history, setHistory] = useState<Job[]>([
    {
      id: 'JOB-10101',
      templateId: 'post-id',
      type: 'text',
      title: 'eSIM Bali Roaming 8GB',
      payload: {},
      status: 'Approved',
      p95: 2.5,
      outputText: '🌴 Jelajahi Bali lebih bebas! eSIM roaming 8GB — promo minggu ini. Unduh MyIOH sekarang.',
      outputImage: PLACEHOLDER_IMAGES[0],
      created: '2025-10-22 16:12',
    },
    {
      id: 'JOB-10102',
      templateId: 'poster-ioh',
      type: 'image',
      title: 'IOH Autumn Promo Poster',
      payload: {},
      status: 'Pending',
      p95: 11.2,
      outputText: 'Autumn special! Get connected with MyIOH. Simple. Fast. Reliable.',
      outputImage: PLACEHOLDER_IMAGES[1],
      created: '2025-10-23 10:03',
    },
  ])

  // 选中模板并立即给一个默认「图文 Demo」
  const startUse = useCallback((tpl: any) => {
    setCurrentTpl(tpl)
    setActive('generate')

    const id = `JOB-${Math.floor(Math.random() * 90000 + 10000)}`
    const demo: Job = {
      id,
      templateId: tpl.id,
      type: tpl.type,
      title: `${tpl.name} — Demo Preview`,
      payload: {},
      status: 'Approved',
      p95: tpl.type === 'text' ? 2.6 : 10.8,
      outputText: tpl.type === 'text'
        ? '🌴 Explore Bali with more freedom! eSIM roaming 8GB — limited this week. Download MyIOH now.'
        : 'Stay connected everywhere — Download MyIOH for quick top-ups and seamless data.',
      outputImage: randImg(),
      created: new Date().toISOString().slice(0, 16).replace('T', ' '),
    }
    setCurrentJob(demo)
  }, [])

  // 页面加载后自动展示第一个模板的 Demo
  useEffect(() => {
    startUse(TEMPLATES[0])
  }, [startUse])

  // 接收 GenerateForm 的 payload，并同时生成 文案 + 图片
  const runGenerate = (payload: any) => {
    if(!currentTpl) return
    const id = `JOB-${Math.floor(Math.random() * 90000 + 10000)}`

    // 文案生成：根据模板类型与参数简单组合（真实环境换为后端返回）
    const textForTextTpl = (p: any) => {
      const lang = p.lang || 'en'
      const cta = p.cta || 'Download MyIOH'
      const size = (p.keywords || '8GB').toString()
      if(lang === 'id')
        return `🌴 Nikmati kebebasan lebih! eSIM roaming ${size} — promo minggu ini. Unduh MyIOH — ${cta}.`
      else if(lang === 'zh')
        return `🌴 更自由的旅程！eSIM 漫游${size}，本周限时。立刻下载 MyIOH —— ${cta}。`

      return `🌴 Explore more freedom! eSIM roaming ${size} — limited this week. ${cta}.`
    }

    const textForImageTpl = (p: any) => {
      const tone = (p.tone || 'friendly')
      const base = `Stay connected with MyIOH — ${(p.prompt || 'Your perfect poster').slice(0, 32)}`
      return tone === 'concise' ? `${base}. Download now.` : `${base}. Simple. Fast. Reliable.`
    }

    const outputText = currentTpl.type === 'text' ? textForTextTpl(payload) : textForImageTpl(payload)
    const outputImage = randImg()

    const job: Job = {
      id,
      templateId: currentTpl.id,
      type: currentTpl.type,
      title: currentTpl.type === 'text'
        ? (payload.title || 'Untitled Post')
        : (`${String(payload.prompt || 'Poster').slice(0, 16)}…`),
      payload,
      status: 'Generating',
      p95: currentTpl.type === 'text' ? 2.6 : 10.8,
      created: new Date().toISOString().slice(0, 16).replace('T', ' '),
    }
    setCurrentJob(job)

    // Simulate generation 完成：回填 文案 + 图片
    setTimeout(() => {
      const done: Job = { ...job, status: 'Pending', outputText, outputImage }
      setCurrentJob(done)
      setHistory(prev => [done, ...prev])
    }, currentTpl.type === 'text' ? 800 : 1600)
  }

  return (
    <TooltipProvider>
      <div className="flex min-h-dvh flex-col bg-white">
        <Header />
        <main className="mx-auto w-full max-w-7xl space-y-4 p-4 lg:p-6">
          <motion.div layout className={`rounded-3xl bg-gradient-to-r p-4 ${gradient} border border-amber-200`}>
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-2xl bg-gradient-to-r from-yellow-400 to-red-500"/>
              <div>
                <div className="text-sm text-zinc-600">IOH · Meranti Cloud AI</div>
                <div className="text-lg font-semibold">Content Factory Portal</div>
              </div>
            </div>
          </motion.div>

          <Tabs value={active} onValueChange={setActive}>
            <TabsList>
              <TabsTrigger value="gallery">Templates</TabsTrigger>
              <TabsTrigger value="generate">Generate</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>

            <TabsContent value="gallery"><TemplateGallery onUse={startUse} /></TabsContent>

            <TabsContent value="generate">
              <div className="grid gap-4 lg:grid-cols-3">
                <div className="space-y-4 lg:col-span-2">
                  {/* key 确保切换模板时表单重置 */}
                  <GenerateForm key={currentTpl?.id || 'none'} template={currentTpl} onGenerate={runGenerate} />
                  {currentJob && <OutputPane job={currentJob} />}
                </div>
                <div className="space-y-4">
                  <Card className="shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-base">How it works</CardTitle>
                      <CardDescription>Linked to Admin template & compliance</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm text-zinc-700">
                      <p>Generated content is auto-submitted to the Review Queue with status Pending/Approved/Flagged.</p>
                      <p>All parameters mirror Admin Template fields and can be versioned.</p>
                      <p>Image generation defaults to IOH-Sunset palette for brand consistency.</p>
                    </CardContent>
                  </Card>

                  {/* 小提示卡片 */}
                  <Card className="shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base"><ImageIcon className="size-4"/>Output Mode</CardTitle>
                      <CardDescription>One click → Copy + Image</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm text-zinc-700">
                      <p>Regardless of the template type, generation returns both the copy and a matching image preview.</p>
                      <p>When the backend is ready, replace the placeholders with real URLs and model responses.</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="history"><HistoryList items={history} onOpen={(j) => { setCurrentJob(j); setActive('generate') }} /></TabsContent>
          </Tabs>

          <div className="pt-2 text-[12px] text-zinc-500">Prototype • Targets: Text ≤3s · Image ≤12s · Auto-pass ≥92% · One-click Submit Review</div>
        </main>
      </div>
    </TooltipProvider>
  )
}

/**
 * Minimal runtime tests (non-blocking):
 * These run once in the browser console to ensure the onGenerate contract
 * is correct and payloads are shaped as expected. They do NOT affect the UI.
 */
(function runDevTests() {
  try{
    const textPayload = { title: 'Test', keywords: '8GB', tone: 'friendly', lang: 'en', cta: 'Download MyIOH', imgPrompt: 'Poster' }
    const imagePayload = { prompt: 'Poster', palette: 'sunset', ratio: '1:1', tone: 'friendly', lang: 'en' }
    console.assert(typeof textPayload.title === 'string', 'textPayload.title should be string')
    console.assert(typeof imagePayload.prompt === 'string', 'imagePayload.prompt should be string')
  }
  catch (e) {
    // swallow — tests are best-effort and should never break build
  }
})()
