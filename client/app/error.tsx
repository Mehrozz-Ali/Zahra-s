"use client";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-6 text-center">
      <h1 className="font-display text-5xl">Something went wrong</h1>
      <p className="mb-8 mt-3 text-stone">We could not load this page. Please try again.</p>
      <button type="button" onClick={reset} className="bg-ink px-8 py-3.5 text-sm uppercase tracking-widest text-ivory hover:bg-rose-dark">Try again</button>
    </main>
  );
}
