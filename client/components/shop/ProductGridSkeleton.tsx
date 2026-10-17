export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div role="status" aria-label="Loading products" className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-8 h-12 w-64 animate-pulse bg-sand motion-reduce:animate-none" />
      <div className="grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4">
        {Array.from({ length: count }, (_, i) => (
          <div key={i} className="space-y-3">
            <div className="aspect-[3/4] animate-pulse bg-sand motion-reduce:animate-none" />
            <div className="h-4 w-3/4 animate-pulse bg-sand motion-reduce:animate-none" />
            <div className="h-4 w-1/3 animate-pulse bg-sand motion-reduce:animate-none" />
          </div>
        ))}
      </div>
    </div>
  );
}
