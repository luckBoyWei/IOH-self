'use client'

import dynamic from 'next/dynamic'
import React from 'react'

const IOHStage1MVP = dynamic(() => import('../../ioh-suite/src/systems/LLMPlatformBackend'), { ssr: false })

export default function OverviewClient() {
  return (
    <div className="min-h-screen bg-white">
      <IOHStage1MVP />
    </div>
  )
}
