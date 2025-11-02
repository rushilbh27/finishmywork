'use client'

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  console.error('App error:', error)

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center text-zinc-200 bg-slate-950">
      <h1 className="text-2xl font-semibold mb-2">Something went wrong</h1>
      <p className="text-zinc-400 mb-6">{error.message}</p>
      <button
        onClick={() => reset()}
        className="px-4 py-2 rounded-xl bg-white/10 border border-white/10 hover:bg-white/20 transition"
      >
        Try again
      </button>
    </div>
  )
}