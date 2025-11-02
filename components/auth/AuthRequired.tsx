import Link from 'next/link'

export default function AuthRequired({ className = '' }: { className?: string }) {
  return (
    <div className={`min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950 ${className}`}>
      <div className="max-w-md w-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 backdrop-blur-xl rounded-2xl shadow-lg dark:shadow-2xl p-6 sm:p-8 text-center">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-zinc-100">Sign in to continue</h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-zinc-400">You need to be signed in to perform this action.</p>

        <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:justify-center">
          <Link
            href="/auth/signin"
            className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-blue-600 dark:bg-blue-500/20 text-white dark:text-blue-300 border dark:border-blue-500/30 text-sm font-medium hover:bg-blue-700 dark:hover:bg-blue-500/30 transition-all duration-200"
          >
            Sign in
          </Link>

          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 rounded-xl border border-gray-200 dark:border-white/20 text-sm text-gray-700 dark:text-zinc-300 bg-white dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/10 transition-all duration-200"
          >
            Go home
          </Link>

          <Link
            href="/auth/signup"
            className="inline-flex items-center justify-center px-6 py-3 rounded-xl border border-transparent text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-all duration-200"
          >
            Create account
          </Link>
        </div>
      </div>
    </div>
  )
}
