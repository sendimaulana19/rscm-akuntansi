'use client'
import { useState, useEffect } from 'react'
import { FileText, ChevronRight, BarChart3, Grid3x3, TrendingUp, TrendingDown, Calendar, Target } from 'lucide-react'

const NAMA_BULAN = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des']
const NAMA_BULAN_FULL = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

const kpiConfig = [
  { key: 'ebitda',                            label: 'EBITDA',                          satuan: 'rupiah', target: 'Positif',    targetVal: 0,    higherBetter: true  },
  { key: 'arus_kas_bersih',                   label: 'Arus Kas Bersih',                 satuan: 'rupiah', target: 'Positif',    targetVal: 0,    higherBetter: true  },
  { key: 'pendapatan_operasional',             label: 'Pendapatan Operasional',          satuan: 'rupiah', target: 'Linear RBA', targetVal: null,  higherBetter: true  },
  { key: 'rasio_beban_pegawai',                label: 'Rasio Beban Pegawai',             satuan: 'persen', target: '≤ 45%',     targetVal: 45,   higherBetter: false },
  { key: 'rasio_beban_persediaan_farmasi',     label: 'Rasio Beban Persediaan Farmasi',  satuan: 'persen', target: '≤ 25%',     targetVal: 25,   higherBetter: false },
  { key: 'rasio_beban_persediaan_non_farmasi', label: 'Rasio Beban Non Farmasi',         satuan: 'persen', target: '≤ 5%',      targetVal: 5,    higherBetter: false },
  { key: 'margin_laba_kotor',                  label: 'Margin Laba Kotor',               satuan: 'persen', target: '≥ 25%',     targetVal: 25,   higherBetter: true  },
  { key: 'margin_laba_usaha',                  label: 'Margin Laba Usaha',               satuan: 'persen', target: '≥ 10%',     targetVal: 10,   higherBetter: true  },
  { key: 'ebitda_margin',                      label: 'EBITDA Margin',                   satuan: 'persen', target: '≥ 15%',     targetVal: 15,   higherBetter: true  },
  { key: 'perputaran_piutang',                 label: 'Perputaran Piutang',              satuan: 'hari',   target: '≤ 40 hari', targetVal: 40,   higherBetter: false },
  { key: 'perputaran_persediaan',              label: 'Perputaran Persediaan',            satuan: 'hari',   target: '≤ 60 hari', targetVal: 60,   higherBetter: false },
  { key: 'perputaran_utang',                   label: 'Perputaran Utang',                satuan: 'hari',   target: '≤ 60 hari', targetVal: 60,   higherBetter: false },
]

function fmt(v: number | null | undefined, s: string): string {
  if (v == null) return '—'
  if (s === 'rupiah') {
    // Tampilkan angka penuh dengan format Indonesia (titik sebagai pemisah ribuan)
    return `Rp\u00A0${Math.round(v).toLocaleString('id-ID')}`
  }
  if (s === 'persen') return `${v.toFixed(1)}%`
  if (s === 'hari')   return `${v.toFixed(0)} hari`
  return String(v)
}

function stat(v: number | null | undefined, c: typeof kpiConfig[0]): 'baik' | 'buruk' | 'kosong' {
  if (v == null) return 'kosong'
  if (c.targetVal === null) return v > 0 ? 'baik' : 'buruk'
  return c.higherBetter ? (v >= c.targetVal ? 'baik' : 'buruk') : (v <= c.targetVal ? 'baik' : 'buruk')
}

interface Props { kpiTerbaru: any; semuaKpi: any[]; laporanKeuangan: any[]; catatanLaporan: any[] }

export default function KinerjaKeuanganClient({ kpiTerbaru, semuaKpi, laporanKeuangan, catatanLaporan }: Props) {
  const [mode, setMode] = useState<'grid' | 'tabel'>('grid')
  const [fP, setFP] = useState(''); const [fTL, setFTL] = useState(''); const [fTC, setFTC] = useState('')
  const [ready, setReady] = useState(false)
  const defaultThn = kpiTerbaru?.tahun ?? new Date().getFullYear()
  const [selectedThn, setSelectedThn] = useState<number>(defaultThn)
  useEffect(() => { setTimeout(() => setReady(true), 80) }, [])

  const thnL = [...new Set(laporanKeuangan.map(l => l.tahun))].sort((a: number, b: number) => b - a)
  const thnC = [...new Set(catatanLaporan.map(c => c.tahun))].sort((a: number, b: number) => b - a)
  // Semua tahun yang tersedia di data KPI
  const availThn = [...new Set(semuaKpi.map(k => k.tahun))].sort((a: number, b: number) => b - a)
  const lapF = laporanKeuangan.filter(l => (!fP || l.periode === fP) && (!fTL || String(l.tahun) === fTL))
  const catF = fTC ? catatanLaporan.filter(c => String(c.tahun) === fTC) : catatanLaporan
  const komp = semuaKpi.filter(k => k.tahun === selectedThn).sort((a, b) => a.bulan - b.bulan)

  return (
    <>
      <style>{`
        @keyframes slideUp   { from { opacity:0; transform:translateY(30px) } to { opacity:1; transform:translateY(0) } }
        @keyframes slideLeft { from { opacity:0; transform:translateX(-40px) } to { opacity:1; transform:translateX(0) } }
        @keyframes fadeIn    { from { opacity:0 } to { opacity:1 } }
        @keyframes popIn     { from { opacity:0; transform:scale(0.9) } to { opacity:1; transform:scale(1) } }
        @keyframes shimmer   { 0% { background-position:-200% 0 } 100% { background-position:200% 0 } }
        .aSlideUp   { animation: slideUp 0.6s cubic-bezier(.22,1,.36,1) both }
        .aSlideLeft { animation: slideLeft 0.7s cubic-bezier(.22,1,.36,1) both }
        .aFadeIn    { animation: fadeIn 0.6s ease both }
        .aPopIn     { animation: popIn 0.4s cubic-bezier(.22,1,.36,1) both }
        .cardHover  { transition: transform .25s cubic-bezier(.22,1,.36,1), box-shadow .25s }
        .cardHover:hover { transform: translateY(-6px); box-shadow: 0 16px 40px rgba(0,40,43,.12) }
        .rowHover   { transition: background .15s }
        .rowHover:hover { background: #eef9fa !important }
        .docHover   { transition: all .2s }
        .docHover:hover { border-color: #01bcce !important; transform: translateX(5px); box-shadow: 0 4px 12px rgba(1,188,206,.1) }
        .pdfCard    { transition: transform .3s cubic-bezier(.22,1,.36,1), box-shadow .3s }
        .pdfCard:hover { transform: translateY(-8px); box-shadow: 0 20px 50px rgba(0,40,43,.15) }
        .pdfCard:hover .pdfOverlay { opacity: 1 }
      `}</style>

      <div style={{ minHeight: '100vh', fontFamily: '"TeX Gyre Bonum", Georgia, serif' }}>

        {/* ═══════ HERO ═══════ */}
        <div className={ready ? 'aFadeIn' : ''} style={{
          position: 'relative', height: 320,
          backgroundImage: 'url(/bg-lobby-rscm.png)', backgroundSize: 'cover', backgroundPosition: 'center 60%',
        }}>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(0,40,43,.92), rgba(0,40,43,.65))' }} />
          <div style={{ position: 'relative', zIndex: 1, maxWidth: 1140, margin: '0 auto', padding: '0 24px', height: '100%', display: 'flex', alignItems: 'center' }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(208,219,65,.15)', border: '1px solid rgba(208,219,65,.3)', borderRadius: 20, padding: '5px 14px', marginBottom: 14 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#d0db41', display: 'inline-block' }} />
                <span style={{ fontFamily: 'Nunito, sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase' as const, color: '#d0db41' }}>Sub Tim Kerja</span>
              </div>
              <h1 style={{ fontSize: 48, fontWeight: 900, color: '#fff', lineHeight: 1.1, margin: 0, fontFamily: 'Nunito, sans-serif' }}>Akuntansi Keuangan</h1>
              <div style={{ width: 70, height: 4, background: '#d0db41', borderRadius: 2, marginTop: 16 }} />
            </div>
          </div>
        </div>

        {/* ═══════ KINERJA KEUANGAN SECTION ═══════ */}
        <div style={{ background: '#d0db41', paddingBottom: 48 }}>
          <div style={{ maxWidth: 1140, margin: '0 auto', padding: '0 24px' }}>

            {/* Floating card container */}
            <div style={{
              background: '#fff', borderRadius: 16, padding: '36px 32px',
              boxShadow: '0 8px 40px rgba(0,40,43,.12)', border: '1px solid rgba(0,0,0,.04)',
              position: 'relative', top: -50,
            }}>

              {mode === 'grid' ? (
                /* ── GRID MODE ── */
                <>
                  {/* Two-column: Title left | Grid right */}
                  <div style={{ display: 'flex', gap: 40, flexWrap: 'wrap' as const }}>

                    {/* LEFT COLUMN — Title */}
                    <div className={ready ? 'aSlideLeft' : ''} style={{ opacity: ready ? undefined : 0, flex: '0 0 220px', minWidth: 200 }}>
                      {/* Accent bar */}
                      <div style={{ width: 40, height: 4, background: '#01bcce', borderRadius: 2, marginBottom: 16 }} />

                      <h2 style={{ fontSize: 38, fontWeight: 900, lineHeight: 1.05, color: '#00282b', margin: '0 0 6px' }}>
                        Kinerja<br />Keuangan<br /><span style={{ color: '#01bcce' }}>RSCM</span>
                      </h2>

                      {/* Periode box */}
                      {kpiTerbaru && (
                        <div style={{
                          marginTop: 20, padding: '14px 16px', borderRadius: 10,
                          background: 'linear-gradient(135deg, #00282b, #013a3f)',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                            <Calendar size={14} color="#d0db41" />
                            <span style={{ fontFamily: 'Nunito, sans-serif', fontSize: 9, fontWeight: 700, color: '#d0db41', textTransform: 'uppercase' as const, letterSpacing: 1.5 }}>Periode</span>
                          </div>
                          <div style={{ fontFamily: 'Nunito, sans-serif', fontSize: 17, fontWeight: 800, color: '#fff' }}>
                            {NAMA_BULAN_FULL[kpiTerbaru.bulan]}
                          </div>
                          <div style={{ fontFamily: 'Nunito, sans-serif', fontSize: 13, fontWeight: 600, color: '#01bcce' }}>
                            {kpiTerbaru.tahun}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* RIGHT COLUMN — Grid */}
                    <div style={{ flex: 1, minWidth: 0 }}>

                      {/* Periode header above grid */}
                      <div className={ready ? 'aSlideUp' : ''} style={{
                        opacity: ready ? undefined : 0, animationDelay: '.1s',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        marginBottom: 16, paddingBottom: 14, borderBottom: '2px solid #f0f0f0',
                      }}>
                        <div>
                          <h3 style={{ fontFamily: 'Nunito, sans-serif', fontSize: 16, fontWeight: 800, color: '#00282b', margin: 0 }}>
                            Kinerja Keuangan RSCM
                          </h3>
                          <p style={{ fontFamily: 'Nunito, sans-serif', fontSize: 13, fontWeight: 600, color: '#01bcce', margin: '2px 0 0' }}>
                            {kpiTerbaru ? `${NAMA_BULAN_FULL[kpiTerbaru.bulan]} ${kpiTerbaru.tahun}` : 'Periode belum tersedia'}
                          </p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Target size={14} color="#d0db41" />
                          <span style={{ fontFamily: 'Nunito, sans-serif', fontSize: 10, fontWeight: 700, color: '#999', textTransform: 'uppercase' as const, letterSpacing: 1 }}>12 Indikator</span>
                        </div>
                      </div>

                      {/* 4×3 Grid */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                        {kpiConfig.map((cfg, i) => {
                          const v = kpiTerbaru?.[cfg.key]
                          const s = stat(v, cfg)
                          const has = v != null
                          const accentColor = has ? (s === 'baik' ? '#01bcce' : '#ef5350') : '#e0e0e0'

                          return (
                            <div
                              key={cfg.key}
                              className={`cardHover ${ready ? 'aSlideUp' : ''}`}
                              style={{
                                opacity: ready ? undefined : 0,
                                animationDelay: `${0.15 + i * 0.05}s`,
                                background: '#fff', borderRadius: 10, padding: '16px 14px 12px',
                                border: '1px solid #eee', position: 'relative' as const,
                                overflow: 'hidden', display: 'flex', flexDirection: 'column' as const,
                                justifyContent: 'center',
                                gap: 3, minHeight: 105,
                              }}
                            >
                              {/* Top color bar */}
                              <div style={{ position: 'absolute' as const, top: 0, left: 0, right: 0, height: 3, background: accentColor }} />

                              {/* Status badge */}
                              {has && (
                                <div style={{
                                  position: 'absolute' as const, top: 10, right: 10,
                                  width: 20, height: 20, borderRadius: 5,
                                  background: s === 'baik' ? '#e8f5e9' : '#ffebee',
                                  color: s === 'baik' ? '#2e7d32' : '#c62828',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                  {s === 'baik' ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                                </div>
                              )}

                              {/* Value */}
                              <div className={ready ? 'aPopIn' : ''} style={{
                                opacity: ready ? undefined : 0,
                                animationDelay: `${0.35 + i * 0.05}s`,
                                fontFamily: 'Nunito, sans-serif', fontSize: has ? (cfg.satuan === 'rupiah' ? 16 : 18) : 22,
                                fontWeight: 800, color: has ? '#00282b' : '#ddd', lineHeight: 1.2,
                                marginTop: 4, textAlign: 'center' as const,
                                whiteSpace: 'nowrap'
                              }}>
                                {has ? fmt(v, cfg.satuan) : '—'}
                              </div>

                              {/* Label */}
                              <div style={{ fontFamily: 'Nunito, sans-serif', fontSize: 9, fontWeight: 700, color: '#666', lineHeight: 1.35, textTransform: 'uppercase' as const, letterSpacing: .3, textAlign: 'center' as const }}>
                                {cfg.label}
                              </div>

                              {/* Target */}
                              <div style={{ fontFamily: 'Nunito, sans-serif', fontSize: 8, color: '#bbb', fontStyle: 'italic', textAlign: 'center' as const }}>
                                Target: {cfg.target}
                              </div>
                            </div>
                          )
                        })}
                      </div>

                      {/* Komparatif button under grid */}
                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14 }}>
                        <button
                          onClick={() => setMode('tabel')}
                          style={{
                            padding: '9px 22px', borderRadius: 8, border: 'none',
                            background: '#d0db41', color: '#00282b',
                            fontFamily: 'Nunito, sans-serif', fontWeight: 800, fontSize: 12,
                            cursor: 'pointer', transition: 'all .2s', letterSpacing: .5,
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#00282b'; e.currentTarget.style.color = '#d0db41' }}
                          onMouseLeave={e => { e.currentTarget.style.background = '#d0db41'; e.currentTarget.style.color = '#00282b' }}
                        >
                          Komparatif →
                        </button>
                      </div>
                    </div>
                  </div>
                </>

              ) : (
                /* ── TABLE MODE ── */
                <div className={ready ? 'aFadeIn' : ''}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap' as const, gap: 12 }}>
                    <div>
                      <div style={{ width: 40, height: 4, background: '#d0db41', borderRadius: 2, marginBottom: 10 }} />
                      <h2 style={{ fontSize: 22, fontWeight: 800, color: '#00282b', margin: '0 0 4px' }}>
                        Komparatif Kinerja — Tahun {selectedThn}
                      </h2>
                      <p style={{ fontFamily: 'Nunito, sans-serif', fontSize: 12, color: '#888', margin: '0 0 12px' }}>Perbandingan 12 indikator kinerja bulanan</p>
                      {/* Filter Tahun */}
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const }}>
                        {availThn.length > 0 ? availThn.map(t => (
                          <button key={t} onClick={() => setSelectedThn(t)}
                            style={{
                              padding: '5px 14px', borderRadius: 20, border: '2px solid',
                              borderColor: selectedThn === t ? '#00282b' : '#ddd',
                              background: selectedThn === t ? '#00282b' : '#fff',
                              color: selectedThn === t ? '#d0db41' : '#666',
                              fontFamily: 'Nunito, sans-serif', fontWeight: 700, fontSize: 11,
                              cursor: 'pointer', transition: 'all .2s',
                            }}
                          >{t}</button>
                        )) : (
                          <span style={{ fontFamily: 'Nunito, sans-serif', fontSize: 11, color: '#aaa' }}>Belum ada data tahun lain</span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => setMode('grid')}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        padding: '9px 18px', borderRadius: 8, border: '2px solid #00282b',
                        background: 'transparent', color: '#00282b',
                        fontFamily: 'Nunito, sans-serif', fontWeight: 700, fontSize: 12, cursor: 'pointer', transition: 'all .2s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#00282b'; e.currentTarget.style.color = '#d0db41' }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#00282b' }}
                    >
                      <Grid3x3 size={14} /> Tampilan Grid
                    </button>
                  </div>

                  <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid #e8e8e8' }}>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' as const, minWidth: 920 }}>
                        <thead>
                          <tr>
                            <th style={{ background: '#00282b', color: '#d0db41', fontFamily: 'Nunito, sans-serif', fontSize: 10, fontWeight: 700, textAlign: 'left' as const, padding: '13px 14px', position: 'sticky' as const, left: 0, zIndex: 2, textTransform: 'uppercase' as const, letterSpacing: .5, minWidth: 190 }}>
                              Indikator Kinerja
                            </th>
                            {NAMA_BULAN.slice(1).map((b, i) => {
                              // Highlight bulan terbaru hanya jika tahun yang dipilih adalah tahun kpiTerbaru
                              const latest = selectedThn === kpiTerbaru?.tahun && kpiTerbaru?.bulan === i + 1
                              return <th key={i} style={{ background: latest ? '#01bcce' : '#00282b', color: latest ? '#fff' : 'rgba(255,255,255,.5)', fontFamily: 'Nunito, sans-serif', fontSize: 10, fontWeight: 700, textAlign: 'center' as const, padding: '13px 6px', textTransform: 'uppercase' as const }}>{b}</th>
                            })}
                          </tr>
                        </thead>
                        <tbody>
                          {kpiConfig.map((cfg, ri) => (
                            <tr key={cfg.key} className="rowHover" style={{ background: ri % 2 === 0 ? '#fff' : '#fafbfc' }}>
                              <td style={{ padding: '10px 14px', position: 'sticky' as const, left: 0, zIndex: 1, background: 'inherit', borderRight: '1px solid #eee', borderBottom: '1px solid #f0f0f0' }}>
                                <div style={{ fontFamily: 'Nunito, sans-serif', fontSize: 11, fontWeight: 700, color: '#00282b' }}>{cfg.label}</div>
                                <div style={{ fontFamily: 'Nunito, sans-serif', fontSize: 9, color: '#aaa', marginTop: 1 }}>Target: {cfg.target}</div>
                              </td>
                              {Array.from({ length: 12 }, (_, mi) => {
                                const d = komp.find(k => k.bulan === mi + 1); const v = d?.[cfg.key]; const s = stat(v, cfg)
                                const latest = kpiTerbaru?.bulan === mi + 1; const has = v != null
                                return <td key={mi} style={{ padding: '10px 6px', textAlign: 'center' as const, fontFamily: 'Nunito, sans-serif', fontSize: 11, fontWeight: has ? 700 : 400, color: !has ? '#d0d0d0' : s === 'baik' ? '#2e7d32' : '#c62828', background: latest ? (ri % 2 === 0 ? '#eef9fa' : '#e4f6f8') : undefined, borderBottom: '1px solid #f0f0f0' }}>{fmt(v, cfg.satuan)}</td>
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 18, marginTop: 12, flexWrap: 'wrap' as const }}>
                    {[{ c: '#2e7d32', t: 'Memenuhi Target' }, { c: '#c62828', t: 'Di Bawah Target' }].map(x => (
                      <span key={x.t} style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'Nunito, sans-serif', fontSize: 11, color: '#666' }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: x.c, display: 'inline-block' }} />{x.t}
                      </span>
                    ))}
                    <span style={{ fontFamily: 'Nunito, sans-serif', fontSize: 11, color: '#ccc' }}><b>—</b> Belum Ada Data</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ═══════ LAPORAN KEUANGAN ═══════ */}
        <div style={{ background: '#f3f5f7', padding: '48px 0' }}>
          <div style={{ maxWidth: 1140, margin: '0 auto', padding: '0 24px' }}>

            {/* Section header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <div style={{ width: 4, height: 28, background: '#01bcce', borderRadius: 2 }} />
              <h2 style={{ fontSize: 26, fontWeight: 800, color: '#00282b', margin: 0 }}>Laporan Keuangan</h2>
            </div>
            <p style={{ fontFamily: 'Nunito, sans-serif', fontSize: 13, color: '#888', margin: '0 0 20px', paddingLeft: 16 }}>Unduh laporan keuangan per semester dan tahunan</p>

            <div style={{ display: 'flex', gap: 8, marginBottom: 20, paddingLeft: 16 }}>
              <select value={fP} onChange={e => setFP(e.target.value)} style={sel}>
                <option value="">Semua Periode</option>
                <option value="Semester 1">Semester 1</option>
                <option value="Semester 2">Semester 2</option>
                <option value="Tahunan">Tahunan</option>
              </select>
              <select value={fTL} onChange={e => setFTL(e.target.value)} style={sel}>
                <option value="">Tahun</option>
                {thnL.map(t => <option key={t} value={String(t)}>{t}</option>)}
              </select>
            </div>

            {lapF.length === 0 ? <Empty /> : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 20 }}>
                {lapF.map((l: any) => <PdfCover key={l.id} title={l.judul} sub={`${l.periode} · ${l.tahun}`} url={l.file_url} />)}
              </div>
            )}

            {/* ─── Catatan Atas Laporan ─── */}
            <div style={{ marginTop: 56 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <div style={{ width: 4, height: 28, background: '#d0db41', borderRadius: 2 }} />
                <h2 style={{ fontSize: 26, fontWeight: 800, color: '#00282b', margin: 0 }}>Catatan Atas Laporan Keuangan</h2>
              </div>
              <p style={{ fontFamily: 'Nunito, sans-serif', fontSize: 13, color: '#888', margin: '0 0 20px', paddingLeft: 16 }}>Catatan penjelas atas laporan keuangan tahunan</p>

              <div style={{ marginBottom: 20, paddingLeft: 16 }}>
                <select value={fTC} onChange={e => setFTC(e.target.value)} style={sel}>
                  <option value="">Semua Tahun</option>
                  {thnC.map(t => <option key={t} value={String(t)}>{t}</option>)}
                </select>
              </div>

              {catF.length === 0 ? <Empty /> : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 20 }}>
                  {catF.map((c: any) => <PdfCover key={c.id} title={c.judul} sub={`Tahun ${c.tahun}`} url={c.file_url} />)}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer spacer */}
        <div style={{ height: 40 }} />
      </div>
    </>
  )
}

/* ─── Shared ─── */
const sel: React.CSSProperties = { padding: '8px 14px', borderRadius: 8, border: '1px solid #ddd', fontFamily: 'Nunito, sans-serif', fontSize: 12, color: '#333', background: '#fff', outline: 'none' }

function Empty() {
  return <div style={{ textAlign: 'center', padding: 36, border: '2px dashed #ddd', borderRadius: 12, color: '#bbb', fontFamily: 'Nunito, sans-serif', fontSize: 13 }}>Belum ada dokumen.</div>
}

function PdfCover({ title, sub, url }: { title: string; sub: string; url: string }) {
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="pdfCard"
      style={{ display: 'block', textDecoration: 'none', borderRadius: 12, overflow: 'hidden', background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,.06)', border: '1px solid #eee' }}>
      {/* PDF Cover Preview */}
      <div style={{ position: 'relative', width: '100%', aspectRatio: '3/4', background: '#f0f0f0', overflow: 'hidden' }}>
        <iframe
          src={`${url}#page=1&view=FitH&toolbar=0&navpanes=0&scrollbar=0`}
          style={{ width: '200%', height: '200%', border: 'none', transform: 'scale(0.5)', transformOrigin: '0 0', pointerEvents: 'none' }}
          title={title}
        />
        {/* Hover overlay */}
        <div className="pdfOverlay" style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to top, rgba(0,40,43,.85) 0%, rgba(0,40,43,.3) 50%, transparent 100%)',
          opacity: 0, transition: 'opacity .3s',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: 16,
        }}>
          <span style={{
            fontFamily: 'Nunito, sans-serif', fontSize: 12, fontWeight: 700,
            color: '#d0db41', background: 'rgba(0,40,43,.6)', borderRadius: 6,
            padding: '6px 16px', backdropFilter: 'blur(4px)',
          }}>
            Buka Dokumen →
          </span>
        </div>
      </div>
      {/* Title below */}
      <div style={{ padding: '12px 14px' }}>
        <div style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 700, fontSize: 13, color: '#00282b', lineHeight: 1.3 }}>{title}</div>
        <div style={{ fontFamily: 'Nunito, sans-serif', fontSize: 11, color: '#888', marginTop: 3 }}>{sub}</div>
      </div>
    </a>
  )
}
