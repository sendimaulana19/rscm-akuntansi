'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Trash2, Plus, HelpCircle } from 'lucide-react'
import dynamic from 'next/dynamic'
import 'react-quill-new/dist/quill.snow.css'

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false })

interface FAQ {
  id: string
  pertanyaan: string
  jawaban: string
}

export default function AdminFAQPage() {
  const supabase = createClient()
  const [data, setData] = useState<FAQ[]>([])
  const [pertanyaan, setPertanyaan] = useState('')
  const [jawaban, setJawaban] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const { data: faqData, error } = await supabase
      .from('faq')
      .select('id, pertanyaan, jawaban')
      .order('created_at', { ascending: false })
      
    if (!error && faqData) {
      setData(faqData)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pertanyaan || !jawaban || jawaban === '<p><br></p>') {
      setMessage({ type: 'error', text: 'Pertanyaan dan Jawaban wajib diisi.' })
      return
    }
    
    setLoading(true)
    setMessage(null)

    const { error } = await supabase
      .from('faq')
      .insert({ pertanyaan, jawaban })

    setLoading(false)

    if (error) {
      setMessage({ type: 'error', text: 'Gagal menyimpan data: ' + error.message })
    } else {
      setMessage({ type: 'success', text: 'FAQ berhasil ditambahkan!' })
      setPertanyaan('')
      setJawaban('')
      fetchData()
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus FAQ ini?')) return

    const { error } = await supabase.from('faq').delete().eq('id', id)
    if (error) {
      alert('Gagal menghapus: ' + error.message)
    } else {
      fetchData()
    }
  }

  // Toolbar options for ReactQuill
  const modules = {
    toolbar: [
      ['bold', 'italic', 'underline'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['clean']
    ],
  }

  return (
    <div className="min-h-screen" style={{ background: '#f0f4f5' }}>
      <div style={{ background: '#00282b' }} className="px-6 py-6">
        <div className="max-w-4xl mx-auto">
          <p className="font-nav text-xs text-white/50 mb-1">
            <Link href="/admin/dashboard" className="hover:text-white">← Dashboard</Link>
          </p>
          <h1 className="font-nav font-bold text-white text-xl flex items-center gap-2">
            <HelpCircle size={24} /> Kelola FAQ (Frequently Asked Questions)
          </h1>
        </div>
      </div>
      
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* Form Tambah FAQ */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-nav font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Plus size={18} style={{ color: '#01bcce' }} /> Tambah FAQ Baru
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="font-nav text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Pertanyaan</label>
              <input 
                type="text" 
                value={pertanyaan} 
                onChange={e => setPertanyaan(e.target.value)} 
                placeholder="Contoh: Bagaimana cara mengajukan permintaan data?" 
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 font-nav text-sm outline-none" 
              />
            </div>
            
            <div className="pb-12">
              <label className="font-nav text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Jawaban</label>
              <div className="bg-white rounded-xl overflow-hidden border border-gray-200" style={{ minHeight: '200px' }}>
                <ReactQuill 
                  theme="snow" 
                  value={jawaban} 
                  onChange={setJawaban} 
                  modules={modules}
                  style={{ height: '160px' }}
                />
              </div>
            </div>
            
            <div className="flex items-center gap-4 pt-2">
              <button 
                type="submit" 
                disabled={loading} 
                className="bg-[#01bcce] text-[#00282b] font-nav font-bold text-sm px-6 py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {loading ? 'Menyimpan...' : 'Simpan FAQ'}
              </button>
              {message && (
                <span className={`font-nav text-sm font-semibold ${message.type === 'error' ? 'text-red-500' : 'text-green-600'}`}>
                  {message.text}
                </span>
              )}
            </div>
          </form>
        </div>

        {/* Daftar FAQ */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-nav font-bold text-gray-800 mb-4">Daftar FAQ</h2>
          
          {data.length === 0 ? (
            <div className="text-center py-8 text-gray-400 font-nav text-sm border-t border-gray-100">
              Belum ada FAQ yang ditambahkan.
            </div>
          ) : (
            <div className="space-y-4">
              {data.map((item) => (
                <div key={item.id} className="border border-gray-100 rounded-xl p-4 hover:border-[#cce8ea] transition-colors relative group">
                  <h3 className="font-nav font-bold text-[#00282b] text-base mb-2 pr-10">Q: {item.pertanyaan}</h3>
                  <div 
                    className="prose prose-sm max-w-none text-gray-600"
                    dangerouslySetInnerHTML={{ __html: item.jawaban }}
                  />
                  <button 
                    onClick={() => handleDelete(item.id)} 
                    className="absolute top-4 right-4 p-2 text-red-500 bg-red-50 rounded-lg hover:bg-red-500 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                    title="Hapus FAQ"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
