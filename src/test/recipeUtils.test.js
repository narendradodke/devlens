import { describe, it, expect, beforeEach } from 'vitest';
import {
  SCHEMA_VERSION,
  MAX_RECIPE_CONTENT_LENGTH,
  MAX_RECIPE_TITLE_LENGTH,
  MAX_RECIPE_DESC_LENGTH,
  MAX_RECIPE_TAG_LENGTH,
  MAX_RECIPE_FILE_SIZE,
  VALID_CATEGORIES,
  LANGUAGES,
  STARTER_RECIPES,
  validateRecipe,
  validateImportDataset,
  mergeImportedRecipes,
  filterRecipes,
  formatRecipesExport,
  getPersistencePreference,
  setPersistencePreference,
  loadStoredRecipes,
  saveStoredRecipes,
  clearStoredRecipes,
  STORAGE_KEY,
} from '../lib/recipeUtils';

describe('recipeUtils Unit Tests', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('Starter Recipes Integrity', () => {
    it('bundles exactly six curated starter recipes', () => {
      expect(STARTER_RECIPES).toHaveLength(6);
    });

    it('all starter recipes pass strict schema validation and have isStarter: true', () => {
      for (const starter of STARTER_RECIPES) {
        const { valid, error, sanitized } = validateRecipe(starter);
        expect(valid, `Starter "${starter.title}" failed validation: ${error}`).toBe(true);
        expect(sanitized.isStarter).toBe(true);
        expect(sanitized.content.length).toBeGreaterThan(10);
        expect(VALID_CATEGORIES).toContain(sanitized.category);
        expect(LANGUAGES).toContain(sanitized.language);
      }
    });

    it('identifies potentially destructive commands and security-sensitive presets', () => {
      const destructive = STARTER_RECIPES.filter((r) => r.isDestructive);
      const securitySensitive = STARTER_RECIPES.filter((r) => r.isSecuritySensitive);

      expect(destructive.length).toBeGreaterThanOrEqual(2);
      expect(securitySensitive.length).toBeGreaterThanOrEqual(2);

      // Verify destructive recipes contain CAUTION labels in description
      destructive.forEach((r) => {
        expect(r.description).toContain('CAUTION');
      });
    });
  });

  describe('validateRecipe', () => {
    const validSample = {
      id: 'custom-1',
      title: 'Valid Recipe',
      category: 'API & Network',
      description: 'Useful description',
      language: 'bash',
      content: 'echo "hello"',
      tags: ['test', 'api'],
    };

    it('validates a complete, valid recipe correctly', () => {
      const result = validateRecipe(validSample);
      expect(result.valid).toBe(true);
      expect(result.error).toBeNull();
      expect(result.sanitized.title).toBe('Valid Recipe');
      expect(result.sanitized.tags).toEqual(['test', 'api']);
    });

    it('rejects missing or empty title and content', () => {
      expect(validateRecipe({ ...validSample, title: '' }).valid).toBe(false);
      expect(validateRecipe({ ...validSample, content: '   ' }).valid).toBe(false);
      expect(validateRecipe({ ...validSample, id: '' }).valid).toBe(false);
    });

    it('rejects titles exceeding MAX_RECIPE_TITLE_LENGTH', () => {
      const longTitle = 'a'.repeat(MAX_RECIPE_TITLE_LENGTH + 1);
      const res = validateRecipe({ ...validSample, title: longTitle });
      expect(res.valid).toBe(false);
      expect(res.error).toContain('cannot exceed 100 characters');
    });

    it('rejects descriptions exceeding MAX_RECIPE_DESC_LENGTH', () => {
      const longDesc = 'a'.repeat(MAX_RECIPE_DESC_LENGTH + 1);
      const res = validateRecipe({ ...validSample, description: longDesc });
      expect(res.valid).toBe(false);
      expect(res.error).toContain('cannot exceed 300 characters');
    });

    it('rejects contents exceeding MAX_RECIPE_CONTENT_LENGTH', () => {
      const longContent = 'x'.repeat(MAX_RECIPE_CONTENT_LENGTH + 1);
      const res = validateRecipe({ ...validSample, content: longContent });
      expect(res.valid).toBe(false);
      expect(res.error).toContain('cannot exceed 50,000 characters');
    });

    it('rejects invalid category and invalid language', () => {
      expect(validateRecipe({ ...validSample, category: 'Invalid Category' }).valid).toBe(false);
      expect(validateRecipe({ ...validSample, language: 'unknown-lang' }).valid).toBe(false);
    });

    it('validates and sanitizes tags (max 5 tags, max 20 chars, lowercase, deduped)', () => {
      const res = validateRecipe({
        ...validSample,
        tags: ['API', 'api', '  DEV  ', 'network'],
      });
      expect(res.valid).toBe(true);
      expect(res.sanitized.tags).toEqual(['api', 'dev', 'network']);

      // Too many tags
      const tooMany = validateRecipe({
        ...validSample,
        tags: ['1', '2', '3', '4', '5', '6'],
      });
      expect(tooMany.valid).toBe(false);
      expect(tooMany.error).toContain('cannot have more than 5 tags');

      // Tag too long
      const tooLongTag = validateRecipe({
        ...validSample,
        tags: ['a'.repeat(MAX_RECIPE_TAG_LENGTH + 1)],
      });
      expect(tooLongTag.valid).toBe(false);
      expect(tooLongTag.error).toContain('exceeds maximum length of 20');
    });
  });

  describe('validateImportDataset', () => {
    const validExportObj = {
      tool: 'DevLens Recipe Manager',
      schemaVersion: SCHEMA_VERSION,
      recipeCount: 1,
      recipes: [
        {
          id: 'imp-1',
          title: 'Imported Recipe',
          category: 'Docker & DevOps',
          description: 'Desc',
          language: 'yaml',
          content: 'version: "3"',
          tags: ['docker'],
        },
      ],
    };

    it('accepts valid versioned JSON export payload', () => {
      const json = JSON.stringify(validExportObj);
      const res = validateImportDataset(json);
      expect(res.success).toBe(true);
      expect(res.recipes).toHaveLength(1);
      expect(res.recipes[0].isStarter).toBe(false);
    });

    it('rejects oversized import files (> 1 MB)', () => {
      const hugeJson = '{"data":"' + 'x'.repeat(MAX_RECIPE_FILE_SIZE) + '"}';
      const res = validateImportDataset(hugeJson);
      expect(res.success).toBe(false);
      expect(res.error).toContain('exceeds maximum allowed size of 1 MB');
    });

    it('rejects malformed JSON syntax', () => {
      const res = validateImportDataset('{ unclosed json');
      expect(res.success).toBe(false);
      expect(res.error).toContain('Invalid JSON syntax');
    });

    it('rejects unsupported schema version', () => {
      const invalidVersion = JSON.stringify({ ...validExportObj, schemaVersion: 99 });
      const res = validateImportDataset(invalidVersion);
      expect(res.success).toBe(false);
      expect(res.error).toContain('Unsupported schema version: 99');
    });

    it('rejects missing or empty recipes array', () => {
      expect(validateImportDataset(JSON.stringify({ schemaVersion: 1 })).success).toBe(false);
      expect(validateImportDataset(JSON.stringify({ schemaVersion: 1, recipes: [] })).success).toBe(
        false
      );
    });

    it('rejects dataset with duplicate IDs within the file', () => {
      const dupObj = {
        schemaVersion: 1,
        recipes: [
          { ...validExportObj.recipes[0], id: 'same-id' },
          { ...validExportObj.recipes[0], id: 'same-id', title: 'Second' },
        ],
      };
      const res = validateImportDataset(JSON.stringify(dupObj));
      expect(res.success).toBe(false);
      expect(res.error).toContain('contains duplicate ID within file: "same-id"');
    });

    it('rejects the entire dataset atomically if any single recipe is invalid', () => {
      const invalidObj = {
        schemaVersion: 1,
        recipes: [
          validExportObj.recipes[0],
          { ...validExportObj.recipes[0], id: 'bad-2', title: '' }, // empty title
        ],
      };
      const res = validateImportDataset(JSON.stringify(invalidObj));
      expect(res.success).toBe(false);
      expect(res.error).toContain('Validation failed for recipe #2');
    });
  });

  describe('mergeImportedRecipes — Duplicate Handling Strategy', () => {
    it('appends non-colliding recipes directly', () => {
      const existing = [{ id: 'ex-1', title: 'Existing 1' }];
      const incoming = [{ id: 'in-1', title: 'Incoming 1' }];

      const { merged, addedCount, renamedCount } = mergeImportedRecipes(existing, incoming);
      expect(merged).toHaveLength(2);
      expect(addedCount).toBe(1);
      expect(renamedCount).toBe(0);
      expect(merged.map((r) => r.id)).toEqual(['ex-1', 'in-1']);
    });

    it('generates a unique copy ID for colliding IDs without overwriting existing recipes', () => {
      const existing = [{ id: 'colliding-id', title: 'Existing Original' }];
      const incoming = [{ id: 'colliding-id', title: 'Imported Collision' }];

      const { merged, addedCount, renamedCount } = mergeImportedRecipes(existing, incoming);
      expect(merged).toHaveLength(2);
      expect(addedCount).toBe(1);
      expect(renamedCount).toBe(1);

      // Existing item is untouched
      expect(merged[0]).toEqual({ id: 'colliding-id', title: 'Existing Original' });

      // Incoming item received a unique copy ID and preserved title
      expect(merged[1].id).toContain('colliding-id-copy-');
      expect(merged[1].title).toBe('Imported Collision');
    });
  });

  describe('filterRecipes', () => {
    const list = [
      {
        id: '1',
        title: 'cURL API Auth',
        category: 'API & Network',
        description: 'Bearer tokens',
        language: 'bash',
        content: 'curl https://example.com',
        tags: ['curl', 'http'],
      },
      {
        id: '2',
        title: 'Docker Redis',
        category: 'Docker & DevOps',
        description: 'Run cache',
        language: 'yaml',
        content: 'image: redis',
        tags: ['docker', 'cache'],
      },
      {
        id: '3',
        title: 'Git Squash',
        category: 'Git & Version Control',
        description: 'Combine commits',
        language: 'bash',
        content: 'git rebase -i HEAD~3',
        tags: ['git', 'rebase'],
      },
    ];

    it('returns all recipes when query is empty and category is All', () => {
      expect(filterRecipes(list, '', 'All')).toHaveLength(3);
    });

    it('filters strictly by category', () => {
      const filtered = filterRecipes(list, '', 'Docker & DevOps');
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('2');
    });

    it('filters across title, description, content, tags, and language case-insensitively', () => {
      expect(filterRecipes(list, 'curl', 'All')).toHaveLength(1);
      expect(filterRecipes(list, 'CACHE', 'All')).toHaveLength(1);
      expect(filterRecipes(list, 'rebase', 'All')).toHaveLength(1);
      expect(filterRecipes(list, 'yaml', 'All')).toHaveLength(1);
      expect(filterRecipes(list, 'nonexistent', 'All')).toHaveLength(0);
    });

    it('combines category and query filters simultaneously', () => {
      // 'bash' exists in API and Git, but selecting Git returns only 1
      expect(filterRecipes(list, 'bash', 'Git & Version Control')).toHaveLength(1);
      expect(filterRecipes(list, 'bash', 'Docker & DevOps')).toHaveLength(0);
    });
  });

  describe('formatRecipesExport', () => {
    it('generates a valid, schema-compliant JSON export string', () => {
      const custom = [
        {
          id: 'c1',
          title: 'Custom Recipe',
          category: 'API & Network',
          description: 'Desc',
          language: 'bash',
          content: 'echo 1',
          tags: ['test'],
          isDestructive: false,
          isSecuritySensitive: false,
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      ];

      const exportedStr = formatRecipesExport(custom);
      const parsed = JSON.parse(exportedStr);

      expect(parsed.tool).toBe('DevLens Recipe Manager');
      expect(parsed.schemaVersion).toBe(SCHEMA_VERSION);
      expect(parsed.recipeCount).toBe(1);
      expect(parsed.recipes).toHaveLength(1);
      expect(parsed.recipes[0].title).toBe('Custom Recipe');
    });
  });

  describe('Storage & Persistence Helpers', () => {
    it('defaults persistence preference to false', () => {
      expect(getPersistencePreference()).toBe(false);
      expect(loadStoredRecipes()).toEqual([]);
    });

    it('enables persistence preference when set to true', () => {
      setPersistencePreference(true);
      expect(getPersistencePreference()).toBe(true);

      const toSave = [
        {
          id: 'c1',
          title: 'Saved Recipe',
          category: 'API & Network',
          language: 'bash',
          content: 'echo saved',
          isStarter: false,
        },
      ];
      const saveRes = saveStoredRecipes(toSave);
      expect(saveRes.success).toBe(true);

      const loaded = loadStoredRecipes();
      expect(loaded).toHaveLength(1);
      expect(loaded[0].title).toBe('Saved Recipe');
    });

    it('recovers gracefully from corrupted localStorage without throwing', () => {
      setPersistencePreference(true);
      localStorage.setItem(STORAGE_KEY, '{ invalid json corrupted');

      const loaded = loadStoredRecipes();
      expect(loaded).toEqual([]);
    });

    it('clears stored recipes on clearStoredRecipes', () => {
      setPersistencePreference(true);
      saveStoredRecipes([
        {
          id: 'c1',
          title: 'Saved Recipe',
          category: 'API & Network',
          language: 'bash',
          content: 'echo saved',
        },
      ]);
      expect(loadStoredRecipes()).toHaveLength(1);

      clearStoredRecipes();
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
      expect(loadStoredRecipes()).toEqual([]);
    });
  });
});
