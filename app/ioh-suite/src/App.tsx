import React, { useState } from 'react'
import LLMPlatformBackend from '@/systems/LLMPlatformBackend'
import OpsSystemBackend from '@/systems/OpsSystemBackend'
import OpsSystemFrontend from '@/systems/OpsSystemFrontend'
import TicketSystemBackend from '@/systems/TicketSystemBackend'
import TicketSystemFrontend from '@/systems/TicketSystemFrontend'
import QASystemBackend from '@/systems/QASystemBackend'
import QASystemFrontend from '@/systems/QASystemFrontend'
import ContentFactoryBackend from '@/systems/ContentFactoryBackend'
import ContentFactoryFrontend from '@/systems/ContentFactoryFrontend'
import AIPaintBackend from '@/systems/AIPaintBackend'
import AIPaintFrontend from '@/systems/AIPaintFrontend'
import { HashRouter as Router } from 'react-router-dom'

type TabId
  = | 'LLMPlatformBackend'
  | 'OpsSystemBackend'
  | 'OpsSystemFrontend'
  | 'TicketSystemBackend'
  | 'TicketSystemFrontend'
  | 'QASystemBackend'
  | 'QASystemFrontend'
  | 'ContentFactoryBackend'
  | 'ContentFactoryFrontend'
  | 'AIPaintBackend'
  | 'AIPaintFrontend'

const tabs: { id: TabId; label: string }[] = [
  { id: 'LLMPlatformBackend', label: 'Model Platform Admin' },
  { id: 'OpsSystemBackend', label: 'Ops System Admin' },
  { id: 'OpsSystemFrontend', label: 'Ops System Portal' },
  { id: 'TicketSystemBackend', label: 'Work Order Admin' },
  { id: 'TicketSystemFrontend', label: 'Work Order Portal' },
  { id: 'QASystemBackend', label: 'Q&A System Admin' },
  { id: 'QASystemFrontend', label: 'Q&A System Portal' },
  { id: 'ContentFactoryBackend', label: 'Content Factory Admin' },
  { id: 'ContentFactoryFrontend', label: 'Content Factory Portal' },
  { id: 'AIPaintBackend', label: 'AI Painting Admin' },
  { id: 'AIPaintFrontend', label: 'AI Painting Portal' },
]

export default function App() {
  const [active, setActive] = useState<TabId>('LLMPlatformBackend')

  return (
    <Router>
      <div className="mx-auto max-w-7xl space-y-4 p-4">
        <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/80 backdrop-blur">
          <div className="mx-auto max-w-7xl p-3">
            <h1 className="text-lg font-semibold">
              IOH · Suite (Template)
            </h1>
            <p className="text-sm text-zinc-600">
              Select a module tab below. Replace files in <code>src/systems</code> later.
            </p>
          </div>
        </header>

        <nav className="flex flex-wrap gap-2">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setActive(t.id)}
              className={`rounded-xl border px-3 py-1.5 text-sm transition
                ${active === t.id ? 'border-zinc-900 bg-zinc-900 text-white' : 'border-zinc-200 bg-white hover:bg-zinc-50'}`}
            >
              {t.label}
            </button>
          ))}
        </nav>

        <main className="rounded-2xl border border-zinc-200 bg-white p-4">
          {active === 'LLMPlatformBackend' && <LLMPlatformBackend />}
          {active === 'OpsSystemBackend' && <OpsSystemBackend />}
          {active === 'OpsSystemFrontend' && <OpsSystemFrontend />}
          {active === 'TicketSystemBackend' && <TicketSystemBackend />}
          {active === 'TicketSystemFrontend' && <TicketSystemFrontend />}
          {active === 'QASystemBackend' && <QASystemBackend />}
          {active === 'QASystemFrontend' && <QASystemFrontend />}
          {active === 'ContentFactoryBackend' && <ContentFactoryBackend />}
          {active === 'ContentFactoryFrontend' && <ContentFactoryFrontend />}
          {active === 'AIPaintBackend' && <AIPaintBackend />}
          {active === 'AIPaintFrontend' && <AIPaintFrontend />}
        </main>

        <footer className="text-xs text-zinc-500">
          Ready to replace: <code>src/systems/*.tsx</code>. Alias <code>@</code> → <code>src</code>.
        </footer>
      </div>
    </Router>
  )
}
