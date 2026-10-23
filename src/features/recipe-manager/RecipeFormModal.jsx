import { useState, useEffect, useCallback } from 'react';
import { X, AlertCircle } from 'lucide-react';
import {
  VALID_CATEGORIES,
  LANGUAGES,
  LANGUAGE_LABELS,
  MAX_RECIPE_CONTENT_LENGTH,
  MAX_RECIPE_TITLE_LENGTH,
  MAX_RECIPE_DESC_LENGTH,
  MAX_RECIPE_TAGS_COUNT,
  validateRecipe,
} from '../../lib/recipeUtils';

export function RecipeFormModal({ isOpen, onClose, onSave, initialRecipe = null }) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(VALID_CATEGORIES[0]);
  const [language, setLanguage] = useState(LANGUAGES[0]);
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [isDestructive, setIsDestructive] = useState(false);
  const [isSecuritySensitive, setIsSecuritySensitive] = useState(false);
  const [error, setError] = useState(null);

  // Initialize form state when modal opens or initialRecipe changes
  useEffect(() => {
    if (initialRecipe) {
      setTitle(initialRecipe.title || '');
      setCategory(initialRecipe.category || VALID_CATEGORIES[0]);
      setLanguage(initialRecipe.language || LANGUAGES[0]);
      setDescription(initialRecipe.description || '');
      setContent(initialRecipe.content || '');
      setTagsInput(Array.isArray(initialRecipe.tags) ? initialRecipe.tags.join(', ') : '');
      setIsDestructive(Boolean(initialRecipe.isDestructive));
      setIsSecuritySensitive(Boolean(initialRecipe.isSecuritySensitive));
    } else {
      setTitle('');
      setCategory(VALID_CATEGORIES[0]);
      setLanguage(LANGUAGES[0]);
      setDescription('');
      setContent('');
      setTagsInput('');
      setIsDestructive(false);
      setIsSecuritySensitive(false);
    }
    setError(null);
  }, [initialRecipe, isOpen]);

  // Handle Escape key
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();

      const rawTags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const candidateRecipe = {
        id:
          initialRecipe?.id || `recipe-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        title,
        category,
        language,
        description,
        content,
        tags: rawTags,
        isStarter: false,
        isDestructive,
        isSecuritySensitive,
        createdAt: initialRecipe?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const { valid, error: validationError, sanitized } = validateRecipe(candidateRecipe);

      if (!valid) {
        setError(validationError);
        return;
      }

      onSave(sanitized);
      onClose();
    },
    [
      initialRecipe,
      title,
      category,
      language,
      description,
      content,
      tagsInput,
      isDestructive,
      isSecuritySensitive,
      onSave,
      onClose,
    ]
  );

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="recipe-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
    >
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <h2 id="recipe-modal-title" className="text-lg font-bold text-slate-900 dark:text-white">
            {initialRecipe ? 'Edit Recipe' : 'New Recipe'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-start gap-2.5 p-3 rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/30 text-red-800 dark:text-red-300 text-xs">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Title */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label
                htmlFor="recipe-title"
                className="text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Recipe Title <span className="text-red-500">*</span>
              </label>
              <span className="text-[10px] text-slate-400">
                {title.length}/{MAX_RECIPE_TITLE_LENGTH}
              </span>
            </div>
            <input
              id="recipe-title"
              type="text"
              required
              value={title}
              maxLength={MAX_RECIPE_TITLE_LENGTH}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Docker Compose Redis with Persistent Storage"
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Category & Language Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="recipe-category"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
              >
                Category <span className="text-red-500">*</span>
              </label>
              <select
                id="recipe-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {VALID_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="recipe-language"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
              >
                Language / Syntax <span className="text-red-500">*</span>
              </label>
              <select
                id="recipe-language"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang} value={lang}>
                    {LANGUAGE_LABELS[lang] || lang}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label
                htmlFor="recipe-description"
                className="text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Description / Usage Notes
              </label>
              <span className="text-[10px] text-slate-400">
                {description.length}/{MAX_RECIPE_DESC_LENGTH}
              </span>
            </div>
            <textarea
              id="recipe-description"
              rows={2}
              maxLength={MAX_RECIPE_DESC_LENGTH}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explain how or when to use this template..."
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Tags */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label
                htmlFor="recipe-tags"
                className="text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Tags (comma-separated, max {MAX_RECIPE_TAGS_COUNT})
              </label>
            </div>
            <input
              id="recipe-tags"
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="e.g. docker, redis, cache"
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Content */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label
                htmlFor="recipe-content"
                className="text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Recipe Content / Code <span className="text-red-500">*</span>
              </label>
              <span className="text-[10px] text-slate-400">
                {content.length.toLocaleString()}/{MAX_RECIPE_CONTENT_LENGTH.toLocaleString()} chars
              </span>
            </div>
            <textarea
              id="recipe-content"
              required
              rows={8}
              value={content}
              maxLength={MAX_RECIPE_CONTENT_LENGTH}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste reusable command, script, configuration, or payload..."
              className="w-full p-3 font-mono text-xs sm:text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
            />
          </div>

          {/* Flags: Destructive & Security-Sensitive */}
          <div className="flex flex-col sm:flex-row gap-3 pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={isDestructive}
                onChange={(e) => setIsDestructive(e.target.checked)}
                className="rounded text-amber-600 focus:ring-amber-500"
              />
              <span>Mark as potentially destructive command</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={isSecuritySensitive}
                onChange={(e) => setIsSecuritySensitive(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <span>Mark as security-sensitive configuration</span>
            </label>
          </div>

          {/* Footer buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-xs"
            >
              {initialRecipe ? 'Save Changes' : 'Create Recipe'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
