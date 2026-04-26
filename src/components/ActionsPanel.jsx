export default function ActionsPanel({ data, lang }) {
  const isRtl = lang === 'dari'
  const explanation = isRtl ? data?.dari_explanation : data?.english_explanation
  const actions = isRtl ? data?.dari_actions : data?.english_actions

  return (
    <div className="bg-white border border-[#d1c5b4] rounded-2xl p-6 shadow-sm">
      <h2
        className="text-[#1e1b16] mb-5"
        style={{
          fontFamily: '"Space Grotesk", sans-serif',
          fontSize: '20px',
          fontWeight: 600,
        }}
      >
        {isRtl ? 'توضیحات و اقدامات' : 'Explanation & Recommended Actions'}
      </h2>

      {explanation && (
        <p
          className="text-[#4e4639] mb-6 leading-relaxed"
          dir={isRtl ? 'rtl' : undefined}
          style={{ fontFamily: 'Manrope, sans-serif', fontSize: '16px', lineHeight: '1.7' }}
        >
          {explanation}
        </p>
      )}

      {actions && actions.length > 0 && (
        <ol
          className="space-y-4"
          dir={isRtl ? 'rtl' : undefined}
        >
          {actions.map((action, i) => (
            <li key={i} className="flex gap-4 items-start">
              <span
                className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-white text-sm font-bold"
                style={{
                  background: '#775a19',
                  fontFamily: '"Space Grotesk", sans-serif',
                  minWidth: '28px',
                }}
              >
                {i + 1}
              </span>
              <p
                className="text-[#1e1b16] leading-relaxed pt-0.5"
                style={{ fontFamily: 'Manrope, sans-serif', fontSize: '15px' }}
              >
                {action}
              </p>
            </li>
          ))}
        </ol>
      )}

      {!explanation && !actions && (
        <p
          className="text-[#7f7667] text-sm italic"
          style={{ fontFamily: 'Manrope, sans-serif' }}
        >
          No recommendations available.
        </p>
      )}
    </div>
  )
}
