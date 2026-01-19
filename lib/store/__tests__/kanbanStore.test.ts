import { describe, test, expect, beforeEach, vi } from 'vitest';
import type { Column } from '../../../app/kanban/_components/Column';
import type { Card } from '../../../app/kanban/_components/Card';

// Mock the persistence module BEFORE importing KanbanStore
vi.mock('../persistence', () => ({
  asyncStorage: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  },
}));

import { KanbanStore, DEFAULT_COLUMNS } from '../kanbanStore';
import { asyncStorage } from '../persistence';

describe('KanbanStore', () => {
  const mockProjectId = 'test-project-123';
  const mockStorageKey = 'app-kanban-test-project-123';

  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
  });

  describe('getKanbanData', () => {
    test('returns stored columns when data exists', async () => {
      const mockColumns: Column[] = [
        {
          id: 'col-1',
          title: 'To Do',
          order: 0,
          cards: [
            {
              id: 'card-1',
              title: 'Test Card',
              description: 'Test Description',
              tags: ['test'],
              order: 0,
              createdAt: Date.now(),
              updatedAt: Date.now(),
            },
          ],
        },
      ];

      const mockData = {
        projectId: mockProjectId,
        columns: mockColumns,
        updatedAt: Date.now(),
      };

      vi.mocked(asyncStorage.getItem).mockResolvedValue(JSON.stringify(mockData));

      const result = await KanbanStore.getKanbanData(mockProjectId);

      expect(asyncStorage.getItem).toHaveBeenCalledWith(mockStorageKey);
      expect(result).toEqual(mockColumns);
    });

    test('returns default columns when no data exists', async () => {
      vi.mocked(asyncStorage.getItem).mockResolvedValue(null);

      const result = await KanbanStore.getKanbanData(mockProjectId);

      expect(asyncStorage.getItem).toHaveBeenCalledWith(mockStorageKey);
      expect(result).toEqual(DEFAULT_COLUMNS);
    });

    test('returns default columns on error', async () => {
      vi.mocked(asyncStorage.getItem).mockRejectedValue(new Error('Storage error'));

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await KanbanStore.getKanbanData(mockProjectId);

      expect(result).toEqual(DEFAULT_COLUMNS);
      expect(consoleSpy).toHaveBeenCalledWith('Error loading kanban data:', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });

  describe('saveKanbanData', () => {
    test('saves columns to storage with metadata', async () => {
      const mockColumns: Column[] = [
        {
          id: 'col-1',
          title: 'To Do',
          order: 0,
          cards: [],
        },
      ];

      await KanbanStore.saveKanbanData(mockProjectId, mockColumns);

      expect(asyncStorage.setItem).toHaveBeenCalledWith(
        mockStorageKey,
        expect.stringContaining('"projectId":"test-project-123"')
      );

      const savedData = JSON.parse(
        vi.mocked(asyncStorage.setItem).mock.calls[0][1]
      );

      expect(savedData.projectId).toBe(mockProjectId);
      expect(savedData.columns).toEqual(mockColumns);
      expect(savedData.updatedAt).toBeGreaterThan(0);
    });

    test('throws error when storage fails', async () => {
      const mockError = new Error('Storage write error');
      vi.mocked(asyncStorage.setItem).mockRejectedValue(mockError);

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await expect(
        KanbanStore.saveKanbanData(mockProjectId, [])
      ).rejects.toThrow('Storage write error');

      expect(consoleSpy).toHaveBeenCalledWith('Error saving kanban data:', mockError);

      consoleSpy.mockRestore();
    });
  });

  describe('deleteKanbanData', () => {
    test('removes data from storage', async () => {
      await KanbanStore.deleteKanbanData(mockProjectId);

      expect(asyncStorage.removeItem).toHaveBeenCalledWith(mockStorageKey);
    });

    test('logs error when removal fails', async () => {
      const mockError = new Error('Remove error');
      vi.mocked(asyncStorage.removeItem).mockRejectedValue(mockError);

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await expect(
        KanbanStore.deleteKanbanData(mockProjectId)
      ).rejects.toThrow('Remove error');

      expect(consoleSpy).toHaveBeenCalledWith('Error deleting kanban data:', mockError);

      consoleSpy.mockRestore();
    });
  });

  describe('getKanbanStats', () => {
    test('calculates statistics correctly', async () => {
      const mockColumns: Column[] = [
        {
          id: 'todo',
          title: 'To Do',
          order: 0,
          cards: [
            {
              id: 'card-1',
              title: 'Task 1',
              description: '',
              tags: [],
              order: 0,
              createdAt: Date.now(),
              updatedAt: Date.now(),
            },
            {
              id: 'card-2',
              title: 'Task 2',
              description: '',
              tags: [],
              order: 1,
              createdAt: Date.now(),
              updatedAt: Date.now(),
            },
          ],
        },
        {
          id: 'in-progress',
          title: 'In Progress',
          order: 1,
          cards: [
            {
              id: 'card-3',
              title: 'Task 3',
              description: '',
              tags: [],
              order: 0,
              createdAt: Date.now(),
              updatedAt: Date.now(),
            },
          ],
        },
        {
          id: 'done',
          title: 'Done',
          order: 2,
          cards: [
            {
              id: 'card-4',
              title: 'Task 4',
              description: '',
              tags: [],
              order: 0,
              createdAt: Date.now(),
              updatedAt: Date.now(),
            },
            {
              id: 'card-5',
              title: 'Task 5',
              description: '',
              tags: [],
              order: 1,
              createdAt: Date.now(),
              updatedAt: Date.now(),
            },
          ],
        },
      ];

      const mockData = {
        projectId: mockProjectId,
        columns: mockColumns,
        updatedAt: Date.now(),
      };

      vi.mocked(asyncStorage.getItem).mockResolvedValue(JSON.stringify(mockData));

      const stats = await KanbanStore.getKanbanStats(mockProjectId);

      expect(stats.totalCards).toBe(5);
      expect(stats.cardsByColumn).toEqual({
        todo: 2,
        'in-progress': 1,
        done: 2,
      });
      expect(stats.completedCards).toBe(2);
    });

    test('returns zero stats on error', async () => {
      const mockError = new Error('Stats error');
      vi.mocked(asyncStorage.getItem).mockRejectedValue(mockError);

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const stats = await KanbanStore.getKanbanStats(mockProjectId);

      expect(stats).toEqual({
        totalCards: 0,
        cardsByColumn: {},
        completedCards: 0,
      });
      expect(consoleSpy).toHaveBeenCalledWith('Error getting kanban stats:', mockError);

      consoleSpy.mockRestore();
    });

    test('handles missing done column', async () => {
      const mockColumns: Column[] = [
        {
          id: 'custom-column',
          title: 'Custom',
          order: 0,
          cards: [
            {
              id: 'card-1',
              title: 'Task 1',
              description: '',
              tags: [],
              order: 0,
              createdAt: Date.now(),
              updatedAt: Date.now(),
            },
          ],
        },
      ];

      const mockData = {
        projectId: mockProjectId,
        columns: mockColumns,
        updatedAt: Date.now(),
      };

      vi.mocked(asyncStorage.getItem).mockResolvedValue(JSON.stringify(mockData));

      const stats = await KanbanStore.getKanbanStats(mockProjectId);

      expect(stats.totalCards).toBe(1);
      expect(stats.completedCards).toBe(0);
    });
  });

  describe('createCard', () => {
    test('creates card with all properties', () => {
      const title = 'New Task';
      const description = 'Task description';
      const tags = ['urgent', 'bug'];
      const order = 0;
      const model = 'claude-3-7-sonnet-20250219' as const;

      const card = KanbanStore.createCard(title, description, tags, order, model);

      expect(card.id).toBeTruthy();
      expect(card.title).toBe(title);
      expect(card.description).toBe(description);
      expect(card.tags).toEqual(tags);
      expect(card.model).toBe(model);
      expect(card.order).toBe(order);
      expect(card.createdAt).toBeGreaterThan(0);
      expect(card.updatedAt).toBeGreaterThan(0);
      expect(card.createdAt).toBe(card.updatedAt);
    });

    test('creates card without model', () => {
      const card = KanbanStore.createCard('Task', 'Description', [], 0);

      expect(card.model).toBeUndefined();
      expect(card.id).toBeTruthy();
    });

    test('generates unique IDs for multiple cards', () => {
      const card1 = KanbanStore.createCard('Task 1', '', [], 0);
      const card2 = KanbanStore.createCard('Task 2', '', [], 1);

      expect(card1.id).not.toBe(card2.id);
    });
  });

  describe('createColumn', () => {
    test('creates column with sanitized ID', () => {
      const column = KanbanStore.createColumn('In Progress', 1);

      expect(column.title).toBe('In Progress');
      expect(column.order).toBe(1);
      expect(column.cards).toEqual([]);
      expect(column.id).toMatch(/^in-progress-\d+$/);
    });

    test('handles special characters in title', () => {
      const column = KanbanStore.createColumn('Done! (Final)', 2);

      expect(column.title).toBe('Done! (Final)');
      // Special characters and parentheses are stripped, leaving "done-final"
      expect(column.id).toMatch(/^done-final-\d+$/);
    });

    test('handles empty title', () => {
      const column = KanbanStore.createColumn('', 0);

      expect(column.title).toBe('');
      expect(column.id).toMatch(/^col-\d+$/);
    });

    test('handles whitespace-only title', () => {
      const column = KanbanStore.createColumn('   ', 0);

      expect(column.title).toBe('');
      expect(column.id).toMatch(/^col-\d+$/);
    });

    test('generates unique IDs for multiple columns', async () => {
      const col1 = KanbanStore.createColumn('Column 1', 0);
      // Add a small delay to ensure timestamp differs
      await new Promise(resolve => setTimeout(resolve, 2));
      const col2 = KanbanStore.createColumn('Column 1', 1);

      expect(col1.id).not.toBe(col2.id);
    });
  });

  describe('migrateOldData', () => {
    test('migrates old format to new format', async () => {
      const oldFormatData = [
        {
          id: 'col-1',
          title: 'To Do',
          cards: [
            {
              id: 'card-1',
              title: 'Task',
              description: '',
              tags: [],
            },
          ],
        },
      ];

      vi.mocked(asyncStorage.getItem).mockResolvedValue(JSON.stringify(oldFormatData));

      await KanbanStore.migrateOldData(mockProjectId);

      expect(asyncStorage.setItem).toHaveBeenCalled();

      const savedData = JSON.parse(
        vi.mocked(asyncStorage.setItem).mock.calls[0][1]
      );

      expect(savedData.columns[0].order).toBe(0);
      expect(savedData.columns[0].cards[0].order).toBe(0);
      expect(savedData.columns[0].cards[0].createdAt).toBeGreaterThan(0);
      expect(savedData.columns[0].cards[0].updatedAt).toBeGreaterThan(0);
    });

    test('skips migration when no data exists', async () => {
      vi.mocked(asyncStorage.getItem).mockResolvedValue(null);

      await KanbanStore.migrateOldData(mockProjectId);

      expect(asyncStorage.setItem).not.toHaveBeenCalled();
    });

    test('skips migration when data is already in new format', async () => {
      const newFormatData = {
        projectId: mockProjectId,
        columns: [],
        updatedAt: Date.now(),
      };

      vi.mocked(asyncStorage.getItem).mockResolvedValue(JSON.stringify(newFormatData));

      await KanbanStore.migrateOldData(mockProjectId);

      expect(asyncStorage.setItem).not.toHaveBeenCalled();
    });

    test('handles migration errors gracefully', async () => {
      vi.mocked(asyncStorage.getItem).mockRejectedValue(new Error('Migration error'));

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await KanbanStore.migrateOldData(mockProjectId);

      expect(consoleSpy).toHaveBeenCalledWith('Error migrating kanban data:', expect.any(Error));

      consoleSpy.mockRestore();
    });

    test('preserves existing order values during migration', async () => {
      const oldFormatData = [
        {
          id: 'col-1',
          title: 'Column',
          order: 5,
          cards: [
            {
              id: 'card-1',
              title: 'Card',
              description: '',
              tags: [],
              order: 3,
              createdAt: 123456,
              updatedAt: 789012,
            },
          ],
        },
      ];

      vi.mocked(asyncStorage.getItem).mockResolvedValue(JSON.stringify(oldFormatData));

      await KanbanStore.migrateOldData(mockProjectId);

      const savedData = JSON.parse(
        vi.mocked(asyncStorage.setItem).mock.calls[0][1]
      );

      expect(savedData.columns[0].order).toBe(5);
      expect(savedData.columns[0].cards[0].order).toBe(3);
      expect(savedData.columns[0].cards[0].createdAt).toBe(123456);
      expect(savedData.columns[0].cards[0].updatedAt).toBe(789012);
    });
  });

  describe('edge cases', () => {
    test('handles empty columns array', async () => {
      const mockData = {
        projectId: mockProjectId,
        columns: [],
        updatedAt: Date.now(),
      };

      vi.mocked(asyncStorage.getItem).mockResolvedValue(JSON.stringify(mockData));

      const result = await KanbanStore.getKanbanData(mockProjectId);
      expect(result).toEqual([]);

      const stats = await KanbanStore.getKanbanStats(mockProjectId);
      expect(stats.totalCards).toBe(0);
    });

    test('handles malformed JSON data', async () => {
      vi.mocked(asyncStorage.getItem).mockResolvedValue('invalid json');

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await KanbanStore.getKanbanData(mockProjectId);
      expect(result).toEqual(DEFAULT_COLUMNS);

      consoleSpy.mockRestore();
    });

    test('creates cards with very long titles', () => {
      const longTitle = 'A'.repeat(1000);
      const card = KanbanStore.createCard(longTitle, '', [], 0);

      expect(card.title).toBe(longTitle);
      expect(card.id).toBeTruthy();
    });

    test('creates columns with unicode characters', () => {
      const column = KanbanStore.createColumn('待办事项 🚀', 0);

      expect(column.title).toBe('待办事项 🚀');
      expect(column.id).toBeTruthy();
    });

    test('handles concurrent save operations', async () => {
      const columns1: Column[] = [{ id: 'col-1', title: 'Col 1', order: 0, cards: [] }];
      const columns2: Column[] = [{ id: 'col-2', title: 'Col 2', order: 0, cards: [] }];

      // Reset the mock to allow these operations to succeed
      vi.mocked(asyncStorage.setItem).mockResolvedValue(undefined);

      // Both saves should complete without error
      await Promise.all([
        KanbanStore.saveKanbanData('project-1', columns1),
        KanbanStore.saveKanbanData('project-2', columns2),
      ]);

      expect(asyncStorage.setItem).toHaveBeenCalledTimes(2);
    });
  });
});
