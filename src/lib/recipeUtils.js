/**
 * Pure Recipe Manager utility functions for DevLens.
 * All operations execute locally in the browser in memory with opt-in localStorage persistence.
 * Zero external dependencies, zero backend calls, and zero unsafe HTML rendering.
 */

export const SCHEMA_VERSION = 1;
export const MAX_RECIPE_CONTENT_LENGTH = 50000;
export const MAX_RECIPE_TITLE_LENGTH = 100;
export const MAX_RECIPE_DESC_LENGTH = 300;
export const MAX_RECIPE_TAG_LENGTH = 20;
export const MAX_RECIPE_TAGS_COUNT = 5;
export const MAX_CUSTOM_RECIPES = 100;
export const MAX_RECIPE_FILE_SIZE = 1048576; // 1 MB import size boundary

export const STORAGE_KEY = 'devlens-recipes-v1';
export const STORAGE_PREF_KEY = 'devlens-recipes-persistence-enabled';

export const CATEGORIES = [
  'All',
  'API & Network',
  'Docker & DevOps',
  'Git & Version Control',
  'Frontend & Security',
  'Database & SQL',
  'Regex & Text',
];

export const VALID_CATEGORIES = CATEGORIES.filter((c) => c !== 'All');

export const LANGUAGES = ['bash', 'json', 'javascript', 'yaml', 'sql', 'regex', 'text'];

export const LANGUAGE_LABELS = {
  bash: 'Bash / Shell',
  json: 'JSON',
  javascript: 'JavaScript',
  yaml: 'YAML',
  sql: 'SQL',
  regex: 'RegEx',
  text: 'Plain Text',
};

/**
 * Curated starter recipes demonstrating best practices.
 * Starter recipes use placeholders rather than real credentials and are immutable.
 */
export const STARTER_RECIPES = [
  {
    id: 'starter-curl-bearer',
    title: 'cURL with Bearer Token & JSON Payload',
    category: 'API & Network',
    description:
      'Standard template for authenticated REST API requests sending and receiving JSON.',
    language: 'bash',
    content: `curl -X POST "https://api.example.com/v1/resource" \\
  -H "Authorization: Bearer <YOUR_API_TOKEN>" \\
  -H "Content-Type: application/json" \\
  -H "Accept: application/json" \\
  -d '{
    "name": "<RESOURCE_NAME>",
    "environment": "development",
    "enabled": true
  }'`,
    tags: ['curl', 'api', 'http', 'rest', 'json'],
    isStarter: true,
    isDestructive: false,
    isSecuritySensitive: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'starter-docker-compose-postgres',
    title: 'Docker Compose Postgres with Healthcheck',
    category: 'Docker & DevOps',
    description:
      'Production-tested docker-compose configuration for PostgreSQL 16 with readiness healthcheck and persistent volume.',
    language: 'yaml',
    content: `services:
  db:
    image: postgres:16-alpine
    container_name: <APP_NAME>_postgres
    environment:
      POSTGRES_DB: <DB_NAME>
      POSTGRES_USER: <DB_USER>
      POSTGRES_PASSWORD: <DB_PASSWORD>
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U <DB_USER> -d <DB_NAME>"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  pgdata:`,
    tags: ['docker', 'compose', 'postgres', 'database', 'devops'],
    isStarter: true,
    isDestructive: false,
    isSecuritySensitive: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'starter-git-prune-merged',
    title: 'Git Prune Stale Remote & Merged Local Branches',
    category: 'Git & Version Control',
    description:
      'CAUTION: Destructive command. Synchronizes remote tracking branches and removes local branches already merged into main.',
    language: 'bash',
    content: `# 1. Fetch and prune stale remote tracking references
git fetch --prune

# 2. CAUTION: Deletes all local branches already merged into main
git branch --merged main | grep -v "^\\*" | grep -v "main" | xargs -n 1 git branch -d`,
    tags: ['git', 'branches', 'cleanup', 'prune'],
    isStarter: true,
    isDestructive: true,
    isSecuritySensitive: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'starter-strict-csp-header',
    title: 'Strict Content Security Policy (CSP) Header',
    category: 'Frontend & Security',
    description:
      'Security-sensitive HTTP response header template. Restricts scripts, styles, and frames to mitigate XSS and clickjacking.',
    language: 'text',
    content: `Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self';`,
    tags: ['security', 'csp', 'headers', 'xss', 'http'],
    isStarter: true,
    isDestructive: false,
    isSecuritySensitive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'starter-nginx-reverse-proxy',
    title: 'Nginx Reverse Proxy with TLS & Hardening',
    category: 'Frontend & Security',
    description:
      'Security-sensitive Nginx server configuration for reverse-proxying local application ports with TLS and security headers.',
    language: 'text',
    content: `server {
    listen 443 ssl http2;
    server_name <DOMAIN_NAME>;

    ssl_certificate /etc/ssl/certs/<CERT_FILE>.crt;
    ssl_certificate_key /etc/ssl/private/<KEY_FILE>.key;
    ssl_protocols TLSv1.2 TLSv1.3;

    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    location / {
        proxy_pass http://127.0.0.1:<PORT>;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}`,
    tags: ['nginx', 'proxy', 'tls', 'ssl', 'security'],
    isStarter: true,
    isDestructive: false,
    isSecuritySensitive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'starter-pg-terminate-idle',
    title: 'PostgreSQL Terminate Stale Idle Connections',
    category: 'Database & SQL',
    description:
      'CAUTION: Destructive administrative query. Forcefully cancels and terminates backend connections idle in transaction > 5 minutes.',
    language: 'sql',
    content: `-- CAUTION: Terminates active backend connections that have been idle in transaction for > 5 minutes
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = '<DATABASE_NAME>'
  AND pid <> pg_backend_pid()
  AND state IN ('idle in transaction', 'idle in transaction (aborted)')
  AND state_change < current_timestamp - INTERVAL '5 minutes';`,
    tags: ['postgres', 'sql', 'database', 'kill', 'admin'],
    isStarter: true,
    isDestructive: true,
    isSecuritySensitive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
];

/**
 * Validates a single recipe object against strict schema rules.
 *
 * @param {unknown} recipe
 * @returns {{ valid: boolean, error: string | null, sanitized?: object }}
 */
export function validateRecipe(recipe) {
  if (!recipe || typeof recipe !== 'object') {
    return { valid: false, error: 'Recipe must be a valid JSON object.' };
  }

  const { id, title, category, description, language, content, tags } = recipe;

  if (typeof id !== 'string' || id.trim() === '') {
    return { valid: false, error: 'Recipe requires a valid non-empty id string.' };
  }

  if (typeof title !== 'string' || title.trim() === '') {
    return { valid: false, error: 'Recipe title is required.' };
  }
  if (title.length > MAX_RECIPE_TITLE_LENGTH) {
    return {
      valid: false,
      error: `Recipe title cannot exceed ${MAX_RECIPE_TITLE_LENGTH} characters.`,
    };
  }

  if (!VALID_CATEGORIES.includes(category)) {
    return {
      valid: false,
      error: `Invalid recipe category: "${category}". Must be one of: ${VALID_CATEGORIES.join(', ')}.`,
    };
  }

  if (!LANGUAGES.includes(language)) {
    return {
      valid: false,
      error: `Invalid recipe language: "${language}". Must be one of: ${LANGUAGES.join(', ')}.`,
    };
  }

  if (typeof content !== 'string' || content.trim() === '') {
    return { valid: false, error: 'Recipe content is required.' };
  }
  if (content.length > MAX_RECIPE_CONTENT_LENGTH) {
    return {
      valid: false,
      error: `Recipe content cannot exceed ${MAX_RECIPE_CONTENT_LENGTH.toLocaleString()} characters.`,
    };
  }

  if (description !== undefined && description !== null) {
    if (typeof description !== 'string') {
      return { valid: false, error: 'Recipe description must be a string if provided.' };
    }
    if (description.length > MAX_RECIPE_DESC_LENGTH) {
      return {
        valid: false,
        error: `Recipe description cannot exceed ${MAX_RECIPE_DESC_LENGTH} characters.`,
      };
    }
  }

  let sanitizedTags = [];
  if (tags !== undefined && tags !== null) {
    if (!Array.isArray(tags)) {
      return { valid: false, error: 'Recipe tags must be an array of strings.' };
    }
    if (tags.length > MAX_RECIPE_TAGS_COUNT) {
      return {
        valid: false,
        error: `Recipe cannot have more than ${MAX_RECIPE_TAGS_COUNT} tags.`,
      };
    }
    for (const tag of tags) {
      if (typeof tag !== 'string' || tag.trim() === '') {
        return { valid: false, error: 'Tags must be non-empty strings.' };
      }
      if (tag.trim().length > MAX_RECIPE_TAG_LENGTH) {
        return {
          valid: false,
          error: `Tag "${tag}" exceeds maximum length of ${MAX_RECIPE_TAG_LENGTH} characters.`,
        };
      }
      sanitizedTags.push(tag.trim().toLowerCase());
    }
    sanitizedTags = Array.from(new Set(sanitizedTags));
  }

  return {
    valid: true,
    error: null,
    sanitized: {
      id: id.trim(),
      title: title.trim(),
      category,
      description: typeof description === 'string' ? description.trim() : '',
      language,
      content,
      tags: sanitizedTags,
      isStarter: Boolean(recipe.isStarter),
      isDestructive: Boolean(recipe.isDestructive),
      isSecuritySensitive: Boolean(recipe.isSecuritySensitive),
      createdAt: recipe.createdAt || new Date().toISOString(),
      updatedAt: recipe.updatedAt || new Date().toISOString(),
    },
  };
}

/**
 * Validates a complete imported JSON string dataset before modifying library.
 * Enforces size limits, version checks, item counts, and schema validation.
 *
 * @param {string} jsonString - Raw file text
 * @returns {{ success: boolean, error?: string, recipes?: Array<object> }}
 */
export function validateImportDataset(jsonString) {
  if (typeof jsonString !== 'string') {
    return { success: false, error: 'Import data must be a text string.' };
  }

  if (jsonString.length > MAX_RECIPE_FILE_SIZE) {
    return {
      success: false,
      error: `Import file exceeds maximum allowed size of 1 MB (${MAX_RECIPE_FILE_SIZE.toLocaleString()} bytes).`,
    };
  }

  if (!jsonString.trim()) {
    return { success: false, error: 'Import file is empty.' };
  }

  let parsed;
  try {
    parsed = JSON.parse(jsonString);
  } catch (err) {
    return {
      success: false,
      error: `Invalid JSON syntax in import file: ${err instanceof Error ? err.message : String(err)}.`,
    };
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return {
      success: false,
      error: 'Import payload must be a JSON object containing schemaVersion and recipes array.',
    };
  }

  if (parsed.schemaVersion !== SCHEMA_VERSION) {
    return {
      success: false,
      error: `Unsupported schema version: ${parsed.schemaVersion}. Supported version is ${SCHEMA_VERSION}.`,
    };
  }

  if (!Array.isArray(parsed.recipes)) {
    return {
      success: false,
      error: 'Invalid export format: missing "recipes" array property.',
    };
  }

  if (parsed.recipes.length === 0) {
    return {
      success: false,
      error: 'Import file contains 0 recipes.',
    };
  }

  if (parsed.recipes.length > MAX_CUSTOM_RECIPES) {
    return {
      success: false,
      error: `Import file contains ${parsed.recipes.length} recipes, exceeding the maximum library limit of ${MAX_CUSTOM_RECIPES}.`,
    };
  }

  const validatedRecipes = [];
  const seenIds = new Set();

  for (let i = 0; i < parsed.recipes.length; i++) {
    const raw = parsed.recipes[i];
    const { valid, error, sanitized } = validateRecipe(raw);
    if (!valid || !sanitized) {
      return {
        success: false,
        error: `Validation failed for recipe #${i + 1}: ${error}`,
      };
    }

    if (seenIds.has(sanitized.id)) {
      return {
        success: false,
        error: `Import contains duplicate ID within file: "${sanitized.id}".`,
      };
    }
    seenIds.add(sanitized.id);

    // Ensure imported items are treated as custom recipes
    sanitized.isStarter = false;
    validatedRecipes.push(sanitized);
  }

  return { success: true, recipes: validatedRecipes };
}

/**
 * Merges imported recipes into existing custom recipes.
 * Predictable duplicate handling strategy: If an incoming recipe ID already exists,
 * a unique imported ID is generated so the recipe is imported alongside without overwriting.
 *
 * @param {Array<object>} existingRecipes
 * @param {Array<object>} incomingRecipes
 * @returns {{ merged: Array<object>, addedCount: number, renamedCount: number }}
 */
export function mergeImportedRecipes(existingRecipes, incomingRecipes) {
  const existingIds = new Set(existingRecipes.map((r) => r.id));
  const merged = [...existingRecipes];
  let addedCount = 0;
  let renamedCount = 0;

  for (const incoming of incomingRecipes) {
    let finalId = incoming.id;
    if (existingIds.has(finalId)) {
      finalId = `${incoming.id}-copy-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      renamedCount++;
    }

    existingIds.add(finalId);
    merged.push({
      ...incoming,
      id: finalId,
      isStarter: false,
    });
    addedCount++;
  }

  return { merged, addedCount, renamedCount };
}

/**
 * Filters a recipe list by search query and category.
 *
 * @param {Array<object>} recipes
 * @param {string} query
 * @param {string} category
 * @returns {Array<object>}
 */
export function filterRecipes(recipes, query, category) {
  if (!Array.isArray(recipes)) return [];

  const trimmedQuery = typeof query === 'string' ? query.trim().toLowerCase() : '';
  const selectedCategory = category || 'All';

  return recipes.filter((recipe) => {
    // Category check
    if (selectedCategory !== 'All' && recipe.category !== selectedCategory) {
      return false;
    }

    // Search query check
    if (!trimmedQuery) {
      return true;
    }

    const titleMatch = recipe.title && recipe.title.toLowerCase().includes(trimmedQuery);
    const descMatch = recipe.description && recipe.description.toLowerCase().includes(trimmedQuery);
    const contentMatch = recipe.content && recipe.content.toLowerCase().includes(trimmedQuery);
    const tagMatch =
      Array.isArray(recipe.tags) && recipe.tags.some((t) => t.toLowerCase().includes(trimmedQuery));
    const langMatch = recipe.language && recipe.language.toLowerCase().includes(trimmedQuery);

    return titleMatch || descMatch || contentMatch || tagMatch || langMatch;
  });
}

/**
 * Formats custom recipes into versioned JSON export payload.
 *
 * @param {Array<object>} customRecipes
 * @returns {string}
 */
export function formatRecipesExport(customRecipes) {
  const payload = {
    tool: 'DevLens Recipe Manager',
    schemaVersion: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    recipeCount: customRecipes.length,
    recipes: customRecipes.map((r) => ({
      id: r.id,
      title: r.title,
      category: r.category,
      description: r.description,
      language: r.language,
      content: r.content,
      tags: r.tags,
      isDestructive: Boolean(r.isDestructive),
      isSecuritySensitive: Boolean(r.isSecuritySensitive),
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    })),
  };
  return JSON.stringify(payload, null, 2);
}

/**
 * Reads a File object as text across standard browsers and JSDOM environments.
 *
 * @param {File} file
 * @returns {Promise<string>}
 */
export function readFileAsText(file) {
  if (typeof file.text === 'function') {
    return file.text();
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error || new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

/**
 * Storage helpers for opt-in browser localStorage persistence.
 */

export function getPersistencePreference() {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(STORAGE_PREF_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setPersistencePreference(enabled) {
  if (typeof window === 'undefined') return false;
  try {
    if (enabled) {
      localStorage.setItem(STORAGE_PREF_KEY, 'true');
    } else {
      localStorage.removeItem(STORAGE_PREF_KEY);
    }
    return true;
  } catch {
    return false;
  }
}

export function loadStoredRecipes() {
  if (typeof window === 'undefined') return [];
  if (!getPersistencePreference()) return [];

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    const validRecipes = [];
    for (const item of parsed) {
      const { valid, sanitized } = validateRecipe(item);
      if (valid && sanitized) {
        sanitized.isStarter = false;
        validRecipes.push(sanitized);
      }
    }
    return validRecipes;
  } catch {
    // Storage corrupted or blocked; return empty without crashing
    return [];
  }
}

export function saveStoredRecipes(customRecipes) {
  if (typeof window === 'undefined') return { success: false, error: 'Window undefined' };
  if (!getPersistencePreference()) return { success: true };

  try {
    const customOnly = customRecipes.filter((r) => !r.isStarter);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customOnly));
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : 'Failed to save to local storage (quota exceeded or storage restricted).',
    };
  }
}

export function clearStoredRecipes() {
  if (typeof window === 'undefined') return false;
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}
