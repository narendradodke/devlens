export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white py-6 dark:border-slate-800 dark:bg-slate-900 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-700 dark:text-slate-300">DevLens</span>
          <span>•</span>
          <span>Open-Source Developer Toolkit</span>
          <span>•</span>
          <span>Released under MIT License</span>
        </div>
        <div className="flex items-center gap-4">
          <span>Client-Side Local Computation Only</span>
          <span>•</span>
          <a
            href="https://github.com/narendradodke/devlens"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-blue-600 dark:hover:text-blue-400 underline underline-offset-2"
          >
            GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}
