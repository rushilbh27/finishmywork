import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="border-t border-border-light/50 dark:border-border-dark/50 py-8 text-sm">
      <div className="flex flex-col md:flex-row items-center justify-between max-w-7xl mx-auto px-6">
        <div className="flex items-center gap-2 text-muted-light dark:text-muted-dark">
          <span className="gradient-text font-semibold">FinishMyWork</span>
          <span className="text-xs">•</span>
          <span>© {new Date().getFullYear()}</span>
        </div>
        <div className="flex flex-wrap gap-6 mt-4 md:mt-0 text-muted-light dark:text-muted-dark">
          <Link href="/tasks" className="hover:text-text-light dark:hover:text-text-dark transition-colors">Browse Tasks</Link>
          <Link href="/about" className="hover:text-text-light dark:hover:text-text-dark transition-colors">About</Link>
          <Link href="/help" className="hover:text-text-light dark:hover:text-text-dark transition-colors">Help</Link>
          <Link href="/privacy" className="hover:text-text-light dark:hover:text-text-dark transition-colors">Privacy</Link>
          <Link href="/terms" className="hover:text-text-light dark:hover:text-text-dark transition-colors">Terms</Link>
        </div>
      </div>
    </footer>
  )
}