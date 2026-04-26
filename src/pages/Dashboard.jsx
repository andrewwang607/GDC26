import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useAnalyze } from '../hooks/useAnalyze.js'
import AlertBanner from '../components/AlertBanner.jsx'
import SignalCard from '../components/SignalCard.jsx'
import CropSelector from '../components/CropSelector.jsx'
import ActionsPanel from '../components/ActionsPanel.jsx'
import SkeletonDashboard from '../components/SkeletonDashboard.jsx'

export default function Dashboard() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const lat = searchParams.get('lat') || '34.52'
  const lon = searchParams.get('lon') || '69.18'

  const [crop, setCrop] = useState('wheat')
  const [lang, setLang] = useState('english')

  const { data, loading, error, analyze, loadDemo } = useAnalyze()

  useEffect(() => {
    analyze({ lat, lon, crop })
  }, [lat, lon, crop, analyze])

  function handleCropChange(newCrop) {
    if (newCrop !== crop) setCrop(newCrop)
  }

  const latNum = parseFloat(lat)
  const lonNum = parseFloat(lon)

  return (
    <div className="min-h-screen bg-[#fff8f3] flex flex-col">
      {/* Header */}
      <header className="bg-[#faf7f2] border-b border-[#3e2723]/10 sticky top-0 z-50 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <span className="material-symbols-outlined fill-icon text-[#c5a059] text-[26px]">
              monitoring
            </span>
            <span
              className="text-[#3e2723] text-xl font-bold"
              style={{ fontFamily: '"Space Grotesk", sans-serif' }}
            >
              DroughtWatch
            </span>
          </button>

          <div className="flex items-center gap-3 sm:gap-4">
            <div className="hidden sm:flex items-center gap-1.5 text-[#7f7667] text-sm" style={{ fontFamily: 'Manrope, sans-serif' }}>
              <span className="material-symbols-outlined text-[16px]">location_on</span>
              <span>
                {latNum.toFixed(3)}°N, {lonNum.toFixed(3)}°E
              </span>
            </div>

            {/* Language toggle */}
            <div className="flex rounded overflow-hidden border border-[#d1c5b4]">
              <button
                onClick={() => setLang('english')}
                className={`px-3 py-1.5 text-sm font-semibold transition-colors ${
                  lang === 'english'
                    ? 'bg-[#775a19] text-white'
                    : 'text-[#4e4639] hover:bg-[#f5ede4]'
                }`}
                style={{ fontFamily: 'Manrope, sans-serif' }}
              >
                EN
              </button>
              <button
                onClick={() => setLang('dari')}
                className={`px-3 py-1.5 text-sm font-semibold transition-colors border-l border-[#d1c5b4] ${
                  lang === 'dari'
                    ? 'bg-[#775a19] text-white'
                    : 'text-[#4e4639] hover:bg-[#f5ede4]'
                }`}
                style={{ fontFamily: 'Manrope, sans-serif' }}
              >
                دری
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-grow max-w-5xl mx-auto w-full">
        {loading ? (
          <SkeletonDashboard />
        ) : error ? (
          <div className="p-4 sm:p-6 pt-8">
            <div className="bg-[#ffdad6] border border-[#ba1a1a]/20 rounded-2xl p-6 max-w-lg">
              <div className="flex items-center gap-3 mb-2">
                <span className="material-symbols-outlined fill-icon text-[#ba1a1a]">error</span>
                <span
                  className="font-semibold text-[#93000a] text-lg"
                  style={{ fontFamily: '"Space Grotesk", sans-serif' }}
                >
                  Failed to fetch data
                </span>
              </div>
              <p
                className="text-[#93000a] text-sm mb-5 leading-relaxed"
                style={{ fontFamily: 'Manrope, sans-serif' }}
              >
                {error}
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => analyze({ lat, lon, crop })}
                  className="bg-[#775a19] text-white font-bold text-sm px-5 py-2 rounded hover:bg-[#5d4201] active:scale-95 transition-all"
                  style={{ fontFamily: 'Manrope, sans-serif' }}
                >
                  Retry
                </button>
                <button
                  onClick={loadDemo}
                  className="border border-[#775a19] text-[#775a19] font-bold text-sm px-5 py-2 rounded hover:bg-[#f5ede4] active:scale-95 transition-all"
                  style={{ fontFamily: 'Manrope, sans-serif' }}
                >
                  Load Demo Data
                </button>
              </div>
            </div>
          </div>
        ) : data ? (
          <div>
            {/* Alert banner */}
            <AlertBanner level={data.alert_level} />

            <div className="p-4 sm:p-6 space-y-8">
              {/* Crop selector */}
              <section>
                <p
                  className="text-xs uppercase tracking-widest text-[#7f7667] mb-3"
                  style={{ fontFamily: 'Manrope, sans-serif', letterSpacing: '0.1em' }}
                >
                  Crop Type
                </p>
                <CropSelector selected={crop} onChange={handleCropChange} />
              </section>

              {/* Signal cards */}
              <section>
                <p
                  className="text-xs uppercase tracking-widest text-[#7f7667] mb-3"
                  style={{ fontFamily: 'Manrope, sans-serif', letterSpacing: '0.1em' }}
                >
                  Satellite Signals — 90-day window vs. 5-year baseline
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <SignalCard signal="soil_moisture" data={data.signals?.soil_moisture} />
                  <SignalCard signal="rainfall" data={data.signals?.rainfall} />
                  <SignalCard signal="ndvi" data={data.signals?.ndvi} />
                </div>
              </section>

              {/* Actions panel */}
              <section>
                <ActionsPanel data={data} lang={lang} />
              </section>
            </div>
          </div>
        ) : null}
      </main>

      {/* Footer */}
      <footer className="bg-[#3e2723]">
        <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p
            className="text-white/50 text-sm text-center sm:text-left"
            style={{ fontFamily: '"Space Grotesk", sans-serif' }}
          >
            © 2024 DroughtWatch · Humanitarian field tool for NGO workers
          </p>
          <button
            onClick={loadDemo}
            className="text-white/50 hover:text-white text-sm underline transition-colors"
            style={{ fontFamily: 'Manrope, sans-serif' }}
          >
            Load demo data
          </button>
        </div>
      </footer>
    </div>
  )
}
