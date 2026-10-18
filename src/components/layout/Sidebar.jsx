import { NavLink } from 'react-router-dom';
import { Shield, Home } from 'lucide-react';
import { TOOLS } from '../../lib/tools-registry';
import { ToolIcon } from '../common/ToolIcon';

export function Sidebar({ onCloseMobile }) {
  return (
    <aside className="flex flex-col h-full border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 transition-colors w-64 select-none">
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        <div>
          <NavLink
            to="/"
            end
            onClick={onCloseMobile}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg border-l-4 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isActive
                  ? 'border-blue-600 bg-blue-50 text-blue-700 font-semibold shadow-xs dark:border-blue-500 dark:bg-blue-950/60 dark:text-blue-300'
                  : 'border-transparent text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/80 dark:hover:text-slate-100'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Home
                  className={`h-4 w-4 ${
                    isActive
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                />
                <span>Overview & Directory</span>
              </>
            )}
          </NavLink>
        </div>

        <div>
          <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Core Developer Tools
          </div>
          <nav className="space-y-1" aria-label="Core tools">
            {TOOLS.map((tool) => (
              <NavLink
                key={tool.id}
                to={tool.path}
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg border-l-4 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isActive
                      ? 'border-blue-600 bg-blue-50 text-blue-700 font-semibold shadow-xs dark:border-blue-500 dark:bg-blue-950/60 dark:text-blue-300'
                      : 'border-transparent text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/80 dark:hover:text-slate-100'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-2.5 truncate">
                      <ToolIcon
                        name={tool.iconName}
                        className={`h-4 w-4 shrink-0 ${
                          isActive
                            ? 'text-blue-600 dark:text-blue-400'
                            : 'text-slate-500 dark:text-slate-400'
                        }`}
                      />
                      <span className="truncate">{tool.name}</span>
                    </div>
                    <span
                      className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${
                        isActive
                          ? 'border-blue-200 bg-blue-100 text-blue-800 dark:border-blue-800 dark:bg-blue-900/60 dark:text-blue-200'
                          : 'border-slate-200 text-slate-500 dark:border-slate-700 dark:text-slate-400'
                      }`}
                    >
                      {tool.id === 'json-studio' ? 'Active' : tool.phase}
                    </span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>

      <div className="p-4 border-t border-slate-200 dark:border-slate-800">
        <div className="rounded-lg bg-slate-50 p-3 border border-slate-200/80 dark:bg-slate-800/60 dark:border-slate-700/60 text-xs space-y-1.5">
          <div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-slate-100">
            <Shield className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
            <span>Zero-Server Guarantee</span>
          </div>
          <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
            All data processing happens entirely inside your local browser instance. No external API
            calls or storage.
          </p>
        </div>
      </div>
    </aside>
  );
}
