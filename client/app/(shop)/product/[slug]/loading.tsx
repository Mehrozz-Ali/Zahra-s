export default function Loading() {
  return (
    <div role="status" aria-label="Loading product" className="mx-auto grid max-w-7xl animate-pulse gap-10 px-4 py-10 sm:px-6 lg:grid-cols-2 motion-reduce:animate-none">
      <div className="aspect-[3/4] bg-sand" />
      <div className="space-y-4"><div className="h-10 w-3/4 bg-sand" /><div className="h-6 w-1/4 bg-sand" /><div className="h-40 bg-sand" /></div>
    </div>
  );
}
