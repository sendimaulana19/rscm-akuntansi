'use client'
import { useState } from 'react'
import Link from 'next/link'
import { FileCheck, Clock, TrendingUp } from 'lucide-react'
import DokumenTagihanTab from './DokumenTagihanTab'
import SlaTab from './SlaTab'
import BaTutupTagihanTab from './BaTutupTagihanTab'

export default function AdminAkuntansiVerifikasi() {
  const [activeAdminTab, setActiveAdminTab] = useState<'dokumen_tagihan' | 'sla' | 'ba_tutup_tagihan'>('dokumen_tagihan')
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  const handleSetMessage = (msg: { type: 'ok' | 'err'; text: string } | null) => {
    setMessage(msg)
    if (msg) {
      setTimeout(() => setMessage(null), 5000)
    }
  }

  return (
    <div className="min-h-screen" style={{ background: '#f0f4f5' }}>
      {/* Header Bar */}
      <div style={{ background: '#00282b' }} className="px-4 sm:px-6 py-6">
        <div className="max-w-6xl mx-auto">
          <p className="font-nav text-xs text-white/50 mb-1">
            <Link href="/admin/dashboard" className="hover:text-white transition-colors">
              ← Dashboard Admin
            </Link>
          </p>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="font-nav font-bold text-white text-xl">
                Kelola Akuntansi Verifikasi
              </h1>
              <p className="font-nav text-xs text-white/60 mt-0.5">
                Input data langsung pada tabel spreadsheet atau copy-paste dari Excel untuk Dokumen Tagihan, SLA, dan BA Tutup Tagihan.
              </p>
            </div>

            <Link
              href="/akuntansi-verifikasi"
              target="_blank"
              className="px-4 py-2 rounded-xl text-xs font-nav font-bold text-[#00282b] bg-[#d0db41] hover:bg-[#c2cc36] transition-all flex items-center gap-1.5 self-start sm:self-auto shadow-sm"
            >
              Lihat Halaman Publik →
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Flash Message Banner */}
        {message && (
          <div
            className="font-nav text-sm rounded-xl px-4 py-3 shadow-xs transition-all"
            style={
              message.type === 'ok'
                ? { background: '#e6f7ee', color: '#0a7a3d', border: '1px solid #b7e4c7' }
                : { background: '#fdecec', color: '#b42318', border: '1px solid #f5c2c0' }
            }
          >
            {message.type === 'ok' ? '✅ ' : '❌ '}
            {message.text}
          </div>
        )}

        {/* 3 Main Admin Tabs */}
        <div className="flex items-center gap-2 p-1.5 bg-white rounded-2xl border border-gray-200 shadow-xs overflow-x-auto">
          {[
            { id: 'dokumen_tagihan', label: '1. Dokumen Tagihan', icon: FileCheck },
            { id: 'sla', label: '2. SLA (Service Level Agreement)', icon: Clock },
            { id: 'ba_tutup_tagihan', label: '3. BA Tutup Tagihan', icon: TrendingUp },
          ].map((tab) => {
            const Icon = tab.icon
            const isActive = activeAdminTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveAdminTab(tab.id as 'dokumen_tagihan' | 'sla' | 'ba_tutup_tagihan')}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl font-nav text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-[#00282b] text-[#d0db41] shadow-md shadow-[#00282b]/20 scale-[1.01]'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Icon size={16} className={isActive ? 'text-[#01bcce]' : 'text-gray-400'} />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>

        {/* Tab 1: Dokumen Tagihan */}
        {activeAdminTab === 'dokumen_tagihan' && (
          <DokumenTagihanTab onMessage={handleSetMessage} />
        )}

        {/* Tab 2: SLA */}
        {activeAdminTab === 'sla' && (
          <SlaTab onMessage={handleSetMessage} />
        )}

        {/* Tab 3: BA Tutup Tagihan */}
        {activeAdminTab === 'ba_tutup_tagihan' && (
          <BaTutupTagihanTab onMessage={handleSetMessage} />
        )}
      </div>
    </div>
  )
}
