import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, Clock, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { TOOLS } from '../lib/tools-registry';
import { ToolIcon } from '../components/common/ToolIcon';

export function ToolShellPage({ toolId }) {
  const location = useLocation();
  const currentPath = location.pathname;

  const tool = TOOLS.find((t) => t.id === toolId || t.path === currentPath);

  if (!tool) {
    return (
      <div className="py-12 text-center space-y-4">
        <h1 className="text-xl font-bold">Tool Not Found</h1>
        <p className="text-sm text-slate-500">The requested tool was not found in the registry.</p>
        <Link to="/" className="text-sm text-blue-600 hover:underline">
          Return to directory
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Back button */}
      <div>
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Tools Directory</span>
        </Link>
      </div>

      {/* Tool Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300">
            <ToolIcon name={tool.iconName} className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{tool.name}</h1>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                {tool.statusLabel || `${tool.phase} Target`}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {tool.category} • Client-side local execution
            </p>
          </div>
        </div>
      </div>

      {/* Honest Status Banner */}
      <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 dark:border-amber-900/50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 space-y-2">
        <div className="flex items-center gap-2 font-semibold text-sm">
          <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          <span>Planned Tool — Implementation Scheduled for {tool.phase}</span>
        </div>
        <p className="text-xs leading-relaxed text-amber-800 dark:text-amber-300">
          In strict compliance with the project roadmap, interactive utilities are constructed and
          verified phase-by-phase. This specification shell outlines the technical requirements,
          privacy guarantees, and interface design scheduled for implementation in {tool.phase}.
        </p>
      </div>

      {/* Specification Preview */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 space-y-4">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
          Planned Technical Capabilities ({tool.phase})
        </h2>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {tool.features.map((feature, idx) => (
            <li
              key={idx}
              className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Privacy Guarantee Card */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/60 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
        <div className="text-xs space-y-1">
          <p className="font-semibold text-slate-900 dark:text-slate-100">
            Privacy Boundary Notice
          </p>
          <p className="text-slate-600 dark:text-slate-400">
            When implemented, this tool will process all inputs strictly in-memory using Web Workers
            and native browser APIs. No data will be cached in external storage or transmitted
            across the network.
          </p>
        </div>
      </div>
    </div>
  );
}
