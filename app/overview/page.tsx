import React from 'react'
import OverviewClient from './OverviewClient'

export default function OverviewPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* client-only wrapper that dynamically loads IOH component */}
      <OverviewClient />
    </div>
  )
}
