import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  BookMarked,
  Plus,
  Search,
  Copy,
  Check,
  Trash2,
  Edit,
  Download,
  Upload,
  AlertCircle,
  AlertTriangle,
  ShieldAlert,
  HardDrive,
  CopyPlus,
  Tag,
} from 'lucide-react';
import {
  CATEGORIES,
  STARTER_RECIPES,
  LANGUAGE_LABELS,
  MAX_RECIPE_FILE_SIZE,
  filterRecipes,
  formatRecipesExport,
  validateImportDataset,
  mergeImportedRecipes,
  getPersistencePreference,
  setPersistencePreference,
  loadStoredRecipes,
  saveStoredRecipes,
  clearStoredRecipes,
  readFileAsText,
} from '../../lib/recipeUtils';
import { RecipeFormModal } from './RecipeFormModal';

export function RecipeManager() {
  const [customRecipes, setCustomRecipes] = useState(() => loadStoredRecipes());
  const [selectedRecipeId, setSelectedRecipeId] = useState(STARTER_RECIPES[0].id);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [persistenceEnabled, setPersistenceEnabled] = useState(() => getPersistencePreference());

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState(null);

  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(null);
  const [feedbackMessage, setFeedbackMessage] = useState(null);
  const [storageError, setStorageError] = useState(null);

  const fileInputRef = useRef(null);
  const copiedTimeoutRef = useRef(null);
  const feedbackTimeoutRef = useRef(null);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (copiedTimeoutRef.current) clearTimeout(copiedTimeoutRef.current);
      if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
    };
  }, []);

  // Sync to localStorage whenever customRecipes changes (if persistence is enabled)
  useEffect(() => {
    if (persistenceEnabled) {
      const res = saveStoredRecipes(customRecipes);
      if (!res.success) {
        setStorageError(res.error || 'Failed to save recipes to local storage.');
      } else {
        setStorageError(null);
      }
    }
  }, [customRecipes, persistenceEnabled]);

  // Combined recipe list (Starters + Custom)
  const allRecipes = useMemo(() => {
    return [...STARTER_RECIPES, ...customRecipes];
  }, [customRecipes]);

  // Filtered recipes
  const filteredRecipes = useMemo(() => {
    return filterRecipes(allRecipes, searchQuery, selectedCategory);
  }, [allRecipes, searchQuery, selectedCategory]);

  // Active selected recipe: prioritize match within current filtered results
  const selectedRecipe = useMemo(() => {
    const foundInFiltered = filteredRecipes.find((r) => r.id === selectedRecipeId);
    if (foundInFiltered) return foundInFiltered;
    return filteredRecipes[0] || null;
  }, [selectedRecipeId, filteredRecipes]);

  // Show temporary feedback message
  const triggerFeedback = useCallback((msg, isError = false) => {
    setFeedbackMessage({ text: msg, isError });
    if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
    feedbackTimeoutRef.current = setTimeout(() => {
      setFeedbackMessage(null);
    }, 4000);
  }, []);

  // Toggle persistence preference
  const handleTogglePersistence = useCallback(
    (e) => {
      const nextVal = e.target.checked;
      setPersistenceEnabled(nextVal);
      setPersistencePreference(nextVal);
      if (nextVal) {
        saveStoredRecipes(customRecipes);
        triggerFeedback('Persistence enabled: Custom recipes are now saved on this device.');
      } else {
        triggerFeedback('Persistence disabled: Custom recipes will not be saved after tab close.');
      }
    },
    [customRecipes, triggerFeedback]
  );

  // Clear stored recipes from device
  const handleClearStored = useCallback(() => {
    if (customRecipes.length === 0) return;
    const confirmed = window.confirm(
      'Are you sure you want to remove all custom recipes from this device? This action cannot be undone.'
    );
    if (!confirmed) return;

    clearStoredRecipes();
    setCustomRecipes([]);
    setSelectedRecipeId(STARTER_RECIPES[0].id);
    triggerFeedback('All custom recipes were removed from this device.');
  }, [customRecipes, triggerFeedback]);

  // Save new or edited recipe
  const handleSaveRecipe = useCallback(
    (recipe) => {
      setCustomRecipes((prev) => {
        const existingIndex = prev.findIndex((r) => r.id === recipe.id);
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = recipe;
          return updated;
        }
        return [recipe, ...prev];
      });
      setSelectedRecipeId(recipe.id);
      triggerFeedback(`Recipe "${recipe.title}" saved successfully.`);
    },
    [triggerFeedback]
  );

  // Open modal to create a new recipe
  const handleOpenCreate = useCallback(() => {
    setEditingRecipe(null);
    setIsModalOpen(true);
  }, []);

  // Open modal to edit existing custom recipe
  const handleOpenEdit = useCallback((recipe) => {
    setEditingRecipe(recipe);
    setIsModalOpen(true);
  }, []);

  // Duplicate a starter recipe into a custom recipe
  const handleDuplicateStarter = useCallback((starter) => {
    const duplicated = {
      ...starter,
      id: `custom-from-${starter.id}-${Date.now()}`,
      title: `${starter.title} (Copy)`,
      isStarter: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setEditingRecipe(duplicated);
    setIsModalOpen(true);
  }, []);

  // Delete a custom recipe
  const handleDeleteRecipe = useCallback(
    (recipeId) => {
      const recipe = customRecipes.find((r) => r.id === recipeId);
      if (!recipe) return;

      const confirmed = window.confirm(`Delete recipe "${recipe.title}"?`);
      if (!confirmed) return;

      setCustomRecipes((prev) => prev.filter((r) => r.id !== recipeId));
      setSelectedRecipeId(STARTER_RECIPES[0].id);
      triggerFeedback(`Recipe "${recipe.title}" deleted.`);
    },
    [customRecipes, triggerFeedback]
  );

  // Copy recipe content
  const handleCopyContent = useCallback(async () => {
    if (!selectedRecipe?.content) return;
    try {
      await navigator.clipboard.writeText(selectedRecipe.content);
      setCopied(true);
      setCopyError(null);
      if (copiedTimeoutRef.current) clearTimeout(copiedTimeoutRef.current);
      copiedTimeoutRef.current = setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      setCopyError(
        err instanceof Error
          ? `Clipboard copy failed: ${err.message}`
          : 'Failed to copy to clipboard.'
      );
    }
  }, [selectedRecipe]);

  // Export custom recipes to JSON file
  const handleExport = useCallback(() => {
    if (customRecipes.length === 0) {
      triggerFeedback(
        'No custom recipes to export. Starter presets are bundled with the app.',
        true
      );
      return;
    }

    try {
      const jsonContent = formatRecipesExport(customRecipes);
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `devlens-recipes-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      triggerFeedback(`Exported ${customRecipes.length} custom recipe(s) to JSON.`);
    } catch (err) {
      triggerFeedback(
        `Export failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
        true
      );
    }
  }, [customRecipes, triggerFeedback]);

  // Trigger file selection for import
  const handleTriggerImport = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  }, []);

  // Handle file import
  const handleFileChange = useCallback(
    async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (file.size > MAX_RECIPE_FILE_SIZE) {
        triggerFeedback(
          `Import rejected: File size (${(file.size / 1024).toFixed(1)} KB) exceeds 1 MB limit.`,
          true
        );
        return;
      }

      try {
        const text = await readFileAsText(file);
        const validation = validateImportDataset(text);

        if (!validation.success || !validation.recipes) {
          triggerFeedback(`Import rejected: ${validation.error}`, true);
          return;
        }

        const { merged, addedCount, renamedCount } = mergeImportedRecipes(
          customRecipes,
          validation.recipes
        );

        setCustomRecipes(merged);
        if (validation.recipes.length > 0) {
          setSelectedRecipeId(validation.recipes[0].id);
        }

        const renameNote =
          renamedCount > 0 ? ` (${renamedCount} duplicate ID(s) imported with new unique IDs)` : '';
        triggerFeedback(`Successfully imported ${addedCount} recipe(s)${renameNote}.`, false);
      } catch (err) {
        triggerFeedback(
          `Import failed: ${err instanceof Error ? err.message : 'Unable to parse file'}`,
          true
        );
      }
    },
    [customRecipes, triggerFeedback]
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Hidden File Input for Import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileChange}
        className="hidden"
        aria-hidden="true"
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Recipe Manager
            </h1>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              Active Tool
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Organize, parameterize, and export reusable developer commands, configurations, and
            reference recipes.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Recipe</span>
          </button>
          <button
            type="button"
            onClick={handleTriggerImport}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <Upload className="w-3.5 h-3.5 text-slate-500" />
            <span>Import</span>
          </button>
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Storage & Privacy Controls Banner */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={persistenceEnabled}
              onChange={handleTogglePersistence}
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-700"
            />
            <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              Save on this device (localStorage)
            </span>
          </label>

          {customRecipes.length > 0 && (
            <button
              type="button"
              onClick={handleClearStored}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 rounded hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Saved Recipes ({customRecipes.length})</span>
            </button>
          )}
        </div>

        <div className="flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
          <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Storage & Privacy Notice:
            </span>{' '}
            When &ldquo;Save on this device&rdquo; is enabled, custom recipes are stored in your
            browser&rsquo;s local storage as unencrypted plaintext. Never store live credentials,
            private API keys, JWT tokens, or passwords in recipe content. DevLens runs 100% offline.
          </div>
        </div>
      </div>

      {/* Storage Quota / Error Banner */}
      {storageError && (
        <div className="flex items-start gap-2.5 p-3 rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/30 text-red-800 dark:text-red-300 text-xs">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <span>Storage Error: {storageError}</span>
        </div>
      )}

      {/* Copy Error Banner */}
      {copyError && (
        <div className="flex items-start gap-2.5 p-3 rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/30 text-red-800 dark:text-red-300 text-xs">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <span>{copyError}</span>
        </div>
      )}

      {/* Feedback Banner */}
      {feedbackMessage && (
        <div
          className={`flex items-start gap-2.5 p-3 rounded-lg border text-xs ${
            feedbackMessage.isError
              ? 'border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/30 text-red-800 dark:text-red-300'
              : 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300'
          }`}
        >
          {feedbackMessage.isError ? (
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          ) : (
            <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          )}
          <span>{feedbackMessage.text}</span>
        </div>
      )}

      {/* Search & Category Filter Toolbar */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search recipes by title, tag, or content..."
              aria-label="Search recipes"
              className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                Clear
              </button>
            )}
          </div>

          <div className="text-xs text-slate-500 dark:text-slate-400">
            Showing{' '}
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {filteredRecipes.length}
            </span>{' '}
            of {allRecipes.length} recipes
          </div>
        </div>

        {/* Category Pills */}
        <div
          className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none"
          role="tablist"
        >
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => setSelectedCategory(cat)}
                className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Dual Panel Workspace: Master List (Left) + Detail Inspector (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Recipe List (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden flex flex-col h-[600px]">
          <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/30 flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
            <span>Recipes Directory</span>
            <span className="text-[11px] text-slate-400 font-normal">
              {customRecipes.length} custom, {STARTER_RECIPES.length} presets
            </span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800/80 overflow-y-auto grow">
            {filteredRecipes.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No recipes match your current filter.
              </div>
            ) : (
              filteredRecipes.map((r) => {
                const isSelected = selectedRecipe?.id === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setSelectedRecipeId(r.id)}
                    className={`w-full text-left p-3.5 transition-colors flex flex-col gap-1.5 focus:outline-none ${
                      isSelected
                        ? 'bg-blue-50/80 dark:bg-blue-950/40 border-l-4 border-blue-600'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                        {r.title}
                      </span>
                      {r.isStarter ? (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 shrink-0">
                          Preset
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 shrink-0">
                          Custom
                        </span>
                      )}
                    </div>

                    {r.description && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                        {r.description}
                      </p>
                    )}

                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-slate-100 dark:bg-slate-800 font-mono text-slate-600 dark:text-slate-300">
                        {r.language}
                      </span>
                      <span className="text-[10px] text-slate-400 truncate">{r.category}</span>
                      {r.isDestructive && (
                        <span className="text-[9px] font-semibold px-1 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                          CAUTION
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Recipe Inspector & Content (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden flex flex-col min-h-[600px]">
          {selectedRecipe ? (
            <div className="p-5 flex flex-col grow space-y-4">
              {/* Recipe Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                      {selectedRecipe.title}
                    </h2>
                    {selectedRecipe.isStarter && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        Starter Preset
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {selectedRecipe.category}
                    </span>
                    <span>•</span>
                    <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[11px] text-slate-700 dark:text-slate-300">
                      {LANGUAGE_LABELS[selectedRecipe.language] || selectedRecipe.language}
                    </span>
                  </div>
                </div>

                {/* Recipe Actions */}
                <div className="flex items-center gap-1.5 shrink-0 self-start">
                  <button
                    type="button"
                    onClick={handleCopyContent}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-xs"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-300" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Recipe</span>
                      </>
                    )}
                  </button>

                  {selectedRecipe.isStarter ? (
                    <button
                      type="button"
                      onClick={() => handleDuplicateStarter(selectedRecipe)}
                      title="Duplicate this starter recipe into a customizable recipe"
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                    >
                      <CopyPlus className="w-3.5 h-3.5 text-slate-500" />
                      <span>Duplicate</span>
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(selectedRecipe)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                      >
                        <Edit className="w-3.5 h-3.5 text-slate-500" />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteRecipe(selectedRecipe.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                        title="Delete recipe"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Description */}
              {selectedRecipe.description && (
                <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50/70 dark:bg-slate-950/40 p-3 rounded-lg border border-slate-200/80 dark:border-slate-800">
                  {selectedRecipe.description}
                </div>
              )}

              {/* Warnings / Cautions */}
              {selectedRecipe.isDestructive && (
                <div className="flex items-start gap-2.5 p-3 rounded-lg border border-amber-200 dark:border-amber-900/60 bg-amber-50/80 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 text-xs">
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Potentially Destructive Command:</span> Review
                    parameters carefully before executing in production environments.
                  </div>
                </div>
              )}

              {selectedRecipe.isSecuritySensitive && (
                <div className="flex items-start gap-2.5 p-3 rounded-lg border border-blue-200 dark:border-blue-900/60 bg-blue-50/80 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300 text-xs">
                  <AlertCircle className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Security-Sensitive Configuration:</span>{' '}
                    Contains access controls, header policies, or network configurations.
                  </div>
                </div>
              )}

              {/* Tags */}
              {Array.isArray(selectedRecipe.tags) && selectedRecipe.tags.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5">
                  <Tag className="w-3 h-3 text-slate-400" />
                  {selectedRecipe.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Recipe Content Code Block (strictly React text, never innerHTML) */}
              <div className="grow flex flex-col space-y-1.5 pt-2">
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>Template Code:</span>
                  <span>{selectedRecipe.content.length.toLocaleString()} characters</span>
                </div>
                <div className="relative grow rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950 text-slate-100 p-4 font-mono text-xs sm:text-sm leading-relaxed overflow-x-auto">
                  <pre className="whitespace-pre-wrap select-all">
                    <code>{selectedRecipe.content}</code>
                  </pre>
                </div>
              </div>
            </div>
          ) : (
            <div className="grow flex flex-col items-center justify-center p-12 text-center text-slate-400 space-y-2">
              <BookMarked className="w-8 h-8 text-slate-300 dark:text-slate-600" />
              <p className="text-sm font-medium">Select a recipe from the directory to inspect.</p>
            </div>
          )}
        </div>
      </div>

      {/* Recipe Create / Edit Modal */}
      <RecipeFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveRecipe}
        initialRecipe={editingRecipe}
      />
    </div>
  );
}
