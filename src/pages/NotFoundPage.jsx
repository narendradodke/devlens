import { Link } from 'react-router-dom';
import { FileQuestion, ArrowLeft } from 'lucide-react';

export function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
        <FileQuestion className="h-8 w-8" />
      </div>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">404 — Page Not Found</h1>
      <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md">
        The route you navigated to does not exist in DevLens. Use the directory below to find
        available developer tools.
      </p>
      <Link
        to="/"
        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Tools Directory</span>
      </Link>
    </div>
  );
}
