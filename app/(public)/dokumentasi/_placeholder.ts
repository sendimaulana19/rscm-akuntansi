'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/server'

interface DokumentasiItem {
  id: string
  caption?: string
  media_url: string
  media_type: 'image' | 'video'
  created_at?: string
}

// Fix: dokumentasi page.tsx is server, but we need DokumentasiClient separately
// This file is the actual server page that can't use 'use client'
// We'll recreate properly below
