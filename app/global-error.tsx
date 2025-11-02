'use client'

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  console.error('Global error:', error)

  return (
    <html>
      <body className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-zinc-100">
        <h2 className="text-2xl font-semibold mb-2">A global error occurred</h2>
        <p className="text-zinc-400 mb-6">{error.message}</p>
        <button
          onClick={() => reset()}
          className="px-4 py-2 rounded-xl bg-white/10 border border-white/10 hover:bg-white/20 transition"
        >
          Reload
        </button>
      </body>
    </html>
  )
}