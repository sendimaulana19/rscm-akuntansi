import { createClient } from '@/lib/supabase/server'
import React from 'react'

export const metadata = {
  title: 'Our Teams | RSCM Akuntansi',
  description: 'Kenali anggota Tim Kerja Akuntansi RSCM',
}

interface TeamMember {
  id: string
  nama: string
  jabatan: string
  foto_url?: string
  urutan?: number
}

function MemberNode({ member, isTopLevel = false }: { member?: TeamMember, isTopLevel?: boolean }) {
  if (!member) return null

  return (
    <div className="flex flex-col items-center text-center px-2 z-10 relative">
      <div
        className={`mb-3.5 flex-shrink-0 transition-transform duration-300 hover:scale-105 ${
          isTopLevel
            ? 'w-40 h-40 sm:w-48 sm:h-48 md:w-56 md:h-56'
            : 'w-28 h-28 sm:w-36 sm:h-36 md:w-44 md:h-44'
        }`}
      >
        {member.foto_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={member.foto_url}
            alt={member.nama}
            className="w-full h-full object-contain drop-shadow-[0_10px_20px_rgba(0,40,43,0.15)]"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center text-4xl font-bold rounded-2xl shadow-md"
            style={{ background: 'linear-gradient(135deg, #00282b, #015a61)' }}
          >
            <span className="text-white">
              {member.nama.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </div>

      <h3
        className={`font-extrabold whitespace-nowrap tracking-tight ${
          isTopLevel ? 'text-lg md:text-xl' : 'text-xs sm:text-sm md:text-sm'
        }`}
        style={{ color: '#00282b', fontFamily: 'Nunito, sans-serif' }}
      >
        {member.nama}
      </h3>

      <div
        className="mt-2 px-3.5 py-1 rounded-full text-[11px] md:text-xs font-bold whitespace-nowrap shadow-sm"
        style={{
          background: 'linear-gradient(135deg, #00282b, #015a61)',
          color: '#d0db41',
          fontFamily: 'Nunito, sans-serif',
          lineHeight: '1.3',
        }}
      >
        {member.jabatan.split('|')[0]}
      </div>
    </div>
  )
}

function SubTeamGroup({ title, members, keywords }: { title: string; members: TeamMember[]; keywords: string[] }) {
  // Filter members matching this sub-team keywords
  const teamMembers = members.filter((m) =>
    keywords.some((k) => m.jabatan.toLowerCase().includes(k))
  )

  // Identify roles
  const asisten = teamMembers.find((m) => m.jabatan.toLowerCase().includes('asisten'))
  const leaders = teamMembers.filter((m) => m.jabatan.toLowerCase().includes('leader'))
  const staffs = teamMembers.filter(
    (m) =>
      m.jabatan.toLowerCase().includes('staff') ||
      m.jabatan.toLowerCase().includes('staf') ||
      m.jabatan.toLowerCase().includes('pelaksana')
  )

  // Split leaders to left and right: if odd or 1, extra/first goes to the left side, then right
  const leftLeadersCount = Math.ceil(leaders.length / 2)
  const leftLeaders = leaders.slice(0, leftLeadersCount)
  const rightLeaders = leaders.slice(leftLeadersCount)

  return (
    <div className="flex flex-col items-center bg-white rounded-[2rem] p-6 md:p-8 shadow-[0_10px_40px_rgba(0,0,0,0.04)] border border-gray-100 h-full relative overflow-hidden">
      {/* Decorative background accent */}
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#00282b] to-[#01bcce]"></div>

      <h2
        className="text-lg md:text-xl font-black mb-10 text-center tracking-wide"
        style={{ color: '#00282b', fontFamily: 'Nunito, sans-serif' }}
      >
        {title}
      </h2>

      {/* Management Level (Asisten & Leaders) */}
      {asisten ? (
        <div className="flex flex-col md:flex-row justify-center items-center md:items-start gap-8 md:gap-8 lg:gap-12 w-full mb-10 relative">
          {/* Left Leaders */}
          <div
            className={`flex-1 flex flex-col items-center gap-6 mt-0 md:mt-16 order-2 md:order-1 ${
              leftLeaders.length === 0 ? 'hidden md:flex invisible pointer-events-none' : ''
            }`}
          >
            {leftLeaders.map((l) => (
              <MemberNode key={l.id} member={l} />
            ))}
          </div>

          {/* Center: Asisten Manajer */}
          <div className="flex-shrink-0 flex justify-center z-10 px-4 order-1 md:order-2 mb-6 md:mb-0">
            <MemberNode member={asisten} isTopLevel={false} />
          </div>

          {/* Right Leaders */}
          <div
            className={`flex-1 flex flex-col items-center gap-6 mt-0 md:mt-16 order-3 ${
              rightLeaders.length === 0 ? 'hidden md:flex invisible pointer-events-none' : ''
            }`}
          >
            {rightLeaders.map((l) => (
              <MemberNode key={l.id} member={l} />
            ))}
          </div>
        </div>
      ) : leaders.length > 0 ? (
        <div className="flex flex-wrap justify-center items-center gap-8 w-full mb-10 relative">
          {leaders.map((l) => (
            <MemberNode key={l.id} member={l} />
          ))}
        </div>
      ) : null}

      {/* Level 3: Staffs */}
      {staffs.length > 0 && (
        <div className="w-full mt-auto pt-8 border-t-2 border-gray-100 border-dashed relative">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white px-4 text-[10px] text-gray-400 font-black tracking-widest uppercase rounded-full">
            Anggota Tim
          </div>
          <div className="flex flex-wrap justify-center gap-x-6 sm:gap-x-10 gap-y-8 mt-4">
            {staffs.map((staff) => (
              <div key={staff.id} className="min-w-[200px] sm:min-w-[230px] flex justify-center px-2">
                <MemberNode member={staff} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default async function OurTeamsPage() {
  let members: TeamMember[] = []
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('our_teams')
      .select('id, nama, jabatan, foto_url, urutan')
      .order('urutan', { ascending: true })

    if (error) {
      console.error('Error fetching our_teams:', error)
    } else {
      members = data ?? []
    }
  } catch (err) {
    console.warn('Network issue fetching our_teams:', err)
  }

  // Identify Core Management
  const manager = members.find(
    (m) =>
      m.jabatan.toLowerCase().includes('manajer') &&
      !m.jabatan.toLowerCase().includes('asisten') &&
      !m.jabatan.toLowerCase().includes('sub')
  )
  const secretary = members.find(
    (m) => m.jabatan.toLowerCase().includes('sekertaris') || m.jabatan.toLowerCase().includes('sekretaris')
  )

  // Identify Others
  const getSubTeam = (keywords: string[]) => members.filter((m) => keywords.some(k => m.jabatan.toLowerCase().includes(k)))
  const keuangan = getSubTeam(['keuangan'])
  const manajemen = getSubTeam(['manajemen'])
  const verifikasi = getSubTeam(['verifikasi'])

  const categorizedIds = [
    ...(manager ? [manager] : []),
    ...(secretary ? [secretary] : []),
    ...keuangan,
    ...manajemen,
    ...verifikasi
  ].map((m) => m.id)

  const others = members.filter((m) => !categorizedIds.includes(m.id))

  return (
    <main
      className="min-h-screen"
      style={{ fontFamily: '"TeX Gyre Bonum", Georgia, serif', background: '#f4f6f8' }}
    >
      {/* ═══════ HERO ═══════ */}
      <div
        style={{
          position: 'relative',
          height: 200,
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
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: 'rgba(208,219,65,.15)',
                border: '1px solid rgba(208,219,65,.3)',
                borderRadius: 20,
                padding: '4px 12px',
                marginBottom: 8,
              }}
            >
              <span
                style={{ width: 6, height: 6, borderRadius: '50%', background: '#d0db41', display: 'inline-block' }}
              />
              <span
                style={{
                  fontFamily: 'Nunito, sans-serif',
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: 2,
                  textTransform: 'uppercase',
                  color: '#d0db41',
                }}
              >
                Profil Pegawai
              </span>
            </div>
            <h1
              style={{
                fontSize: 36,
                fontWeight: 900,
                color: '#fff',
                lineHeight: 1.1,
                margin: 0,
                fontFamily: 'Nunito, sans-serif',
              }}
            >
              Our Teams
            </h1>
            <p style={{ fontFamily: 'Nunito, sans-serif', color: '#7dd3da', fontSize: 14, marginTop: 6 }}>
              Kenali para profesional di balik Tim Kerja Akuntansi RSCM
            </p>
            <div style={{ width: 50, height: 3.5, background: '#d0db41', borderRadius: 2, marginTop: 10 }} />
          </div>
        </div>
      </div>

      {/* ═══════ ORG CHART CONTENT ═══════ */}
      <div className="max-w-[1400px] mx-auto px-4 pt-10 pb-16 md:pt-12 md:pb-20 relative">
        {/* Watermark Ornamen Latar Belakang Konten */}
        <img
          src="/ornament-side.png"
          alt=""
          className="absolute -left-10 top-36 w-44 md:w-56 h-auto pointer-events-none select-none z-0 opacity-[0.04]"
        />
        <img
          src="/ornament-mandala.png"
          alt=""
          className="absolute -right-20 top-1/3 w-80 md:w-96 h-auto pointer-events-none select-none z-0 opacity-[0.04]"
        />
        <img
          src="/ornament-mandala.png"
          alt=""
          className="absolute -left-16 bottom-20 w-72 md:w-80 h-auto pointer-events-none select-none z-0 opacity-[0.03]"
        />

        {members.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">👥</div>
            <p className="text-gray-500 text-xl">Data tim belum tersedia.</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            
            {/* Level 1: Manajer */}
            {manager && (
              <div className="flex flex-col items-center relative z-20 mb-8 md:mb-12">
                <MemberNode member={manager} isTopLevel={true} />
              </div>
            )}

            {/* Level 2: Sekretaris */}
            {secretary && (
              <div className="flex flex-col items-center relative z-20 mb-8 md:mb-16">
                <MemberNode member={secretary} isTopLevel={false} />
              </div>
            )}

            {/* Sub Teams (Level 3 & below) */}
            <div className="w-full max-w-5xl mx-auto flex flex-col gap-12 relative z-10 mt-4">
              <SubTeamGroup title="Sub Tim Akuntansi Keuangan" members={members} keywords={['keuangan']} />
              <SubTeamGroup title="Sub Tim Akuntansi Manajemen" members={members} keywords={['manajemen']} />
              <SubTeamGroup title="Sub Tim Akuntansi Verifikasi" members={members} keywords={['verifikasi']} />
            </div>

            {/* Others (Level 4 / Uncategorized) */}
            {others.length > 0 && (
              <div className="w-full max-w-5xl mx-auto flex flex-col items-center mt-16 pt-12 border-t-2 border-gray-100 border-dashed">
                <div className="bg-white px-6 py-2 text-xs text-gray-400 font-black tracking-widest uppercase rounded-full shadow-sm border border-gray-100 mb-8 -mt-16">
                  Anggota Lainnya
                </div>
                <div className="flex flex-wrap justify-center gap-x-6 sm:gap-x-10 gap-y-12">
                  {others.map((other) => (
                    <div key={other.id} className="min-w-[200px] sm:min-w-[230px] flex justify-center px-2">
                      <MemberNode member={other} />
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </main>
  )
}
