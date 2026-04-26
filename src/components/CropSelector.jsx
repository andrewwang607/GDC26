const CROPS = [
  { id: 'wheat', label: 'Wheat', icon: 'grass' },
  { id: 'maize', label: 'Maize', icon: 'eco' },
  { id: 'sorghum', label: 'Sorghum', icon: 'grain' },
  { id: 'cotton', label: 'Cotton', icon: 'local_florist' },
  { id: 'rice', label: 'Rice', icon: 'rice_bowl' },
]

export default function CropSelector({ selected, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {CROPS.map(({ id, label, icon }) => {
        const isActive = selected === id
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold capitalize border transition-all duration-150 active:scale-95 ${
              isActive
                ? 'bg-[#775a19] text-white border-[#775a19] shadow-sm'
                : 'bg-white text-[#4e4639] border-[#d1c5b4] hover:border-[#775a19] hover:text-[#775a19]'
            }`}
            style={{ fontFamily: 'Manrope, sans-serif' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
              {icon}
            </span>
            {label}
          </button>
        )
      })}
    </div>
  )
}
