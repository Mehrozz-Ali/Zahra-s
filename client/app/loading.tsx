export default function Loading() {
  return (
    <div role="status" aria-label="Loading" className="flex min-h-[50vh] items-center justify-center">
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-sand border-t-rose-dark motion-reduce:animate-none" />
    </div>
  );
}
