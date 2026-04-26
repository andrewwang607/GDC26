const CONFIGS = {
  normal: {
    bg: '#689f38',
    text: '#ffffff',
    icon: 'check_circle',
    label: 'ALL CLEAR',
    desc: 'Conditions are within normal range. Continue standard farm practices.',
  },
  watch: {
    bg: '#c5a059',
    text: '#261900',
    icon: 'warning',
    label: 'WATCH',
    desc: 'Conditions are below normal. Monitor closely and prepare contingency measures.',
  },
  act_now: {
    bg: '#ba1a1a',
    text: '#ffffff',
    icon: 'emergency',
    label: 'ACT NOW',
    desc: 'Critical drought conditions detected. Immediate action is required.',
  },
  unknown: {
    bg: '#8a6a1f',
    text: '#fffaf1',
    icon: 'hourglass_top',
    label: 'DATA DELAY',
    desc: 'Some live datasets were unavailable or delayed, so this view may be incomplete.',
  },
}

export default function AlertBanner({ level }) {
  const cfg = CONFIGS[level] ?? CONFIGS.unknown

  return (
    <div
      className="w-full px-4 sm:px-6 py-4 flex items-center gap-4"
      style={{ background: cfg.bg, color: cfg.text }}
    >
      <span
        className="material-symbols-outlined fill-icon flex-shrink-0"
        style={{ fontSize: '32px' }}
      >
        {cfg.icon}
      </span>
      <div className="min-w-0">
        <span
          className="font-bold tracking-widest mr-3 text-base"
          style={{ fontFamily: '"Space Grotesk", sans-serif', letterSpacing: '0.12em' }}
        >
          {cfg.label}
        </span>
        <span
          className="text-sm opacity-90 leading-snug"
          style={{ fontFamily: 'Manrope, sans-serif' }}
        >
          {cfg.desc}
        </span>
      </div>
    </div>
  )
}
