'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Trash2, Mail, CheckCircle, Circle } from 'lucide-react'
import Link from 'next/link'

export default function AdminKontakPage() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => { loadData() }, [])
  async function loadData() {
    setLoading(true)
    const { data: d } = await supabase.from('kontak_pesan').select('*').order('created_at', { ascending: false })
    setData(d || [])
    setLoading(false)
  }

  async function toggleRead(id: string, current: boolean) {
    await supabase.from('kontak_pesan').update({ is_read: !current }).eq('id', id)
    loadData()
  }

  async function handleDelete(id: string) {
    if (!confirm('Hapus pesan ini?')) return
    await supabase.from('kontak_pesan').delete().eq('id', id)
    loadData()
  }

  const unread = data.filter(d => !d.is_read).length

  return (
    <div className="min-h-screen" style={{ background: '#f0f4f5' }}>
      <div style={{ background: '#00282b' }} className="px-6 py-6">
        <div className="max-w-4xl mx-auto">
          <p className="font-nav text-xs text-white/50 mb-1"><Link href="/admin/dashboard" className="hover:text-white">← Dashboard</Link></p>
          <div className="flex items-center gap-3">
            <h1 className="font-nav font-bold text-white text-xl">Pesan Kontak</h1>
            {unread > 0 && (
              <span className="px-2 py-0.5 rounded-full font-nav font-bold text-xs" style={{ background: '#d0db41', color: '#00282b' }}>
                {unread} belum dibaca
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center"><div className="w-6 h-6 border-2 border-gray-200 border-t-cyan-500 rounded-full animate-spin mx-auto" /></div>
          ) : data.length === 0 ? (
            <div className="p-8 text-center">
              <Mail size={32} className="mx-auto text-gray-300 mb-2" />
              <p className="font-nav text-sm text-gray-400">Belum ada pesan masuk.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {data.map((item: any) => (
                <div key={item.id} className={`p-5 flex gap-4 transition-colors ${!item.is_read ? 'bg-cyan-50/40' : 'bg-white'}`}>
                  {/* Status indicator */}
                  <button onClick={() => toggleRead(item.id, item.is_read)} className="flex-shrink-0 mt-0.5">
                    {item.is_read
                      ? <CheckCircle size={18} style={{ color: '#01bcce' }} />
                      : <Circle size={18} className="text-gray-300" />
                    }
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div>
                        <p className="font-nav font-bold text-sm text-gray-800">{item.nama}</p>
                        <a href={`mailto:${item.email}`} className="font-nav text-xs text-cyan-600 hover:underline">{item.email}</a>
                      </div>
                      <div className="flex items-center gap-2">
                        {!item.is_read && (
                          <span className="px-2 py-0.5 rounded-full font-nav font-bold text-xs bg-red-100 text-red-600">Baru</span>
                        )}
                        <span className="font-nav text-xs text-gray-400">
                          {new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                    </div>
                    <p className="font-nav text-sm text-gray-600 mt-2 leading-relaxed">{item.pesan}</p>
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => toggleRead(item.id, item.is_read)}
                        className="font-nav text-xs font-bold px-3 py-1.5 rounded-lg transition-all"
                        style={{ background: item.is_read ? '#f0f4f5' : 'rgba(1,188,206,0.1)', color: item.is_read ? '#666' : '#01bcce' }}>
                        {item.is_read ? 'Tandai Belum Dibaca' : 'Tandai Sudah Dibaca'}
                      </button>
                      <a href={`mailto:${item.email}?subject=Re: Pesan dari Website RSCM`}
                        className="font-nav text-xs font-bold px-3 py-1.5 rounded-lg"
                        style={{ background: '#e8f5e9', color: '#2e7d32' }}>
                        Balas Email
                      </a>
                      <button onClick={() => handleDelete(item.id)} className="p-1.5 rounded-lg bg-red-50 text-red-400 ml-auto"><Trash2 size={14} /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
