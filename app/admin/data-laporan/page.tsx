"use client"
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Save, Database, Trash2, ClipboardPaste } from 'lucide-react'
import NeracaForm from './NeracaForm'
import OperasionalForm from './OperasionalForm'
import ArusKasForm from './ArusKasForm'
import IndikatorForm from './IndikatorForm'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']

const CATEGORIES = [
  { value: 'neraca', label: 'Neraca' },
  { value: 'operasional', label: 'Laporan Operasional' },
  { value: 'arus_kas', label: 'Laporan Arus Kas' },
  { value: '12_indikator', label: '12 Indikator Kinerja' },
]

// Kolom bulan pada Excel (setelah kolom nama) jika ada subtotal Triwulan/Semester:
// Jan, Feb, Mar, TW1, Apr, Mei, Jun, TW2, SM1, Jul, Agu, Sep, TW3, Okt, Nov, Des
const IDX_WITH_SUBTOTAL = [0, 1, 2, 4, 5, 6, 9, 10, 11, 13, 14, 15]

const HEADER_WORDS = ['coa neraca', 'kinerja operasional', 'arus kas dari aktivitas operasi', 'keterangan', 'uraian', 'item']

function parseNumber(raw: string | undefined): number | null {
  if (raw == null) return null
  let s = raw.trim().replace(/\s/g, '').replace(/^Rp/i, '')
  if (!s || s === '-' || s === '–') return s ? 0 : null
  let neg = false
  if (/^\(.*\)$/.test(s)) { neg = true; s = s.slice(1, -1) }
  if (s.startsWith('-')) { neg = true; s = s.slice(1) }
  s = s.replace(/%$/, '')
  const hasComma = s.includes(','), hasDot = s.includes('.')
  if (hasComma && hasDot) {
    if (s.lastIndexOf(',') > s.lastIndexOf('.')) s = s.replace(/\./g, '').replace(',', '.')
    else s = s.replace(/,/g, '')
  } else if (hasComma) {
    s = /^\d{1,3}(,\d{3})+$/.test(s) ? s.replace(/,/g, '') : s.replace(',', '.')
  } else if (hasDot) {
    s = /^\d{1,3}(\.\d{3})+$/.test(s) ? s.replace(/\./g, '') : s
  }
  const n = parseFloat(s)
  if (isNaN(n)) return null
  return neg ? -n : n
}

interface Row { item_name: string; values: (number | null)[] }

function parseTSV(text: string): Row[] {
  const rows: Row[] = []
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) continue
    const cols = line.split('\t').map(c => c.replace(/^"|"$/g, ''))
    // kolom nama: kolom ke-8 jika berisi huruf, jika tidak cari sel teks pertama
    let nameIdx = /[A-Za-z]/.test(cols[7] ?? '') ? 7 : cols.findIndex(c => /[A-Za-z]/.test(c) && parseNumber(c) === null)
    if (nameIdx < 0) continue
    const name = cols[nameIdx].trim()
    if (!name || HEADER_WORDS.includes(name.toLowerCase())) continue
    const tail = cols.slice(nameIdx + 1)
    const nums = tail.map(parseNumber)
    if (!nums.some(n => n !== null)) continue // baris judul/tanpa angka
    const values: (number | null)[] = nums.length >= 16
      ? IDX_WITH_SUBTOTAL.map(i => nums[i] ?? null)
      : Array.from({ length: 12 }, (_, i) => nums[i] ?? null)
    rows.push({ item_name: name, values })
  }
  return rows
}

const fmt = (v: number | null) => v == null ? '—' : v.toLocaleString('id-ID')

export default function DataLaporanAdmin() {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [category, setCategory] = useState('neraca')
  const [year, setYear] = useState(new Date().getFullYear().toString())

  return (
    <div className="min-h-screen" style={{ background: '#f0f4f5' }}>
      <div style={{ background: '#00282b' }} className="px-4 sm:px-6 py-6">
        <div className="max-w-6xl mx-auto">
          <p className="font-nav text-xs text-white/50 mb-1">
            <Link href="/admin/dashboard" className="hover:text-white">← Dashboard</Link>
          </p>
          <h1 className="font-nav font-bold text-white text-xl">Input Data Laporan</h1>
          <p className="font-nav text-xs text-white/60 mt-0.5">Neraca, Operasional, Arus Kas (Paste dari Excel)</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {message && (
          <div className="font-nav text-sm rounded-xl px-4 py-3" style={message.type === 'ok'
            ? { background: '#e6f7ee', color: '#0a7a3d', border: '1px solid #b7e4c7' }
            : { background: '#fdecec', color: '#b42318', border: '1px solid #f5c2c0' }}>
            {message.type === 'ok' ? '✅ ' : '❌ '}{message.text}
          </div>
        )}

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex flex-wrap gap-4 mb-5">
            <div>
              <label className="font-nav text-xs font-bold text-gray-500 block mb-1">Kategori</label>
              <select value={category} onChange={e => setCategory(e.target.value)}
                className="font-nav text-sm font-bold border border-gray-200 rounded-lg px-3 py-2 outline-none">
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="font-nav text-xs font-bold text-gray-500 block mb-1">Tahun</label>
              <input type="number" value={year} onChange={e => setYear(e.target.value)}
                className="font-nav text-sm font-bold border border-gray-200 rounded-lg px-3 py-2 w-28 outline-none" />
            </div>
          </div>

          {category === 'neraca' && <NeracaForm year={year} onMessage={setMessage} />}
          {category === 'operasional' && <OperasionalForm year={year} onMessage={setMessage} />}
          {category === 'arus_kas' && <ArusKasForm year={year} onMessage={setMessage} />}
          {category === '12_indikator' && <IndikatorForm year={year} onMessage={setMessage} />}
        </div>
      </div>
    </div>
  )
}
