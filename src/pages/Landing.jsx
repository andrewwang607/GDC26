import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Landing() {
  const navigate = useNavigate()
  const [locating, setLocating] = useState(false)
  const [toast, setToast] = useState(null)

  function handleLocate() {
    setLocating(true)
    if (!navigator.geolocation) {
      navigate('/dashboard?lat=34.52&lon=69.18')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        navigate(`/dashboard?lat=${pos.coords.latitude.toFixed(5)}&lon=${pos.coords.longitude.toFixed(5)}`)
      },
      () => {
        setLocating(false)
        setToast('Location unavailable — defaulting to Kabul, Afghanistan.')
        setTimeout(() => navigate('/dashboard?lat=34.52&lon=69.18'), 2000)
      },
      { timeout: 10000 },
    )
  }

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      {/* Desertification backdrop: green (lush) → sand/arid (right) */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            linear-gradient(
              105deg,
              #1a4a10 0%,
              #2d6a1f 12%,
              #4a7a25 22%,
              #7a8a30 35%,
              #a08a35 48%,
              #c5a059 62%,
              #d4956a 75%,
              #c47a4a 88%,
              #b06030 100%
            )
          `,
        }}
      />
      {/* Subtle texture overlay */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />
      {/* Dark vignette to lift text */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.45) 100%)',
        }}
      />

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-xl w-full">
        <div className="flex items-center justify-center gap-3 mb-8">
          <span
            className="material-symbols-outlined fill-icon text-[#e9c176]"
            style={{ fontSize: '52px' }}
          >
            monitoring
          </span>
        </div>

        <h1
          className="text-white mb-4 tracking-tight leading-none drop-shadow-lg"
          style={{
            fontFamily: '"Space Grotesk", sans-serif',
            fontSize: 'clamp(48px, 10vw, 80px)',
            fontWeight: 700,
            letterSpacing: '-0.02em',
          }}
        >
          DroughtWatch
        </h1>

        <p
          className="text-white/80 mb-10 mx-auto leading-relaxed"
          style={{
            fontFamily: 'Manrope, sans-serif',
            fontSize: '18px',
            maxWidth: '420px',
          }}
        >
          Real-time agricultural drought alerts — per farm, on-demand, in English and Dari.
        </p>

        <button
          onClick={handleLocate}
          disabled={locating}
          className="inline-flex items-center gap-3 mx-auto px-10 py-4 rounded active:scale-95 transition-all duration-150 shadow-xl disabled:opacity-60"
          style={{
            background: '#e9c176',
            color: '#261900',
            fontFamily: 'Manrope, sans-serif',
            fontWeight: 700,
            fontSize: '17px',
          }}
        >
          <span
            className={`material-symbols-outlined${locating ? ' animate-spin' : ''}`}
            style={{ fontSize: '22px' }}
          >
            {locating ? 'progress_activity' : 'my_location'}
          </span>
          {locating ? 'Detecting location…' : 'Find My Location'}
        </button>

        <p
          className="mt-5 text-white/50"
          style={{ fontFamily: 'Manrope, sans-serif', fontSize: '13px' }}
        >
          Uses device GPS · Falls back to Kabul if unavailable
        </p>
      </div>

      {/* Toast notification */}
      {toast && (
        <div
          className="absolute bottom-10 left-1/2 -translate-x-1/2 px-6 py-3 rounded-xl shadow-xl text-white text-sm z-20 whitespace-nowrap"
          style={{
            background: 'rgba(38, 25, 0, 0.92)',
            fontFamily: 'Manrope, sans-serif',
            backdropFilter: 'blur(8px)',
          }}
        >
          <span className="material-symbols-outlined align-middle mr-2 text-[#e9c176]" style={{ fontSize: '16px' }}>
            info
          </span>
          {toast}
        </div>
      )}
    </div>
  )
}
