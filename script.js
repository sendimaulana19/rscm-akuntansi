const fs = require('fs');
const content = "use client"
import { useState, useEffect } from 'react'
import { FileText, ChevronRight, BarChart3, Grid3x3, Calendar, Target } from 'lucide-react'

const NAMA_BULAN = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
const NAMA_BULAN_FULL = NAMA_BULAN

const kpiConfig = [
  { key: 'pendapatan_operasional', label: 'Pendapatan Operasional', target: 'Rp 6,61 T', targetVal: 6610000000000, satuan: 'rupiah', higherBetter: true },
  { key: 'pnbp', label: 'PNBP', target: 'Rp 4,5 T', targetVal: 4500000000000, satuan: 'rupiah', higherBetter: true },
  { key: 'belanja_operasional', label: 'Belanja Operasional', target: 'Rp 5,4 T', targetVal: 5400000000000, satuan: 'rupiah', higherBetter: false },
  { key: 'beban_operasional', label: 'Beban Operasional', target: 'Rp 5,3 T', targetVal: 5300000000000, satuan: 'rupiah', higherBetter: false },
  { key: 'po_bo', label: 'Rasio POBO', target: 'Max 82%', targetVal: 82, satuan: 'persen', higherBetter: false },
  { key: 'pertumbuhan_pendapatan', label: 'Pertumbuhan Pendapatan', target: '5%', targetVal: 5, satuan: 'persen', higherBetter: true },
  { key: 'nilai_aset', label: 'Nilai Aset', target: 'Rp 9,6 T', targetVal: 9600000000000, satuan: 'rupiah', higherBetter: true },
  { key: 'saldo_kas_setara_kas', label: 'Saldo Kas', target: 'Rp 500 M', targetVal: 500000000000, satuan: 'rupiah', higherBetter: true },
  { key: 'collection_rate', label: 'Collection Rate', target: 'Min 95%', targetVal: 95, satuan: 'persen', higherBetter: true },
  { key: 'laba_rugi_bersih', label: 'Laba/Rugi Bersih', target: 'Positif', targetVal: 0, satuan: 'rupiah', higherBetter: true },
  { key: 'hari_piutang', label: 'Hari Piutang', target: 'Maks 60 Hari', targetVal: 60, satuan: 'hari', higherBetter: false },
  { key: 'hari_persediaan', label: 'Hari Persediaan', target: 'Maks 30 Hari', targetVal: 30, satuan: 'hari', higherBetter: false },
]

function fmt(v, s) {
  if (v == null) return '—'
  if (s === 'rupiah') return "Rp\u00A0" + Math.round(v).toLocaleString('id-ID')
  if (s === 'persen') return v.toFixed(1) + "%"
  if (s === 'hari')   return v.toFixed(0) + " hari"
  return String(v)
}

function fmtJutaan(v) {
  if (v == null) return '—'
  return (v / 1000000).toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}

function stat(v, c) {
  if (v == null) return 'kosong'
  if (c.targetVal === null) return v > 0 ? 'baik' : 'buruk'
  return c.higherBetter ? (v >= c.targetVal ? 'baik' : 'buruk') : (v <= c.targetVal ? 'baik' : 'buruk')
}

export default function KinerjaKeuanganClient({ kpiTerbaru, semuaKpi, financialData, laporanKeuangan, catatanLaporan }) {
  const [mode, setMode] = useState('grid')
  const [kategori, setKategori] = useState('12 Indikator Kinerja')
  
  const [fP, setFP] = useState(''); const [fTL, setFTL] = useState(''); const [fTC, setFTC] = useState('')
  const [ready, setReady] = useState(false)
  
  const defaultThn = kpiTerbaru?.tahun ?? new Date().getFullYear()
  const defaultBln = kpiTerbaru?.bulan ?? (new Date().getMonth() + 1)
  
  const [selectedThn, setSelectedThn] = useState(defaultThn)
  const [selectedBln, setSelectedBln] = useState(defaultBln)
  
  useEffect(() => { setTimeout(() => setReady(true), 80) }, [])

  const thnL = [...new Set(laporanKeuangan.map(l => l.tahun))].sort((a, b) => b - a)
  const thnC = [...new Set(catatanLaporan.map(c => c.tahun))].sort((a, b) => b - a)
  
  const availThn = [...new Set([
    ...semuaKpi.map(k => k.tahun),
    ...financialData.map(f => f.year)
  ])].sort((a, b) => b - a)
  
  if (availThn.length === 0) availThn.push(new Date().getFullYear())

  const lapF = laporanKeuangan.filter(l => (!fP || l.periode === fP) && (!fTL || String(l.tahun) === fTL))
  const catF = fTC ? catatanLaporan.filter(c => String(c.tahun) === fTC) : catatanLaporan

  const komp = semuaKpi.filter(k => k.tahun === selectedThn).sort((a, b) => a.bulan - b.bulan)
  const dSelected = komp.find(k => k.bulan === selectedBln)
  
  const catKey = kategori === 'Neraca' ? 'neraca' : kategori === 'Laporan Operasional' ? 'operasional' : 'arus_kas'
  const finDataForYear = financialData.filter(f => f.category === catKey && f.year === selectedThn)

  const TABS = ['12 Indikator Kinerja', 'Neraca', 'Laporan Operasional', 'Laporan Arus Kas']

  const renderGridFinancial = () => {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {finDataForYear.map((item, idx) => {
          const val = item.data?.['m' + selectedBln]
          return (
            <div key={idx} className="bg-white rounded-2xl p-5 border border-gray-100 cardHover" style={{ borderLeft: '4px solid #01bcce' }}>
              <div style={{ fontFamily: 'Nunito, sans-serif', fontSize: 13, fontWeight: 700, color: '#00282b', marginBottom: 10, lineHeight: 1.3 }}>
                {item.item_name}
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span style={{ fontFamily: 'Nunito, sans-serif', fontSize: 22, fontWeight: 800, color: '#00282b' }}>
                  {val != null ? fmtJutaan(val) : '—'}
                </span>
              </div>
            </div>
          )
        })}
        {finDataForYear.length === 0 && (
          <div className="col-span-full text-center py-12 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 font-nav text-sm">
            Tidak ada data {kategori} untuk periode ini.
          </div>
        )}
      </div>
    )
  }

  const renderGrid12Indikator = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {kpiConfig.map(cfg => {
        const val = dSelected?.[cfg.key]
        const st = stat(val, cfg)
        const cColor = !val ? '#94a3b8' : st === 'baik' ? '#10b981' : '#f43f5e'
        const cBg = !val ? '#f8fafc' : st === 'baik' ? '#ecfdf5' : '#fff1f2'

        return (
          <div key={cfg.key} className="bg-white rounded-2xl p-5 border border-gray-100 cardHover" style={{ position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, right: 0, width: 40, height: 40, background: cBg, borderBottomLeftRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Target size={16} color={cColor} />
            </div>
            
            <div style={{ fontFamily: 'Nunito, sans-serif', fontSize: 13, fontWeight: 700, color: '#00282b', marginBottom: 2, paddingRight: 32 }}>{cfg.label}</div>
            <div style={{ fontFamily: 'Nunito, sans-serif', fontSize: 11, color: '#888', marginBottom: 12 }}>Target: {cfg.target}</div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ fontFamily: 'Nunito, sans-serif', fontSize: 22, fontWeight: 800, color: '#00282b' }}>{fmt(val, cfg.satuan)}</span>
              {val != null && <span style={{ fontFamily: 'Nunito, sans-serif', fontSize: 11, fontWeight: 700, color: cColor }}>{st === 'baik' ? 'Tercapai' : 'Belum Tercapai'}</span>}
            </div>
          </div>
        )
      })}
    </div>
  )

  return (
    <>
      <style>{"\
        @keyframes fadeIn    { from { opacity:0 } to { opacity:1 } }\
        .aFadeIn    { animation: fadeIn 0.6s ease both }\
        .cardHover  { transition: transform .25s cubic-bezier(.22,1,.36,1), box-shadow .25s }\
        .cardHover:hover { transform: translateY(-4px); box-shadow: 0 12px 30px rgba(0,40,43,.08) }\
        .rowHover   { transition: background .15s }\
        .rowHover:hover { background: #eef9fa !important }\
        .pdfCard    { transition: transform .3s cubic-bezier(.22,1,.36,1), box-shadow .3s }\
        .pdfCard:hover { transform: translateY(-8px); box-shadow: 0 20px 50px rgba(0,40,43,.15) }\
        .pdfCard:hover .pdfOverlay { opacity: 1 }\
      "}</style>

      <div style={{ minHeight: '100vh', fontFamily: '\"TeX Gyre Bonum\", Georgia, serif' }}>
        {/* HERO */}
        <div className={ready ? 'aFadeIn' : ''} style={{
          position: 'relative', height: 280,
          backgroundImage: 'url(/bg-lobby-rscm.png)', backgroundSize: 'cover', backgroundPosition: 'center 60%',
        }}>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(0,40,43,.92), rgba(0,40,43,.65))' }} />
          <div style={{ position: 'relative', zIndex: 1, maxWidth: 1140, margin: '0 auto', padding: '0 24px', height: '100%', display: 'flex', alignItems: 'center' }}>
            <div>
              <h1 style={{ fontSize: 42, fontWeight: 900, color: '#fff', lineHeight: 1.1, margin: 0, fontFamily: 'Nunito, sans-serif' }}>
                12 Indikator Kinerja Keuangan RSCM
              </h1>
              <div style={{ width: 70, height: 4, background: '#d0db41', borderRadius: 2, marginTop: 16 }} />
            </div>
          </div>
        </div>

        {/* MAIN SECTION */}
        <div style={{ background: '#f4f6f8', paddingBottom: 48 }}>
          <div style={{ maxWidth: 1140, margin: '0 auto', padding: '0 24px' }}>
            
            {/* Main Container */}
            <div style={{
              background: '#fff', borderRadius: 16, padding: '36px',
              boxShadow: '0 8px 40px rgba(0,40,43,.08)',
              position: 'relative', top: -40,
            }}>

              {/* TABS & FILTERS */}
              <div className="flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center mb-8 border-b border-gray-100 pb-6">
                <div className="flex flex-wrap gap-2">
                  {TABS.map(t => (
                    <button
                      key={t}
                      onClick={() => setKategori(t)}
                      className={"px-4 py-2 rounded-lg font-nav text-sm font-bold transition-all " + (kategori === t ? 'bg-[#00282b] text-white shadow-md' : 'bg-gray-50 text-gray-500 hover:bg-gray-100')}
                    >
                      {t}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-3 bg-gray-50 p-2 rounded-xl border border-gray-100">
                  <Calendar size={16} className="text-gray-400 ml-2" />
                  <select
                    value={selectedBln}
                    onChange={e => setSelectedBln(Number(e.target.value))}
                    className="bg-transparent font-nav text-sm font-bold text-[#00282b] outline-none cursor-pointer"
                  >
                    {NAMA_BULAN.slice(1).map((n, i) => (
                      <option key={i + 1} value={i + 1}>{n}</option>
                    ))}
                  </select>
                  <select
                    value={selectedThn}
                    onChange={e => setSelectedThn(Number(e.target.value))}
                    className="bg-transparent font-nav text-sm font-bold text-[#01bcce] outline-none cursor-pointer pr-2"
                  >
                    {availThn.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>

              {/* HEADER & VIEW TOGGLE (for 12 Indikator only) */}
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="font-nav text-2xl font-black text-[#00282b]">{kategori}</h2>
                  <p className="font-nav text-sm text-gray-500 mt-1">
                    {kategori !== '12 Indikator Kinerja' && 'Dalam jutaan rupiah | '}
                    Periode: {NAMA_BULAN[selectedBln]} {selectedThn}
                  </p>
                </div>
                
                {kategori === '12 Indikator Kinerja' && (
                  <div style={{ display: 'flex', background: '#f0f0f0', borderRadius: 8, padding: 4 }}>
                    <button onClick={() => setMode('grid')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 6, border: 'none', background: mode === 'grid' ? '#fff' : 'transparent', color: mode === 'grid' ? '#00282b' : '#888', fontWeight: 700, fontSize: 12, fontFamily: 'Nunito, sans-serif', cursor: 'pointer', boxShadow: mode === 'grid' ? '0 2px 6px rgba(0,0,0,.05)' : 'none', transition: 'all .2s' }}><Grid3x3 size={14} /> Grid</button>
                    <button onClick={() => setMode('tabel')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 6, border: 'none', background: mode === 'tabel' ? '#fff' : 'transparent', color: mode === 'tabel' ? '#00282b' : '#888', fontWeight: 700, fontSize: 12, fontFamily: 'Nunito, sans-serif', cursor: 'pointer', boxShadow: mode === 'tabel' ? '0 2px 6px rgba(0,0,0,.05)' : 'none', transition: 'all .2s' }}><BarChart3 size={14} /> Komparatif</button>
                  </div>
                )}
              </div>

              {/* CONTENT */}
              {kategori === '12 Indikator Kinerja' ? (
                mode === 'grid' ? renderGrid12Indikator() : (
                  <div className="overflow-x-auto border border-gray-100 rounded-2xl">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr style={{ background: '#f8fafc' }}>
                          <th style={{ padding: '12px 14px', position: 'sticky', left: 0, zIndex: 2, background: '#f8fafc', borderRight: '1px solid #eee', borderBottom: '2px solid #eee', fontFamily: 'Nunito, sans-serif', fontSize: 11, fontWeight: 800, color: '#888', textTransform: 'uppercase' }}>Indikator KPI</th>
                          {Array.from({ length: 12 }, (_, i) => (
                            <th key={i} style={{ padding: '12px 6px', textAlign: 'center', borderBottom: '2px solid #eee', fontFamily: 'Nunito, sans-serif', fontSize: 11, fontWeight: 800, color: selectedBln === i + 1 ? '#01bcce' : '#888' }}>
                              {NAMA_BULAN[i + 1].slice(0, 3)}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {kpiConfig.map((cfg, ri) => (
                          <tr key={cfg.key} className="rowHover" style={{ background: ri % 2 === 0 ? '#fff' : '#fafbfc' }}>
                            <td style={{ padding: '10px 14px', position: 'sticky', left: 0, zIndex: 1, background: 'inherit', borderRight: '1px solid #eee', borderBottom: '1px solid #f0f0f0' }}>
                              <div style={{ fontFamily: 'Nunito, sans-serif', fontSize: 11, fontWeight: 700, color: '#00282b' }}>{cfg.label}</div>
                              <div style={{ fontFamily: 'Nunito, sans-serif', fontSize: 9, color: '#aaa', marginTop: 1 }}>Target: {cfg.target}</div>
                            </td>
                            {Array.from({ length: 12 }, (_, mi) => {
                              const v = komp.find(k => k.bulan === mi + 1)?.[cfg.key]; const s = stat(v, cfg)
                              return <td key={mi} style={{ padding: '10px 6px', textAlign: 'center', fontFamily: 'Nunito, sans-serif', fontSize: 11, fontWeight: v != null ? 700 : 400, color: !v ? '#d0d0d0' : s === 'baik' ? '#2e7d32' : '#c62828', background: selectedBln === mi + 1 ? (ri % 2 === 0 ? '#eef9fa' : '#e4f6f8') : undefined, borderBottom: '1px solid #f0f0f0' }}>{fmt(v, cfg.satuan)}</td>
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              ) : (
                <>
                  {renderGridFinancial()}
                  
                  {finDataForYear.length > 0 && (
                    <div className="mt-12 overflow-x-auto border border-gray-100 rounded-2xl">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr style={{ background: '#f8fafc' }}>
                            <th style={{ padding: '12px 14px', position: 'sticky', left: 0, zIndex: 2, background: '#f8fafc', borderRight: '1px solid #eee', borderBottom: '2px solid #eee', fontFamily: 'Nunito, sans-serif', fontSize: 11, fontWeight: 800, color: '#888', textTransform: 'uppercase' }}>Item {kategori}</th>
                            {Array.from({ length: 12 }, (_, i) => (
                              <th key={i} style={{ padding: '12px 6px', textAlign: 'center', borderBottom: '2px solid #eee', fontFamily: 'Nunito, sans-serif', fontSize: 11, fontWeight: 800, color: selectedBln === i + 1 ? '#01bcce' : '#888' }}>
                                {NAMA_BULAN[i + 1].slice(0, 3)}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {finDataForYear.map((item, ri) => (
                            <tr key={ri} className="rowHover" style={{ background: ri % 2 === 0 ? '#fff' : '#fafbfc' }}>
                              <td style={{ padding: '10px 14px', position: 'sticky', left: 0, zIndex: 1, background: 'inherit', borderRight: '1px solid #eee', borderBottom: '1px solid #f0f0f0' }}>
                                <div style={{ fontFamily: 'Nunito, sans-serif', fontSize: 12, fontWeight: 700, color: '#00282b' }}>{item.item_name}</div>
                              </td>
                              {Array.from({ length: 12 }, (_, mi) => {
                                const v = item.data?.['m' + (mi + 1)]
                                return <td key={mi} style={{ padding: '10px 6px', textAlign: 'right', fontFamily: 'Nunito, sans-serif', fontSize: 11, fontWeight: v != null ? 700 : 400, color: !v ? '#d0d0d0' : '#444', background: selectedBln === mi + 1 ? (ri % 2 === 0 ? '#eef9fa' : '#e4f6f8') : undefined, borderBottom: '1px solid #f0f0f0' }}>{v != null ? fmtJutaan(v) : '—'}</td>
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}

            </div>
          </div>
        </div>

        {/* LAPORAN KEUANGAN PDF */}
        <div style={{ background: '#eef1f3', padding: '48px 0' }}>
          <div style={{ maxWidth: 1140, margin: '0 auto', padding: '0 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <div style={{ width: 4, height: 28, background: '#01bcce', borderRadius: 2 }} />
              <h2 style={{ fontSize: 26, fontWeight: 800, color: '#00282b', margin: 0 }}>Dokumen Laporan Keuangan</h2>
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
                {lapF.map((l) => <PdfCover key={l.id} title={l.judul} sub={l.periode + ' · ' + l.tahun} url={l.file_url} />)}
              </div>
            )}

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
                  {catF.map((c) => <PdfCover key={c.id} title={c.judul} sub={'Tahun ' + c.tahun} url={c.file_url} />)}
                </div>
              )}
            </div>
          </div>
        </div>
        <div style={{ height: 40 }} />
      </div>
    </>
  )
}

const sel = { padding: '8px 14px', borderRadius: 8, border: '1px solid #ddd', fontFamily: 'Nunito, sans-serif', fontSize: 12, color: '#333', background: '#fff', outline: 'none' }

function Empty() {
  return <div style={{ textAlign: 'center', padding: 36, border: '2px dashed #ddd', borderRadius: 12, color: '#bbb', fontFamily: 'Nunito, sans-serif', fontSize: 13 }}>Belum ada dokumen.</div>
}

function PdfCover({ title, sub, url }) {
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="pdfCard"
      style={{ display: 'block', textDecoration: 'none', borderRadius: 12, overflow: 'hidden', background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,.06)', border: '1px solid #eee' }}>
      <div style={{ position: 'relative', width: '100%', aspectRatio: '3/4', background: '#f0f0f0', overflow: 'hidden' }}>
        <iframe src={url + '#page=1&view=FitH&toolbar=0&navpanes=0&scrollbar=0'} style={{ width: '200%', height: '200%', border: 'none', transform: 'scale(0.5)', transformOrigin: '0 0', pointerEvents: 'none' }} title={title} />
        <div className="pdfOverlay" style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,40,43,.85) 0%, rgba(0,40,43,.3) 50%, transparent 100%)', opacity: 0, transition: 'opacity .3s', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: 16 }}>
          <span style={{ fontFamily: 'Nunito, sans-serif', fontSize: 12, fontWeight: 700, color: '#d0db41', background: 'rgba(0,40,43,.6)', borderRadius: 6, padding: '6px 16px', backdropFilter: 'blur(4px)' }}>Buka Dokumen ?</span>
        </div>
      </div>
      <div style={{ padding: '12px 14px' }}>
        <div style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 700, fontSize: 13, color: '#00282b', lineHeight: 1.3 }}>{title}</div>
        <div style={{ fontFamily: 'Nunito, sans-serif', fontSize: 11, color: '#888', marginTop: 3 }}>{sub}</div>
      </div>
    </a>
  )
}
fs.writeFileSync("app/(public)/akuntansi-keuangan/KinerjaKeuanganClient.tsx", content);
