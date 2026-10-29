'use client'

import { useState, useMemo } from 'react'
import { Calendar, Clock } from 'lucide-react'
import {
  KpiRow,
  IsoLikeRow,
  RscmAwardRow,
  MONTH_NAMES_SHORT,
  calculateAverageKpi,
  parseNum,
} from '@/lib/kpi-types'

interface Props {
  availableYears: number[]
  initialKpiByYear: Record<number, KpiRow[]>
  initialIsoByYear: Record<number, IsoLikeRow[]>
  initialAwardByYear: Record<number, RscmAwardRow[]>
}

const TABS = [
  { id: 'kpi', label: 'KPI' },
  { id: 'iso_like', label: 'ISO Like' },
  { id: 'rscm_award', label: 'RSCM Award' },
] as const

export default function KpiClient({
  availableYears,
  initialKpiByYear,
  initialIsoByYear,
  initialAwardByYear,
}: Props) {
  const defaultYear = availableYears.length > 0 ? availableYears[0] : new Date().getFullYear()
  const [selectedYear, setSelectedYear] = useState<number>(defaultYear)
  const [activeTab, setActiveTab] = useState<'kpi' | 'iso_like' | 'rscm_award'>('kpi')

  const currentKpiRows = initialKpiByYear[selectedYear] || []
  const currentIsoRows = initialIsoByYear[selectedYear] || []
  const currentAwardRows = initialAwardByYear[selectedYear] || []

  // Hitung 3 Rata-rata untuk kartu di atas tab (seperti Gambar 1)
  const avgKpi = useMemo(() => {
    const vals = currentKpiRows
      .map((r) => {
        const avgStr = r.rata_rata ? String(r.rata_rata) : calculateAverageKpi(r)
        return parseNum(avgStr)
      })
      .filter((n): n is number => n !== null)
    if (vals.length === 0) return '0.0%'
    const mean = vals.reduce((a, b) => a + b, 0) / vals.length
    return `${mean.toFixed(1)}%`
  }, [currentKpiRows])

  const avgIsoLike = useMemo(() => {
    const vals = currentIsoRows
      .map((r) => {
        const capNum = parseNum(r.capaian)
        if (capNum !== null) return capNum
        return parseNum(r.nilai)
      })
      .filter((n): n is number => n !== null)
    if (vals.length === 0) return '0.0%'
    const mean = vals.reduce((a, b) => a + b, 0) / vals.length
    return `${mean.toFixed(1)}%`
  }, [currentIsoRows])

  const avgRscmAward = useMemo(() => {
    const vals = currentAwardRows
      .map((r) => {
        const nilNum = parseNum(r.nilai)
        if (nilNum !== null) return nilNum
        return parseNum(r.capaian)
      })
      .filter((n): n is number => n !== null)
    if (vals.length === 0) return '0.0%'
    const mean = vals.reduce((a, b) => a + b, 0) / vals.length
    return `${mean.toFixed(1)}%`
  }, [currentAwardRows])

  return (
    <>
      <style>{`
        @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
        @keyframes fadeSlideUp { from { opacity:0; transform: translateY(15px) } to { opacity:1; transform: translateY(0) } }
        .aFadeIn { animation: fadeIn 0.6s ease both }
        .animate-fadeSlideUp { animation: fadeSlideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards }
        .rowHover { transition: background .15s }
        .rowHover:hover { background: #eef9fa !important }
      `}</style>

      <div style={{ minHeight: '100vh', fontFamily: '"TeX Gyre Bonum", Georgia, serif' }}>
        {/* HERO HEADER */}
        <div
          className="aFadeIn"
          style={{
            position: 'relative',
            height: 280,
            background: 'linear-gradient(135deg, #00282b 0%, #015a61 100%)',
            overflow: 'hidden',
          }}
        >
          {/* Watermark Ornamen Mandala (Kanan Atas) */}
          <img
            src="/ornament-mandala.png"
            alt=""
            className="absolute -top-10 -right-10 w-48 h-48 object-contain pointer-events-none select-none z-0"
            style={{ opacity: 0.15 }}
          />

          {/* Watermark Ornamen Mandala Kecil (Kanan Bawah) */}
          <img
            src="/ornament-mandala.png"
            alt=""
            className="absolute -bottom-16 right-40 w-40 h-40 object-contain pointer-events-none select-none z-0"
            style={{ opacity: 0.08 }}
          />

          {/* Watermark Ornamen Sisi Kiri */}
          <img
            src="/ornament-side.png"
            alt=""
            className="absolute -left-6 sm:-left-8 top-0 bottom-0 h-full w-32 sm:w-44 object-cover object-left pointer-events-none select-none z-0 opacity-[0.08]"
            style={{ filter: 'brightness(0) invert(1)' }}
          />

          <div
            style={{
              position: 'relative',
              zIndex: 1,
              maxWidth: 1140,
              margin: '0 auto',
              padding: '0 24px',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <div>
              <h1
                style={{
                  fontSize: 42,
                  fontWeight: 900,
                  color: '#fff',
                  lineHeight: 1.1,
                  margin: 0,
                  fontFamily: 'Nunito, sans-serif',
                }}
              >
                Key Performance Indicator (KPI)
              </h1>
              <div style={{ width: 70, height: 4, background: '#d0db41', borderRadius: 2, marginTop: 16 }} />
            </div>
          </div>
        </div>

        {/* MAIN SECTION */}
        <div style={{ background: '#f4f6f8', paddingBottom: 48 }}>
          <div style={{ maxWidth: 1440, margin: '0 auto', padding: '0 24px' }}>
            {/* Main Container dengan Ornamen */}
            <div
              style={{
                background: '#fff',
                borderRadius: 16,
                padding: '36px',
                boxShadow: '0 8px 40px rgba(0,40,43,.05)',
                position: 'relative',
                top: -40,
                overflow: 'hidden',
              }}
            >
              {/* Ornamen Mandala Kanan Atas di dalam Container Utama */}
              <img
                src="/ornament-mandala.png"
                alt=""
                className="absolute -top-12 -right-12 w-56 h-56 object-contain pointer-events-none select-none z-0"
                style={{ opacity: 0.06 }}
              />

              {/* Ornamen Sisi Kiri di dalam Container Utama */}
              <img
                src="/ornament-side.png"
                alt=""
                className="absolute -left-6 top-0 bottom-0 h-full w-36 sm:w-44 object-cover object-left pointer-events-none select-none z-0"
                style={{ opacity: 0.04 }}
              />

              {/* Ornamen Mandala Kiri Bawah */}
              <img
                src="/ornament-mandala.png"
                alt=""
                className="absolute -bottom-14 -left-14 w-52 h-52 object-contain pointer-events-none select-none z-0"
                style={{ opacity: 0.05 }}
              />

              <div className="relative z-10">
                {/* BAGIAN RATA-RATA (Sesuai Gambar 1: Di bawah judul tapi di atas tab) */}
                <div
                  style={{
                    background: '#e0f5f7',
                    borderRadius: 14,
                    padding: '16px',
                    marginBottom: 28,
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <img
                    src="/ornament-mandala.png"
                    alt=""
                    className="absolute -top-8 -right-8 w-32 h-32 object-contain pointer-events-none select-none z-0"
                    style={{ opacity: 0.1 }}
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 relative z-10">
                    {[
                      { label: 'Rata-rata KPI', value: avgKpi },
                      { label: 'Rata-rata ISO Like', value: avgIsoLike },
                      { label: 'Rata-rata RSCM Award', value: avgRscmAward },
                    ].map((card) => (
                      <div
                        key={card.label}
                        style={{
                          background: '#ffffff',
                          borderRadius: 10,
                          padding: '18px 20px',
                          textAlign: 'center',
                          border: '1px solid #cce8eb',
                          boxShadow: '0 2px 6px rgba(0,40,43,0.05)',
                        }}
                      >
                        <div
                          style={{
                            fontFamily: 'Nunito, sans-serif',
                            fontSize: 13,
                            fontWeight: 600,
                            color: '#527377',
                            marginBottom: 4,
                          }}
                        >
                          {card.label}
                        </div>
                        <div
                          style={{
                            fontFamily: 'Nunito, sans-serif',
                            fontSize: 28,
                            fontWeight: 800,
                            color: '#00282b',
                            lineHeight: 1.2,
                          }}
                        >
                          {card.value}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* TABS & FILTERS (Sama seperti Akuntansi Keuangan) */}
                <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-end mb-6 border-b border-gray-100 pb-4">
                  <div>
                    <h2 className="font-nav text-lg sm:text-xl font-bold text-[#00282b] mb-2.5 tracking-tight">
                      Indikator Kinerja & Mutu
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {TABS.map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setActiveTab(t.id)}
                          className={`px-4 py-2 rounded-lg font-nav text-sm font-bold transition-all cursor-pointer ${
                            activeTab === t.id
                              ? 'bg-[#00282b] text-white shadow-md'
                              : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 bg-gray-50 p-2 rounded-xl border border-gray-100">
                    <Calendar size={16} className="text-gray-400 ml-2" />
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(Number(e.target.value))}
                      className="bg-transparent font-nav text-sm font-bold text-[#01bcce] outline-none cursor-pointer pr-2"
                    >
                      {availableYears.map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* CONTENT */}
                <div key={`${activeTab}-${selectedYear}`} className="animate-fadeSlideUp">
                  <div className="mb-4">
                    <h2 className="font-nav text-2xl font-black text-[#00282b]">
                      {activeTab === 'kpi' ? 'KPI' : activeTab === 'iso_like' ? 'ISO Like' : 'RSCM Award'}
                    </h2>
                    <p className="font-nav text-sm text-[#01bcce] font-bold mt-1">
                      Periode: {selectedYear}
                    </p>
                  </div>

                  {/* ======================================================= */}
                  {/* TAB 1: TABEL KPI (Dengan kolom Periode di samping Indikator) */}
                  {/* ======================================================= */}
                  {activeTab === 'kpi' && (
                    <div className="overflow-x-auto rounded-xl border border-gray-200/90 shadow-2xs bg-white">
                      <table
                        className="w-full text-left border-collapse min-w-[1360px]"
                        style={{ fontFamily: 'Nunito, sans-serif' }}
                      >
                        <thead>
                          <tr
                            className="text-white text-xs uppercase tracking-wider font-bold"
                            style={{ background: '#00282b' }}
                          >
                            <th
                              rowSpan={2}
                              className="px-3 py-3.5 text-center border-r border-white/10 w-12 sticky left-0 z-20 bg-[#00282b]"
                            >
                              No
                            </th>
                            <th
                              rowSpan={2}
                              className="px-4 py-3.5 border-r border-white/10 min-w-[260px] max-w-[340px] sticky left-12 z-20 bg-[#00282b]"
                            >
                              Poin Penilaian
                            </th>
                            <th
                              rowSpan={2}
                              className="px-3 py-3.5 border-r border-white/10 min-w-[115px] text-center"
                            >
                              Periode
                            </th>
                            <th
                              rowSpan={2}
                              className="px-3 py-3.5 border-r border-white/10 min-w-[120px] text-center"
                            >
                              Target
                            </th>
                            <th
                              colSpan={12}
                              className="px-2 py-2 text-center border-b border-r border-white/10 bg-[#014146] text-[#d0db41]"
                            >
                              Capaian
                            </th>
                            <th
                              rowSpan={2}
                              className="px-3 py-3.5 border-r border-white/10 min-w-[100px] text-center bg-[#015a61] text-[#d0db41]"
                            >
                              Rata Rata Capaian
                            </th>
                            <th
                              rowSpan={2}
                              className="px-4 py-3.5 border-r border-white/10 min-w-[260px] max-w-[340px]"
                            >
                              Analisis
                            </th>
                            <th rowSpan={2} className="px-4 py-3.5 min-w-[260px] max-w-[340px]">
                              Rencana Tindak Lanjut
                            </th>
                          </tr>
                          <tr className="text-white/90 text-[11px] font-semibold" style={{ background: '#014146' }}>
                            {MONTH_NAMES_SHORT.map((bln, bIdx) => (
                              <th
                                key={bln}
                                className={`px-1.5 py-2 text-center min-w-[55px] ${
                                  bIdx < 11 ? 'border-r border-white/10' : 'border-r border-white/20'
                                }`}
                              >
                                {bln}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-xs text-gray-800 bg-white">
                          {currentKpiRows.length === 0 ? (
                            <tr>
                              <td colSpan={19} className="py-12 text-center text-gray-400">
                                Belum ada data KPI untuk tahun {selectedYear}.
                              </td>
                            </tr>
                          ) : (
                            currentKpiRows.map((row, rIdx) => {
                              const avg = row.rata_rata ? String(row.rata_rata) : calculateAverageKpi(row)
                              const isEven = rIdx % 2 === 1

                              return (
                                <tr
                                  key={row.id || rIdx}
                                  className={`rowHover ${isEven ? 'bg-gray-50/40' : 'bg-white'}`}
                                >
                                  <td
                                    className="px-3 py-3.5 text-center font-bold text-gray-600 border-r border-gray-100 sticky left-0 z-10"
                                    style={{ background: isEven ? '#f9fafb' : '#ffffff' }}
                                  >
                                    {row.no || rIdx + 1}
                                  </td>
                                  <td
                                    className="px-4 py-3.5 font-bold text-[#00282b] border-r border-gray-100 min-w-[260px] max-w-[340px] whitespace-normal break-words leading-relaxed sticky left-12 z-10"
                                    style={{ background: isEven ? '#f9fafb' : '#ffffff' }}
                                  >
                                    {row.poin_penilaian}
                                  </td>
                                  <td className="px-3 py-3.5 text-center font-semibold text-[#015a61] border-r border-gray-100 min-w-[115px] whitespace-normal break-words">
                                    <span className="inline-block px-2.5 py-0.5 rounded-md bg-teal-50 text-[#015a61] border border-teal-100 font-bold text-[11px]">
                                      {row.periode || 'Bulanan'}
                                    </span>
                                  </td>
                                  <td className="px-3 py-3.5 text-center font-medium text-gray-700 border-r border-gray-100 min-w-[120px] whitespace-normal break-words">
                                    <span className="inline-block px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 font-semibold text-[11px]">
                                      {row.target || '—'}
                                    </span>
                                  </td>
                                  {(
                                    ['m1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7', 'm8', 'm9', 'm10', 'm11', 'm12'] as const
                                  ).map((mKey, mIdx) => {
                                    const val = row[mKey]
                                    const formatted =
                                      val !== null && val !== undefined && val !== ''
                                        ? typeof val === 'number'
                                          ? `${val}%`
                                          : String(val).includes('%')
                                          ? val
                                          : `${val}%`
                                        : '—'

                                    return (
                                      <td
                                        key={mKey}
                                        className={`px-1.5 py-3.5 text-center font-medium min-w-[55px] ${
                                          mIdx < 11 ? 'border-r border-gray-100' : 'border-r border-gray-200'
                                        } ${
                                          val !== null && val !== undefined && val !== ''
                                            ? 'text-gray-900 font-semibold'
                                            : 'text-gray-300'
                                        }`}
                                      >
                                        {formatted}
                                      </td>
                                    )
                                  })}
                                  <td className="px-3 py-3.5 text-center font-black text-[#015a61] border-r border-gray-100 min-w-[100px] bg-[#01bcce]/5">
                                    <span className="inline-block px-2.5 py-1 rounded-md bg-[#01bcce]/15 text-[#00282b] font-black text-xs">
                                      {avg}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3.5 text-gray-700 border-r border-gray-100 min-w-[260px] max-w-[340px] whitespace-normal break-words leading-relaxed text-xs">
                                    {row.analisis || '—'}
                                  </td>
                                  <td className="px-4 py-3.5 text-gray-700 min-w-[260px] max-w-[340px] whitespace-normal break-words leading-relaxed text-xs">
                                    {row.rencana_tindak_lanjut || '—'}
                                  </td>
                                </tr>
                              )
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* ======================================================= */}
                  {/* TAB 2: TABEL ISO LIKE                                   */}
                  {/* ======================================================= */}
                  {activeTab === 'iso_like' && (
                    <div className="overflow-x-auto rounded-xl border border-gray-200/90 shadow-2xs bg-white">
                      <table
                        className="w-full text-left border-collapse min-w-[850px]"
                        style={{ fontFamily: 'Nunito, sans-serif' }}
                      >
                        <thead>
                          <tr
                            className="text-white text-xs uppercase tracking-wider font-bold"
                            style={{ background: '#00282b' }}
                          >
                            <th className="px-4 py-3.5 text-center border-r border-white/10 w-16">No</th>
                            <th className="px-5 py-3.5 border-r border-white/10 min-w-[320px] max-w-[480px]">
                              Poin Penilaian
                            </th>
                            <th className="px-4 py-3.5 text-center border-r border-white/10 min-w-[140px]">
                              Target
                            </th>
                            <th className="px-4 py-3.5 text-center border-r border-white/10 min-w-[140px]">
                              Capaian
                            </th>
                            <th className="px-4 py-3.5 text-center min-w-[130px] bg-[#015a61] text-[#d0db41]">
                              Nilai
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-xs text-gray-800 bg-white">
                          {currentIsoRows.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="py-12 text-center text-gray-400">
                                Belum ada data ISO Like untuk tahun {selectedYear}.
                              </td>
                            </tr>
                          ) : (
                            currentIsoRows.map((row, rIdx) => {
                              const isEven = rIdx % 2 === 1
                              return (
                                <tr
                                  key={row.id || rIdx}
                                  className={`rowHover ${isEven ? 'bg-gray-50/40' : 'bg-white'}`}
                                >
                                  <td className="px-4 py-4 text-center font-bold text-gray-600 border-r border-gray-100">
                                    {row.no || rIdx + 1}
                                  </td>
                                  <td className="px-5 py-4 font-bold text-[#00282b] border-r border-gray-100 min-w-[320px] max-w-[480px] whitespace-normal break-words leading-relaxed">
                                    {row.poin_penilaian}
                                  </td>
                                  <td className="px-4 py-4 text-center font-medium text-gray-700 border-r border-gray-100 min-w-[140px] whitespace-normal break-words">
                                    <span className="inline-block px-2.5 py-1 rounded-md bg-gray-100 text-gray-700 font-semibold text-xs">
                                      {row.target || '—'}
                                    </span>
                                  </td>
                                  <td className="px-4 py-4 text-center font-bold text-[#00282b] border-r border-gray-100 min-w-[140px] whitespace-normal break-words">
                                    {row.capaian || '—'}
                                  </td>
                                  <td className="px-4 py-4 text-center font-black min-w-[130px]">
                                    <span className="inline-block px-3 py-1 rounded-lg bg-[#e6f7ee] text-[#0a7a3d] border border-[#b7e4c7] font-bold text-xs shadow-2xs">
                                      {row.nilai || '—'}
                                    </span>
                                  </td>
                                </tr>
                              )
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* ======================================================= */}
                  {/* TAB 3: TABEL RSCM AWARD                                 */}
                  {/* ======================================================= */}
                  {activeTab === 'rscm_award' && (
                    <div className="overflow-x-auto rounded-xl border border-gray-200/90 shadow-2xs bg-white">
                      <table
                        className="w-full text-left border-collapse min-w-[1100px]"
                        style={{ fontFamily: 'Nunito, sans-serif' }}
                      >
                        <thead>
                          <tr
                            className="text-white text-xs uppercase tracking-wider font-bold"
                            style={{ background: '#00282b' }}
                          >
                            <th className="px-3 py-3.5 text-center border-r border-white/10 w-14">No</th>
                            <th className="px-4 py-3.5 border-r border-white/10 min-w-[280px] max-w-[380px]">
                              Poin Penilaian
                            </th>
                            <th className="px-3 py-3.5 text-center border-r border-white/10 min-w-[130px]">
                              Target
                            </th>
                            <th className="px-3 py-3.5 text-center border-r border-white/10 min-w-[130px]">
                              Capaian
                            </th>
                            <th className="px-3 py-3.5 text-center border-r border-white/10 min-w-[100px] bg-[#015a61] text-[#d0db41]">
                              Nilai
                            </th>
                            <th className="px-4 py-3.5 border-r border-white/10 min-w-[260px] max-w-[360px]">
                              Rencana Tindak Lanjut
                            </th>
                            <th className="px-3 py-3.5 text-center min-w-[130px]">Deadline</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-xs text-gray-800 bg-white">
                          {currentAwardRows.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="py-12 text-center text-gray-400">
                                Belum ada data RSCM Award untuk tahun {selectedYear}.
                              </td>
                            </tr>
                          ) : (
                            currentAwardRows.map((row, rIdx) => {
                              const isEven = rIdx % 2 === 1
                              return (
                                <tr
                                  key={row.id || rIdx}
                                  className={`rowHover ${isEven ? 'bg-gray-50/40' : 'bg-white'}`}
                                >
                                  <td className="px-3 py-4 text-center font-bold text-gray-600 border-r border-gray-100">
                                    {row.no || rIdx + 1}
                                  </td>
                                  <td className="px-4 py-4 font-bold text-[#00282b] border-r border-gray-100 min-w-[280px] max-w-[380px] whitespace-normal break-words leading-relaxed">
                                    {row.poin_penilaian}
                                  </td>
                                  <td className="px-3 py-4 text-center font-medium text-gray-700 border-r border-gray-100 min-w-[130px] whitespace-normal break-words">
                                    <span className="inline-block px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 font-semibold text-[11px]">
                                      {row.target || '—'}
                                    </span>
                                  </td>
                                  <td className="px-3 py-4 text-center font-bold text-[#00282b] border-r border-gray-100 min-w-[130px] whitespace-normal break-words">
                                    {row.capaian || '—'}
                                  </td>
                                  <td className="px-3 py-4 text-center font-black border-r border-gray-100 min-w-[100px]">
                                    <span className="inline-block px-2.5 py-1 rounded-md bg-teal-50 text-[#015a61] border border-teal-200 font-black text-xs">
                                      {row.nilai || '—'}
                                    </span>
                                  </td>
                                  <td className="px-4 py-4 text-gray-700 border-r border-gray-100 min-w-[260px] max-w-[360px] whitespace-normal break-words leading-relaxed text-xs">
                                    {row.rencana_tindak_lanjut || '—'}
                                  </td>
                                  <td className="px-3 py-4 text-center min-w-[130px] whitespace-normal break-words">
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-50 text-amber-800 border border-amber-200/80 font-bold text-[11px]">
                                      <Clock size={12} className="text-amber-600 shrink-0" />
                                      {row.deadline || '—'}
                                    </span>
                                  </td>
                                </tr>
                              )
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div style={{ height: 40 }} />
      </div>
    </>
  )
}
