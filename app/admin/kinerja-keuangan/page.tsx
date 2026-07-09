'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Save, Plus, Trash2, AlertCircle } from 'lucide-react'
import Link from 'next/link'

const NAMA_BULAN = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

const kpiFields = [
  { key: 'ebitda', label: 'EBITDA', satuan: 'Rupiah', placeholder: '1000000000' },
  { key: 'arus_kas_bersih', label: 'Arus Kas Bersih', satuan: 'Rupiah', placeholder: '500000000' },
  { key: 'pendapatan_operasional', label: 'Pendapatan Operasional', satuan: 'Rupiah', placeholder: '2000000000' },
  { key: 'rasio_beban_pegawai', label: 'Rasio Beban Pegawai', satuan: '%', placeholder: '42.5' },
  { key: 'rasio_beban_persediaan_farmasi', label: 'Rasio Beban Persediaan Farmasi', satuan: '%', placeholder: '22.0' },
  { key: 'rasio_beban_persediaan_non_farmasi', label: 'Rasio Beban Non Farmasi', satuan: '%', placeholder: '4.5' },
  { key: 'margin_laba_kotor', label: 'Margin Laba Kotor', satuan: '%', placeholder: '28.0' },
  { key: 'margin_laba_usaha', label: 'Margin Laba Usaha', satuan: '%', placeholder: '12.0' },
  { key: 'ebitda_margin', label: 'EBITDA Margin', satuan: '%', placeholder: '16.0' },
  { key: 'perputaran_piutang', label: 'Perputaran Piutang', satuan: 'Hari', placeholder: '38' },
  { key: 'perputaran_persediaan', label: 'Perputaran Persediaan', satuan: 'Hari', placeholder: '55' },
  { key: 'perputaran_utang', label: 'Perputaran Utang', satuan: 'Hari', placeholder: '58' },
]

export default function AdminKinerjaKeuanganPage() {
  const [bulan, setBulan] = useState(String(new Date().getMonth() + 1))
  const [tahun, setTahun] = useState(String(new Date().getFullYear()))
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [existingData, setExistingData] = useState<any[]>([])
  const supabase = createClient()

  // Load existing data when bulan/tahun changes
  useEffect(() => {
    loadExisting()
  }, [bulan, tahun])

  // Load semua data untuk tabel riwayat
  useEffect(() => {
    loadAllData()
  }, [])

  async function loadExisting() {
    const { data } = await supabase
      .from('kinerja_keuangan')
      .select('*')
      .eq('bulan', parseInt(bulan))
      .eq('tahun', parseInt(tahun))
      .single()

    if (data) {
      const fields: Record<string, string> = {}
      kpiFields.forEach(f => {
        fields[f.key] = data[f.key] !== null ? String(data[f.key]) : ''
      })
      setFormData(fields)
    } else {
      setFormData({})
    }
  }

  async function loadAllData() {
    const { data } = await supabase
      .from('kinerja_keuangan')
      .select('bulan, tahun, pendapatan_operasional, created_at')
      .order('tahun', { ascending: false })
      .order('bulan', { ascending: false })
    setExistingData(data || [])
  }

  async function handleSave() {
    setLoading(true)
    setMessage('')

    const dataToSave: Record<string, any> = { bulan: parseInt(bulan), tahun: parseInt(tahun) }
    kpiFields.forEach(f => {
      const val = formData[f.key]
      if (val !== '' && val !== undefined) {
        dataToSave[f.key] = parseFloat(val)
      }
    })

    const { error } = await supabase
      .from('kinerja_keuangan')
      .upsert(dataToSave, { onConflict: 'bulan,tahun' })

    if (error) {
      setMessage('❌ Gagal menyimpan: ' + error.message)
    } else {
      setMessage('✅ Data berhasil disimpan!')
      loadAllData()
    }
    setLoading(false)
    setTimeout(() => setMessage(''), 4000)
  }

  async function handleDelete(b: number, t: number) {
    if (!confirm(`Hapus data ${NAMA_BULAN[b]} ${t}?`)) return
    await supabase.from('kinerja_keuangan').delete().eq('bulan', b).eq('tahun', t)
    loadAllData()
    if (parseInt(bulan) === b && parseInt(tahun) === t) setFormData({})
  }

  return (
    <div className="min-h-screen" style={{ background: '#f0f4f5' }}>
      {/* Header */}
      <div style={{ background: '#00282b' }} className="px-4 sm:px-6 py-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <p className="font-nav text-xs text-white/50 mb-1">
              <Link href="/admin/dashboard" className="hover:text-white">← Dashboard</Link>
            </p>
            <h1 className="font-nav font-bold text-white text-xl">Input Kinerja Keuangan</h1>
            <p className="font-nav text-xs text-white/60 mt-0.5">Input 12 indikator KPI per bulan</p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Period Selector */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-nav font-bold text-gray-800 mb-4">Pilih Periode</h2>
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="font-nav text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Bulan</label>
              <select
                value={bulan}
                onChange={e => setBulan(e.target.value)}
                className="px-4 py-2.5 rounded-xl border border-gray-200 font-nav text-sm outline-none focus:border-brand-cyan min-w-40"
              >
                {NAMA_BULAN.slice(1).map((n, i) => (
                  <option key={i + 1} value={String(i + 1)}>{n}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="font-nav text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Tahun</label>
              <select
                value={tahun}
                onChange={e => setTahun(e.target.value)}
                className="px-4 py-2.5 rounded-xl border border-gray-200 font-nav text-sm outline-none focus:border-brand-cyan"
              >
                {[2023, 2024, 2025, 2026, 2027].map(y => (
                  <option key={y} value={String(y)}>{y}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* KPI Form */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-nav font-bold text-gray-800 mb-1">
            Data Kinerja — {NAMA_BULAN[parseInt(bulan)]} {tahun}
          </h2>
          <p className="font-nav text-xs text-gray-400 mb-6">Masukkan nilai untuk setiap indikator. Kosongkan jika belum ada data.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {kpiFields.map(field => (
              <div key={field.key}>
                <label className="font-nav text-xs font-bold text-gray-600 block mb-1.5">
                  {field.label}
                  <span className="ml-1 text-gray-400 font-normal">({field.satuan})</span>
                </label>
                <input
                  type="number"
                  step="any"
                  value={formData[field.key] || ''}
                  onChange={e => setFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
                  placeholder={field.placeholder}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 font-nav text-sm outline-none focus:border-brand-cyan focus:ring-2 focus:ring-brand-cyan/10 transition-all"
                />
              </div>
            ))}
          </div>

          {message && (
            <div className={`mt-4 px-4 py-3 rounded-xl font-nav text-sm ${
              message.startsWith('✅') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'
            }`}>
              {message}
            </div>
          )}

          <div className="mt-6 flex justify-end">
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-nav font-bold text-sm text-white transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-60"
              style={{ background: '#00282b' }}
            >
              <Save size={16} />
              {loading ? 'Menyimpan...' : 'Simpan Data'}
            </button>
          </div>
        </div>

        {/* Riwayat Data */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-nav font-bold text-gray-800 mb-4">Riwayat Data</h2>
          {existingData.length === 0 ? (
            <p className="font-nav text-sm text-gray-400">Belum ada data yang tersimpan.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="font-nav text-xs font-bold text-gray-500 uppercase tracking-wide text-left py-3 px-2">Periode</th>
                    <th className="font-nav text-xs font-bold text-gray-500 uppercase tracking-wide text-right py-3 px-2">Pendapatan Ops</th>
                    <th className="font-nav text-xs font-bold text-gray-500 uppercase tracking-wide text-center py-3 px-2">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {existingData.map(d => (
                    <tr key={`${d.bulan}-${d.tahun}`} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="font-nav text-sm text-gray-700 py-3 px-2">
                        {NAMA_BULAN[d.bulan]} {d.tahun}
                      </td>
                      <td className="font-nav text-sm text-gray-500 py-3 px-2 text-right">
                        {d.pendapatan_operasional ? `Rp ${(d.pendapatan_operasional/1e9).toFixed(1)}M` : '—'}
                      </td>
                      <td className="py-3 px-2 text-center flex justify-center gap-2">
                        <button
                          onClick={() => { setBulan(String(d.bulan)); setTahun(String(d.tahun)) }}
                          className="font-nav text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
                          style={{ background: 'rgba(1,188,206,0.1)', color: '#01bcce' }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(d.bulan, d.tahun)}
                          className="font-nav text-xs font-bold px-3 py-1.5 rounded-lg bg-red-50 text-red-500 transition-colors hover:bg-red-100"
                        >
                          <Trash2 size={12} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
