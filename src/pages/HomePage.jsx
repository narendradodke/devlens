import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, Shield, Zap, Lock, Cpu, ArrowRight, CheckCircle2 } from 'lucide-react';
import { TOOLS, CATEGORIES } from '../lib/tools-registry';
import { ToolIcon } from '../components/common/ToolIcon';

export function HomePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredTools = useMemo(() => {
    return TOOLS.filter((tool) => {
      const matchesCategory = selectedCategory === 'All' || tool.category === selectedCategory;

      const query = searchQuery.trim().toLowerCase();
      if (!query) return matchesCategory;

      const matchesSearch =
        tool.name.toLowerCase().includes(query) ||
        tool.description.toLowerCase().includes(query) ||
        tool.tags.some((tag) => tag.toLowerCase().includes(query));

      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, selectedCategory]);

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Hero / Header Section */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            <Lock className="w-3.5 h-3.5" />
            Zero-Telemetry Architecture
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <Shield className="w-3.5 h-3.5" />
            100% In-Browser Execution
          </span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          DevLens Developer Toolkit
        </h1>
        <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-3xl leading-relaxed">
          A privacy-first suite of developer utilities running entirely in your browser. JSON Studio
          is available now for formatting and validation, with upcoming tools scheduled across
          development phases. Your data never leaves your device.
        </p>
      </section>

      {/* Directory Search & Filter Controls */}
      <section className="space-y-4" aria-labelledby="directory-heading">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <label htmlFor="tool-search" className="sr-only">
              Search developer tools
            </label>
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
              aria-hidden="true"
            />
            <input
              id="tool-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tools by name, tag, or function (e.g. json, jwt, regex)..."
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder-slate-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                aria-label="Clear search input"
              >
                Clear
              </button>
            )}
          </div>

          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 self-center sm:self-auto">
            <span>Showing</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {filteredTools.length}
            </span>
            <span>of {TOOLS.length} tools</span>
          </div>
        </div>

        {/* Category Pill Filters */}
        <div
          className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none"
          role="tablist"
          aria-label="Tool categories"
        >
          {CATEGORIES.map((category) => {
            const isSelected = selectedCategory === category;
            return (
              <button
                key={category}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => setSelectedCategory(category)}
                className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
                }`}
              >
                {category}
              </button>
            );
          })}
        </div>
      </section>

      {/* Tools Grid */}
      <section aria-label="Tool directory list">
        {filteredTools.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center dark:border-slate-700">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              No developer tools found matching &quot;{searchQuery}&quot;.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
              }}
              className="mt-3 text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              Reset filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTools.map((tool) => {
              const isActive = tool.status === 'active';
              return (
                <article
                  key={tool.id}
                  className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-xs hover:border-slate-300 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700 transition-all"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 shrink-0">
                          <ToolIcon name={tool.iconName} className="h-5 w-5" />
                        </div>
                        <div>
                          <h2 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                            {tool.name}
                          </h2>
                          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                            {tool.category}
                          </span>
                        </div>
                      </div>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${
                          isActive
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800'
                            : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                        }`}
                      >
                        {tool.statusLabel || tool.phase}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {tool.description}
                    </p>

                    <ul className="space-y-1 pt-1">
                      {tool.features.slice(0, 3).map((feat, idx) => (
                        <li
                          key={idx}
                          className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400"
                        >
                          <CheckCircle2
                            className="w-3.5 h-3.5 text-blue-500 shrink-0"
                            aria-hidden="true"
                          />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-4 mt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      {isActive ? 'Functional in browser' : 'In development roadmap'}
                    </span>
                    <Link
                      to={tool.path}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-1.5 py-0.5"
                    >
                      <span>{isActive ? 'Open Tool' : 'View Spec Shell'}</span>
                      <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Security & Core Tenets Grid */}
      <section className="rounded-xl border border-slate-200 bg-slate-50/50 p-6 dark:border-slate-800 dark:bg-slate-900/50 space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
          Core Principles & Architectural Guarantees
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-white">
              <Lock className="w-4 h-4 text-emerald-500" />
              <span>Zero External Transmission</span>
            </div>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              No backend API, no tracking scripts, and no telemetry. All current and upcoming tools
              operate exclusively on your device without server communication.
            </p>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-white">
              <Zap className="w-4 h-4 text-amber-500" />
              <span>Strict RFC Compliance</span>
            </div>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Native JSON handling adheres to RFC 8259, with upcoming JWT inspection following
              strict RFC 7519 Base64URL parsing and UTF-8 byte reconstruction.
            </p>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-white">
              <Cpu className="w-4 h-4 text-blue-500" />
              <span>Isolated Execution (Planned)</span>
            </div>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Upcoming regex evaluation will execute within dedicated Web Workers with configurable
              timeouts to protect your main tab thread from catastrophic backtracking.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
