'use client'
import { useState } from 'react'
import { Building2, Globe2, CheckCircle2, Clock3, TrendingUp, TrendingDown, Minus, ArrowRightLeft, Calendar, BarChart3, FileText } from 'lucide-react'

const NAMA_BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
]

const BULAN_SINGKAT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'
]

/**
 * Format label periode dan tahun untuk perbandingan, e.g. "Jan – Mar 2026"
 */
export function formatBulanDanTahun(selectedMonths: string[], year: number): string {
  if (!selectedMonths || selectedMonths.length === 0) {
    return ''
  }
  if (selectedMonths.length === 12) {
    return `Jan – Des ${year}`
  }
  const indices = selectedMonths
    .map(m => NAMA_BULAN.indexOf(m))
    .filter(idx => idx !== -1)
    .sort((a, b) => a - b)

  if (indices.length === 0) return ''
  if (indices.length === 1) return `${BULAN_SINGKAT[indices[0]]} ${year}`

  let isContiguous = true
  for (let i = 1; i < indices.length; i++) {
    if (indices[i] !== indices[i - 1] + 1) {
      isContiguous = false
      break
    }
  }

  if (isContiguous) {
    return `${BULAN_SINGKAT[indices[0]]} – ${BULAN_SINGKAT[indices[indices.length - 1]]} ${year}`
  }

  return `${indices.map(i => BULAN_SINGKAT[i]).join(', ')} ${year}`
}

/**
 * Format label periode sesuai permintaan:
 * - 12 Bulan (1 tahun): "Periode Jan – Des"
 * - 2 Bulan berurutan: "Periode Bulan Jan – Feb"
 * - Kuartal / Semester berurutan: "Periode Bulan Jan – Mar", "Periode Bulan Jan – Jun"
 * - 1 Bulan: "Periode Bulan Jan"
 * - Non-kontigu: "Periode Bulan Jan, Mar, Jul"
 */
export function formatPeriodeLabel(selectedMonths: string[]): string {
  if (!selectedMonths || selectedMonths.length === 0) {
    return 'Pilih Bulan'
  }

  // 12 bulan (1 tahun penuh)
  if (selectedMonths.length === 12) {
    return 'Periode Jan – Des'
  }

  // Ambil index bulan dan urutkan
  const indices = selectedMonths
    .map(m => NAMA_BULAN.indexOf(m))
    .filter(idx => idx !== -1)
    .sort((a, b) => a - b)

  if (indices.length === 0) return 'Belum ada periode dipilih'

  if (indices.length === 1) {
    return `Periode Bulan ${BULAN_SINGKAT[indices[0]]}`
  }

  // Cek apakah bulan berurutan (kontigu)
  let isContiguous = true
  for (let i = 1; i < indices.length; i++) {
    if (indices[i] !== indices[i - 1] + 1) {
      isContiguous = false
      break
    }
  }

  if (isContiguous) {
    const start = BULAN_SINGKAT[indices[0]]
    const end = BULAN_SINGKAT[indices[indices.length - 1]]
    return `Periode Bulan ${start} – ${end}`
  }

  // Jika tidak berurutan
  return `Periode Bulan ${indices.map(i => BULAN_SINGKAT[i]).join(', ')}`
}

interface PieChartProps {
  proses: number
  lolos: number
  title?: string
  periodeLabel?: string
  internalCount?: number
  eksternalCount?: number
}

export function VerifikasiPieChart({
  proses,
  lolos,
  title,
  periodeLabel,
}: PieChartProps) {
  const [hoveredSlice, setHoveredSlice] = useState<'proses' | 'lolos' | null>(null)

  const total = proses + lolos
  const lolosPct = total > 0 ? (lolos / total) * 100 : 0
  const prosesPct = total > 0 ? (proses / total) * 100 : 0

  // Perlebar ketebalan donat agar tulisan & angka di dalamnya sangat jelas
  const radius = 82
  const strokeWidth = 48
  const circumference = Number((2 * Math.PI * radius).toFixed(2)) // ~515.22
  const lolosStroke = total > 0 ? Number(((lolos / total) * circumference).toFixed(2)) : 0
  const prosesStroke = total > 0 ? Number(((proses / total) * circumference).toFixed(2)) : 0

  // Hitung sudut tengah masing-masing irisan untuk label langsung di atas irisan
  const pLolos = total > 0 ? lolos / total : 0
  const pProses = total > 0 ? proses / total : 0

  // Lolos mulai dari jam 12 (-PI/2)
  const angleMidLolos = -Math.PI / 2 + Math.PI * pLolos
  const angleMidProses = -Math.PI / 2 + 2 * Math.PI * pLolos + Math.PI * pProses

  const xLolos = Number((120 + radius * Math.cos(angleMidLolos)).toFixed(2))
  const yLolos = Number((120 + radius * Math.sin(angleMidLolos)).toFixed(2))

  const xProses = Number((120 + radius * Math.cos(angleMidProses)).toFixed(2))
  const yProses = Number((120 + radius * Math.sin(angleMidProses)).toFixed(2))

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200 shadow-sm flex flex-col justify-between h-full font-nav transition-all">
      {/* Header & Subtitle Sesuai Format */}
      <div className="w-full text-center">
        <h4 className="font-nav font-black text-sm sm:text-base text-[#00282b] leading-tight">
          {title || 'Proporsi Dokumen Tagihan'}
        </h4>
        <div className="mt-1">
          <span className="inline-block text-[11px] font-bold text-[#01bcce] bg-[#eef9fa] px-3 py-0.5 rounded-full border border-[#01bcce]/20">
            {total === 0 ? 'Belum Ada Data' : (periodeLabel || 'Periode Jan – Des')}
          </span>
        </div>
      </div>

      {/* SVG Donut Chart dengan Lebar Donat Diperbesar & Teks Sangat Jelas */}
      <div className="relative my-auto flex-1 flex items-center justify-center py-2">
        <svg viewBox="0 0 240 240" className="w-52 h-52 sm:w-60 sm:h-60 md:w-64 md:h-64 overflow-visible">
          <defs>
            <filter id="pieGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#00282b" floodOpacity="0.08" />
            </filter>
          </defs>

          {/* Group Lingkaran Pie dengan rotasi -90deg */}
          <g transform="rotate(-90 120 120)">
            {/* Base background ring */}
            <circle
              cx="120"
              cy="120"
              r={radius}
              fill="transparent"
              stroke="#dbeafe"
              strokeWidth={strokeWidth}
            />

            {total === 0 ? (
              <circle
                cx="120"
                cy="120"
                r={radius}
                fill="transparent"
                stroke="#e2e8f0"
                strokeWidth={strokeWidth}
              />
            ) : (
              <g filter="url(#pieGlow)">
                {/* 1. Lolos Verifikasi (Teal #268484) */}
                {lolos > 0 && (
                  <circle
                    cx="120"
                    cy="120"
                    r={radius}
                    fill="transparent"
                    stroke="#268484"
                    strokeWidth={hoveredSlice === 'lolos' ? strokeWidth + 6 : strokeWidth}
                    strokeDasharray={`${lolosStroke} ${circumference}`}
                    strokeDashoffset="0"
                    className="transition-all duration-300 cursor-pointer"
                    onMouseEnter={() => setHoveredSlice('lolos')}
                    onMouseLeave={() => setHoveredSlice(null)}
                  />
                )}

                {/* 2. Proses Verifikasi (Cyan #01bcce) */}
                {proses > 0 && (
                  <circle
                    cx="120"
                    cy="120"
                    r={radius}
                    fill="transparent"
                    stroke="#01bcce"
                    strokeWidth={hoveredSlice === 'proses' ? strokeWidth + 6 : strokeWidth}
                    strokeDasharray={`${prosesStroke} ${circumference}`}
                    strokeDashoffset={`${-lolosStroke}`}
                    className="transition-all duration-300 cursor-pointer"
                    onMouseEnter={() => setHoveredSlice('proses')}
                    onMouseLeave={() => setHoveredSlice(null)}
                  />
                )}
              </g>
            )}
          </g>

          {/* Label & Angka Langsung di Dalam Irisan Donat (Tulisan Jelas & Tebal) */}
          {total > 0 && (
            <>
              {/* Lolos Verifikasi di Irisan Teal #268484 */}
              {pLolos >= 0.08 && (
                <g className="pointer-events-none select-none transition-all">
                  <text
                    x={xLolos}
                    y={yLolos - 4}
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="13"
                    fontWeight="900"
                    className="drop-shadow"
                  >
                    {lolos.toLocaleString('id-ID')}
                  </text>
                  <text
                    x={xLolos}
                    y={yLolos + 10}
                    textAnchor="middle"
                    fill="#ffffff"
                    opacity="0.95"
                    fontSize="10.5"
                    fontWeight="800"
                  >
                    {lolosPct.toFixed(1)}%
                  </text>
                </g>
              )}

              {/* Proses Verifikasi di Irisan Cyan #01bcce */}
              {pProses >= 0.08 && (
                <g className="pointer-events-none select-none transition-all">
                  <text
                    x={xProses}
                    y={yProses - 4}
                    textAnchor="middle"
                    fill="#00282b"
                    fontSize="13"
                    fontWeight="900"
                  >
                    {proses.toLocaleString('id-ID')}
                  </text>
                  <text
                    x={xProses}
                    y={yProses + 10}
                    textAnchor="middle"
                    fill="#00282b"
                    opacity="0.9"
                    fontSize="10.5"
                    fontWeight="800"
                  >
                    {prosesPct.toFixed(1)}%
                  </text>
                </g>
              )}
            </>
          )}

          {/* Center Hole: Total Dokumen */}
          <g className="pointer-events-none select-none text-center">
            <text
              x="120"
              y="107"
              textAnchor="middle"
              fill="#94a3b8"
              fontSize="10"
              fontWeight="800"
              letterSpacing="1px"
            >
              TOTAL
            </text>
            <text
              x="120"
              y="129"
              textAnchor="middle"
              fill="#268484"
              fontSize="23"
              fontWeight="900"
              letterSpacing="-0.5px"
            >
              {total.toLocaleString('id-ID')}
            </text>
            <text
              x="120"
              y="144"
              textAnchor="middle"
              fill="#64748b"
              fontSize="10"
              fontWeight="700"
              letterSpacing="0.5px"
            >
              DOKUMEN
            </text>
          </g>
        </svg>
      </div>

      {/* Legend & Rincian Interaktif Hanya Proses Verifikasi & Lolos Verifikasi */}
      <div className="w-full flex items-center justify-center gap-3 pt-3 border-t border-gray-100 font-nav flex-wrap">
        {/* Lolos Verifikasi */}
        <div
          className={`flex items-center gap-2 p-1.5 px-3 rounded-xl transition-all cursor-pointer ${
            hoveredSlice === 'lolos'
              ? 'bg-[#268484]/10 ring-1 ring-[#268484]/30'
              : 'bg-gray-50/70 hover:bg-gray-50'
          }`}
          onMouseEnter={() => setHoveredSlice('lolos')}
          onMouseLeave={() => setHoveredSlice(null)}
        >
          <span className="w-3.5 h-3.5 rounded-full bg-[#268484] flex-shrink-0 shadow-sm" />
          <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
            <CheckCircle2 size={13} className="text-[#268484]" />
            Lolos Verifikasi
          </span>
        </div>

        {/* Proses Verifikasi */}
        <div
          className={`flex items-center gap-2 p-1.5 px-3 rounded-xl transition-all cursor-pointer ${
            hoveredSlice === 'proses'
              ? 'bg-cyan-50 ring-1 ring-cyan-200'
              : 'bg-gray-50/70 hover:bg-gray-50'
          }`}
          onMouseEnter={() => setHoveredSlice('proses')}
          onMouseLeave={() => setHoveredSlice(null)}
        >
          <span className="w-3.5 h-3.5 rounded-full bg-[#01bcce] flex-shrink-0 shadow-sm" />
          <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
            <Clock3 size={13} className="text-[#01bcce]" />
            Proses Verifikasi
          </span>
        </div>
      </div>
    </div>
  )
}

export interface LineChartDataPoint {
  bulan: string
  bulanSingkat: string
  jumlah_dokumen: number
  proses: number
  lolos: number
}

interface LineChartProps {
  data: LineChartDataPoint[]
  title?: string
  periodeLabel?: string
  selectedBulan?: string
}

export function VerifikasiLineChart({ data, title, periodeLabel, selectedBulan }: LineChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)

  // Empty state jika belum ada data bulan yang diinput
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm flex flex-col items-center justify-center h-full min-h-[320px] text-center font-nav">
        <p className="text-gray-400 font-bold text-sm">Belum ada data dokumen tagihan yang diinput.</p>
        <p className="text-gray-300 text-xs mt-1">Grafik tren akan muncul setelah ada data bulan yang diinput melalui panel admin.</p>
      </div>
    )
  }

  // Tentukan nilai maksimum untuk sumbu Y
  const maxVal = Math.max(
    ...data.flatMap(d => [d.jumlah_dokumen, d.proses, d.lolos]),
    10
  )
  const ceiling = Math.ceil(maxVal * 1.15)

  // Dimensi Chart Diperlebar Sesuai Permintaan
  const width = 680
  const height = 360
  const padLeft = 56 // Ruang cukup untuk label angka di kiri
  const padRight = 24
  const padTop = 28
  const padBottom = 44

  const n = data.length
  const plotHeight = height - padTop - padBottom

  // Batasi jarak antar titik ketika bulan yang dipilih sedikit (misal 2 atau 3 bulan)
  // agar tidak menempel di ujung kiri dan ujung kanan chart
  const availableWidth = width - padLeft - padRight
  const baseMargin = 32 // Margin minimum dari batas kiri dan kanan
  const maxAllowedSpan = availableWidth - 2 * baseMargin

  // Jarak antar titik diperlebar
  const stepX = n <= 1 ? 0 : Math.min(220, maxAllowedSpan / (n - 1))
  const totalSpan = n <= 1 ? 0 : (n - 1) * stepX
  const startX = padLeft + (availableWidth - totalSpan) / 2

  const getX = (i: number) => {
    if (n <= 1) return Number((padLeft + availableWidth / 2).toFixed(2))
    return Number((startX + i * stepX).toFixed(2))
  }

  const getY = (val: number) => Number((padTop + plotHeight - (val / ceiling) * plotHeight).toFixed(2))

  // Garis Biasa Lurus (Straight Polyline, Tidak Meliuk-liuk)
  const makeStraightPath = (key: 'jumlah_dokumen' | 'proses' | 'lolos') => {
    if (n <= 0) return ''
    return data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d[key])}`).join(' ')
  }

  // Area lurus di bawah garis
  const makeStraightAreaPath = (key: 'jumlah_dokumen' | 'proses' | 'lolos') => {
    if (n <= 1) return ''
    const linePath = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d[key])}`).join(' ')
    const bottomY = padTop + plotHeight
    return `${linePath} L ${getX(n - 1)} ${bottomY} L ${getX(0)} ${bottomY} Z`
  }

  // Grid horizontal ticks (4 garis)
  const ticks = [0, 0.25, 0.5, 0.75, 1].map(r => Math.round(ceiling * r))

  const activeIndex = hoveredIdx !== null
    ? hoveredIdx
    : selectedBulan
    ? data.findIndex(d => d.bulan.toLowerCase() === selectedBulan.toLowerCase())
    : null

  const hoveredData = activeIndex !== null && activeIndex >= 0 ? data[activeIndex] : null

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200 shadow-sm flex flex-col justify-between h-full font-nav transition-all">
      <div className="flex-1 flex flex-col justify-between">
        {/* 1. Header & Judul Berada di Tengah Sesuai Permintaan */}
        <div className="w-full text-center mb-1">
          <h4 className="font-nav font-black text-base text-[#00282b] leading-tight">
            {title || 'Tren Dokumen Tagihan'}
          </h4>
          <div className="mt-1">
            <span className="inline-block text-xs font-bold text-[#01bcce] bg-[#eef9fa] px-3.5 py-0.5 rounded-full border border-[#01bcce]/20">
              {periodeLabel || 'Periode Jan – Des'}
            </span>
          </div>
        </div>

        {/* 3. SVG Line Chart Diperbesar & Garis Lurus Bersih */}
        <div className="relative w-full overflow-hidden select-none my-auto flex-1 flex items-center justify-center py-2">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
            <defs>
              {/* Gradients halus untuk area fill */}
              <linearGradient id="areaStraightGradJumlah" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#268484" stopOpacity="0.08" />
                <stop offset="100%" stopColor="#268484" stopOpacity="0.0" />
              </linearGradient>
              <linearGradient id="areaStraightGradLolos" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#d0db41" stopOpacity="0.12" />
                <stop offset="100%" stopColor="#d0db41" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Grid horizontal & Tick angka pada Sumbu Y */}
            {ticks.map((t, idx) => {
              const y = getY(t)
              return (
                <g key={idx}>
                  <line
                    x1={padLeft}
                    y1={y}
                    x2={width - padRight}
                    y2={y}
                    stroke="#dbeafe"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                  />
                  <text
                    x={padLeft - 10}
                    y={y + 3.5}
                    textAnchor="end"
                    fill="#94a3b8"
                    fontSize="10"
                    fontWeight="700"
                  >
                    {t.toLocaleString('id-ID')}
                  </text>
                </g>
              )
            })}

            {/* Area fill lurus */}
            <path d={makeStraightAreaPath('jumlah_dokumen')} fill="url(#areaStraightGradJumlah)" />
            <path d={makeStraightAreaPath('lolos')} fill="url(#areaStraightGradLolos)" />

            {/* Garis Lurus Bersih (Straight Polylines) */}
            {/* 1. Garis Jumlah Dokumen (Dark Teal #268484) */}
            <path
              d={makeStraightPath('jumlah_dokumen')}
              fill="none"
              stroke="#268484"
              strokeWidth="2.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* 2. Garis Lolos Verifikasi (Lime #d0db41) */}
            <path
              d={makeStraightPath('lolos')}
              fill="none"
              stroke="#d0db41"
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* 3. Garis Proses Verifikasi (Cyan #01bcce Dashed) */}
            <path
              d={makeStraightPath('proses')}
              fill="none"
              stroke="#01bcce"
              strokeWidth="2.4"
              strokeDasharray="5 4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Garis Vertikal Penunjuk saat Titik Diarahkan (Hover Guide) */}
            {activeIndex !== null && (
              <line
                x1={getX(activeIndex)}
                y1={padTop}
                x2={getX(activeIndex)}
                y2={padTop + plotHeight}
                stroke="#01bcce"
                strokeWidth="1.5"
                strokeDasharray="4 3"
                opacity="0.8"
              />
            )}

            {/* Data Points, X-Axis labels, and Interactive Hover Columns */}
            {data.map((d, i) => {
              const x = getX(i)
              const yJumlah = getY(d.jumlah_dokumen)
              const yProses = getY(d.proses)
              const yLolos = getY(d.lolos)
              const isHovered = activeIndex === i

              return (
                <g key={i}>
                  {/* Highlight capsule background saat di-hover */}
                  {isHovered && (
                    <rect
                      x={x - 18}
                      y={padTop}
                      width={36}
                      height={plotHeight}
                      fill="#eef9fa"
                      rx="8"
                      opacity="0.6"
                    />
                  )}

                  {/* Label Nama Bulan pada Sumbu X (Jan sudah digeser rapi dari sumbu Y) */}
                  <text
                    x={x}
                    y={height - 12}
                    textAnchor="middle"
                    fill={isHovered ? '#01bcce' : '#64748b'}
                    fontSize="11"
                    fontWeight={isHovered ? '800' : '600'}
                  >
                    {d.bulanSingkat}
                  </text>

                  {/* Titik Jumlah Dokumen */}
                  {isHovered && (
                    <circle cx={x} cy={yJumlah} r={7} fill="#268484" opacity="0.25" />
                  )}
                  <circle
                    cx={x}
                    cy={yJumlah}
                    r={isHovered ? 5.5 : 4}
                    fill="#268484"
                    stroke="#ffffff"
                    strokeWidth="2.5"
                  />

                  {/* Titik Lolos Verifikasi */}
                  {isHovered && (
                    <circle cx={x} cy={yLolos} r={7} fill="#d0db41" opacity="0.25" />
                  )}
                  <circle
                    cx={x}
                    cy={yLolos}
                    r={isHovered ? 5.5 : 4}
                    fill="#d0db41"
                    stroke="#268484"
                    strokeWidth="2"
                  />

                  {/* Titik Proses Verifikasi */}
                  {isHovered && (
                    <circle cx={x} cy={yProses} r={7} fill="#01bcce" opacity="0.25" />
                  )}
                  <circle
                    cx={x}
                    cy={yProses}
                    r={isHovered ? 5.5 : 4}
                    fill="#01bcce"
                    stroke="#ffffff"
                    strokeWidth="2.5"
                  />

                  {/* Invisible Hit Area Column untuk hover responsif dan mudah */}
                  <rect
                    x={x - (n > 1 ? stepX / 2 : 30)}
                    y={padTop}
                    width={n > 1 ? stepX : 60}
                    height={plotHeight + 20}
                    fill="transparent"
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredIdx(i)}
                    onMouseLeave={() => setHoveredIdx(null)}
                    onClick={() => setHoveredIdx(hoveredIdx === i ? null : i)}
                  />
                </g>
              )
            })}
          </svg>

          {/* Floating Vertical List Card (List ke bawah tanpa menutupi titik) */}
          {hoveredData && activeIndex !== null && (
            <div
              className="absolute z-20 pointer-events-none transition-all duration-150 ease-out"
              style={{
                left: `${(getX(activeIndex) / width) * 100}%`,
                top: '16px',
                transform:
                  getX(activeIndex) > width * 0.52
                    ? 'translateX(calc(-100% - 18px))'
                    : 'translateX(18px)',
              }}
            >
              <div className="bg-[#00282b]/95 backdrop-blur-md text-white rounded-xl px-4 py-3 shadow-2xl border border-[#01bcce]/30 min-w-[175px]">
                <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-white/10">
                  <span className="font-black text-xs text-[#d0db41]">
                    {hoveredData.bulan}
                  </span>
                  <span className="text-[10px] text-gray-300 font-bold bg-white/10 px-1.5 py-0.5 rounded">
                    {hoveredData.bulanSingkat}
                  </span>
                </div>
                <div className="space-y-1.5 text-xs font-nav">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-gray-300 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#268484] inline-block shadow-sm" />
                      Jumlah Dokumen:
                    </span>
                    <span className="font-black text-white">
                      {hoveredData.jumlah_dokumen.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-lime-300 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#d0db41] inline-block shadow-sm" />
                      Lolos:
                    </span>
                    <span className="font-black text-[#d0db41]">
                      {hoveredData.lolos.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-cyan-300 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#01bcce] inline-block shadow-sm" />
                      Proses:
                    </span>
                    <span className="font-black text-[#01bcce]">
                      {hoveredData.proses.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4. Legend Diletakkan di Bawah Sesuai Permintaan */}
      <div className="flex items-center justify-center gap-3 sm:gap-4 text-xs font-bold flex-wrap pt-3 mt-2 border-t border-gray-100 font-nav">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-50/70 border border-[#268484]/20 text-[#268484]">
          <span className="w-3 h-3 rounded-full bg-[#268484]" />
          <span>Jumlah Dokumen</span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-lime-50/70 border border-[#d0db41]/30 text-lime-800">
          <span className="w-3 h-3 rounded-full bg-[#d0db41]" />
          <span>Lolos Verifikasi</span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-50/70 border border-cyan-100 text-[#01bcce]">
          <span className="w-3 h-3 rounded-full bg-[#01bcce]" />
          <span>Proses Verifikasi</span>
        </div>
      </div>
    </div>
  )
}

export interface ComparisonMonthlyItem {
  bulan: string
  bulanSingkat: string
  valA: number
  valB: number
  isIncludedA: boolean
  isIncludedB: boolean
}

export interface VerifikasiBarChartProps {
  title?: string
  labelA: string
  totalA: number
  labelB: string
  totalB: number
  items?: ComparisonMonthlyItem[]
  colorA?: string
  colorB?: string
}

export function VerifikasiBarChart({
  title,
  labelA,
  totalA,
  labelB,
  totalB,
  items = [],
  colorA = '#01bcce',
  colorB = '#268484',
}: VerifikasiBarChartProps) {
  const [, setHoveredBar] = useState<{ label: string; period: string; val: number } | null>(null)

  // Empty state jika kedua total = 0
  if (totalA === 0 && totalB === 0) {
    return (
      <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm flex flex-col items-center justify-center min-h-[190px] text-center font-nav">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-2.5 bg-[#eef9fa] text-[#01bcce]">
          <BarChart3 size={20} />
        </div>
        {title && <h4 className="font-black text-sm text-[#00282b]">{title}</h4>}
        <p className="text-gray-400 font-bold text-xs mt-1">Belum ada data dokumen tagihan yang diinput pada periode yang dibandingkan.</p>
        <p className="text-gray-400 text-[11px] mt-0.5">Diagram batang perbandingan akan tampil otomatis setelah ada data yang diinput.</p>
      </div>
    )
  }

  const diff = totalB - totalA
  const diffPct = totalA > 0 ? (diff / totalA) * 100 : (totalB > 0 ? 100 : 0)

  // Dimensi Chart Diperlebar Sesuai Permintaan
  const width = 600
  const height = 240
  const padLeft = 48
  const padRight = 16
  const padTop = 18
  const padBottom = 34
  const plotWidth = width - padLeft - padRight // 536
  const plotHeight = height - padTop - padBottom // 188

  // Hitung nilai maksimum
  const maxVal = Math.max(
    totalA,
    totalB,
    ...items.flatMap(i => [i.valA, i.valB]),
    10
  )
  const ceiling = Math.ceil(maxVal * 1.25)

  const ticks = [0, 0.25, 0.5, 0.75, 1].map(r => Math.round(ceiling * r))

  const getY = (val: number) => Number((padTop + plotHeight - (val / ceiling) * plotHeight).toFixed(2))
  const getH = (val: number) => Number(((val / ceiling) * plotHeight).toFixed(2))

  // Menentukan layout grup batang (diperlebar)
  const hasMultipleMonths = items.length > 1
  const numGroups = hasMultipleMonths ? items.length + 1 : 1 // items + TOTAL
  const groupWidth = Number((plotWidth / numGroups).toFixed(2))
  const barWidth = hasMultipleMonths ? Math.min(24, Math.max(10, Number(((groupWidth - 12) / 2).toFixed(2)))) : 48

  return (
    <div className="bg-white rounded-2xl p-2.5 sm:p-3 border border-gray-200 shadow-sm flex flex-col justify-between h-full font-nav transition-all">
      {/* Tren Badge (Jika ada selisih) */}
      {diff !== 0 && (
        <div className="w-full flex items-center justify-end pb-1">
          {diff > 0 ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <TrendingUp size={11} />
              +{diff.toLocaleString('id-ID')} ({diffPct > 0 ? `+${diffPct.toFixed(1)}%` : '0%'})
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] font-black text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
              <TrendingDown size={11} />
              {diff.toLocaleString('id-ID')} ({diffPct.toFixed(1)}%)
            </span>
          )}
        </div>
      )}

      {/* SVG Bar Chart */}
      <div className="relative my-auto flex-1 flex items-center justify-center py-1">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible" style={{ maxHeight: 250 }}>
          {/* Grid lines horizontal */}
          {ticks.map((t) => {
            const y = getY(t)
            return (
              <g key={t}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={width - padRight}
                  y2={y}
                  stroke="#dbeafe"
                  strokeWidth="1"
                  strokeDasharray={t === 0 ? 'none' : '3 3'}
                />
                <text
                  x={padLeft - 8}
                  y={y + 3.5}
                  textAnchor="end"
                  fill="#94a3b8"
                  fontSize="9.5"
                  fontWeight="700"
                >
                  {t.toLocaleString('id-ID')}
                </text>
              </g>
            )
          })}

          {/* Sumbu X dasar */}
          <line
            x1={padLeft}
            y1={padTop + plotHeight}
            x2={width - padRight}
            y2={padTop + plotHeight}
            stroke="#cbd5e1"
            strokeWidth="1.5"
          />

          {/* Batang-batang */}
          {hasMultipleMonths ? (
            <>
              {/* Grup Bulan */}
              {items.map((item, idx) => {
                const groupCenterX = Number((padLeft + idx * groupWidth + groupWidth / 2).toFixed(2))
                const barAX = Number((groupCenterX - barWidth - 1.5).toFixed(2))
                const barBX = Number((groupCenterX + 1.5).toFixed(2))

                const hA = getH(item.valA)
                const yA = getY(item.valA)
                const hB = getH(item.valB)
                const yB = getY(item.valB)

                return (
                  <g key={item.bulan}>
                    {/* Batang A (Periode 1) */}
                    <rect
                      x={barAX}
                      y={yA}
                      width={barWidth}
                      height={hA}
                      fill={colorA}
                      rx="3"
                      className="cursor-pointer transition-all duration-200 hover:opacity-85"
                      onMouseEnter={() => setHoveredBar({ label: item.bulan, period: labelA, val: item.valA })}
                      onMouseLeave={() => setHoveredBar(null)}
                    />
                    {item.valA > 0 && (
                      <text
                        x={Number((barAX + barWidth / 2).toFixed(2))}
                        y={yA - 4}
                        textAnchor="middle"
                        fill="#00282b"
                        fontSize="9"
                        fontWeight="800"
                      >
                        {item.valA.toLocaleString('id-ID')}
                      </text>
                    )}

                    {/* Batang B (Periode 2) */}
                    <rect
                      x={barBX}
                      y={yB}
                      width={barWidth}
                      height={hB}
                      fill={colorB}
                      rx="3"
                      className="cursor-pointer transition-all duration-200 hover:opacity-85"
                      onMouseEnter={() => setHoveredBar({ label: item.bulan, period: labelB, val: item.valB })}
                      onMouseLeave={() => setHoveredBar(null)}
                    />
                    {item.valB > 0 && (
                      <text
                        x={Number((barBX + barWidth / 2).toFixed(2))}
                        y={yB - 4}
                        textAnchor="middle"
                        fill="#00282b"
                        fontSize="9"
                        fontWeight="800"
                      >
                        {item.valB.toLocaleString('id-ID')}
                      </text>
                    )}

                    {/* Label Bulan */}
                    <text
                      x={groupCenterX}
                      y={padTop + plotHeight + 16}
                      textAnchor="middle"
                      fill="#64748b"
                      fontSize="10"
                      fontWeight="700"
                    >
                      {item.bulanSingkat}
                    </text>
                  </g>
                )
              })}

              {/* Separator Garis Vertikal sebelum grup Total */}
              {(() => {
                const sepX = Number((padLeft + items.length * groupWidth).toFixed(2))
                return (
                  <line
                    x1={sepX}
                    y1={padTop}
                    x2={sepX}
                    y2={padTop + plotHeight}
                    stroke="#cbd5e1"
                    strokeWidth="1.5"
                    strokeDasharray="4 3"
                  />
                )
              })()}

              {/* Grup TOTAL */}
              {(() => {
                const idx = items.length
                const groupCenterX = Number((padLeft + idx * groupWidth + groupWidth / 2).toFixed(2))
                const barAX = Number((groupCenterX - barWidth - 1.5).toFixed(2))
                const barBX = Number((groupCenterX + 1.5).toFixed(2))

                const hA = getH(totalA)
                const yA = getY(totalA)
                const hB = getH(totalB)
                const yB = getY(totalB)

                return (
                  <g>
                    {/* Background Highlight Grup Total */}
                    <rect
                      x={Number((padLeft + idx * groupWidth + 2).toFixed(2))}
                      y={padTop}
                      width={Number((groupWidth - 4).toFixed(2))}
                      height={plotHeight}
                      fill="#f8fafc"
                      rx="4"
                      opacity="0.6"
                    />

                    {/* Batang Total A */}
                    <rect
                      x={barAX}
                      y={yA}
                      width={barWidth}
                      height={hA}
                      fill={colorA}
                      rx="3"
                      className="cursor-pointer transition-all duration-200 hover:opacity-85"
                      onMouseEnter={() => setHoveredBar({ label: 'Total', period: labelA, val: totalA })}
                      onMouseLeave={() => setHoveredBar(null)}
                    />
                    {totalA > 0 && (
                      <text
                        x={Number((barAX + barWidth / 2).toFixed(2))}
                        y={yA - 4}
                        textAnchor="middle"
                        fill="#01bcce"
                        fontSize="9.5"
                        fontWeight="900"
                      >
                        {totalA.toLocaleString('id-ID')}
                      </text>
                    )}

                    {/* Batang Total B */}
                    <rect
                      x={barBX}
                      y={yB}
                      width={barWidth}
                      height={hB}
                      fill={colorB}
                      rx="3"
                      className="cursor-pointer transition-all duration-200 hover:opacity-85"
                      onMouseEnter={() => setHoveredBar({ label: 'Total', period: labelB, val: totalB })}
                      onMouseLeave={() => setHoveredBar(null)}
                    />
                    {totalB > 0 && (
                      <text
                        x={Number((barBX + barWidth / 2).toFixed(2))}
                        y={yB - 4}
                        textAnchor="middle"
                        fill="#00282b"
                        fontSize="9.5"
                        fontWeight="900"
                      >
                        {totalB.toLocaleString('id-ID')}
                      </text>
                    )}

                    {/* Label TOTAL */}
                    <text
                      x={groupCenterX}
                      y={padTop + plotHeight + 16}
                      textAnchor="middle"
                      fill="#00282b"
                      fontSize="10"
                      fontWeight="900"
                    >
                      TOTAL
                    </text>
                  </g>
                )
              })()}
            </>
          ) : (
            /* Mode 1 Bulan */
            (() => {
              const center1 = Number((padLeft + plotWidth * 0.35).toFixed(2))
              const center2 = Number((padLeft + plotWidth * 0.65).toFixed(2))
              const bWidth = 54

              const hA = getH(totalA)
              const yA = getY(totalA)
              const hB = getH(totalB)
              const yB = getY(totalB)

              return (
                <g>
                  {/* Batang A */}
                  <rect
                    x={Number((center1 - bWidth / 2).toFixed(2))}
                    y={yA}
                    width={bWidth}
                    height={hA}
                    fill={colorA}
                    rx="4"
                    className="cursor-pointer transition-all duration-200 hover:opacity-85"
                    onMouseEnter={() => setHoveredBar({ label: 'Dokumen', period: labelA, val: totalA })}
                    onMouseLeave={() => setHoveredBar(null)}
                  />
                  {totalA > 0 && (
                    <text
                      x={center1}
                      y={yA - 6}
                      textAnchor="middle"
                      fill="#01bcce"
                      fontSize="12"
                      fontWeight="900"
                    >
                      {totalA.toLocaleString('id-ID')}
                    </text>
                  )}
                  <text
                    x={center1}
                    y={padTop + plotHeight + 18}
                    textAnchor="middle"
                    fill="#00282b"
                    fontSize="11"
                    fontWeight="800"
                  >
                    {labelA}
                  </text>

                  {/* Batang B */}
                  <rect
                    x={Number((center2 - bWidth / 2).toFixed(2))}
                    y={yB}
                    width={bWidth}
                    height={hB}
                    fill={colorB}
                    rx="4"
                    className="cursor-pointer transition-all duration-200 hover:opacity-85"
                    onMouseEnter={() => setHoveredBar({ label: 'Dokumen', period: labelB, val: totalB })}
                    onMouseLeave={() => setHoveredBar(null)}
                  />
                  {totalB > 0 && (
                    <text
                      x={center2}
                      y={yB - 6}
                      textAnchor="middle"
                      fill="#00282b"
                      fontSize="12"
                      fontWeight="900"
                    >
                      {totalB.toLocaleString('id-ID')}
                    </text>
                  )}
                  <text
                    x={center2}
                    y={padTop + plotHeight + 18}
                    textAnchor="middle"
                    fill="#00282b"
                    fontSize="11"
                    fontWeight="800"
                  >
                    {labelB}
                  </text>
                </g>
              )
            })()
          )}
        </svg>
      </div>

      {/* Legend Batang di Bawah */}
      <div className="flex items-center justify-center gap-4 text-xs font-bold flex-wrap pt-3 mt-1 border-t border-gray-100 font-nav">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-cyan-50/70 border border-cyan-100 text-[#00282b]">
          <span className="w-3.5 h-3.5 rounded-md shadow-xs" style={{ background: colorA }} />
          <span>{labelA}</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-50 border border-gray-200 text-[#00282b]">
          <span className="w-3.5 h-3.5 rounded-md shadow-xs" style={{ background: colorB }} />
          <span>{labelB}</span>
        </div>
      </div>
    </div>
  )
}

// =========================================================================
// ============= REVISI DOKUMEN TAGIHAN: PERBANDINGAN CHARTS ===============
// =========================================================================

function getNiceMaxScale(val: number): number {
  if (val <= 0) return 10
  if (val <= 10) return 10
  if (val <= 25) return 25
  if (val <= 50) return 50
  if (val <= 100) return 100
  if (val <= 200) return 200
  if (val <= 500) return 500
  const magnitude = Math.pow(10, Math.floor(Math.log10(val)))
  return Math.ceil(val / magnitude) * magnitude
}

export interface ColumnComparisonItem {
  bulan: string
  bulanSingkat: string
  internalA: number
  eksternalA: number
  keseluruhanA: number
  internalB: number
  eksternalB: number
  keseluruhanB: number
  isIncludedA: boolean
  isIncludedB: boolean
}

export interface VerifikasiColumnComparisonChartProps {
  title?: string
  labelA: string
  labelB: string
  yearA: number
  yearB: number
  items: ColumnComparisonItem[]
  colorInternal?: string
  colorEksternal?: string
}

/**
 * Chart 1 (Column):
 * 1 Bar terdiri dari stacked Internal (bawah) + Eksternal (atas), tinggi total = Keseluruhan.
 * Angka internal & eksternal dimasukkan ke dalam batang column chart.
 * Angka total keseluruhan berada di atas batang.
 * Periode perbandingan bersampingan (Bar A & Bar B per bulan).
 * Tanpa kolom / angka total di akhir grafik.
 * Judul & Periode di-center, tanpa bulat di judul.
 * Legend hanya Internal dan Eksternal.
 */
export function VerifikasiColumnComparisonChart({
  title = 'Perbandingan Dokumen Tagihan',
  labelA,
  labelB,
  yearA,
  yearB,
  items = [],
  colorInternal = '#01bcce',
  colorEksternal = '#268484',
}: VerifikasiColumnComparisonChartProps) {
  const [hovered, setHovered] = useState<{
    bulan: string
    period: string
    year: number
    internal: number
    eksternal: number
    keseluruhan: number
  } | null>(null)

  const hasAnyData = items.some(it => it.keseluruhanA > 0 || it.keseluruhanB > 0)

  if (!hasAnyData) {
    return (
      <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-xs flex flex-col items-center justify-center min-h-[300px] text-center font-nav">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-2.5 bg-[#eef9fa] text-[#01bcce]">
          <BarChart3 size={20} />
        </div>
        {title && <h4 className="font-black text-sm text-[#00282b]">{title}</h4>}
        {labelA && labelB ? (
          <p className="text-xs font-bold text-gray-500 mt-1">
            {labelA} <span className="font-normal text-gray-400">vs</span> {labelB}
          </p>
        ) : labelA ? (
          <p className="text-xs font-bold text-gray-500 mt-1">{labelA}</p>
        ) : labelB ? (
          <p className="text-xs font-bold text-gray-500 mt-1">{labelB}</p>
        ) : null}
        <p className="text-gray-400 font-bold text-xs mt-1">
          {(!labelA && !labelB)
            ? 'Silakan pilih bulan pada periode perbandingan di atas untuk menampilkan grafik.'
            : 'Belum ada data dokumen tagihan yang diinput pada periode yang dibandingkan.'}
        </p>
        {(!labelA && !labelB) && (
          <p className="text-gray-400 text-[11px] mt-0.5">Gunakan filter periode di atas untuk memilih bulan yang ingin dibandingkan.</p>
        )}
      </div>
    )
  }

  const maxVal = Math.max(1, ...items.map(it => Math.max(it.keseluruhanA, it.keseluruhanB)))
  const ceil = getNiceMaxScale(maxVal)
  const ticks = [0, ceil * 0.25, ceil * 0.5, ceil * 0.75, ceil].map(v => Math.round(v))

  // Dimensi lebar penuh untuk tampilan atas-bawah
  const width = Math.max(760, items.length * 70 + 90)
  const height = 310
  const padLeft = 50
  const padRight = 25
  const padTop = 38
  const padBottom = 55
  const plotWidth = width - padLeft - padRight
  const plotHeight = height - padTop - padBottom

  const getY = (val: number) => Number((padTop + plotHeight - (val / ceil) * plotHeight).toFixed(2))
  const groupWidth = plotWidth / Math.max(1, items.length)

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200 shadow-xs flex flex-col justify-between font-nav w-full">
      {/* Header (Center, tanpa bulat di judul) */}
      <div className="pb-3 border-b border-gray-100 text-center relative">
        <h4 className="font-black text-sm sm:text-base text-[#00282b] leading-tight">
          {title}
        </h4>
        {labelA && labelB ? (
          <p className="text-xs font-bold text-gray-500 mt-1">
            {labelA} <span className="font-normal text-gray-400">vs</span> {labelB}
          </p>
        ) : labelA ? (
          <p className="text-xs font-bold text-gray-500 mt-1">{labelA}</p>
        ) : labelB ? (
          <p className="text-xs font-bold text-gray-500 mt-1">{labelB}</p>
        ) : null}

        {/* Floating Tooltip saat hover */}
        {hovered && (
          <div className="hidden sm:inline-flex absolute right-2 top-0 px-2.5 py-1 rounded-lg bg-[#00282b] text-white text-[11px] font-bold shadow-sm items-center">
            <span>{hovered.bulan} {hovered.year} ({hovered.period}): </span>
            <span className="text-[#d0db41] ml-1">{hovered.keseluruhan.toLocaleString('id-ID')} Dok</span>
            <span className="text-gray-300 ml-1.5 font-normal">(Int: {hovered.internal.toLocaleString('id-ID')}, Eks: {hovered.eksternal.toLocaleString('id-ID')})</span>
          </div>
        )}
      </div>

      {/* SVG Column Chart */}
      <div className="relative my-auto flex-1 flex items-center justify-center py-2 overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible" style={{ maxHeight: 310, minWidth: 420 }}>
          {/* Horizontal Grid lines */}
          {ticks.map((t) => {
            const y = getY(t)
            return (
              <g key={t}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={width - padRight}
                  y2={y}
                  stroke="#e2e8f0"
                  strokeWidth="1"
                  strokeDasharray={t === 0 ? 'none' : '3 3'}
                />
                <text
                  x={padLeft - 8}
                  y={y + 3.5}
                  textAnchor="end"
                  fill="#94a3b8"
                  fontSize="9.5"
                  fontWeight="700"
                >
                  {t.toLocaleString('id-ID')}
                </text>
              </g>
            )
          })}

          {/* Sumbu X dasar */}
          <line
            x1={padLeft}
            y1={padTop + plotHeight}
            x2={width - padRight}
            y2={padTop + plotHeight}
            stroke="#cbd5e1"
            strokeWidth="1.5"
          />

          {/* Bar Groups per Bulan (Side-by-side: Bar A & Bar B) */}
          {items.map((item, idx) => {
            const groupCenterX = Number((padLeft + idx * groupWidth + groupWidth / 2).toFixed(2))
            const barWidth = Math.min(28, Math.max(16, (groupWidth - 14) / 2))
            const barAX = Number((groupCenterX - barWidth - 2).toFixed(2))
            const barBX = Number((groupCenterX + 2).toFixed(2))

            // Bar A (Periode A)
            const hIntA = Number(((item.internalA / ceil) * plotHeight).toFixed(2))
            const hEksA = Number(((item.eksternalA / ceil) * plotHeight).toFixed(2))
            const hTotA = hIntA + hEksA
            const yIntA = Number((padTop + plotHeight - hIntA).toFixed(2))
            const yEksA = Number((padTop + plotHeight - hTotA).toFixed(2))

            // Bar B (Periode B)
            const hIntB = Number(((item.internalB / ceil) * plotHeight).toFixed(2))
            const hEksB = Number(((item.eksternalB / ceil) * plotHeight).toFixed(2))
            const hTotB = hIntB + hEksB
            const yIntB = Number((padTop + plotHeight - hIntB).toFixed(2))
            const yEksB = Number((padTop + plotHeight - hTotB).toFixed(2))

            return (
              <g key={`${item.bulan}-${idx}`}>
                {/* 1. STACKED BAR A */}
                <g
                  className="cursor-pointer transition-all duration-200 hover:opacity-85"
                  onMouseEnter={() => setHovered({
                    bulan: item.bulan,
                    period: labelA,
                    year: yearA,
                    internal: item.internalA,
                    eksternal: item.eksternalA,
                    keseluruhan: item.keseluruhanA,
                  })}
                  onMouseLeave={() => setHovered(null)}
                >
                  {/* Internal segment A (bawah) */}
                  {hIntA > 0 && (
                    <rect
                      x={barAX}
                      y={yIntA}
                      width={barWidth}
                      height={hIntA}
                      fill={colorInternal}
                      rx={hEksA > 0 ? 0 : 3}
                    />
                  )}
                  {/* Angka internal di dalam batang Internal A */}
                  {item.internalA > 0 && hIntA >= 13 && (
                    <text
                      x={barAX + barWidth / 2}
                      y={yIntA + hIntA / 2 + 3.5}
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize={hIntA < 18 ? "8" : "9"}
                      fontWeight="800"
                    >
                      {item.internalA.toLocaleString('id-ID')}
                    </text>
                  )}

                  {/* Eksternal segment A (atas) */}
                  {hEksA > 0 && (
                    <rect
                      x={barAX}
                      y={yEksA}
                      width={barWidth}
                      height={hEksA}
                      fill={colorEksternal}
                      rx="3"
                    />
                  )}
                  {/* Angka eksternal di dalam batang Eksternal A */}
                  {item.eksternalA > 0 && hEksA >= 13 && (
                    <text
                      x={barAX + barWidth / 2}
                      y={yEksA + hEksA / 2 + 3.5}
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize={hEksA < 18 ? "8" : "9"}
                      fontWeight="800"
                    >
                      {item.eksternalA.toLocaleString('id-ID')}
                    </text>
                  )}

                  {/* Angka Total Keseluruhan di atas Bar A */}
                  {item.keseluruhanA > 0 && (
                    <text
                      x={barAX + barWidth / 2}
                      y={yEksA - 5}
                      textAnchor="middle"
                      fill="#00282b"
                      fontSize="9.5"
                      fontWeight="900"
                    >
                      {item.keseluruhanA.toLocaleString('id-ID')}
                    </text>
                  )}
                </g>

                {/* 2. STACKED BAR B */}
                <g
                  className="cursor-pointer transition-all duration-200 hover:opacity-85"
                  onMouseEnter={() => setHovered({
                    bulan: item.bulan,
                    period: labelB,
                    year: yearB,
                    internal: item.internalB,
                    eksternal: item.eksternalB,
                    keseluruhan: item.keseluruhanB,
                  })}
                  onMouseLeave={() => setHovered(null)}
                >
                  {/* Internal segment B (bawah) */}
                  {hIntB > 0 && (
                    <rect
                      x={barBX}
                      y={yIntB}
                      width={barWidth}
                      height={hIntB}
                      fill={colorInternal}
                      rx={hEksB > 0 ? 0 : 3}
                    />
                  )}
                  {/* Angka internal di dalam batang Internal B */}
                  {item.internalB > 0 && hIntB >= 13 && (
                    <text
                      x={barBX + barWidth / 2}
                      y={yIntB + hIntB / 2 + 3.5}
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize={hIntB < 18 ? "8" : "9"}
                      fontWeight="800"
                    >
                      {item.internalB.toLocaleString('id-ID')}
                    </text>
                  )}

                  {/* Eksternal segment B (atas) */}
                  {hEksB > 0 && (
                    <rect
                      x={barBX}
                      y={yEksB}
                      width={barWidth}
                      height={hEksB}
                      fill={colorEksternal}
                      rx="3"
                    />
                  )}
                  {/* Angka eksternal di dalam batang Eksternal B */}
                  {item.eksternalB > 0 && hEksB >= 13 && (
                    <text
                      x={barBX + barWidth / 2}
                      y={yEksB + hEksB / 2 + 3.5}
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize={hEksB < 18 ? "8" : "9"}
                      fontWeight="800"
                    >
                      {item.eksternalB.toLocaleString('id-ID')}
                    </text>
                  )}

                  {/* Angka Total Keseluruhan di atas Bar B */}
                  {item.keseluruhanB > 0 && (
                    <text
                      x={barBX + barWidth / 2}
                      y={yEksB - 5}
                      textAnchor="middle"
                      fill="#00282b"
                      fontSize="9.5"
                      fontWeight="900"
                    >
                      {item.keseluruhanB.toLocaleString('id-ID')}
                    </text>
                  )}
                </g>

                {/* Sub-label Tahun di bawah masing-masing bar */}
                <text
                  x={barAX + barWidth / 2}
                  y={padTop + plotHeight + 13}
                  textAnchor="middle"
                  fill="#64748b"
                  fontSize="8.5"
                  fontWeight="700"
                >
                  {yearA}
                </text>
                <text
                  x={barBX + barWidth / 2}
                  y={padTop + plotHeight + 13}
                  textAnchor="middle"
                  fill="#64748b"
                  fontSize="8.5"
                  fontWeight="700"
                >
                  {yearB}
                </text>

                {/* Label Bulan Utama */}
                <text
                  x={groupCenterX}
                  y={padTop + plotHeight + 28}
                  textAnchor="middle"
                  fill="#00282b"
                  fontSize="11"
                  fontWeight="800"
                >
                  {item.bulanSingkat}
                </text>
              </g>
            )
          })}
        </svg>
      </div>

      {/* Legend di Bawah (Hanya keterangan Internal dan Eksternal saja) */}
      <div className="flex items-center justify-center gap-4 text-xs font-bold flex-wrap pt-3 mt-1 border-t border-gray-100 font-nav">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-cyan-50/70 border border-cyan-100 text-[#00282b]">
          <span className="w-3.5 h-3.5 rounded-md shadow-xs" style={{ background: colorInternal }} />
          <span>Internal</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-teal-50/70 border border-teal-100 text-[#00282b]">
          <span className="w-3.5 h-3.5 rounded-md shadow-xs" style={{ background: colorEksternal }} />
          <span>Eksternal</span>
        </div>
      </div>
    </div>
  )
}

export interface VerifikasiHorizontalBarComparisonChartProps {
  title?: string
  labelA: string
  labelB: string
  internalA: number
  eksternalA: number
  keseluruhanA: number
  internalB: number
  eksternalB: number
  keseluruhanB: number
  colorInternal?: string
  colorEksternal?: string
  colorKeseluruhan?: string
}

/**
 * Chart 2 (Horizontal Bar):
 * Total berada di garis X (horizontal).
 * Periode berada di garis Y (vertikal).
 * Hanya ada 2 bar yang muncul (1 bar per periode).
 * Dalam 1 bar terdiri dari total tagihan internal (kiri) + eksternal (kanan) = total keseluruhan.
 * Batang dibuat lebih lebar/tebal.
 * Judul & Periode di-center, tanpa bulat di judul, tanpa teks "Garis X...".
 * Legend hanya Internal dan Eksternal.
 */
export function VerifikasiHorizontalBarComparisonChart({
  title = 'Perbandingan Total Dokumen Tagihan',
  labelA,
  labelB,
  internalA,
  eksternalA,
  keseluruhanA,
  internalB,
  eksternalB,
  keseluruhanB,
  colorInternal = '#01bcce',
  colorEksternal = '#268484',
}: VerifikasiHorizontalBarComparisonChartProps) {
  const [hovered, setHovered] = useState<{
    period: string
    internal: number
    eksternal: number
    keseluruhan: number
  } | null>(null)

  const hasAnyData = keseluruhanA > 0 || keseluruhanB > 0

  if (!hasAnyData) {
    return (
      <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-xs flex flex-col items-center justify-center min-h-[220px] text-center font-nav">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-2.5 bg-[#eef9fa] text-[#01bcce]">
          <BarChart3 size={20} />
        </div>
        {title && <h4 className="font-black text-sm text-[#00282b]">{title}</h4>}
        {labelA && labelB ? (
          <p className="text-xs font-bold text-gray-500 mt-1">
            {labelA} <span className="font-normal text-gray-400">vs</span> {labelB}
          </p>
        ) : labelA ? (
          <p className="text-xs font-bold text-gray-500 mt-1">{labelA}</p>
        ) : labelB ? (
          <p className="text-xs font-bold text-gray-500 mt-1">{labelB}</p>
        ) : null}
        <p className="text-gray-400 font-bold text-xs mt-1">
          {(!labelA && !labelB)
            ? 'Silakan pilih bulan pada periode perbandingan di atas untuk menampilkan grafik.'
            : 'Belum ada data dokumen tagihan yang diinput pada periode yang dibandingkan.'}
        </p>
      </div>
    )
  }

  const maxVal = Math.max(1, keseluruhanA, keseluruhanB)
  const ceil = getNiceMaxScale(maxVal)
  const ticks = [0, ceil * 0.25, ceil * 0.5, ceil * 0.75, ceil].map(v => Math.round(v))

  const width = 800
  const height = 220
  const padLeft = 160
  const padRight = 70
  const padTop = 22
  const padBottom = 45
  const plotWidth = width - padLeft - padRight
  const plotHeight = height - padTop - padBottom

  const getX = (val: number) => Number((padLeft + (val / ceil) * plotWidth).toFixed(2))

  const barHeight = 40
  const gap = 24
  const totalBarsHeight = 2 * barHeight + gap
  const startY = padTop + (plotHeight - totalBarsHeight) / 2

  const bars = [
    {
      period: labelA || 'Periode A',
      internal: internalA,
      eksternal: eksternalA,
      keseluruhan: keseluruhanA,
      y: startY,
    },
    {
      period: labelB || 'Periode B',
      internal: internalB,
      eksternal: eksternalB,
      keseluruhan: keseluruhanB,
      y: startY + barHeight + gap,
    },
  ]

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200 shadow-xs flex flex-col justify-between font-nav w-full">
      {/* Header (Center, tanpa bulat di judul, tanpa teks Garis X/Y) */}
      <div className="pb-3 border-b border-gray-100 text-center relative">
        <h4 className="font-black text-sm sm:text-base text-[#00282b] leading-tight">
          {title}
        </h4>
        {labelA && labelB ? (
          <p className="text-xs font-bold text-gray-500 mt-1">
            {labelA} <span className="font-normal text-gray-400">vs</span> {labelB}
          </p>
        ) : labelA ? (
          <p className="text-xs font-bold text-gray-500 mt-1">{labelA}</p>
        ) : labelB ? (
          <p className="text-xs font-bold text-gray-500 mt-1">{labelB}</p>
        ) : null}

        {/* Floating Tooltip saat hover */}
        {hovered && (
          <div className="hidden sm:inline-flex absolute right-2 top-0 px-2.5 py-1 rounded-lg bg-[#00282b] text-white text-[11px] font-bold shadow-sm items-center">
            <span>{hovered.period}: </span>
            <span className="text-[#d0db41] ml-1">{hovered.keseluruhan.toLocaleString('id-ID')} Dok</span>
            <span className="text-gray-300 ml-1.5 font-normal">(Int: {hovered.internal.toLocaleString('id-ID')}, Eks: {hovered.eksternal.toLocaleString('id-ID')})</span>
          </div>
        )}
      </div>

      {/* SVG Horizontal Bar Chart */}
      <div className="relative my-auto flex-1 flex items-center justify-center py-2 overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible" style={{ maxHeight: 220, minWidth: 420 }}>
          {/* Vertical Grid lines for X-axis (Total) */}
          {ticks.map((t) => {
            const x = getX(t)
            return (
              <g key={t}>
                <line
                  x1={x}
                  y1={padTop}
                  x2={x}
                  y2={padTop + plotHeight}
                  stroke="#e2e8f0"
                  strokeWidth="1"
                  strokeDasharray={t === 0 ? 'none' : '3 3'}
                />
                <text
                  x={x}
                  y={padTop + plotHeight + 16}
                  textAnchor="middle"
                  fill="#94a3b8"
                  fontSize="9.5"
                  fontWeight="700"
                >
                  {t.toLocaleString('id-ID')}
                </text>
              </g>
            )
          })}

          {/* Sumbu Y Vertikal dasar */}
          <line
            x1={padLeft}
            y1={padTop}
            x2={padLeft}
            y2={padTop + plotHeight}
            stroke="#cbd5e1"
            strokeWidth="1.5"
          />

          {/* Sumbu X dasar */}
          <line
            x1={padLeft}
            y1={padTop + plotHeight}
            x2={width - padRight}
            y2={padTop + plotHeight}
            stroke="#cbd5e1"
            strokeWidth="1.5"
          />

          {/* 2 STACKED HORIZONTAL BARS */}
          {bars.map((b, idx) => {
            const wInt = Number(((b.internal / ceil) * plotWidth).toFixed(2))
            const wEks = Number(((b.eksternal / ceil) * plotWidth).toFixed(2))
            const wTot = wInt + wEks
            const xInt = padLeft
            const xEks = padLeft + wInt

            return (
              <g
                key={`stacked-bar-${idx}`}
                className="cursor-pointer transition-all duration-200 hover:opacity-85"
                onMouseEnter={() => setHovered({
                  period: b.period,
                  internal: b.internal,
                  eksternal: b.eksternal,
                  keseluruhan: b.keseluruhan,
                })}
                onMouseLeave={() => setHovered(null)}
              >
                {/* Label Periode di Sisi Kiri */}
                <text
                  x={padLeft - 14}
                  y={b.y + barHeight / 2 + 4}
                  textAnchor="end"
                  fill="#00282b"
                  fontSize="12"
                  fontWeight="800"
                >
                  {b.period}
                </text>

                {/* Segmen Internal (Kiri) */}
                {wInt > 0 && (
                  <rect
                    x={xInt}
                    y={b.y}
                    width={wInt}
                    height={barHeight}
                    fill={colorInternal}
                    rx={wEks > 0 ? 0 : 4}
                  />
                )}
                {/* Angka internal di dalam segmen */}
                {b.internal > 0 && wInt >= 26 && (
                  <text
                    x={xInt + wInt / 2}
                    y={b.y + barHeight / 2 + 4}
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="11"
                    fontWeight="800"
                  >
                    {b.internal.toLocaleString('id-ID')}
                  </text>
                )}

                {/* Segmen Eksternal (Kanan) */}
                {wEks > 0 && (
                  <rect
                    x={xEks}
                    y={b.y}
                    width={wEks}
                    height={barHeight}
                    fill={colorEksternal}
                    rx="4"
                  />
                )}
                {/* Angka eksternal di dalam segmen */}
                {b.eksternal > 0 && wEks >= 26 && (
                  <text
                    x={xEks + wEks / 2}
                    y={b.y + barHeight / 2 + 4}
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="11"
                    fontWeight="800"
                  >
                    {b.eksternal.toLocaleString('id-ID')}
                  </text>
                )}

                {/* Angka Total Keseluruhan di Ujung Batang */}
                {b.keseluruhan > 0 && (
                  <text
                    x={padLeft + wTot + 8}
                    y={b.y + barHeight / 2 + 4}
                    textAnchor="start"
                    fill="#00282b"
                    fontSize="12.5"
                    fontWeight="900"
                  >
                    {b.keseluruhan.toLocaleString('id-ID')}
                  </text>
                )}
              </g>
            )
          })}
        </svg>
      </div>

      {/* Legend di Bawah (Hanya keterangan Internal dan Eksternal saja) */}
      <div className="flex items-center justify-center gap-4 text-xs font-bold flex-wrap pt-3 mt-1 border-t border-gray-100 font-nav">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-cyan-50/70 border border-cyan-100 text-[#00282b]">
          <span className="w-3.5 h-3.5 rounded-md shadow-xs" style={{ background: colorInternal }} />
          <span>Internal</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-teal-50/70 border border-teal-100 text-[#00282b]">
          <span className="w-3.5 h-3.5 rounded-md shadow-xs" style={{ background: colorEksternal }} />
          <span>Eksternal</span>
        </div>
      </div>
    </div>
  )
}

// =========================================================================
// ========================== SLA CHARTS SECTION ===========================
// =========================================================================

export interface SlaSectionLineDataPoint {
  bulan: string
  bulanSingkat: string
  verifikasi: number
  pengambilan: number
  pengembalian: number
  has_data?: boolean
}

export interface SlaSectionLineChartProps {
  data: SlaSectionLineDataPoint[]
  title?: string
  periodeLabel?: string
  colorVerifikasi?: string
  colorPengambilan?: string
  colorPengembalian?: string
}

/**
 * Line Chart SLA 3 Lines:
 * Line 1: SLA Verifikasi (Cyan)
 * Line 2: SLA Pengambilan (Teal)
 * Line 3: SLA Pengembalian (Lime)
 * Legend di bawah memuat 3 kategori tersebut.
 */
export function SlaSectionLineChart({
  data,
  title,
  periodeLabel,
  colorVerifikasi = '#01bcce',
  colorPengambilan = '#268484',
  colorPengembalian = '#d0db41',
}: SlaSectionLineChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)

  const hasAnyData = data && data.some(d => (d.verifikasi || 0) > 0 || (d.pengambilan || 0) > 0 || (d.pengembalian || 0) > 0)

  if (!data || data.length === 0 || !hasAnyData) {
    return (
      <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-xs flex flex-col items-center justify-center min-h-[260px] text-center font-nav">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-2.5 bg-[#eef9fa] text-[#01bcce]">
          <BarChart3 size={20} />
        </div>
        {title && <h4 className="font-black text-sm text-[#00282b] mb-1">{title}</h4>}
        <p className="text-gray-400 font-bold text-sm">Belum ada data SLA yang diinput untuk periode ini.</p>
        <p className="text-gray-300 text-xs mt-1">Grafik tren akan tampil otomatis setelah ada data yang diinput.</p>
      </div>
    )
  }

  const width = 820
  const height = 280
  const padLeft = 56
  const padRight = 30
  const padTop = 30
  const padBottom = 45

  const plotWidth = width - padLeft - padRight
  const plotHeight = height - padTop - padBottom
  const n = data.length

  const ceiling = 100
  const ticks = [0, 25, 50, 75, 100]

  // Batasi jarak antar titik ketika bulan yang dipilih sedikit agar tidak menempel di ujung kiri dan kanan
  const availableWidth = width - padLeft - padRight
  const baseMargin = 32
  const maxAllowedSpan = availableWidth - 2 * baseMargin
  const stepX = n <= 1 ? 0 : Math.min(200, maxAllowedSpan / (n - 1))
  const totalSpan = n <= 1 ? 0 : (n - 1) * stepX
  const startX = padLeft + (availableWidth - totalSpan) / 2

  const getX = (i: number) => {
    if (n <= 1) return Number((padLeft + availableWidth / 2).toFixed(2))
    return Number((startX + i * stepX).toFixed(2))
  }

  const getY = (val: number) => {
    const clamped = Math.max(0, Math.min(100, val || 0))
    return Number((padTop + plotHeight - (clamped / ceiling) * plotHeight).toFixed(2))
  }

  const makePath = (key: 'verifikasi' | 'pengambilan' | 'pengembalian') => {
    if (n <= 0) return ''
    return data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d[key])}`).join(' ')
  }

  const activeIndex = hoveredIdx !== null ? hoveredIdx : null
  const hoveredData = activeIndex !== null && activeIndex >= 0 ? data[activeIndex] : null

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200 shadow-xs flex flex-col justify-between font-nav w-full transition-all">
      {/* 1. Header & Judul Berada di Tengah Sesuai Format Sebelumnya */}
      <div className="w-full text-center mb-1 font-nav">
        <h4 className="font-nav font-black text-sm sm:text-base text-[#00282b] leading-tight">
          {title || 'Tren SLA'}
        </h4>
        <div className="mt-1">
          <span className="inline-block text-xs font-bold text-[#01bcce] bg-[#eef9fa] px-3.5 py-0.5 rounded-full border border-[#01bcce]/20 font-nav">
            {periodeLabel || 'Periode Jan – Des'}
          </span>
        </div>
      </div>

      {/* SVG Multi-Line Chart (3 Lines) */}
      <div className="relative my-auto flex-1 flex items-center justify-center py-2 overflow-x-auto select-none">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible" style={{ maxHeight: 280, minWidth: 420 }}>
          {/* Grid lines horizontal */}
          {ticks.map((t) => {
            const y = getY(t)
            return (
              <g key={t}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={width - padRight}
                  y2={y}
                  stroke="#e2e8f0"
                  strokeWidth="1"
                  strokeDasharray={t === 0 || t === 100 ? 'none' : '3 3'}
                />
                <text
                  x={padLeft - 8}
                  y={y + 3.5}
                  textAnchor="end"
                  fill="#94a3b8"
                  fontSize="9.5"
                  fontWeight="700"
                >
                  {t}%
                </text>
              </g>
            )
          })}

          {/* Sumbu X dasar */}
          <line
            x1={padLeft}
            y1={padTop + plotHeight}
            x2={width - padRight}
            y2={padTop + plotHeight}
            stroke="#cbd5e1"
            strokeWidth="1.5"
          />

          {/* Garis Vertikal Hover Guide */}
          {activeIndex !== null && (
            <line
              x1={getX(activeIndex)}
              y1={padTop}
              x2={getX(activeIndex)}
              y2={padTop + plotHeight}
              stroke="#01bcce"
              strokeWidth="1.5"
              strokeDasharray="4 4"
              opacity="0.8"
            />
          )}

          {/* 1. Line SLA Verifikasi (Cyan) */}
          <path
            d={makePath('verifikasi')}
            fill="none"
            stroke={colorVerifikasi}
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* 2. Line SLA Pengambilan (Teal) */}
          <path
            d={makePath('pengambilan')}
            fill="none"
            stroke={colorPengambilan}
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* 3. Line SLA Pengembalian (Lime) */}
          <path
            d={makePath('pengembalian')}
            fill="none"
            stroke={colorPengembalian}
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Dots dan Interaksi */}
          {data.map((d, i) => {
            const x = getX(i)
            const yVer = getY(d.verifikasi)
            const yPeng = getY(d.pengambilan)
            const yKem = getY(d.pengembalian)
            const isHovered = activeIndex === i

            return (
              <g key={d.bulan}>
                {/* Highlight capsule background saat di-hover */}
                {isHovered && (
                  <rect
                    x={x - 18}
                    y={padTop}
                    width={36}
                    height={plotHeight}
                    fill="#eef9fa"
                    rx="8"
                    opacity="0.6"
                  />
                )}

                {/* Dot Verifikasi */}
                <circle
                  cx={x}
                  cy={yVer}
                  r={isHovered ? 6 : 4}
                  fill={colorVerifikasi}
                  stroke="#ffffff"
                  strokeWidth="2"
                  className="pointer-events-none transition-all"
                />

                {/* Dot Pengambilan */}
                <circle
                  cx={x}
                  cy={yPeng}
                  r={isHovered ? 6 : 4}
                  fill={colorPengambilan}
                  stroke="#ffffff"
                  strokeWidth="2"
                  className="pointer-events-none transition-all"
                />

                {/* Dot Pengembalian */}
                <circle
                  cx={x}
                  cy={yKem}
                  r={isHovered ? 6 : 4.5}
                  fill={colorPengembalian}
                  stroke="#00282b"
                  strokeWidth="1.5"
                  className="pointer-events-none transition-all"
                />

                {/* Label Bulan Sumbu X */}
                <text
                  x={x}
                  y={padTop + plotHeight + 18}
                  textAnchor="middle"
                  fill={isHovered ? '#00282b' : '#64748b'}
                  fontSize={isHovered ? '11' : '10'}
                  fontWeight={isHovered ? '900' : '700'}
                >
                  {d.bulanSingkat}
                </text>

                {/* Invisible Hit Area Column untuk hover responsif dan mudah */}
                <rect
                  x={x - (n > 1 ? stepX / 2 : 30)}
                  y={padTop}
                  width={n > 1 ? stepX : 60}
                  height={plotHeight + 20}
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredIdx(i)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  onClick={() => setHoveredIdx(hoveredIdx === i ? null : i)}
                />
              </g>
            )
          })}
        </svg>

        {/* Floating Vertical List Card (Persis Gambar 2 Sesuai Permintaan) */}
        {hoveredData && activeIndex !== null && (
          <div
            className="absolute z-20 pointer-events-none transition-all duration-150 ease-out"
            style={{
              left: `${(getX(activeIndex) / width) * 100}%`,
              top: '16px',
              transform:
                getX(activeIndex) > width * 0.52
                  ? 'translateX(calc(-100% - 18px))'
                  : 'translateX(18px)',
            }}
          >
            <div className="bg-[#00282b]/95 backdrop-blur-md text-white rounded-2xl px-4 py-3 shadow-2xl border border-[#01bcce]/30 min-w-[190px] font-nav">
              <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-white/10">
                <span className="font-black text-xs text-[#d0db41]">
                  {hoveredData.bulan}
                </span>
                <span className="text-[10px] text-gray-300 font-bold bg-white/10 px-1.5 py-0.5 rounded">
                  {hoveredData.bulanSingkat}
                </span>
              </div>
              <div className="space-y-1.5 text-xs font-nav">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-gray-200 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full inline-block shadow-sm" style={{ background: colorVerifikasi }} />
                    SLA Verifikasi:
                  </span>
                  <span className="font-black text-white">
                    {hoveredData.verifikasi.toFixed(1)}%
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-teal-200 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full inline-block shadow-sm" style={{ background: colorPengambilan }} />
                    SLA Pengambilan:
                  </span>
                  <span className="font-black text-teal-300">
                    {hoveredData.pengambilan.toFixed(1)}%
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-lime-300 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full inline-block shadow-sm" style={{ background: colorPengembalian }} />
                    SLA Pengembalian:
                  </span>
                  <span className="font-black text-[#d0db41]">
                    {hoveredData.pengembalian.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Legend di Bawah (Hanya keterangan label, tanpa angka) */}
      <div className="flex items-center justify-center gap-4 text-xs font-bold flex-wrap pt-3 mt-1 border-t border-gray-100 font-nav">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-cyan-50/70 border border-cyan-100 text-[#00282b]">
          <span className="w-3.5 h-3.5 rounded-md shadow-xs" style={{ background: colorVerifikasi }} />
          <span>SLA Verifikasi</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-teal-50/70 border border-teal-100 text-[#00282b]">
          <span className="w-3.5 h-3.5 rounded-md shadow-xs" style={{ background: colorPengambilan }} />
          <span>SLA Pengambilan</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-lime-50/70 border border-[#d0db41]/40 text-[#00282b]">
          <span className="w-3.5 h-3.5 rounded-md shadow-xs border border-[#00282b]/30" style={{ background: colorPengembalian }} />
          <span>SLA Pengembalian</span>
        </div>
      </div>
    </div>
  )
}

export interface SlaLineChartDataPoint {
  bulan: string
  bulanSingkat: string
  internal: number
  eksternal: number
  keseluruhan: number
}

interface SlaLineChartProps {
  data: SlaLineChartDataPoint[]
  title?: string
  periodeLabel?: string
}

export function SlaLineChart({ data, title, periodeLabel }: SlaLineChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm flex flex-col items-center justify-center min-h-[260px] text-center font-nav">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-2.5 bg-[#eef9fa] text-[#01bcce]">
          <BarChart3 size={20} />
        </div>
        <p className="text-gray-400 font-bold text-sm">Belum ada data capaian SLA yang diinput.</p>
        <p className="text-gray-300 text-xs mt-1">Grafik tren akan tampil otomatis setelah ada data bulan yang diinput.</p>
      </div>
    )
  }

  const width = 760
  const height = 250
  const padLeft = 56
  const padRight = 28
  const padTop = 22
  const padBottom = 38

  const plotWidth = width - padLeft - padRight
  const plotHeight = height - padTop - padBottom
  const n = data.length

  // Sumbu Y persentase 0 - 100%
  const ceiling = 100
  const ticks = [0, 25, 50, 75, 100]

  const baseMargin = 28
  const maxAllowedSpan = plotWidth - 2 * baseMargin
  const stepX = n <= 1 ? 0 : Math.min(200, maxAllowedSpan / (n - 1))
  const totalSpan = n <= 1 ? 0 : (n - 1) * stepX
  const startX = padLeft + (plotWidth - totalSpan) / 2

  const getX = (i: number) => {
    if (n <= 1) return Number((padLeft + plotWidth / 2).toFixed(2))
    return Number((startX + i * stepX).toFixed(2))
  }

  const getY = (val: number) => {
    const clamped = Math.max(0, Math.min(100, val))
    return Number((padTop + plotHeight - (clamped / ceiling) * plotHeight).toFixed(2))
  }

  const makePath = (key: 'internal' | 'eksternal' | 'keseluruhan') => {
    if (n <= 0) return ''
    return data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d[key])}`).join(' ')
  }

  const activeIndex = hoveredIdx !== null ? hoveredIdx : null
  const hoveredData = activeIndex !== null && activeIndex >= 0 ? data[activeIndex] : null

  return (
    <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-gray-200 shadow-sm flex flex-col justify-between h-full font-nav transition-all">
      {/* Header & Judul */}
      <div className="w-full text-center mb-0.5">
        <h4 className="font-nav font-black text-sm sm:text-base text-[#00282b] leading-tight">
          {title || 'Tren Capaian SLA'}
        </h4>
        <div className="mt-0.5">
          <span className="inline-block text-[11px] font-bold text-[#01bcce] bg-[#eef9fa] px-3 py-0.5 rounded-full border border-[#01bcce]/20">
            {periodeLabel || 'Periode Jan – Des'}
          </span>
        </div>
      </div>

      {/* SVG Multi-Line Chart (Tinggi Diperpendek Sesuai Permintaan) */}
      <div className="relative my-auto flex-1 flex items-center justify-center py-1">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible" style={{ maxHeight: 250 }}>
          {/* Grid lines horizontal */}
          {ticks.map((t) => {
            const y = getY(t)
            return (
              <g key={t}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={width - padRight}
                  y2={y}
                  stroke="#dbeafe"
                  strokeWidth="1"
                  strokeDasharray={t === 0 || t === 100 ? 'none' : '3 3'}
                />
                <text
                  x={padLeft - 8}
                  y={y + 3.5}
                  textAnchor="end"
                  fill="#94a3b8"
                  fontSize="10"
                  fontWeight="700"
                >
                  {t}%
                </text>
              </g>
            )
          })}

          {/* Sumbu X dasar */}
          <line
            x1={padLeft}
            y1={padTop + plotHeight}
            x2={width - padRight}
            y2={padTop + plotHeight}
            stroke="#cbd5e1"
            strokeWidth="1.5"
          />

          {/* Garis Vertikal Hover */}
          {activeIndex !== null && (
            <line
              x1={getX(activeIndex)}
              y1={padTop}
              x2={getX(activeIndex)}
              y2={padTop + plotHeight}
              stroke="#01bcce"
              strokeWidth="1.5"
              strokeDasharray="4 4"
              opacity="0.8"
            />
          )}

          {/* 1. Line Keseluruhan (Lime/Gold with border #00282b) */}
          <path
            d={makePath('keseluruhan')}
            fill="none"
            stroke="#d0db41"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="drop-shadow-xs"
          />

          {/* 2. Line Internal (Cyan) */}
          <path
            d={makePath('internal')}
            fill="none"
            stroke="#01bcce"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* 3. Line Eksternal (Dark Teal #268484) */}
          <path
            d={makePath('eksternal')}
            fill="none"
            stroke="#268484"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Titik-titik Data & Label Sumbu X */}
          {data.map((d, i) => {
            const x = getX(i)
            const yInt = getY(d.internal)
            const yEks = getY(d.eksternal)
            const yAll = getY(d.keseluruhan)
            const isHovered = activeIndex === i

            return (
              <g key={d.bulan}>
                {/* Hit area untuk hover */}
                <rect
                  x={x - (stepX > 0 ? stepX / 2 : 25)}
                  y={padTop}
                  width={stepX > 0 ? stepX : 50}
                  height={plotHeight}
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredIdx(i)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  onClick={() => setHoveredIdx(hoveredIdx === i ? null : i)}
                />

                {/* Dot Internal */}
                <circle
                  cx={x}
                  cy={yInt}
                  r={isHovered ? 6 : 4}
                  fill="#01bcce"
                  stroke="#ffffff"
                  strokeWidth="2"
                  className="transition-all pointer-events-none"
                />

                {/* Dot Eksternal */}
                <circle
                  cx={x}
                  cy={yEks}
                  r={isHovered ? 6 : 4}
                  fill="#268484"
                  stroke="#ffffff"
                  strokeWidth="2"
                  className="transition-all pointer-events-none"
                />

                {/* Dot Keseluruhan */}
                <circle
                  cx={x}
                  cy={yAll}
                  r={isHovered ? 6.5 : 4.5}
                  fill="#d0db41"
                  stroke="#268484"
                  strokeWidth="1.5"
                  className="transition-all pointer-events-none"
                />

                {/* Label Bulan pada Sumbu X */}
                <text
                  x={x}
                  y={padTop + plotHeight + 17}
                  textAnchor="middle"
                  fill={isHovered ? '#00282b' : '#64748b'}
                  fontSize={n > 8 ? '9.5' : '11'}
                  fontWeight={isHovered ? '900' : '700'}
                >
                  {n > 8 ? d.bulanSingkat : d.bulan}
                </text>
              </g>
            )
          })}
        </svg>

        {/* Floating Vertical List Card (Toggle kecil seperti di Dokumen Tagihan) */}
        {hoveredData && activeIndex !== null && (
          <div
            className="absolute z-20 pointer-events-none transition-all duration-150 ease-out"
            style={{
              left: `${(getX(activeIndex) / width) * 100}%`,
              top: '12px',
              transform:
                getX(activeIndex) > width * 0.52
                  ? 'translateX(calc(-100% - 18px))'
                  : 'translateX(18px)',
            }}
          >
            <div className="bg-[#00282b]/95 backdrop-blur-md text-white rounded-xl px-4 py-2.5 shadow-2xl border border-[#01bcce]/30 min-w-[170px]">
              <div className="flex items-center justify-between pb-1 mb-1.5 border-b border-white/10">
                <span className="font-black text-xs text-[#d0db41]">
                  {hoveredData.bulan}
                </span>
                <span className="text-[10px] text-gray-300 font-bold bg-white/10 px-1.5 py-0.5 rounded">
                  {hoveredData.bulanSingkat}
                </span>
              </div>
              <div className="space-y-1 text-xs font-nav">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-cyan-300 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#01bcce] inline-block shadow-xs" />
                    Internal:
                  </span>
                  <span className="font-black text-[#01bcce]">
                    {hoveredData.internal.toFixed(1)}%
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-teal-200 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#268484] border border-white inline-block shadow-xs" />
                    Eksternal:
                  </span>
                  <span className="font-black text-white">
                    {hoveredData.eksternal.toFixed(1)}%
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[#d0db41] flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#d0db41] inline-block shadow-xs" />
                    Keseluruhan:
                  </span>
                  <span className="font-black text-[#d0db41]">
                    {hoveredData.keseluruhan.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Legend Garis di Bawah */}
      <div className="flex items-center justify-center gap-3 sm:gap-5 text-xs font-bold flex-wrap pt-2.5 border-t border-gray-100 font-nav">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-cyan-50/70 border border-cyan-100 text-[#00282b]">
          <span className="w-3 h-1 rounded-full bg-[#01bcce]" />
          <span>Internal</span>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-teal-50/70 border border-[#268484]/20 text-[#268484]">
          <span className="w-3 h-1 rounded-full bg-[#268484]" />
          <span>Eksternal</span>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#fafcd2]/60 border border-[#d0db41]/60 text-lime-900">
          <span className="w-3 h-1 rounded-full bg-[#d0db41] border border-[#268484]/30" />
          <span>Keseluruhan</span>
        </div>
      </div>
    </div>
  )
}

interface SlaPieChartProps {
  rataInternal: number
  rataEksternal: number
  rataKeseluruhan: number
  periodeLabel?: string
  title?: string
}

export function SlaPieChart({
  rataInternal,
  rataEksternal,
  rataKeseluruhan,
  periodeLabel,
  title,
}: SlaPieChartProps) {
  const [hoveredSlice, setHoveredSlice] = useState<'internal' | 'eksternal' | null>(null)

  const hasData = rataKeseluruhan > 0 || rataInternal > 0 || rataEksternal > 0
  const total = (rataInternal || 0) + (rataEksternal || 0)
  const pInternal = total > 0 ? (rataInternal || 0) / total : 0.5
  const pEksternal = total > 0 ? (rataEksternal || 0) / total : 0.5

  // Lebar bulatan (ketebalan cincin) dipertahankan tebal (48px) agar tulisan tetap tercover seluruhnya,
  // sementara radius dan kanvas diperkecil agar tinggi chart lebih pendek & proporsional
  const radius = 76
  const strokeWidth = 48
  const circumference = 2 * Math.PI * radius

  const internalStroke = pInternal * circumference
  const eksternalStroke = pEksternal * circumference

  // Posisi teks di dalam irisan donat (pusat 110, 110)
  const angleMidInternal = -Math.PI / 2 + Math.PI * pInternal
  const xInternal = Number((110 + radius * Math.cos(angleMidInternal)).toFixed(2))
  const yInternal = Number((110 + radius * Math.sin(angleMidInternal)).toFixed(2))

  const angleMidEksternal = -Math.PI / 2 + 2 * Math.PI * pInternal + Math.PI * pEksternal
  const xEksternal = Number((110 + radius * Math.cos(angleMidEksternal)).toFixed(2))
  const yEksternal = Number((110 + radius * Math.sin(angleMidEksternal)).toFixed(2))

  return (
    <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-gray-200 shadow-sm flex flex-col justify-between h-full font-nav transition-all">
      {/* Header & Subtitle */}
      <div className="w-full text-center mb-0.5">
        <h4 className="font-nav font-black text-sm sm:text-base text-[#00282b] leading-tight">
          {title || 'Proporsi Capaian SLA'}
        </h4>
        <div className="mt-0.5">
          <span className="inline-block text-[11px] font-bold text-[#01bcce] bg-[#eef9fa] px-3 py-0.5 rounded-full border border-[#01bcce]/20">
            {!hasData ? 'Belum Ada Data' : (periodeLabel || 'Periode Jan – Des')}
          </span>
        </div>
      </div>

      {/* SVG Donut Chart dengan Ukuran Proporsional & Tinggi Lebih Pendek */}
      <div className="relative my-auto flex-1 flex items-center justify-center py-1">
        <svg viewBox="0 0 220 220" className="w-44 h-44 sm:w-48 sm:h-48 md:w-52 md:h-52 overflow-visible" style={{ maxHeight: 205 }}>
          <defs>
            <filter id="slaPieGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#00282b" floodOpacity="0.08" />
            </filter>
          </defs>

          {/* Group Lingkaran Pie dengan rotasi -90deg */}
          <g transform="rotate(-90 110 110)">
            {/* Base background ring */}
            <circle
              cx="110"
              cy="110"
              r={radius}
              fill="transparent"
              stroke="#dbeafe"
              strokeWidth={strokeWidth}
            />

            {!hasData ? (
              <circle
                cx="110"
                cy="110"
                r={radius}
                fill="transparent"
                stroke="#e2e8f0"
                strokeWidth={strokeWidth}
              />
            ) : (
              <g filter="url(#slaPieGlow)">
                {/* 1. Irisan Internal (Cyan) */}
                {rataInternal > 0 && (
                  <circle
                    cx="110"
                    cy="110"
                    r={radius}
                    fill="transparent"
                    stroke="#01bcce"
                    strokeWidth={hoveredSlice === 'internal' ? strokeWidth + 5 : strokeWidth}
                    strokeDasharray={`${internalStroke} ${circumference}`}
                    strokeDashoffset="0"
                    className="transition-all duration-300 cursor-pointer"
                    onMouseEnter={() => setHoveredSlice('internal')}
                    onMouseLeave={() => setHoveredSlice(null)}
                  />
                )}

                {/* 2. Irisan Eksternal (Dark Teal #268484) */}
                {rataEksternal > 0 && (
                  <circle
                    cx="110"
                    cy="110"
                    r={radius}
                    fill="transparent"
                    stroke="#268484"
                    strokeWidth={hoveredSlice === 'eksternal' ? strokeWidth + 5 : strokeWidth}
                    strokeDasharray={`${eksternalStroke} ${circumference}`}
                    strokeDashoffset={`${-internalStroke}`}
                    className="transition-all duration-300 cursor-pointer"
                    onMouseEnter={() => setHoveredSlice('eksternal')}
                    onMouseLeave={() => setHoveredSlice(null)}
                  />
                )}
              </g>
            )}
          </g>

          {/* Label & Angka Langsung di Dalam Irisan Donat (Tercover Sempurna) */}
          {hasData && total > 0 && (
            <>
              {/* Internal di Irisan Cyan */}
              {rataInternal > 0 && pInternal >= 0.08 && (
                <g className="pointer-events-none select-none transition-all">
                  <text
                    x={xInternal}
                    y={yInternal - 3}
                    textAnchor="middle"
                    fill="#00282b"
                    fontSize="12"
                    fontWeight="900"
                  >
                    {rataInternal.toFixed(1)}%
                  </text>
                  <text
                    x={xInternal}
                    y={yInternal + 9}
                    textAnchor="middle"
                    fill="#00282b"
                    opacity="0.95"
                    fontSize="9.5"
                    fontWeight="800"
                  >
                    Internal
                  </text>
                </g>
              )}

              {/* Eksternal di Irisan Dark Teal #268484 */}
              {rataEksternal > 0 && pEksternal >= 0.08 && (
                <g className="pointer-events-none select-none transition-all">
                  <text
                    x={xEksternal}
                    y={yEksternal - 3}
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="12"
                    fontWeight="900"
                    className="drop-shadow"
                  >
                    {rataEksternal.toFixed(1)}%
                  </text>
                  <text
                    x={xEksternal}
                    y={yEksternal + 9}
                    textAnchor="middle"
                    fill="#ffffff"
                    opacity="0.95"
                    fontSize="9.5"
                    fontWeight="800"
                  >
                    Eksternal
                  </text>
                </g>
              )}
            </>
          )}

          {/* Center Hole: Rata-rata Capaian Keseluruhan */}
          <g className="pointer-events-none select-none text-center">
            <text
              x="110"
              y="99"
              textAnchor="middle"
              fill="#94a3b8"
              fontSize="8.5"
              fontWeight="800"
              letterSpacing="1px"
            >
              RATA-RATA
            </text>
            <text
              x="110"
              y="120"
              textAnchor="middle"
              fill="#268484"
              fontSize="21"
              fontWeight="900"
              letterSpacing="-0.5px"
            >
              {hasData ? `${rataKeseluruhan.toFixed(1)}%` : '0%'}
            </text>
            <text
              x="110"
              y="134"
              textAnchor="middle"
              fill="#64748b"
              fontSize="8.5"
              fontWeight="700"
              letterSpacing="0.5px"
            >
              KESELURUHAN
            </text>
          </g>
        </svg>
      </div>

      {/* Legend & Rincian Interaktif di Bawah (Layout 1 Baris Sejajar & Ringkas) */}
      <div className="w-full grid grid-cols-3 gap-2 pt-2.5 mt-1 border-t border-gray-100 font-nav">
        {/* Keseluruhan */}
        <div className="flex items-center justify-center p-1.5 px-2 rounded-xl bg-lime-50/70 border border-[#d0db41]/40 text-center transition-all">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#d0db41] flex-shrink-0" />
            <span className="text-[11px] font-bold text-gray-700">Keseluruhan</span>
          </div>
        </div>

        {/* Internal */}
        <div
          className={`flex items-center justify-center p-1.5 px-2 rounded-xl transition-all cursor-pointer text-center ${
            hoveredSlice === 'internal'
              ? 'bg-cyan-50 ring-1 ring-cyan-200'
              : 'bg-gray-50/70 hover:bg-gray-50'
          }`}
          onMouseEnter={() => setHoveredSlice('internal')}
          onMouseLeave={() => setHoveredSlice(null)}
        >
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#01bcce] flex-shrink-0" />
            <span className="text-[11px] font-bold text-gray-700">Internal</span>
          </div>
        </div>

        {/* Eksternal */}
        <div
          className={`flex items-center justify-center p-1.5 px-2 rounded-xl transition-all cursor-pointer text-center ${
            hoveredSlice === 'eksternal'
              ? 'bg-teal-50 ring-1 ring-[#268484]/30'
              : 'bg-gray-50/70 hover:bg-gray-50'
          }`}
          onMouseEnter={() => setHoveredSlice('eksternal')}
          onMouseLeave={() => setHoveredSlice(null)}
        >
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#268484] flex-shrink-0" />
            <span className="text-[11px] font-bold text-gray-700">Eksternal</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// =========================================================================
// 5. BA TUTUP TAGIHAN CHARTS (LINE CHART & PIE CHART)
// =========================================================================

export interface BaLineChartDataPoint {
  bulan: string
  bulanSingkat: string
  total_penyedia: number
  belum_dikonfirmasi: number
  proses_penagihan: number
  proses_pembuatan_ba: number
  sudah_terbit_ba: number
}

interface BaLineChartProps {
  data: BaLineChartDataPoint[]
  title?: string
  periodeLabel?: string
  totalLabel?: string
}

export function BaTutupTagihanLineChart({ data, title, periodeLabel, totalLabel = 'Total Penyedia' }: BaLineChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm flex flex-col items-center justify-center h-full min-h-[250px] text-center font-nav">
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center mb-2 bg-[#eef9fa] text-[#01bcce]">
          <FileText size={20} />
        </div>
        <p className="text-gray-400 font-bold text-sm">Belum ada data BA Tutup Tagihan yang diinput.</p>
        <p className="text-gray-300 text-xs mt-1">Grafik tren akan muncul otomatis setelah ada data bulan yang diinput.</p>
      </div>
    )
  }

  const width = 760
  const height = 250
  const padLeft = 56
  const padRight = 28
  const padTop = 22
  const padBottom = 38

  const plotWidth = width - padLeft - padRight
  const plotHeight = height - padTop - padBottom
  const n = data.length

  const maxVal = Math.max(
    ...data.flatMap(d => [d.total_penyedia, d.sudah_terbit_ba, d.proses_pembuatan_ba, d.proses_penagihan, d.belum_dikonfirmasi]),
    10
  )
  const ceiling = Math.ceil(maxVal * 1.15)
  const ticks = [0, 0.25, 0.5, 0.75, 1].map(r => Math.round(ceiling * r))

  const baseMargin = 28
  const maxAllowedSpan = plotWidth - 2 * baseMargin
  const stepX = n <= 1 ? 0 : Math.min(200, maxAllowedSpan / (n - 1))
  const totalSpan = n <= 1 ? 0 : (n - 1) * stepX
  const startX = padLeft + (plotWidth - totalSpan) / 2

  const getX = (i: number) => {
    if (n <= 1) return Number((padLeft + plotWidth / 2).toFixed(2))
    return Number((startX + i * stepX).toFixed(2))
  }

  const getY = (val: number) => {
    return Number((padTop + plotHeight - (val / ceiling) * plotHeight).toFixed(2))
  }

  const makePath = (key: keyof BaLineChartDataPoint) => {
    if (n <= 0) return ''
    return data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d[key] as number)}`).join(' ')
  }

  const activeIndex = hoveredIdx !== null ? hoveredIdx : null
  const hoveredData = activeIndex !== null && activeIndex >= 0 ? data[activeIndex] : null

  return (
    <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-gray-200 shadow-sm flex flex-col justify-between h-full font-nav transition-all">
      {/* Header & Judul */}
      <div className="w-full text-center mb-0.5">
        <h4 className="font-nav font-black text-sm sm:text-base text-[#00282b] leading-tight">
          {title || 'Tren BA Tutup Tagihan'}
        </h4>
        <div className="mt-0.5">
          <span className="inline-block text-[11px] font-bold text-[#01bcce] bg-[#eef9fa] px-3 py-0.5 rounded-full border border-[#01bcce]/20">
            {periodeLabel || 'Periode Jan – Des'}
          </span>
        </div>
      </div>

      {/* SVG Multi-Line Chart */}
      <div className="relative my-auto flex-1 flex items-center justify-center py-1 select-none">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible" style={{ maxHeight: 250 }}>
          {/* Grid lines horizontal */}
          {ticks.map((t) => {
            const y = getY(t)
            return (
              <g key={t}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={width - padRight}
                  y2={y}
                  stroke="#dbeafe"
                  strokeWidth="1"
                  strokeDasharray={t === 0 ? 'none' : '3 3'}
                />
                <text
                  x={padLeft - 8}
                  y={y + 3.5}
                  textAnchor="end"
                  fill="#94a3b8"
                  fontSize="10"
                  fontWeight="700"
                >
                  {t.toLocaleString('id-ID')}
                </text>
              </g>
            )
          })}

          {/* Sumbu X dasar */}
          <line
            x1={padLeft}
            y1={padTop + plotHeight}
            x2={width - padRight}
            y2={padTop + plotHeight}
            stroke="#cbd5e1"
            strokeWidth="1.5"
          />

          {/* Garis Vertikal Hover */}
          {activeIndex !== null && (
            <line
              x1={getX(activeIndex)}
              y1={padTop}
              x2={getX(activeIndex)}
              y2={padTop + plotHeight}
              stroke="#01bcce"
              strokeWidth="1.5"
              strokeDasharray="4 4"
              opacity="0.8"
            />
          )}

          {/* 1. Line Total Penyedia (Dark Teal #268484) */}
          <path
            d={makePath('total_penyedia')}
            fill="none"
            stroke="#268484"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* 2. Line Sudah Terbit BA (Lime #d0db41) */}
          <path
            d={makePath('sudah_terbit_ba')}
            fill="none"
            stroke="#d0db41"
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* 3. Line Proses Pembuatan BA (Cyan) */}
          <path
            d={makePath('proses_pembuatan_ba')}
            fill="none"
            stroke="#01bcce"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* 4. Line Proses Penagihan (Amber) */}
          <path
            d={makePath('proses_penagihan')}
            fill="none"
            stroke="#f59e0b"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* 5. Line Belum Dikonfirmasi (Rose) */}
          <path
            d={makePath('belum_dikonfirmasi')}
            fill="none"
            stroke="#f43f5e"
            strokeWidth="2.2"
            strokeDasharray="4 3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data Points, X-Axis labels, and Hit Areas */}
          {data.map((d, i) => {
            const x = getX(i)
            const yTotal = getY(d.total_penyedia)
            const yTerbit = getY(d.sudah_terbit_ba)
            const yBuat = getY(d.proses_pembuatan_ba)
            const yTagih = getY(d.proses_penagihan)
            const yBelum = getY(d.belum_dikonfirmasi)
            const isHovered = activeIndex === i

            return (
              <g key={d.bulan}>
                {/* Hit area hover */}
                <rect
                  x={x - (stepX > 0 ? stepX / 2 : 25)}
                  y={padTop}
                  width={stepX > 0 ? stepX : 50}
                  height={plotHeight}
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredIdx(i)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  onClick={() => setHoveredIdx(hoveredIdx === i ? null : i)}
                />

                {/* Dot Total Penyedia */}
                <circle cx={x} cy={yTotal} r={isHovered ? 6 : 4} fill="#268484" stroke="#ffffff" strokeWidth="2" className="pointer-events-none" />

                {/* Dot Sudah Terbit BA */}
                <circle cx={x} cy={yTerbit} r={isHovered ? 5.5 : 3.5} fill="#d0db41" stroke="#268484" strokeWidth="1.5" className="pointer-events-none" />

                {/* Dot Proses Pembuatan BA */}
                <circle cx={x} cy={yBuat} r={isHovered ? 5.5 : 3.5} fill="#01bcce" stroke="#ffffff" strokeWidth="2" className="pointer-events-none" />

                {/* Dot Proses Penagihan */}
                <circle cx={x} cy={yTagih} r={isHovered ? 5.5 : 3.5} fill="#f59e0b" stroke="#ffffff" strokeWidth="2" className="pointer-events-none" />

                {/* Dot Belum Dikonfirmasi */}
                <circle cx={x} cy={yBelum} r={isHovered ? 5 : 3} fill="#f43f5e" stroke="#ffffff" strokeWidth="1.5" className="pointer-events-none" />

                {/* Label Sumbu X */}
                <text
                  x={x}
                  y={padTop + plotHeight + 17}
                  textAnchor="middle"
                  fill={isHovered ? '#00282b' : '#64748b'}
                  fontSize={n > 8 ? '9.5' : '11'}
                  fontWeight={isHovered ? '900' : '700'}
                >
                  {n > 8 ? d.bulanSingkat : d.bulan}
                </text>
              </g>
            )
          })}
        </svg>

        {/* Floating Toggle Tooltip */}
        {hoveredData && activeIndex !== null && (
          <div
            className="absolute z-20 pointer-events-none transition-all duration-150 ease-out"
            style={{
              left: `${(getX(activeIndex) / width) * 100}%`,
              top: '12px',
              transform:
                getX(activeIndex) > width * 0.52
                  ? 'translateX(calc(-100% - 18px))'
                  : 'translateX(18px)',
            }}
          >
            <div className="bg-[#00282b]/95 backdrop-blur-md text-white rounded-xl px-4 py-2.5 shadow-2xl border border-[#01bcce]/30 min-w-[170px]">
              <div className="flex items-center justify-between pb-1 mb-1.5 border-b border-white/10">
                <span className="font-black text-xs text-[#d0db41]">
                  {hoveredData.bulan}
                </span>
                <span className="text-[10px] text-gray-300 font-bold bg-white/10 px-1.5 py-0.5 rounded">
                  {hoveredData.bulanSingkat}
                </span>
              </div>
              <div className="space-y-1 text-xs font-nav">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-teal-200 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#268484] border border-white inline-block shadow-xs" />
                    {totalLabel}:
                  </span>
                  <span className="font-black text-white">
                    {hoveredData.total_penyedia.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-lime-300 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#d0db41] inline-block shadow-xs" />
                    Sudah Terbit BA:
                  </span>
                  <span className="font-black text-[#d0db41]">
                    {hoveredData.sudah_terbit_ba.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-cyan-300 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#01bcce] inline-block shadow-xs" />
                    Proses Buat BA:
                  </span>
                  <span className="font-black text-[#01bcce]">
                    {hoveredData.proses_pembuatan_ba.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-amber-300 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b] inline-block shadow-xs" />
                    Proses Penagihan:
                  </span>
                  <span className="font-black text-[#f59e0b]">
                    {hoveredData.proses_penagihan.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-rose-300 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#f43f5e] inline-block shadow-xs" />
                    Belum Konfirmasi:
                  </span>
                  <span className="font-black text-[#f43f5e]">
                    {hoveredData.belum_dikonfirmasi.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Legend Garis di Bawah */}
      <div className="flex items-center justify-center gap-2 sm:gap-4 text-[11px] font-bold flex-wrap pt-2.5 border-t border-gray-100 font-nav">
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-teal-50/70 border border-[#268484]/20 text-[#268484]">
          <span className="w-2.5 h-2.5 rounded-full bg-[#268484]" />
          <span>{totalLabel}</span>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-lime-50/70 border border-[#d0db41]/30 text-lime-900">
          <span className="w-2.5 h-2.5 rounded-full bg-[#d0db41]" />
          <span>Sudah Terbit BA</span>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-cyan-50/70 border border-cyan-100 text-[#01bcce]">
          <span className="w-2.5 h-2.5 rounded-full bg-[#01bcce]" />
          <span>Proses Buat BA</span>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-amber-50/70 border border-amber-100 text-[#d97706]">
          <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]" />
          <span>Proses Penagihan</span>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-rose-50/70 border border-rose-100 text-[#e11d48]">
          <span className="w-2.5 h-2.5 rounded-full bg-[#f43f5e]" />
          <span>Belum Konfirmasi</span>
        </div>
      </div>
    </div>
  )
}

export interface BaPieChartProps {
  totalPenyedia: number
  belumDikonfirmasi: number
  prosesPenagihan: number
  prosesPembuatanBa: number
  sudahTerbitBa: number
  periodeLabel?: string
  title?: string
  centerLabel?: string
}

export function BaTutupTagihanPieChart({
  totalPenyedia,
  belumDikonfirmasi,
  prosesPenagihan,
  prosesPembuatanBa,
  sudahTerbitBa,
  periodeLabel,
  title,
  centerLabel = 'PENYEDIA',
}: BaPieChartProps) {
  const [hoveredSlice, setHoveredSlice] = useState<string | null>(null)

  const sumValues = sudahTerbitBa + prosesPembuatanBa + prosesPenagihan + belumDikonfirmasi
  const total = Math.max(totalPenyedia, sumValues)
  const hasData = total > 0

  const radius = 76
  const strokeWidth = 48
  const circumference = 2 * Math.PI * radius

  const pTerbit = total > 0 ? sudahTerbitBa / total : 0
  const pBuat = total > 0 ? prosesPembuatanBa / total : 0
  const pTagih = total > 0 ? prosesPenagihan / total : 0
  const pBelum = total > 0 ? belumDikonfirmasi / total : 0

  const strokeTerbit = pTerbit * circumference
  const strokeBuat = pBuat * circumference
  const strokeTagih = pTagih * circumference
  const strokeBelum = pBelum * circumference

  // Midpoint angles for text placement inside donut ring
  const aTerbit = -Math.PI / 2 + Math.PI * pTerbit
  const aBuat = -Math.PI / 2 + 2 * Math.PI * pTerbit + Math.PI * pBuat
  const aTagih = -Math.PI / 2 + 2 * Math.PI * (pTerbit + pBuat) + Math.PI * pTagih
  const aBelum = -Math.PI / 2 + 2 * Math.PI * (pTerbit + pBuat + pTagih) + Math.PI * pBelum

  const getPos = (angle: number) => ({
    x: Number((110 + radius * Math.cos(angle)).toFixed(2)),
    y: Number((110 + radius * Math.sin(angle)).toFixed(2)),
  })

  const posTerbit = getPos(aTerbit)
  const posBuat = getPos(aBuat)
  const posTagih = getPos(aTagih)
  const posBelum = getPos(aBelum)

  return (
    <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-gray-200 shadow-sm flex flex-col justify-between h-full font-nav transition-all">
      {/* Header & Subtitle */}
      <div className="w-full text-center mb-0.5">
        <h4 className="font-nav font-black text-sm sm:text-base text-[#00282b] leading-tight">
          {title || 'Proporsi Status BA Tutup Tagihan'}
        </h4>
        <div className="mt-0.5">
          <span className="inline-block text-[11px] font-bold text-[#01bcce] bg-[#eef9fa] px-3 py-0.5 rounded-full border border-[#01bcce]/20">
            {!hasData ? 'Belum Ada Data' : (periodeLabel || 'Periode Jan – Des')}
          </span>
        </div>
      </div>

      {/* SVG Donut Chart */}
      <div className="relative my-auto flex-1 flex items-center justify-center py-1">
        <svg viewBox="0 0 220 220" className="w-44 h-44 sm:w-48 sm:h-48 md:w-52 md:h-52 overflow-visible" style={{ maxHeight: 205 }}>
          <defs>
            <filter id="baPieGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#00282b" floodOpacity="0.08" />
            </filter>
          </defs>

          {/* Group Lingkaran Pie dengan rotasi -90deg */}
          <g transform="rotate(-90 110 110)">
            {/* Base background ring */}
            <circle
              cx="110"
              cy="110"
              r={radius}
              fill="transparent"
              stroke="#dbeafe"
              strokeWidth={strokeWidth}
            />

            {!hasData ? (
              <circle
                cx="110"
                cy="110"
                r={radius}
                fill="transparent"
                stroke="#e2e8f0"
                strokeWidth={strokeWidth}
              />
            ) : (
              <g filter="url(#baPieGlow)">
                {/* 1. Sudah Terbit BA (Lime #d0db41) */}
                {sudahTerbitBa > 0 && (
                  <circle
                    cx="110"
                    cy="110"
                    r={radius}
                    fill="transparent"
                    stroke="#d0db41"
                    strokeWidth={hoveredSlice === 'terbit' ? strokeWidth + 5 : strokeWidth}
                    strokeDasharray={`${strokeTerbit} ${circumference}`}
                    strokeDashoffset="0"
                    className="transition-all duration-300 cursor-pointer"
                    onMouseEnter={() => setHoveredSlice('terbit')}
                    onMouseLeave={() => setHoveredSlice(null)}
                  />
                )}

                {/* 2. Proses Pembuatan BA (Cyan #01bcce) */}
                {prosesPembuatanBa > 0 && (
                  <circle
                    cx="110"
                    cy="110"
                    r={radius}
                    fill="transparent"
                    stroke="#01bcce"
                    strokeWidth={hoveredSlice === 'buat' ? strokeWidth + 5 : strokeWidth}
                    strokeDasharray={`${strokeBuat} ${circumference}`}
                    strokeDashoffset={`${-strokeTerbit}`}
                    className="transition-all duration-300 cursor-pointer"
                    onMouseEnter={() => setHoveredSlice('buat')}
                    onMouseLeave={() => setHoveredSlice(null)}
                  />
                )}

                {/* 3. Proses Penagihan (Teal #268484) */}
                {prosesPenagihan > 0 && (
                  <circle
                    cx="110"
                    cy="110"
                    r={radius}
                    fill="transparent"
                    stroke="#268484"
                    strokeWidth={hoveredSlice === 'tagih' ? strokeWidth + 5 : strokeWidth}
                    strokeDasharray={`${strokeTagih} ${circumference}`}
                    strokeDashoffset={`${-(strokeTerbit + strokeBuat)}`}
                    className="transition-all duration-300 cursor-pointer"
                    onMouseEnter={() => setHoveredSlice('tagih')}
                    onMouseLeave={() => setHoveredSlice(null)}
                  />
                )}

                {/* 4. Belum Dikonfirmasi (Rose) */}
                {belumDikonfirmasi > 0 && (
                  <circle
                    cx="110"
                    cy="110"
                    r={radius}
                    fill="transparent"
                    stroke="#f43f5e"
                    strokeWidth={hoveredSlice === 'belum' ? strokeWidth + 5 : strokeWidth}
                    strokeDasharray={`${strokeBelum} ${circumference}`}
                    strokeDashoffset={`${-(strokeTerbit + strokeBuat + strokeTagih)}`}
                    className="transition-all duration-300 cursor-pointer"
                    onMouseEnter={() => setHoveredSlice('belum')}
                    onMouseLeave={() => setHoveredSlice(null)}
                  />
                )}
              </g>
            )}
          </g>

          {/* Teks di dalam irisan donat: Angka + Persentase */}
          {hasData && (
            <>
              {/* Sudah Terbit BA */}
              {sudahTerbitBa > 0 && pTerbit >= 0.07 && (
                <g className="pointer-events-none select-none transition-all">
                  <text x={posTerbit.x} y={posTerbit.y - 4} textAnchor="middle" fill="#00282b" fontSize="11" fontWeight="900">
                    {sudahTerbitBa.toLocaleString('id-ID')}
                  </text>
                  <text x={posTerbit.x} y={posTerbit.y + 8} textAnchor="middle" fill="#00282b" opacity="0.95" fontSize="9" fontWeight="900">
                    {(pTerbit * 100).toFixed(1)}%
                  </text>
                </g>
              )}

              {/* Proses Pembuatan BA */}
              {prosesPembuatanBa > 0 && pBuat >= 0.07 && (
                <g className="pointer-events-none select-none transition-all">
                  <text x={posBuat.x} y={posBuat.y - 4} textAnchor="middle" fill="#00282b" fontSize="11" fontWeight="900">
                    {prosesPembuatanBa.toLocaleString('id-ID')}
                  </text>
                  <text x={posBuat.x} y={posBuat.y + 8} textAnchor="middle" fill="#00282b" opacity="0.95" fontSize="9" fontWeight="900">
                    {(pBuat * 100).toFixed(1)}%
                  </text>
                </g>
              )}

              {/* Proses Penagihan */}
              {prosesPenagihan > 0 && pTagih >= 0.07 && (
                <g className="pointer-events-none select-none transition-all">
                  <text x={posTagih.x} y={posTagih.y - 4} textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="900" className="drop-shadow">
                    {prosesPenagihan.toLocaleString('id-ID')}
                  </text>
                  <text x={posTagih.x} y={posTagih.y + 8} textAnchor="middle" fill="#ffffff" opacity="0.95" fontSize="9" fontWeight="900">
                    {(pTagih * 100).toFixed(1)}%
                  </text>
                </g>
              )}

              {/* Belum Dikonfirmasi */}
              {belumDikonfirmasi > 0 && pBelum >= 0.07 && (
                <g className="pointer-events-none select-none transition-all">
                  <text x={posBelum.x} y={posBelum.y - 4} textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="900" className="drop-shadow">
                    {belumDikonfirmasi.toLocaleString('id-ID')}
                  </text>
                  <text x={posBelum.x} y={posBelum.y + 8} textAnchor="middle" fill="#ffffff" opacity="0.95" fontSize="8.5" fontWeight="900">
                    {(pBelum * 100).toFixed(1)}%
                  </text>
                </g>
              )}
            </>
          )}

          {/* Center Hole: Jumlah Penyedia / Transaksi */}
          <g className="pointer-events-none select-none text-center">
            <text x="110" y="112" textAnchor="middle" fill="#268484" fontSize={total > 999999 ? "18" : "22"} fontWeight="900" letterSpacing="-0.5px">
              {total.toLocaleString('id-ID')}
            </text>
            <text x="110" y="129" textAnchor="middle" fill="#64748b" fontSize="9" fontWeight="800" letterSpacing="0.5px">
              {centerLabel}
            </text>
          </g>
        </svg>
      </div>

      {/* Legend & Rincian Interaktif di Bawah (4 Kolom Ringkas) */}
      <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-2.5 mt-1 border-t border-gray-100 font-nav">
        {/* Sudah Terbit BA */}
        <div
          className={`flex items-center justify-center p-1.5 px-2 rounded-xl transition-all cursor-pointer ${
            hoveredSlice === 'terbit' ? 'bg-[#d0db41]/20 ring-1 ring-[#d0db41]' : 'bg-gray-50/70 hover:bg-gray-50'
          }`}
          onMouseEnter={() => setHoveredSlice('terbit')}
          onMouseLeave={() => setHoveredSlice(null)}
        >
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#d0db41] flex-shrink-0" />
            <span className="text-[11px] font-bold text-gray-700 truncate">Terbit BA</span>
          </div>
        </div>

        {/* Proses Buat BA */}
        <div
          className={`flex items-center justify-center p-1.5 px-2 rounded-xl transition-all cursor-pointer ${
            hoveredSlice === 'buat' ? 'bg-cyan-50 ring-1 ring-cyan-300' : 'bg-gray-50/70 hover:bg-gray-50'
          }`}
          onMouseEnter={() => setHoveredSlice('buat')}
          onMouseLeave={() => setHoveredSlice(null)}
        >
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#01bcce] flex-shrink-0" />
            <span className="text-[11px] font-bold text-gray-700 truncate">Buat BA</span>
          </div>
        </div>

        {/* Proses Penagihan */}
        <div
          className={`flex items-center justify-center p-1.5 px-2 rounded-xl transition-all cursor-pointer ${
            hoveredSlice === 'tagih' ? 'bg-[#268484]/15 ring-1 ring-[#268484]' : 'bg-gray-50/70 hover:bg-gray-50'
          }`}
          onMouseEnter={() => setHoveredSlice('tagih')}
          onMouseLeave={() => setHoveredSlice(null)}
        >
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#268484] flex-shrink-0" />
            <span className="text-[11px] font-bold text-gray-700 truncate">Penagihan</span>
          </div>
        </div>

        {/* Belum Dikonfirmasi */}
        <div
          className={`flex items-center justify-center p-1.5 px-2 rounded-xl transition-all cursor-pointer ${
            hoveredSlice === 'belum' ? 'bg-rose-50 ring-1 ring-rose-300' : 'bg-gray-50/70 hover:bg-gray-50'
          }`}
          onMouseEnter={() => setHoveredSlice('belum')}
          onMouseLeave={() => setHoveredSlice(null)}
        >
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#f43f5e] flex-shrink-0" />
            <span className="text-[11px] font-bold text-gray-700 truncate">Belum Konf.</span>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * ================================================================
 * SECTION 1: PIE / DONUT CHART UNTUK JENIS TAGIHAN
 * Menampilkan proporsi jenis tagihan lengkap dengan jumlah dan persentase di dalam chart
 * ================================================================
 */
export interface JenisTagihanItem {
  id?: string
  jenis: string
  jumlah?: number
  jumlah_penyedia?: number
  sudah_terbit_ba?: number
}

export interface JenisTagihanPieChartProps {
  items: JenisTagihanItem[]
  title?: string
  subtitle?: string
}

export const JENIS_TAGIHAN_PALETTE = [
  '#01bcce', // Cyan
  '#268484', // Teal RSCM
  '#d0db41', // Lime
  '#f59e0b', // Amber
  '#3b82f6', // Blue
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#10b981', // Emerald
  '#f97316', // Orange
  '#6366f1', // Indigo
]

export function JenisTagihanPieChart({
  items,
  title,
  subtitle,
}: JenisTagihanPieChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)

  // Filter out zero or negative values for the chart
  const validItems = items.filter(it => (it.jumlah_penyedia ?? it.jumlah ?? 0) > 0)
  const total = validItems.reduce((acc, it) => acc + (it.jumlah_penyedia ?? it.jumlah ?? 0), 0)
  const hasData = total > 0

  const radius = 76
  const strokeWidth = 48
  const circumference = 2 * Math.PI * radius

  // Hitung stroke length dan offset untuk masing-masing item
  let accumulatedPercent = 0
  const sliceMeta = validItems.map((item, idx) => {
    const val = item.jumlah_penyedia ?? item.jumlah ?? 0
    const p = total > 0 ? val / total : 0
    const strokeLength = p * circumference
    const strokeOffset = accumulatedPercent * circumference
    const midAngle = -Math.PI / 2 + (accumulatedPercent + p / 2) * 2 * Math.PI
    accumulatedPercent += p

    const pos = {
      x: Number((110 + radius * Math.cos(midAngle)).toFixed(2)),
      y: Number((110 + radius * Math.sin(midAngle)).toFixed(2)),
    }

    const color = JENIS_TAGIHAN_PALETTE[idx % JENIS_TAGIHAN_PALETTE.length]
    // Use dark text for lime (#d0db41) and yellow-ish colors, light for others
    const isLightColor = color === '#d0db41' || color === '#f59e0b'
    const textColor = isLightColor ? '#00282b' : '#ffffff'

    return {
      item,
      val,
      idx,
      p,
      strokeLength,
      strokeOffset,
      pos,
      color,
      textColor,
    }
  })

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200 shadow-sm flex flex-col justify-between h-full font-nav transition-all">
      {/* Header & Subtitle */}
      <div className="w-full text-center mb-1">
        <h4 className="font-nav font-black text-sm sm:text-base text-[#00282b] leading-tight">
          {title || 'Proporsi Jenis Tagihan'}
        </h4>
        <div className="mt-1">
          <span className="inline-block text-[11px] font-bold text-[#01bcce] bg-[#eef9fa] px-3 py-0.5 rounded-full border border-[#01bcce]/20">
            {!hasData ? 'Belum Ada Data' : (subtitle || 'Rekapitulasi Tagihan')}
          </span>
        </div>
      </div>

      {/* SVG Donut Chart dengan label Jumlah & Persentase di dalam irisan */}
      <div className="relative my-auto flex-1 flex items-center justify-center py-2">
        <svg viewBox="0 0 220 220" className="w-48 h-48 sm:w-56 sm:h-56 md:w-60 md:h-60 overflow-visible" style={{ maxHeight: 220 }}>
          <defs>
            <filter id="jenisPieGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#00282b" floodOpacity="0.08" />
            </filter>
          </defs>

          {/* Group Lingkaran Pie dengan rotasi -90deg */}
          <g transform="rotate(-90 110 110)">
            <circle
              cx="110"
              cy="110"
              r={radius}
              fill="transparent"
              stroke="#e2e8f0"
              strokeWidth={strokeWidth}
            />

            {hasData && (
              <g filter="url(#jenisPieGlow)">
                {sliceMeta.map((s) => (
                  <circle
                    key={s.idx}
                    cx="110"
                    cy="110"
                    r={radius}
                    fill="transparent"
                    stroke={s.color}
                    strokeWidth={hoveredIdx === s.idx ? strokeWidth + 5 : strokeWidth}
                    strokeDasharray={`${s.strokeLength} ${circumference}`}
                    strokeDashoffset={`${-s.strokeOffset}`}
                    className="transition-all duration-300 cursor-pointer"
                    onMouseEnter={() => setHoveredIdx(s.idx)}
                    onMouseLeave={() => setHoveredIdx(null)}
                  />
                ))}
              </g>
            )}
          </g>

          {/* Teks di dalam irisan donat: Jumlah dan Persentase */}
          {hasData && (
            <>
              {sliceMeta.map((s) => {
                // Tampilkan label hanya jika irisan cukup besar (>= 5%)
                if (s.p < 0.05) return null
                return (
                  <g key={`lbl-${s.idx}`} className="pointer-events-none select-none transition-all">
                    {/* Tulisan Jumlah */}
                    <text
                      x={s.pos.x}
                      y={s.pos.y - 4}
                      textAnchor="middle"
                      fill={s.textColor}
                      fontSize="11"
                      fontWeight="900"
                      className={s.textColor === '#ffffff' ? 'drop-shadow-sm' : ''}
                    >
                      {s.val.toLocaleString('id-ID')}
                    </text>
                    {/* Tulisan Persentase */}
                    <text
                      x={s.pos.x}
                      y={s.pos.y + 8}
                      textAnchor="middle"
                      fill={s.textColor}
                      opacity={s.textColor === '#ffffff' ? 0.95 : 0.9}
                      fontSize="9.5"
                      fontWeight="900"
                      className={s.textColor === '#ffffff' ? 'drop-shadow-sm' : ''}
                    >
                      {(s.p * 100).toFixed(1)}%
                    </text>
                  </g>
                )
              })}
            </>
          )}

          {/* Center Hole: Total Jumlah Tagihan */}
          <g className="pointer-events-none select-none text-center">
            <text x="110" y="99" textAnchor="middle" fill="#94a3b8" fontSize="8.5" fontWeight="800" letterSpacing="1px">
              TOTAL
            </text>
            <text x="110" y="119" textAnchor="middle" fill="#00282b" fontSize={total > 999999 ? "17" : "21"} fontWeight="900" letterSpacing="-0.5px">
              {total.toLocaleString('id-ID')}
            </text>
            <text x="110" y="134" textAnchor="middle" fill="#64748b" fontSize="8.5" fontWeight="700" letterSpacing="0.5px">
              TAGIHAN
            </text>
          </g>
        </svg>
      </div>

      {/* Legend & Rincian Interaktif di Bawah */}
      <div className="w-full pt-3 mt-2 border-t border-gray-100 font-nav">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
          {validItems.length === 0 ? (
            <p className="col-span-2 text-center text-xs text-gray-400 py-2">Belum ada data jenis tagihan.</p>
          ) : (
            validItems.map((item, idx) => {
              const color = JENIS_TAGIHAN_PALETTE[idx % JENIS_TAGIHAN_PALETTE.length]
              const isHovered = hoveredIdx === idx
              return (
                <div
                  key={item.id || idx}
                  className={`flex items-center gap-2 p-2 rounded-xl transition-all cursor-pointer ${
                    isHovered ? 'bg-gray-100 ring-1 ring-gray-300' : 'bg-gray-50/70 hover:bg-gray-100/70'
                  }`}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                >
                  <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                  <span className="text-xs font-bold text-gray-800 truncate" title={item.jenis}>
                    {item.jenis}
                  </span>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * ================================================================
 * SECTION 1: COLUMN CHART JENIS TAGIHAN
 * Batang bersebelahan: Jumlah Penyedia vs Sudah Terbit BA
 * ================================================================
 */
export interface BaJenisTagihanColumnChartProps {
  items: JenisTagihanItem[]
  title?: string
  periodeLabel?: string
}

export function BaJenisTagihanColumnChart({
  items,
  title,
  periodeLabel,
}: BaJenisTagihanColumnChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)

  // Ambil item yang memiliki nilai penyedia atau terbit
  const validItems = items.filter(
    it => (it.jumlah_penyedia ?? it.jumlah ?? 0) > 0 || (it.sudah_terbit_ba ?? 0) > 0
  )
  const hasData = validItems.length > 0

  if (!hasData) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm flex flex-col items-center justify-center h-full min-h-[280px] text-center font-nav">
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center mb-2 bg-[#eef9fa] text-[#01bcce]">
          <BarChart3 size={20} />
        </div>
        <h4 className="font-nav font-black text-sm text-[#00282b] mb-1">{title || 'Perbandingan Jenis Tagihan'}</h4>
        <p className="text-gray-400 font-bold text-xs">Belum ada data jenis tagihan untuk ditampilkan.</p>
        <p className="text-gray-300 text-[11px] mt-0.5">Grafik batang akan muncul otomatis setelah data diinput.</p>
      </div>
    )
  }

  const width = 640
  const height = 300
  const padLeft = 48
  const padRight = 20
  const padTop = 32
  const padBottom = 58

  const plotWidth = width - padLeft - padRight
  const plotHeight = height - padTop - padBottom
  const n = validItems.length

  const maxVal = Math.max(
    ...validItems.flatMap(it => [it.jumlah_penyedia ?? it.jumlah ?? 0, it.sudah_terbit_ba ?? 0]),
    10
  )
  const ceiling = Math.ceil(maxVal * 1.18)
  const ticks = [0, 0.25, 0.5, 0.75, 1].map(r => Math.round(ceiling * r))

  const groupWidth = plotWidth / n
  const barWidth = Math.min(26, Math.max(14, (groupWidth - 26) / 2))
  const barGap = 4

  const activeItem = hoveredIdx !== null && hoveredIdx >= 0 && hoveredIdx < validItems.length ? validItems[hoveredIdx] : null

  // Helper untuk memecah teks kategori menjadi 2 baris agar rapi
  const formatCategoryText = (text: string) => {
    if (text.length <= 15) return [text, '']
    const words = text.split(' ')
    let l1 = ''
    let l2 = ''
    for (const w of words) {
      if ((l1 + ' ' + w).trim().length <= 14) {
        l1 = (l1 + ' ' + w).trim()
      } else {
        l2 = (l2 + ' ' + w).trim()
      }
    }
    return [l1, l2]
  }

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200 shadow-sm flex flex-col justify-between h-full font-nav transition-all">
      {/* Header & Subtitle */}
      <div className="w-full text-center mb-1">
        <h4 className="font-nav font-black text-sm sm:text-base text-[#00282b] leading-tight">
          {title || 'Perbandingan Jenis Tagihan'}
        </h4>
        <div className="mt-1">
          <span className="inline-block text-[11px] font-bold text-[#01bcce] bg-[#eef9fa] px-3 py-0.5 rounded-full border border-[#01bcce]/20">
            {periodeLabel || 'Tahun Berjalan'}
          </span>
        </div>
      </div>

      {/* SVG Column Chart */}
      <div className="relative my-auto flex-1 flex items-center justify-center py-2 select-none overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible" style={{ maxHeight: 290, minWidth: 380 }}>
          <defs>
            <linearGradient id="colPenyediaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#268484" />
              <stop offset="100%" stopColor="#1b6060" />
            </linearGradient>
            <linearGradient id="colTerbitGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#d0db41" />
              <stop offset="100%" stopColor="#b1bd24" />
            </linearGradient>
          </defs>

          {/* Grid lines horizontal */}
          {ticks.map((t) => {
            const y = Number((padTop + plotHeight - (t / ceiling) * plotHeight).toFixed(2))
            return (
              <g key={t}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={width - padRight}
                  y2={y}
                  stroke="#e2e8f0"
                  strokeWidth="1"
                  strokeDasharray={t === 0 ? 'none' : '3 3'}
                />
                <text
                  x={padLeft - 8}
                  y={y + 3.5}
                  textAnchor="end"
                  fill="#94a3b8"
                  fontSize="10"
                  fontWeight="700"
                >
                  {t.toLocaleString('id-ID')}
                </text>
              </g>
            )
          })}

          {/* Sumbu X Dasar */}
          <line
            x1={padLeft}
            y1={padTop + plotHeight}
            x2={width - padRight}
            y2={padTop + plotHeight}
            stroke="#cbd5e1"
            strokeWidth="1.5"
          />

          {/* Bar Groups */}
          {validItems.map((item, idx) => {
            const groupCenterX = padLeft + (idx + 0.5) * groupWidth
            const penyediaVal = item.jumlah_penyedia ?? item.jumlah ?? 0
            const terbitVal = item.sudah_terbit_ba ?? 0

            const hPenyedia = ceiling > 0 ? (penyediaVal / ceiling) * plotHeight : 0
            const hTerbit = ceiling > 0 ? (terbitVal / ceiling) * plotHeight : 0

            const xPenyedia = groupCenterX - barWidth - barGap / 2
            const yPenyedia = padTop + plotHeight - hPenyedia

            const xTerbit = groupCenterX + barGap / 2
            const yTerbit = padTop + plotHeight - hTerbit

            const isHovered = hoveredIdx === idx
            const [line1, line2] = formatCategoryText(item.jenis)

            return (
              <g key={item.id || idx} className="cursor-pointer">
                {/* Background highlight pill saat di-hover */}
                {isHovered && (
                  <rect
                    x={groupCenterX - groupWidth / 2 + 4}
                    y={padTop}
                    width={groupWidth - 8}
                    height={plotHeight}
                    fill="#eef9fa"
                    rx="8"
                    opacity="0.6"
                  />
                )}

                {/* 1. Bar Jumlah Penyedia (Teal RSCM) */}
                <rect
                  x={xPenyedia}
                  y={yPenyedia}
                  width={barWidth}
                  height={Math.max(2, hPenyedia)}
                  fill="url(#colPenyediaGrad)"
                  rx="4"
                  className="transition-all duration-200"
                  opacity={hoveredIdx !== null && !isHovered ? 0.5 : 1}
                />
                {/* Angka di atas Bar Jumlah Penyedia */}
                {penyediaVal > 0 && (
                  <text
                    x={xPenyedia + barWidth / 2}
                    y={yPenyedia - 4}
                    textAnchor="middle"
                    fill="#268484"
                    fontSize={barWidth < 20 ? '8.5' : '10'}
                    fontWeight="800"
                  >
                    {penyediaVal.toLocaleString('id-ID')}
                  </text>
                )}

                {/* 2. Bar Sudah Terbit BA (Lime RSCM) */}
                <rect
                  x={xTerbit}
                  y={yTerbit}
                  width={barWidth}
                  height={Math.max(2, hTerbit)}
                  fill="url(#colTerbitGrad)"
                  rx="4"
                  className="transition-all duration-200"
                  opacity={hoveredIdx !== null && !isHovered ? 0.5 : 1}
                />
                {/* Angka di atas Bar Sudah Terbit BA */}
                {terbitVal > 0 && (
                  <text
                    x={xTerbit + barWidth / 2}
                    y={yTerbit - 4}
                    textAnchor="middle"
                    fill="#566000"
                    fontSize={barWidth < 20 ? '8.5' : '10'}
                    fontWeight="800"
                  >
                    {terbitVal.toLocaleString('id-ID')}
                  </text>
                )}

                {/* Label Kategori Sumbu X (Baris 1 & 2) */}
                <text
                  x={groupCenterX}
                  y={padTop + plotHeight + 15}
                  textAnchor="middle"
                  fill={isHovered ? '#00282b' : '#64748b'}
                  fontSize="10"
                  fontWeight={isHovered ? '900' : '700'}
                >
                  {line1}
                </text>
                {line2 && (
                  <text
                    x={groupCenterX}
                    y={padTop + plotHeight + 27}
                    textAnchor="middle"
                    fill={isHovered ? '#00282b' : '#94a3b8'}
                    fontSize="9"
                    fontWeight={isHovered ? '800' : '600'}
                  >
                    {line2}
                  </text>
                )}

                {/* Invisible Hit Area Group */}
                <rect
                  x={groupCenterX - groupWidth / 2}
                  y={padTop}
                  width={groupWidth}
                  height={plotHeight + 35}
                  fill="transparent"
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  onClick={() => setHoveredIdx(hoveredIdx === idx ? null : idx)}
                />
              </g>
            )
          })}
        </svg>

        {/* Floating Vertical List Card (Gambar 2 Format) */}
        {activeItem && hoveredIdx !== null && (
          <div
            className="absolute z-20 pointer-events-none transition-all duration-150 ease-out"
            style={{
              left: `${((padLeft + (hoveredIdx + 0.5) * groupWidth) / width) * 100}%`,
              top: '12px',
              transform:
                (padLeft + (hoveredIdx + 0.5) * groupWidth) > width * 0.55
                  ? 'translateX(calc(-100% - 16px))'
                  : 'translateX(16px)',
            }}
          >
            <div className="bg-[#00282b]/95 backdrop-blur-md text-white rounded-xl px-4 py-2.5 shadow-2xl border border-[#01bcce]/30 min-w-[190px] font-nav">
              <div className="flex items-center justify-between pb-1 mb-1.5 border-b border-white/10">
                <span className="font-black text-xs text-[#d0db41] truncate max-w-[210px]" title={activeItem.jenis}>
                  {activeItem.jenis}
                </span>
              </div>
              <div className="space-y-1 text-xs font-nav">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-teal-200 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#268484] border border-white inline-block shadow-xs" />
                    Jumlah Penyedia:
                  </span>
                  <span className="font-black text-white">
                    {(activeItem.jumlah_penyedia ?? activeItem.jumlah ?? 0).toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-lime-300 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#d0db41] inline-block shadow-xs" />
                    Sudah Terbit BA:
                  </span>
                  <span className="font-black text-[#d0db41]">
                    {(activeItem.sudah_terbit_ba ?? 0).toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3 pt-1 border-t border-white/10 text-[11px]">
                  <span className="text-gray-300">Capaian Terbit:</span>
                  <span className="font-extrabold text-[#01bcce]">
                    {(activeItem.jumlah_penyedia ?? activeItem.jumlah ?? 0) > 0
                      ? `${(((activeItem.sudah_terbit_ba ?? 0) / (activeItem.jumlah_penyedia ?? activeItem.jumlah ?? 1)) * 100).toFixed(1)}%`
                      : '0%'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Legend Batang di Bawah */}
      <div className="flex items-center justify-center gap-4 text-xs font-bold pt-3 border-t border-gray-100 font-nav">
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-teal-50 border border-[#268484]/20 text-[#268484]">
          <span className="w-2.5 h-2.5 rounded-full bg-[#268484]" />
          <span>Jumlah Penyedia</span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-lime-50 border border-[#d0db41]/30 text-lime-900">
          <span className="w-2.5 h-2.5 rounded-full bg-[#d0db41]" />
          <span>Sudah Terbit BA</span>
        </div>
      </div>
    </div>
  )
}

/**
 * ================================================================
 * SECTION 2 & 3: LINE CHART PERSENTASE BA TUTUP TAGIHAN
 * Baseline 100% (Total) vs Capaian % Sudah Terbit BA per Bulan
 * ================================================================
 */
export interface BaProgressDataPoint {
  bulan: string
  bulanSingkat: string
  totalRaw: number
  terbitRaw: number
  totalPct: number
  terbitPct: number
}

export interface BaProgressLineChartProps {
  data: BaProgressDataPoint[]
  title?: string
  periodeLabel?: string
  totalLabel?: string
  terbitLabel?: string
  isCurrency?: boolean
  colorTotal?: string
  colorTerbit?: string
}

export function BaProgressLineChart({
  data,
  title,
  periodeLabel,
  totalLabel = 'Total Penyedia',
  terbitLabel = 'Sudah Terbit BA',
  isCurrency = false,
  colorTotal = '#268484',
  colorTerbit = '#d0db41',
}: BaProgressLineChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)

  // Hanya tampilkan data bulan yang memiliki nilai total atau sudah terbit
  const validData = (data || []).filter(d => (d.totalRaw || 0) > 0 || (d.terbitRaw || 0) > 0)

  if (!validData || validData.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm flex flex-col items-center justify-center min-h-[260px] text-center font-nav">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-2.5 bg-[#eef9fa] text-[#01bcce]">
          <TrendingUp size={20} />
        </div>
        {title && <h4 className="font-black text-sm text-[#00282b] mb-1">{title}</h4>}
        <p className="text-gray-400 font-bold text-sm">Belum ada data BA yang diinput untuk periode ini.</p>
        <p className="text-gray-300 text-xs mt-1">Grafik persentase capaian akan muncul otomatis setelah data diinput.</p>
      </div>
    )
  }

  const width = 860
  const height = 290
  const padLeft = 56
  const padRight = 32
  const padTop = 32
  const padBottom = 48

  const plotWidth = width - padLeft - padRight
  const plotHeight = height - padTop - padBottom
  const n = validData.length

  const ceiling = 100
  const ticks = [0, 25, 50, 75, 100]

  const availableWidth = width - padLeft - padRight
  const baseMargin = 32
  const maxAllowedSpan = availableWidth - 2 * baseMargin
  const stepX = n <= 1 ? 0 : Math.min(200, maxAllowedSpan / (n - 1))
  const totalSpan = n <= 1 ? 0 : (n - 1) * stepX
  const startX = padLeft + (availableWidth - totalSpan) / 2

  const getX = (i: number) => {
    if (n <= 1) return Number((padLeft + availableWidth / 2).toFixed(2))
    return Number((startX + i * stepX).toFixed(2))
  }

  const getY = (val: number) => {
    const clamped = Math.max(0, Math.min(100, val || 0))
    return Number((padTop + plotHeight - (clamped / ceiling) * plotHeight).toFixed(2))
  }

  // Path Line 1: Dasar / Target 100%
  const pathTotal100 = validData.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(100)}`).join(' ')

  // Path Line 2: Capaian Sudah Terbit BA (%)
  const pathTerbit = validData.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d.terbitPct)}`).join(' ')

  // Area Shading di bawah garis Terbit BA
  const areaTerbit = n > 0
    ? `${pathTerbit} L ${getX(n - 1)} ${padTop + plotHeight} L ${getX(0)} ${padTop + plotHeight} Z`
    : ''

  const activeIndex = hoveredIdx !== null ? hoveredIdx : null
  const hoveredData = activeIndex !== null && activeIndex >= 0 && activeIndex < validData.length ? validData[activeIndex] : null

  const formatRawValue = (val: number) => {
    if (isCurrency) {
      return `Rp ${val.toLocaleString('id-ID')}`
    }
    return val.toLocaleString('id-ID')
  }

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200 shadow-sm flex flex-col justify-between font-nav w-full transition-all">
      {/* 1. Header & Judul Berada di Tengah Sesuai Permintaan */}
      <div className="w-full text-center mb-1 font-nav">
        <h4 className="font-nav font-black text-sm sm:text-base text-[#00282b] leading-tight">
          {title || 'Tren Capaian BA Tutup Tagihan'}
        </h4>
        <div className="mt-1">
          <span className="inline-block text-xs font-bold text-[#01bcce] bg-[#eef9fa] px-3.5 py-0.5 rounded-full border border-[#01bcce]/20 font-nav">
            {periodeLabel || 'Periode Jan – Des'}
          </span>
        </div>
      </div>

      {/* SVG Multi-Line Chart (100% Dasar vs % Sudah Terbit BA) */}
      <div className="relative my-auto flex-1 flex items-center justify-center py-2 select-none overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible" style={{ maxHeight: 290, minWidth: 420 }}>
          <defs>
            {/* Shading Area Gradient */}
            <linearGradient id="terbitProgressGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={colorTerbit} stopOpacity="0.25" />
              <stop offset="100%" stopColor={colorTerbit} stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {/* Grid lines horizontal */}
          {ticks.map((t) => {
            const y = getY(t)
            const isTarget100 = t === 100
            return (
              <g key={t}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={width - padRight}
                  y2={y}
                  stroke={isTarget100 ? '#268484' : '#e2e8f0'}
                  strokeWidth={isTarget100 ? '1.5' : '1'}
                  strokeDasharray={t === 0 || isTarget100 ? 'none' : '3 3'}
                  opacity={isTarget100 ? 0.45 : 1}
                />
                <text
                  x={padLeft - 10}
                  y={y + 3.5}
                  textAnchor="end"
                  fill={isTarget100 ? '#268484' : '#94a3b8'}
                  fontSize="10"
                  fontWeight={isTarget100 ? '900' : '700'}
                >
                  {t}%
                </text>
              </g>
            )
          })}

          {/* Sumbu X dasar */}
          <line
            x1={padLeft}
            y1={padTop + plotHeight}
            x2={width - padRight}
            y2={padTop + plotHeight}
            stroke="#cbd5e1"
            strokeWidth="1.5"
          />

          {/* Area Soft Fill di bawah garis capaian Sudah Terbit BA */}
          {n > 1 && (
            <path
              d={areaTerbit}
              fill="url(#terbitProgressGradient)"
              className="pointer-events-none"
            />
          )}

          {/* Garis Vertikal Hover Guide */}
          {activeIndex !== null && (
            <line
              x1={getX(activeIndex)}
              y1={padTop}
              x2={getX(activeIndex)}
              y2={padTop + plotHeight}
              stroke="#01bcce"
              strokeWidth="1.5"
              strokeDasharray="4 4"
              opacity="0.85"
            />
          )}

          {/* 1. Line 1: Dasar 100% (Teal RSCM #268484) */}
          <path
            d={pathTotal100}
            fill="none"
            stroke={colorTotal}
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* 2. Line 2: Capaian Sudah Terbit BA (%) (Lime RSCM #d0db41) */}
          <path
            d={pathTerbit}
            fill="none"
            stroke={colorTerbit}
            strokeWidth="3.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Dots, Text Labels, & Hit Areas */}
          {validData.map((d, i) => {
            const x = getX(i)
            const y100 = getY(100)
            const yTerbit = getY(d.terbitPct)
            const isHovered = activeIndex === i

            return (
              <g key={d.bulan}>
                {/* Highlight capsule background saat di-hover */}
                {isHovered && (
                  <rect
                    x={x - 20}
                    y={padTop}
                    width={40}
                    height={plotHeight}
                    fill="#eef9fa"
                    rx="8"
                    opacity="0.6"
                  />
                )}

                {/* Dot Line 1: Dasar 100% */}
                <circle
                  cx={x}
                  cy={y100}
                  r={isHovered ? 6 : 4}
                  fill={colorTotal}
                  stroke="#ffffff"
                  strokeWidth="2"
                  className="pointer-events-none transition-all"
                />

                {/* Dot Line 2: Sudah Terbit BA (%) */}
                <circle
                  cx={x}
                  cy={yTerbit}
                  r={isHovered ? 6.5 : 4.5}
                  fill={colorTerbit}
                  stroke="#00282b"
                  strokeWidth="1.5"
                  className="pointer-events-none transition-all"
                />

                {/* Angka Persentase di atas Titik Sudah Terbit BA */}
                <text
                  x={x}
                  y={yTerbit < y100 + 16 ? yTerbit + 16 : yTerbit - 7}
                  textAnchor="middle"
                  fill="#00282b"
                  fontSize="10"
                  fontWeight="900"
                  className="pointer-events-none select-none drop-shadow-xs"
                >
                  {d.terbitPct.toFixed(1)}%
                </text>

                {/* Label Sumbu X */}
                <text
                  x={x}
                  y={padTop + plotHeight + 18}
                  textAnchor="middle"
                  fill={isHovered ? '#00282b' : '#64748b'}
                  fontSize={isHovered ? '11' : '10'}
                  fontWeight={isHovered ? '900' : '700'}
                >
                  {d.bulanSingkat}
                </text>

                {/* Invisible Hit Area Column untuk hover responsif */}
                <rect
                  x={x - (n > 1 ? stepX / 2 : 30)}
                  y={padTop}
                  width={n > 1 ? stepX : 60}
                  height={plotHeight + 24}
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredIdx(i)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  onClick={() => setHoveredIdx(hoveredIdx === i ? null : i)}
                />
              </g>
            )
          })}
        </svg>

        {/* Floating Vertical List Card (Gambar 2 Format) */}
        {hoveredData && activeIndex !== null && (
          <div
            className="absolute z-20 pointer-events-none transition-all duration-150 ease-out"
            style={{
              left: `${(getX(activeIndex) / width) * 100}%`,
              top: '16px',
              transform:
                getX(activeIndex) > width * 0.52
                  ? 'translateX(calc(-100% - 18px))'
                  : 'translateX(18px)',
            }}
          >
            <div className="bg-[#00282b]/95 backdrop-blur-md text-white rounded-2xl px-4 py-3 shadow-2xl border border-[#01bcce]/30 min-w-[210px] font-nav">
              <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-white/10">
                <span className="font-black text-xs text-[#d0db41]">
                  {hoveredData.bulan}
                </span>
                <span className="text-[10px] text-gray-300 font-bold bg-white/10 px-1.5 py-0.5 rounded">
                  {hoveredData.bulanSingkat}
                </span>
              </div>
              <div className="space-y-1.5 text-xs font-nav">
                {/* 1. Total (100%) */}
                <div className="flex items-center justify-between gap-3">
                  <span className="text-teal-200 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full inline-block shadow-sm" style={{ background: colorTotal }} />
                    {totalLabel} (%):
                  </span>
                  <div className="text-right">
                    <span className="font-black text-white block">
                      {formatRawValue(hoveredData.totalRaw)}
                    </span>
                    <span className="text-[10px] font-bold text-teal-300">
                      100%
                    </span>
                  </div>
                </div>

                {/* 2. Sudah Terbit BA (%) */}
                <div className="flex items-center justify-between gap-3 pt-1 border-t border-white/10">
                  <span className="text-lime-300 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full inline-block shadow-sm" style={{ background: colorTerbit }} />
                    {terbitLabel}:
                  </span>
                  <div className="text-right">
                    <span className="font-black text-[#d0db41] block">
                      {formatRawValue(hoveredData.terbitRaw)}
                    </span>
                    <span className="text-[10px] font-black text-[#01bcce]">
                      {hoveredData.terbitPct.toFixed(1)}% Capaian
                    </span>
                  </div>
                </div>

                {/* 3. Belum Terbit BA (Selisih) */}
                <div className="flex items-center justify-between gap-3 pt-1 border-t border-white/10 text-[11px]">
                  <span className="text-gray-300">Belum Terbit:</span>
                  <span className="font-bold text-rose-300">
                    {formatRawValue(Math.max(0, hoveredData.totalRaw - hoveredData.terbitRaw))} ({Math.max(0, 100 - hoveredData.terbitPct).toFixed(1)}%)
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Legend Garis di Bawah */}
      <div className="flex items-center justify-center gap-4 text-xs font-bold pt-3 border-t border-gray-100 font-nav">
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-teal-50 border border-[#268484]/20 text-[#268484]">
          <span className="w-2.5 h-2.5 rounded-full bg-[#268484]" />
          <span>{totalLabel} (%)</span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-lime-50 border border-[#d0db41]/30 text-lime-900">
          <span className="w-2.5 h-2.5 rounded-full bg-[#d0db41]" />
          <span>{terbitLabel} (%)</span>
        </div>
      </div>
    </div>
  )
}





