const SIGNAL_META = {
  soil_moisture: { label: 'Soil Moisture', icon: 'water_drop', unit: 'm³/m³' },
  rainfall: { label: 'Rainfall', icon: 'rainy', unit: 'mm' },
  ndvi: { label: 'Vegetation Health', icon: 'nature', unit: 'Index' },
}

const LEVEL_STYLES = {
  normal: {
    bar: '#689f38',
    badge: { bg: 'rgba(104,159,56,0.12)', color: '#3a6022' },
    label: 'Normal',
  },
  watch: {
    bar: '#c5a059',
    badge: { bg: 'rgba(197,160,89,0.15)', color: '#7a5c00' },
    label: 'Watch',
  },
  act_now: {
    bar: '#ba1a1a',
    badge: { bg: '#ffdad6', color: '#93000a' },
    label: 'Act Now',
  },
  unknown: {
    bar: '#b9afa1',
    badge: { bg: '#f5ede4', color: '#6f6557' },
    label: 'No Data',
  },
}

export default function SignalCard({ signal, data }) {
  const meta = SIGNAL_META[signal]
  const hasPct = data?.pct_of_normal != null
  const level = data?.level ?? 'unknown'
  const styles = LEVEL_STYLES[level] ?? LEVEL_STYLES.unknown
  const pct = hasPct ? data.pct_of_normal : null
  const barWidth = `${Math.min(Math.max(pct ?? 0, 0), 100)}%`
  const hasMetricData = data?.current != null || data?.historical_mean != null

  return (
    <div className="bg-white border border-[#d1c5b4] rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="bg-[#f5ede4] p-2 rounded-xl">
            <span className="material-symbols-outlined text-[#775a19]" style={{ fontSize: '20px' }}>
              {meta.icon}
            </span>
          </div>
          <span
            className="text-[#1e1b16] font-semibold text-sm leading-tight"
            style={{ fontFamily: '"Space Grotesk", sans-serif' }}
          >
            {meta.label}
          </span>
        </div>
        <span
          className="text-xs font-bold uppercase tracking-wide px-2.5 py-1 rounded-full flex-shrink-0"
          style={{
            fontFamily: 'Manrope, sans-serif',
            letterSpacing: '0.06em',
            background: styles.badge.bg,
            color: styles.badge.color,
          }}
        >
          {styles.label}
        </span>
      </div>

      {/* Percentage */}
      <div className="mb-1">
        <div className="flex items-end justify-between mb-2">
          <span
            className="text-[#1e1b16] leading-none"
            style={{ fontFamily: '"Space Grotesk", sans-serif', fontSize: '42px', fontWeight: 700 }}
          >
            {hasPct ? (
              <>
                {Math.round(pct)}
                <span
                  className="text-[#4e4639] ml-0.5"
                  style={{ fontSize: '20px', fontWeight: 400 }}
                >
                  %
                </span>
              </>
            ) : (
              <span className="text-[28px] text-[#7f7667]">—</span>
            )}
          </span>
          <span
            className="text-[#7f7667] text-xs pb-1"
            style={{ fontFamily: 'Manrope, sans-serif' }}
          >
            {hasPct ? 'of normal' : 'data unavailable'}
          </span>
        </div>
        {/* Bar */}
        <div className="h-2 bg-[#e9e1d8] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: barWidth, background: styles.bar }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-[#e9e1d8]">
        <div>
          <span
            className="block text-[10px] uppercase tracking-widest text-[#7f7667] mb-0.5"
            style={{ fontFamily: 'Manrope, sans-serif', letterSpacing: '0.1em' }}
          >
            Current
          </span>
          <span
            className="text-[#1e1b16] font-semibold text-sm"
            style={{ fontFamily: 'Manrope, sans-serif' }}
          >
            {data?.current != null ? data.current.toFixed(2) : '—'}{' '}
            <span className="text-[#7f7667] font-normal">{meta.unit}</span>
          </span>
        </div>
        <div>
          <span
            className="block text-[10px] uppercase tracking-widest text-[#7f7667] mb-0.5"
            style={{ fontFamily: 'Manrope, sans-serif', letterSpacing: '0.1em' }}
          >
            5-yr avg
          </span>
          <span
            className="text-[#1e1b16] font-semibold text-sm"
            style={{ fontFamily: 'Manrope, sans-serif' }}
          >
            {data?.historical_mean != null ? data.historical_mean.toFixed(2) : '—'}{' '}
            <span className="text-[#7f7667] font-normal">{meta.unit}</span>
          </span>
        </div>
      </div>

      {!hasMetricData && (
        <p
          className="mt-4 text-xs text-[#7f7667]"
          style={{ fontFamily: 'Manrope, sans-serif' }}
        >
          This dataset did not return usable values for the current request window.
        </p>
      )}
    </div>
  )
}
