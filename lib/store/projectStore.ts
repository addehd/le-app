import { asyncStorage } from './persistence';

const PROJECTS_STORAGE_KEY = 'app-projects';

export interface Project {
  id: string;
  title: string;
  description?: string;
  rootDir?: string; // Root directory for agent operations
  color: 'blue' | 'purple' | 'pink' | 'green' | 'orange';
  createdAt: number;
  updatedAt: number;
}

// Gradient colors inspired by the image
export const PROJECT_COLORS = {
  blue: {
    from: '#E0F2FE',
    to: '#DBEAFE',
  },
  purple: {
    from: '#EDE9FE',
    to: '#E9D5FF',
  },
  pink: {
    from: '#FCE7F3',
    to: '#FED7E2',
  },
  green: {
    from: '#D1FAE5',
    to: '#A7F3D0',
  },
  orange: {
    from: '#FED7AA',
    to: '#FDBA74',
  },
};

export class ProjectStore {
  static async getProjects(): Promise<Project[]> {
    try {
      const stored = await asyncStorage.getItem(PROJECTS_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
      return [];
    } catch (error) {
      console.error('Error loading projects:', error);
      return [];
    }
  }

  static async saveProjects(projects: Project[]): Promise<void> {
    try {
      await asyncStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
    } catch (error) {
      console.error('Error saving projects:', error);
    }
  }

  static async createProject(title: string, description?: string, rootDir?: string): Promise<Project> {
    const projects = await this.getProjects();
    const colors: Array<'blue' | 'purple' | 'pink' | 'green' | 'orange'> = ['blue', 'purple', 'pink', 'green', 'orange'];
    const color = colors[projects.length % colors.length];
    
    const newProject: Project = {
      id: `project-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title,
      description,
      rootDir,
      color,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    projects.push(newProject);
    await this.saveProjects(projects);
    return newProject;
  }

  static async updateProject(id: string, updates: Partial<Project>): Promise<void> {
    const projects = await this.getProjects();
    const index = projects.findIndex(p => p.id === id);
    if (index !== -1) {
      projects[index] = { ...projects[index], ...updates, updatedAt: Date.now() };
      await this.saveProjects(projects);
    }
  }

  static async deleteProject(id: string): Promise<void> {
    const projects = await this.getProjects();
    const filtered = projects.filter(p => p.id !== id);
    await this.saveProjects(filtered);
    
    // Also delete the project's kanban data
    try {
      await asyncStorage.removeItem(`app-kanban-${id}`);
    } catch (error) {
      console.error('Error deleting project kanban data:', error);
    }
  }
}

