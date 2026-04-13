export default function Loading() {
  return (
    <div className="p-6">
      <div className="animate-pulse space-y-4">
        <div className="h-7 bg-gray-200 rounded w-40" />
        <div className="h-10 bg-gray-200 rounded w-full max-w-md" />
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex gap-4 px-4 py-3 border-b border-gray-100">
              <div className="h-4 bg-gray-200 rounded flex-1" />
              <div className="h-4 bg-gray-200 rounded w-24" />
              <div className="h-4 bg-gray-200 rounded w-16" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
