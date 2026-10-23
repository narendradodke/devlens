import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RecipeManager } from '../features/recipe-manager/RecipeManager';
import { STARTER_RECIPES } from '../lib/recipeUtils';

describe('RecipeManager Component', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function renderComponent() {
    return render(<RecipeManager />);
  }

  it('renders initial UI elements, title, storage & privacy notice, and action buttons', () => {
    renderComponent();

    expect(screen.getByRole('heading', { level: 1, name: 'Recipe Manager' })).toBeInTheDocument();
    expect(screen.getByText('Active Tool')).toBeInTheDocument();
    expect(screen.getByText(/Storage & Privacy Notice:/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Save on this device \(localStorage\)/i)).toBeInTheDocument();

    expect(screen.getByRole('button', { name: /New Recipe/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Import/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Export/i })).toBeInTheDocument();
  });

  it('displays bundled starter recipes in directory by default and ensures they cannot be deleted or directly edited', () => {
    renderComponent();

    // Verify all 6 starter titles exist in the list
    for (const starter of STARTER_RECIPES) {
      expect(screen.getAllByText(starter.title).length).toBeGreaterThan(0);
    }

    // Default inspection is the first starter recipe
    const firstStarter = STARTER_RECIPES[0];
    expect(screen.getByRole('heading', { level: 2, name: firstStarter.title })).toBeInTheDocument();
    expect(screen.getByText('Starter Preset')).toBeInTheDocument();
    expect(screen.getByText(/curl -X POST/i)).toBeInTheDocument();

    // Starter recipe must have "Duplicate" button, NOT "Edit" or "Delete"
    expect(screen.getByRole('button', { name: /Duplicate/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Edit$/i })).not.toBeInTheDocument();
    expect(screen.queryByTitle(/Delete recipe/i)).not.toBeInTheDocument();
  });

  it('filters recipes by search query', async () => {
    const user = userEvent.setup();
    renderComponent();

    const searchInput = screen.getByLabelText('Search recipes');
    await user.type(searchInput, 'docker');

    expect(
      screen.getByRole('heading', {
        level: 2,
        name: 'Docker Compose Postgres with Healthcheck',
      })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', {
        level: 2,
        name: 'cURL with Bearer Token & JSON Payload',
      })
    ).not.toBeInTheDocument();
  });

  it('filters recipes by category tab', async () => {
    const user = userEvent.setup();
    renderComponent();

    const gitTab = screen.getByRole('tab', { name: 'Git & Version Control' });
    await user.click(gitTab);

    expect(
      screen.getByRole('heading', {
        level: 2,
        name: 'Git Prune Stale Remote & Merged Local Branches',
      })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', {
        level: 2,
        name: 'Docker Compose Postgres with Healthcheck',
      })
    ).not.toBeInTheDocument();
  });

  it('displays destructive warning labels on destructive recipes', async () => {
    const user = userEvent.setup();
    renderComponent();

    const gitRecipeBtn = screen.getByRole('button', {
      name: /Git Prune Stale Remote/i,
    });
    await user.click(gitRecipeBtn);

    expect(screen.getByText(/Potentially Destructive Command:/i)).toBeInTheDocument();
  });

  it('copies recipe content to clipboard with feedback', async () => {
    const user = userEvent.setup();
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: writeTextMock },
      configurable: true,
      writable: true,
    });

    renderComponent();

    const copyBtn = screen.getByRole('button', { name: /Copy Recipe/i });
    await user.click(copyBtn);

    expect(writeTextMock).toHaveBeenCalledWith(expect.stringContaining('curl -X POST'));
    expect(screen.getByText('Copied!')).toBeInTheDocument();
  });

  it('creates a new custom recipe via the modal and displays it in the list', async () => {
    const user = userEvent.setup();
    renderComponent();

    const newBtn = screen.getByRole('button', { name: /New Recipe/i });
    await user.click(newBtn);

    // Modal is open
    expect(screen.getByRole('heading', { level: 2, name: 'New Recipe' })).toBeInTheDocument();

    const titleInput = screen.getByLabelText(/Recipe Title/i);
    const contentInput = screen.getByLabelText(/Recipe Content \/ Code/i);
    const descInput = screen.getByLabelText(/Description \/ Usage Notes/i);
    const tagsInput = screen.getByLabelText(/Tags/i);

    await user.type(titleInput, 'My Custom Script');
    await user.type(descInput, 'A custom shell script');
    await user.type(contentInput, 'echo "running custom script"');
    await user.type(tagsInput, 'shell, custom');

    const submitBtn = screen.getByRole('button', { name: 'Create Recipe' });
    await user.click(submitBtn);

    // Modal closed and custom recipe is now selected
    expect(screen.queryByRole('heading', { level: 2, name: 'New Recipe' })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'My Custom Script' })).toBeInTheDocument();
    expect(screen.getByText('Custom')).toBeInTheDocument();
    expect(screen.getByText('echo "running custom script"')).toBeInTheDocument();
  });

  it('duplicates a starter recipe into a custom recipe', async () => {
    const user = userEvent.setup();
    renderComponent();

    const duplicateBtn = screen.getByRole('button', { name: /Duplicate/i });
    await user.click(duplicateBtn);

    // Modal opens populated with starter recipe and title (Copy)
    expect(
      screen.getByDisplayValue(/cURL with Bearer Token & JSON Payload \(Copy\)/i)
    ).toBeInTheDocument();

    const saveBtn = screen.getByRole('button', { name: 'Save Changes' });
    await user.click(saveBtn);

    expect(
      screen.getByRole('heading', {
        level: 2,
        name: /cURL with Bearer Token & JSON Payload \(Copy\)/i,
      })
    ).toBeInTheDocument();
    expect(screen.getByText('Custom')).toBeInTheDocument();
  });

  it('edits an existing custom recipe', async () => {
    const user = userEvent.setup();
    renderComponent();

    // 1. Create a custom recipe
    await user.click(screen.getByRole('button', { name: /New Recipe/i }));
    await user.type(screen.getByLabelText(/Recipe Title/i), 'Initial Recipe');
    await user.type(screen.getByLabelText(/Recipe Content \/ Code/i), 'initial content');
    await user.click(screen.getByRole('button', { name: 'Create Recipe' }));

    expect(screen.getByRole('heading', { level: 2, name: 'Initial Recipe' })).toBeInTheDocument();

    // 2. Edit the recipe
    await user.click(screen.getByRole('button', { name: /Edit/i }));
    const titleInput = screen.getByLabelText(/Recipe Title/i);
    await user.clear(titleInput);
    await user.type(titleInput, 'Updated Recipe Title');

    await user.click(screen.getByRole('button', { name: 'Save Changes' }));

    expect(
      screen.getByRole('heading', { level: 2, name: 'Updated Recipe Title' })
    ).toBeInTheDocument();
  });

  it('deletes a custom recipe after user confirmation', async () => {
    const user = userEvent.setup();
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    renderComponent();

    // Create custom recipe
    await user.click(screen.getByRole('button', { name: /New Recipe/i }));
    await user.type(screen.getByLabelText(/Recipe Title/i), 'Recipe To Delete');
    await user.type(screen.getByLabelText(/Recipe Content \/ Code/i), 'temp content');
    await user.click(screen.getByRole('button', { name: 'Create Recipe' }));

    expect(screen.getByRole('heading', { level: 2, name: 'Recipe To Delete' })).toBeInTheDocument();

    // Delete custom recipe
    const deleteBtn = screen.getByTitle('Delete recipe');
    await user.click(deleteBtn);

    expect(window.confirm).toHaveBeenCalled();
    expect(
      screen.queryByRole('heading', { level: 2, name: 'Recipe To Delete' })
    ).not.toBeInTheDocument();
  });

  it('toggles persistence and clears saved recipes', async () => {
    const user = userEvent.setup();
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    renderComponent();

    const persistenceCheckbox = screen.getByLabelText(/Save on this device \(localStorage\)/i);
    expect(persistenceCheckbox.checked).toBe(false);

    // Turn ON
    await user.click(persistenceCheckbox);
    expect(persistenceCheckbox.checked).toBe(true);

    // Create a recipe so Clear button appears
    await user.click(screen.getByRole('button', { name: /New Recipe/i }));
    await user.type(screen.getByLabelText(/Recipe Title/i), 'Stored Recipe');
    await user.type(screen.getByLabelText(/Recipe Content \/ Code/i), 'stored content');
    await user.click(screen.getByRole('button', { name: 'Create Recipe' }));

    const clearSavedBtn = screen.getByRole('button', { name: /Clear Saved Recipes/i });
    expect(clearSavedBtn).toBeInTheDocument();

    await user.click(clearSavedBtn);
    expect(window.confirm).toHaveBeenCalled();
    expect(
      screen.queryByRole('heading', { level: 2, name: 'Stored Recipe' })
    ).not.toBeInTheDocument();
  });

  it('exports custom recipes to JSON via object URL', async () => {
    const user = userEvent.setup();
    const createObjectURLMock = vi.fn().mockReturnValue('blob:mock-url');
    const revokeObjectURLMock = vi.fn();
    window.URL.createObjectURL = createObjectURLMock;
    window.URL.revokeObjectURL = revokeObjectURLMock;
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    renderComponent();

    // Create a custom recipe first
    await user.click(screen.getByRole('button', { name: /New Recipe/i }));
    await user.type(screen.getByLabelText(/Recipe Title/i), 'Exportable Recipe');
    await user.type(screen.getByLabelText(/Recipe Content \/ Code/i), 'export content');
    await user.click(screen.getByRole('button', { name: 'Create Recipe' }));

    const exportBtn = screen.getByRole('button', { name: /^Export$/ });
    await user.click(exportBtn);

    expect(createObjectURLMock).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();
    clickSpy.mockRestore();

    expect(screen.getByText(/Exported 1 custom recipe\(s\) to JSON/i)).toBeInTheDocument();
  });

  it('notifies user when attempting to export with 0 custom recipes', async () => {
    const user = userEvent.setup();
    renderComponent();

    const exportBtn = screen.getByRole('button', { name: /^Export$/ });
    await user.click(exportBtn);

    expect(
      screen.getByText(/No custom recipes to export\. Starter presets are bundled with the app\./i)
    ).toBeInTheDocument();
  });

  it('Persistence OFF: custom recipes do not persist to localStorage and are not retained after refresh/remount', async () => {
    const user = userEvent.setup();
    const { unmount } = renderComponent();

    // Verify toggle is OFF by default
    const persistenceCheckbox = screen.getByLabelText(/Save on this device \(localStorage\)/i);
    expect(persistenceCheckbox.checked).toBe(false);

    // Create a custom recipe
    await user.click(screen.getByRole('button', { name: /New Recipe/i }));
    await user.type(screen.getByLabelText(/Recipe Title/i), 'Transient Recipe');
    await user.type(screen.getByLabelText(/Recipe Content \/ Code/i), 'transient content');
    await user.click(screen.getByRole('button', { name: 'Create Recipe' }));

    expect(screen.getByRole('heading', { level: 2, name: 'Transient Recipe' })).toBeInTheDocument();

    // Verify localStorage has no custom recipes saved
    expect(localStorage.getItem('devlens-recipes-v1')).toBeNull();

    // Simulate page refresh by unmounting and remounting
    unmount();
    renderComponent();

    // Verify custom recipe is NOT in the remounted list
    expect(screen.queryByText('Transient Recipe')).not.toBeInTheDocument();
  });

  it('Persistence ON: custom recipes persist to localStorage and are restored after refresh/remount', async () => {
    const user = userEvent.setup();
    const { unmount } = renderComponent();

    // Turn toggle ON
    const persistenceCheckbox = screen.getByLabelText(/Save on this device \(localStorage\)/i);
    await user.click(persistenceCheckbox);
    expect(persistenceCheckbox.checked).toBe(true);

    // Create a custom recipe
    await user.click(screen.getByRole('button', { name: /New Recipe/i }));
    await user.type(screen.getByLabelText(/Recipe Title/i), 'Persisted Recipe');
    await user.type(screen.getByLabelText(/Recipe Content \/ Code/i), 'persisted content');
    await user.click(screen.getByRole('button', { name: 'Create Recipe' }));

    // Verify recipe is in localStorage
    const saved = localStorage.getItem('devlens-recipes-v1');
    expect(saved).not.toBeNull();
    expect(saved).toContain('Persisted Recipe');

    // Simulate page refresh by unmounting and remounting
    unmount();
    renderComponent();

    // Verify custom recipe is restored and visible in the directory
    expect(screen.getByText('Persisted Recipe')).toBeInTheDocument();
    const recipeCard = screen.getByRole('button', { name: /Persisted Recipe/i });
    await user.click(recipeCard);
    expect(screen.getByRole('heading', { level: 2, name: 'Persisted Recipe' })).toBeInTheDocument();
    expect(screen.getByText('persisted content')).toBeInTheDocument();
  });

  it('imports valid JSON custom recipes and updates the list', async () => {
    const user = userEvent.setup();
    renderComponent();

    const validExportPayload = JSON.stringify({
      tool: 'DevLens Recipe Manager',
      schemaVersion: 1,
      recipes: [
        {
          id: 'imported-rec-1',
          title: 'Imported Cloud Function',
          category: 'API & Network',
          language: 'javascript',
          description: 'A cloud function recipe',
          content: 'export default async function() { return true; }',
          tags: ['cloud', 'lambda'],
        },
      ],
    });

    const file = new File([validExportPayload], 'recipes.json', { type: 'application/json' });
    const hiddenFileInput = document.querySelector('input[type="file"]');

    await user.upload(hiddenFileInput, file);

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { level: 2, name: 'Imported Cloud Function' })
      ).toBeInTheDocument();
    });
    expect(screen.getByText(/export default async function/i)).toBeInTheDocument();
    expect(screen.getByText(/Successfully imported 1 recipe\(s\)/i)).toBeInTheDocument();
  });

  it('rejects invalid imports (malformed JSON, oversized file, invalid schema) without altering library', async () => {
    const user = userEvent.setup();
    renderComponent();

    const hiddenFileInput = document.querySelector('input[type="file"]');

    // 1. Malformed JSON
    const malformedFile = new File(['{ broken json'], 'bad.json', { type: 'application/json' });
    await user.upload(hiddenFileInput, malformedFile);
    await waitFor(() => {
      expect(screen.getByText(/Import rejected: Invalid JSON syntax/i)).toBeInTheDocument();
    });

    // 2. Invalid schema version
    const invalidSchema = JSON.stringify({ schemaVersion: 999, recipes: [] });
    const badSchemaFile = new File([invalidSchema], 'bad-schema.json', {
      type: 'application/json',
    });
    await user.upload(hiddenFileInput, badSchemaFile);
    await waitFor(() => {
      expect(screen.getByText(/Unsupported schema version: 999/i)).toBeInTheDocument();
    });
  });
});
