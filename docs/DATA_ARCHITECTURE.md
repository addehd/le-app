# Data Architecture - Phase 1: Local Storage

## Overview

This document describes the local storage implementation for the project/kanban management system. All data is stored client-side using `localStorage` (web) or `AsyncStorage` (native).

## Storage Keys

### Projects Storage
**Key:** `app-projects`

Stores the list of all projects.

```typescript
[
  {
    "id": "project-1699876543210-abc123",
    "title": "Website Redesign",
    "description": "Complete redesign of company website",
    "color": "blue" | "purple" | "pink" | "green" | "orange",
    "createdAt": 1699876543210,
    "updatedAt": 1699876543210
  }
]
```

### Kanban Data per Project
**Key:** `app-kanban-{projectId}`

Stores the kanban board data for a specific project.

```typescript
{
  "projectId": "project-1699876543210-abc123",
  "columns": [
    {
      "id": "todo",
      "title": "To Do",
      "order": 0,
      "cards": [
        {
          "id": "card-1699876543210-xyz789",
          "title": "Design homepage",
          "description": "Create mockups for homepage layout",
          "tags": ["design", "ui"],
          "order": 0,
          "createdAt": 1699876543210,
          "updatedAt": 1699876543210
        }
      ]
    }
  ],
  "updatedAt": 1699876543210
}
```

## Data Flow

### Creating a Project
1. User clicks "New Project" on homepage
2. Fills in title and optional description
3. `ProjectStore.createProject()` is called
4. Project is added to `app-projects` storage
5. Project appears on homepage with 0/0 tasks

### Accessing Kanban Board
1. User clicks on a project card
2. Navigate to `/kanban?projectId={projectId}`
3. `KanbanBoard` component receives `projectId` prop
4. `KanbanStore.getKanbanData(projectId)` loads the board
5. If no data exists, default columns (To Do, In Progress, Done) are created

### Adding Cards
1. User clicks "Add Card" in a column
2. Fills in title, description, and tags
3. `KanbanStore.createCard()` generates a new card with:
   - Unique ID
   - Order number (appended to end of column)
   - Timestamps (createdAt, updatedAt)
4. Card is added to column
5. Board data is auto-saved to `app-kanban-{projectId}`

### Viewing Stats
1. Homepage loads all projects from `app-projects`
2. For each project, `KanbanStore.getKanbanStats(projectId)` calculates:
   - Total cards across all columns
   - Completed cards (cards in "done" column)
3. Stats are displayed on project card

## Store Classes

### ProjectStore (`lib/store/projectStore.ts`)
Manages project metadata.

**Methods:**
- `getProjects()` - Load all projects
- `createProject(title, description)` - Create new project
- `updateProject(id, updates)` - Update project details
- `deleteProject(id)` - Delete project and its kanban data

### KanbanStore (`lib/store/kanbanStore.ts`)
Manages kanban board data for projects.

**Methods:**
- `getKanbanData(projectId)` - Load kanban board for project
- `saveKanbanData(projectId, columns)` - Save kanban board
- `deleteKanbanData(projectId)` - Delete kanban board
- `getKanbanStats(projectId)` - Get statistics for project
- `createCard(title, description, tags, order)` - Factory for cards
- `createColumn(title, order)` - Factory for columns
- `migrateOldData(projectId)` - Migrate legacy data format

## Key Features

### ✅ Project-Kanban Linking
- Each kanban board is stored with a unique key per project
- Deleting a project also deletes its kanban data
- Projects can have independent kanban boards

### ✅ Automatic Persistence
- Changes are automatically saved to local storage
- No manual save button required
- Data persists across page reloads

### ✅ Order Management
- Columns have explicit `order` field
- Cards have explicit `order` field
- Enables proper drag-and-drop reordering

### ✅ Statistics Tracking
- Real-time calculation of task counts
- Progress tracking (completed vs total)
- Displayed on project cards

### ✅ Data Migration
- Automatic migration from old format to new format
- Adds missing fields (order, timestamps)
- Maintains backward compatibility

## Storage Limits

### Web (localStorage)
- **Limit:** ~5-10 MB
- **Per-origin:** Shared across entire domain
- **Persistence:** Until manually cleared

### Native (AsyncStorage)
- **Limit:** Device-dependent (typically 6-10 MB)
- **Per-app:** Isolated to this app
- **Persistence:** Until app is uninstalled

## Future Enhancements (Phase 2+)

When moving to database (PostgreSQL), this structure will map to:

- `app-projects` → `projects` table
- `app-kanban-{projectId}` → `columns` and `cards` tables (with foreign keys)
- Stats will be calculated via SQL queries
- Real-time sync will replace localStorage saves

## Testing Storage

### View Current Storage
```javascript
// In browser console
Object.keys(localStorage)
  .filter(key => key.startsWith('app-'))
  .forEach(key => {
    console.log(key, JSON.parse(localStorage.getItem(key)));
  });
```

### Clear All App Data
```javascript
// In app
import { clearAllStorage } from './lib/store/persistence';
await clearAllStorage();
```

### Get Storage Info
```javascript
// In app
import { getStorageInfo } from './lib/store/persistence';
const info = await getStorageInfo();
console.log('Keys:', info.keys);
console.log('Total size:', info.totalSize, 'bytes');
```
