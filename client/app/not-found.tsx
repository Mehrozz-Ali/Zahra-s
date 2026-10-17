import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-6 text-center">
      <p className="text-xs uppercase tracking-[0.3em] text-rose-dark">Error 404</p>
      <h1 className="mt-3 font-display text-5xl">Page not found</h1>
      <p className="mb-8 mt-3 text-stone">The page you are looking for does not exist or has moved.</p>
      <Link href="/" className="bg-ink px-8 py-3.5 text-sm uppercase tracking-widest text-ivory hover:bg-rose-dark">Back to home</Link>
    </main>
  );
}
