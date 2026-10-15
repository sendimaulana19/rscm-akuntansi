'use client'

import { useState, FormEvent } from 'react'

interface FormState {
  nama: string
  email: string
  subjek: string
  pesan: string
}

export default function KontakPage() {
  const [form, setForm] = useState<FormState>({ nama: '', email: '', subjek: '', pesan: '' })
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!form.nama.trim() || !form.email.trim() || !form.subjek.trim() || !form.pesan.trim()) {
      setError('Semua field wajib diisi.')
      return
    }
    setError('')
    setSubmitting(true)

    try {
      // Create mailto link
      const bodyText = `Nama Pengirim: ${form.nama}\nEmail Pengirim: ${form.email}\n\nPesan:\n${form.pesan}`
      const mailtoURL = `mailto:timkerjaakuntansi@rscm.co.id?subject=${encodeURIComponent(form.subjek)}&body=${encodeURIComponent(bodyText)}`
      
      // Open email client
      window.location.href = mailtoURL
      
      setSuccess(true)
      setForm({ nama: '', email: '', subjek: '', pesan: '' })
      
      // Auto hide success message after a few seconds
      setTimeout(() => setSuccess(false), 5000)
    } catch (err) {
      console.error('Error opening mail client:', err)
      setError('Terjadi kesalahan saat mencoba membuka aplikasi email Anda.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main style={{ minHeight: '100vh', fontFamily: '"TeX Gyre Bonum", Georgia, serif', background: '#f4f6f8' }}>
      
      {/* ═══════ HERO ═══════ */}
      <div style={{
        position: 'relative', height: 320,
        background: 'linear-gradient(135deg, #00282b 0%, #015a61 100%)',
        overflow: 'hidden',
      }}>
        {/* Watermark Ornamen Mandala (Kanan Atas) */}
        <img
          src="/ornament-mandala.png"
          alt=""
          className="absolute -top-10 -right-10 w-48 h-48 object-contain pointer-events-none select-none z-0"
          style={{ opacity: 0.15 }}
        />

        {/* Watermark Ornamen Sisi Kiri */}
        <img
          src="/ornament-side.png"
          alt=""
          className="absolute -left-6 sm:-left-8 top-0 bottom-0 h-full w-32 sm:w-44 object-cover object-left pointer-events-none select-none z-0 opacity-[0.08]"
          style={{ filter: 'brightness(0) invert(1)' }}
        />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 1140, margin: '0 auto', padding: '0 24px', height: '100%', display: 'flex', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(208,219,65,.15)', border: '1px solid rgba(208,219,65,.3)', borderRadius: 20, padding: '5px 14px', marginBottom: 14 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#d0db41', display: 'inline-block' }} />
              <span style={{ fontFamily: 'Nunito, sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: '#d0db41' }}>Hubungi Kami</span>
            </div>
            <h1 style={{ fontSize: 48, fontWeight: 900, color: '#fff', lineHeight: 1.1, margin: 0, fontFamily: 'Nunito, sans-serif' }}>Kontak Kami</h1>
            <p style={{ fontFamily: 'Nunito, sans-serif', color: '#7dd3da', fontSize: 16, marginTop: 12 }}>Hubungi Tim Kerja Akuntansi RSCM — kami siap membantu Anda</p>
            <div style={{ width: 70, height: 4, background: '#d0db41', borderRadius: 2, marginTop: 16 }} />
          </div>
        </div>
      </div>

      {/* ═══════ CONTENT SECTION ═══════ */}
      <div style={{ background: '#d0db41', paddingBottom: 64, flex: 1 }}>
        <div style={{ maxWidth: 1140, margin: '0 auto', padding: '0 24px' }}>
          
          {/* Floating container */}
          <div style={{
            background: '#fff', borderRadius: 24, padding: '48px 40px',
            boxShadow: '0 12px 48px rgba(0,40,43,.15)', border: '1px solid rgba(0,0,0,.04)',
            position: 'relative', top: -50,
          }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
              
              {/* Left Side: Contact Info & Map */}
              <div className="space-y-12">
                <div>
                  <h2 className="text-2xl font-bold mb-8" style={{ color: '#00282b', fontFamily: 'Nunito, sans-serif' }}>
                    Informasi Kontak
                  </h2>

                  <div className="flex items-start gap-5" style={{ marginBottom: '40px' }}>
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md" style={{ background: 'linear-gradient(135deg, #00282b, #015a61)' }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#d0db41" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                    </div>
                    <div className="pt-1">
                      <p className="text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: '#01bcce', fontFamily: 'Nunito, sans-serif' }}>Email</p>
                      <a href="mailto:timkerjaakuntansi@rscm.co.id" className="font-semibold text-base hover:underline" style={{ color: '#00282b', fontFamily: 'Nunito, sans-serif' }}>
                        timkerjaakuntansi@rscm.co.id
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-5">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md" style={{ background: 'linear-gradient(135deg, #00282b, #015a61)' }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#d0db41" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                    </div>
                    <div className="pt-1">
                      <p className="text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: '#01bcce', fontFamily: 'Nunito, sans-serif' }}>Alamat</p>
                      <p className="text-sm leading-relaxed" style={{ color: '#555' }}>
                        Gedung Administrasi Lantai 4<br />
                        Jl. Kimia No.11, RT.5/RW.1, Pegangsaan,<br />
                        Kec. Menteng, Kota Jakarta Pusat,<br />
                        DKI Jakarta 10330
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl overflow-hidden shadow-md" style={{ border: '1px solid #eee', marginTop: '64px' }}>
                  <iframe
                    src="https://maps.google.com/maps?q=RSUP%20Nasional%20Dr.%20Cipto%20Mangunkusumo&t=&z=16&ie=UTF8&iwloc=&output=embed"
                    width="100%"
                    height="260"
                    style={{ border: 0, display: 'block' }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Lokasi RSCM"
                  />
                </div>
              </div>

              {/* Right Side: Contact Form */}
              <div className="md:pl-6">
                <h2 className="text-2xl font-bold mb-8" style={{ color: '#00282b', fontFamily: 'Nunito, sans-serif' }}>
                  Kirim Pesan Email
                </h2>
                
                {success ? (
                  <div className="rounded-2xl p-8 text-center shadow-sm" style={{ background: '#f0f9ed', border: '1px solid #7bc67a' }}>
                    <div className="text-6xl mb-4">✅</div>
                    <p className="font-bold text-xl" style={{ color: '#2a7a2a', fontFamily: 'Nunito, sans-serif' }}>Aplikasi Email Dibuka!</p>
                    <p className="text-sm text-gray-600 mt-2">Silakan periksa aplikasi email Anda (seperti Outlook/Gmail) untuk mengirimkan pesan ini secara langsung.</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <label className="block text-sm font-semibold mb-2" style={{ color: '#00282b', fontFamily: 'Nunito, sans-serif' }}>
                        Nama Lengkap <span style={{ color: '#e53e3e' }}>*</span>
                      </label>
                      <input type="text" value={form.nama} onChange={(e) => setForm(p => ({...p, nama: e.target.value}))} placeholder="Masukkan nama Anda" className="w-full rounded-xl px-5 py-3.5 border focus:outline-none focus:ring-2 text-sm transition" style={{ borderColor: '#e2e8f0', backgroundColor: '#f8fafc', color: '#333' }} required />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2" style={{ color: '#00282b', fontFamily: 'Nunito, sans-serif' }}>
                        Email <span style={{ color: '#e53e3e' }}>*</span>
                      </label>
                      <input type="email" value={form.email} onChange={(e) => setForm(p => ({...p, email: e.target.value}))} placeholder="contoh@email.com" className="w-full rounded-xl px-5 py-3.5 border focus:outline-none focus:ring-2 text-sm transition" style={{ borderColor: '#e2e8f0', backgroundColor: '#f8fafc', color: '#333' }} required />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2" style={{ color: '#00282b', fontFamily: 'Nunito, sans-serif' }}>
                        Subjek Pesan <span style={{ color: '#e53e3e' }}>*</span>
                      </label>
                      <input type="text" value={form.subjek} onChange={(e) => setForm(p => ({...p, subjek: e.target.value}))} placeholder="Misal: Pertanyaan terkait Verifikasi" className="w-full rounded-xl px-5 py-3.5 border focus:outline-none focus:ring-2 text-sm transition" style={{ borderColor: '#e2e8f0', backgroundColor: '#f8fafc', color: '#333' }} required />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2" style={{ color: '#00282b', fontFamily: 'Nunito, sans-serif' }}>
                        Pesan <span style={{ color: '#e53e3e' }}>*</span>
                      </label>
                      <textarea value={form.pesan} onChange={(e) => setForm(p => ({...p, pesan: e.target.value}))} placeholder="Tulis pesan Anda di sini..." rows={6} className="w-full rounded-xl px-5 py-3.5 border focus:outline-none focus:ring-2 text-sm resize-none transition" style={{ borderColor: '#e2e8f0', backgroundColor: '#f8fafc', color: '#333' }} required />
                    </div>
                    {error && <p className="text-red-500 text-sm font-medium">{error}</p>}
                    <button type="submit" disabled={submitting} className="w-full font-bold py-4 rounded-xl transition-all duration-200 hover:opacity-90 hover:shadow-lg disabled:opacity-70 flex items-center justify-center gap-2 mt-4" style={{ background: submitting ? '#ccc' : 'linear-gradient(135deg, #00282b, #015a61)', color: '#d0db41', fontFamily: 'Nunito, sans-serif', fontSize: 16 }}>
                      {submitting ? (
                        <><span className="inline-block w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" /> Membuka Email...</>
                      ) : (
                        <>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
                          Kirim ke Tim Kerja Akuntansi RSCM
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
