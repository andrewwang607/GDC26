function Pulse({ className }) {
  return <div className={`bg-[#e9e1d8] rounded animate-pulse ${className}`} />
}

export default function SkeletonDashboard() {
  return (
    <div>
      {/* Alert banner skeleton */}
      <Pulse className="h-16 rounded-none" />

      <div className="p-4 sm:p-6 space-y-8">
        {/* Crop selector skeleton */}
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Pulse key={i} className="h-9 w-20 rounded-full" />
          ))}
        </div>

        {/* Signal cards skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="bg-white border border-[#d1c5b4] rounded-2xl p-5 space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Pulse className="h-9 w-9 rounded-xl" />
                  <Pulse className="h-4 w-28" />
                </div>
                <Pulse className="h-6 w-16 rounded-full" />
              </div>
              <Pulse className="h-11 w-1/2" />
              <Pulse className="h-2 w-full rounded-full" />
              <div className="pt-4 border-t border-[#e9e1d8] grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Pulse className="h-3 w-12" />
                  <Pulse className="h-4 w-20" />
                </div>
                <div className="space-y-1.5">
                  <Pulse className="h-3 w-12" />
                  <Pulse className="h-4 w-20" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Actions panel skeleton */}
        <div className="bg-white border border-[#d1c5b4] rounded-2xl p-6 space-y-5">
          <Pulse className="h-6 w-56" />
          <div className="space-y-2">
            <Pulse className="h-4 w-full" />
            <Pulse className="h-4 w-5/6" />
            <Pulse className="h-4 w-4/6" />
          </div>
          <div className="space-y-4 pt-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-4 items-start">
                <Pulse className="h-7 w-7 rounded-full flex-shrink-0" />
                <Pulse className="h-5 flex-grow" />
              </div>
            ))}
          </div>
        </div>

        {/* Status message */}
        <p
          className="text-center text-[#7f7667] text-sm pb-2"
          style={{ fontFamily: 'Manrope, sans-serif' }}
        >
          <span className="material-symbols-outlined align-middle mr-1.5 text-[16px]">
            satellite_alt
          </span>
          Fetching satellite data — this typically takes 10–20 seconds
        </p>
      </div>
    </div>
  )
}
