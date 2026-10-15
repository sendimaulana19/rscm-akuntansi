'use client'
import { useEffect, useState } from 'react'

export default function AnimatedNumber({ value }: { value: number | null }) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (value == null || value === 0) {
      setCount(value ?? 0)
      return
    }

    let start = 0
    const duration = 1500 // 1.5 seconds
    const frameRate = 1000 / 60
    const totalFrames = Math.round(duration / frameRate)
    let frame = 0

    const counter = setInterval(() => {
      frame++
      const progress = frame / totalFrames
      // Ease out quad
      const currentCount = Math.round(value * (progress * (2 - progress)))
      
      setCount(currentCount)

      if (frame === totalFrames) {
        clearInterval(counter)
        setCount(value)
      }
    }, frameRate)

    return () => clearInterval(counter)
  }, [value])

  if (value == null) return <>-</>

  return <>{count.toLocaleString('id-ID')}</>
}
