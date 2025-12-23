import { asyncStorage } from './persistence';
import type { Column } from '../../app/kanban/components/Column';
import type { Card } from '../../app/kanban/components/Card';

// Default columns structure for new projects
export const DEFAULT_COLUMNS: Column[] = [
  {
    id: 'todo',
    title: 'To Do',
    order: 0,
    cards: [],
  },
  {
    id: 'in-progress',
    title: 'In Progress',
    order: 1,
    cards: [],
  },
  {
    id: 'done',
    title: 'Done',
    order: 2,
    cards: [],
  },
];

export interface KanbanData {
  projectId: string;
  columns: Column[];
  updatedAt: number;
}

export class KanbanStore {
  /**
   * Get storage key for a specific project
   */
  private static getStorageKey(projectId: string): string {
    return `app-kanban-${projectId}`;
  }

  /**
   * Get kanban data for a specific project
   */
  static async getKanbanData(projectId: string): Promise<Column[]> {
    try {
      const storageKey = this.getStorageKey(projectId);
      const stored = await asyncStorage.getItem(storageKey);
      
      if (stored) {
        const data: KanbanData = JSON.parse(stored);
        return data.columns;
      }
      
      // Return default columns if no data exists
      return DEFAULT_COLUMNS;
    } catch (error) {
      console.error('Error loading kanban data:', error);
      return DEFAULT_COLUMNS;
    }
  }

  /**
   * Save kanban data for a specific project
   */
  static async saveKanbanData(projectId: string, columns: Column[]): Promise<void> {
    try {
      const storageKey = this.getStorageKey(projectId);
      const data: KanbanData = {
        projectId,
        columns,
        updatedAt: Date.now(),
      };
      
      await asyncStorage.setItem(storageKey, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving kanban data:', error);
      throw error;
    }
  }

  /**
   * Delete kanban data for a specific project
   */
  static async deleteKanbanData(projectId: string): Promise<void> {
    try {
      const storageKey = this.getStorageKey(projectId);
      await asyncStorage.removeItem(storageKey);
    } catch (error) {
      console.error('Error deleting kanban data:', error);
      throw error;
    }
  }

  /**
   * Get statistics for a project's kanban board
   */
  static async getKanbanStats(projectId: string): Promise<{
    totalCards: number;
    cardsByColumn: Record<string, number>;
    completedCards: number;
  }> {
    try {
      const columns = await this.getKanbanData(projectId);
      
      let totalCards = 0;
      const cardsByColumn: Record<string, number> = {};
      
      columns.forEach(column => {
        const cardCount = column.cards.length;
        totalCards += cardCount;
        cardsByColumn[column.id] = cardCount;
      });

      // Assume 'done' column contains completed cards
      const completedCards = cardsByColumn['done'] || 0;

      return {
        totalCards,
        cardsByColumn,
        completedCards,
      };
    } catch (error) {
      console.error('Error getting kanban stats:', error);
      return {
        totalCards: 0,
        cardsByColumn: {},
        completedCards: 0,
      };
    }
  }

  /**
   * Create a new card in a column
   */
  static createCard(
    title: string,
    description: string,
    tags: string[],
    order: number,
    model?: 'gemini-2.0-flash-exp' | 'claude-3-7-sonnet-20250219'
  ): Card {
    const now = Date.now();
    return {
      id: `card-${now}-${Math.random().toString(36).substr(2, 9)}`,
      title,
      description,
      tags,
      model,
      order,
      createdAt: now,
      updatedAt: now,
    };
  }

  /**
   * Create a new column
   */
  static createColumn(title: string, order: number): Column {
    const base = title.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const id = `${base || 'col'}-${Date.now()}`;
    
    return {
      id,
      title: title.trim(),
      order,
      cards: [],
    };
  }

  /**
   * Migrate old kanban data format to new format (if needed)
   */
  static async migrateOldData(projectId: string): Promise<void> {
    try {
      const storageKey = this.getStorageKey(projectId);
      const stored = await asyncStorage.getItem(storageKey);
      
      if (!stored) return;
      
      const data = JSON.parse(stored);
      
      // Check if data is in old format (just an array of columns)
      if (Array.isArray(data)) {
        // Add order to columns if missing
        const migratedColumns = data.map((col, index) => ({
          ...col,
          order: col.order !== undefined ? col.order : index,
          cards: col.cards.map((card: any, cardIndex: number) => ({
            ...card,
            order: card.order !== undefined ? card.order : cardIndex,
            createdAt: card.createdAt || Date.now(),
            updatedAt: card.updatedAt || Date.now(),
          })),
        }));
        
        await this.saveKanbanData(projectId, migratedColumns);
        console.log(`Migrated kanban data for project: ${projectId}`);
      }
    } catch (error) {
      console.error('Error migrating kanban data:', error);
    }
  }
}
