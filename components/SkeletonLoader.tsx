/**
 * Skeleton Loader Components
 * Show placeholder while data is loading
 */

export function TableSkeleton({ rows = 10 }: { rows?: number }) {
  return (
    <div className="animate-pulse space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4 bg-gray-800/30 rounded-lg p-4">
          <div className="h-10 w-10 bg-gray-700 rounded-full"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-700 rounded w-3/4"></div>
            <div className="h-3 bg-gray-700 rounded w-1/2"></div>
          </div>
          <div className="h-4 bg-gray-700 rounded w-20"></div>
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="animate-pulse bg-gray-800/30 rounded-lg p-6">
      <div className="h-4 bg-gray-700 rounded w-1/3 mb-4"></div>
      <div className="h-8 bg-gray-700 rounded w-2/3"></div>
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="animate-pulse bg-gray-800/30 rounded-lg p-6">
      <div className="h-4 bg-gray-700 rounded w-1/3 mb-4"></div>
      <div className="h-64 bg-gray-700 rounded"></div>
    </div>
  );
}

export function StatsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 animate-pulse">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="bg-gray-800/30 rounded-lg p-6">
          <div className="h-4 bg-gray-700 rounded w-2/3 mb-3"></div>
          <div className="h-8 bg-gray-700 rounded w-full"></div>
        </div>
      ))}
    </div>
  );
}
