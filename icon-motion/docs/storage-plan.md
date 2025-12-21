# Storage Plan - Technical Specification

> Local storage strategy for Icon Motion with 20-item limit and recents display.

---

## Overview

| Feature | MVP (Free) | Future (Auth) |
|---------|------------|---------------|
| Storage Limit | 20 icons | Unlimited |
| Persistence | localStorage | Cloud sync |
| Recents | ✅ Yes | ✅ Yes |
| Cross-device | ❌ No | ✅ Yes |

---

## Storage Architecture

### MVP: localStorage-based

```typescript
// Storage key
const STORAGE_KEY = 'iconmotion_projects';

// Data structure
interface StoredProject {
  id: string;
  name: string;                  // Derived from filename or auto-generated
  svgContent: string;            // Raw SVG string
  thumbnail?: string;            // Base64 mini preview (optional)
  animationPreset: string;       // Preset ID
  animationSettings: Partial<AnimationSettings>;
  createdAt: number;             // Unix timestamp
  updatedAt: number;             // Unix timestamp
}

interface StorageState {
  projects: StoredProject[];
  lastActiveId: string | null;   // Auto-restore on visit
  preferences: UserPreferences;
}

interface UserPreferences {
  previewSize: number;
  previewBackground: 'dots' | 'white' | 'black' | 'custom';
  customBackgroundColor: string;
  playbackSpeed: number;
}
```

---

## Storage Limits

| Constraint | Value | Reason |
|------------|-------|--------|
| Max projects | 20 | localStorage size limit (~5MB) |
| Max SVG size | 200KB | Keep total under limit |
| Total storage | ~5MB | Browser localStorage limit |

### Auto-Cleanup

When limit reached:
1. Delete oldest project (by `updatedAt`)
2. Save new project
3. Show toast: "Oldest icon removed to make room"

---

## CRUD Operations

### Create (Save New Icon)

```typescript
const saveProject = (svgContent: string, settings: AnimationSettings): string => {
  const storage = loadStorage();
  
  const project: StoredProject = {
    id: generateId(),
    name: extractIconName(svgContent) || `Icon ${storage.projects.length + 1}`,
    svgContent,
    animationPreset: settings.transformPreset || 'none',
    animationSettings: settings,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  
  // Add to front (most recent first)
  storage.projects.unshift(project);
  
  // Enforce limit
  if (storage.projects.length > 20) {
    storage.projects = storage.projects.slice(0, 20);
  }
  
  storage.lastActiveId = project.id;
  persistStorage(storage);
  
  return project.id;
};
```

### Read (Load Projects)

```typescript
const loadStorage = (): StorageState => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultStorage();
    return JSON.parse(raw);
  } catch {
    return getDefaultStorage();
  }
};

const getProject = (id: string): StoredProject | null => {
  const storage = loadStorage();
  return storage.projects.find(p => p.id === id) || null;
};

const getRecentProjects = (limit = 10): StoredProject[] => {
  const storage = loadStorage();
  return storage.projects.slice(0, limit);
};
```

### Update (Save Changes)

```typescript
const updateProject = (id: string, updates: Partial<StoredProject>): void => {
  const storage = loadStorage();
  const index = storage.projects.findIndex(p => p.id === id);
  
  if (index !== -1) {
    storage.projects[index] = {
      ...storage.projects[index],
      ...updates,
      updatedAt: Date.now(),
    };
    
    // Move to front (most recently used)
    const [updated] = storage.projects.splice(index, 1);
    storage.projects.unshift(updated);
    
    persistStorage(storage);
  }
};
```

### Delete

```typescript
const deleteProject = (id: string): void => {
  const storage = loadStorage();
  storage.projects = storage.projects.filter(p => p.id !== id);
  
  if (storage.lastActiveId === id) {
    storage.lastActiveId = storage.projects[0]?.id || null;
  }
  
  persistStorage(storage);
};

const clearAllProjects = (): void => {
  const storage = loadStorage();
  storage.projects = [];
  storage.lastActiveId = null;
  persistStorage(storage);
};
```

---

## Recents UI

### Location

In the "Add SVG" panel, below the upload area:

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│   ┌───────────────────────────────────────────────────────────┐     │
│   │                                                           │     │
│   │              📁 Drop your SVG here                        │     │
│   │                                                           │     │
│   │              or click to browse                           │     │
│   │                                                           │     │
│   └───────────────────────────────────────────────────────────┘     │
│                                                                     │
│   Recent (5 of 20)                            [Clear All]           │
│   ┌────┐  ┌────┐  ┌────┐  ┌────┐  ┌────┐                           │
│   │ 🔔 │  │ ⚙️ │  │ ❤️ │  │ 📧 │  │ 🏠 │                           │
│   │bell│  │gear│  │hear│  │mail│  │home│                           │
│   └────┘  └────┘  └────┘  └────┘  └────┘                           │
│                                                                     │
│   [Show all 20 →]                                                   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Recent Item Component

```
┌────────────────┐
│   ┌────────┐   │
│   │  SVG   │   │  ← Mini preview (actual icon)
│   │ Preview│   │
│   └────────┘   │
│                │
│  bell-icon     │  ← Name (truncated if long)
│  2 min ago     │  ← Relative time
│       ✕        │  ← Delete button (on hover)
└────────────────┘
```

### Interactions

| Action | Result |
|--------|--------|
| Click item | Load icon + settings into editor |
| Hover item | Show delete button |
| Click ✕ | Delete with confirmation |
| Clear All | Confirm → delete all |

---

## Auto-Restore on Visit

When user returns to Icon Motion:

```typescript
const initializeFromStorage = () => {
  const storage = loadStorage();
  
  if (storage.lastActiveId) {
    const lastProject = getProject(storage.lastActiveId);
    if (lastProject) {
      // Restore to editor
      loadProjectIntoEditor(lastProject);
      showToast('Restored: ' + lastProject.name);
    }
  }
};
```

### First Visit Experience

If no stored projects:
- Show default sample icon
- Hide "Recent" section

---

## Storage Events

### On SVG Upload

```typescript
const handleSVGUpload = (svgContent: string, filename: string) => {
  // 1. Check size
  if (svgContent.length > 200 * 1024) {
    showError('SVG too large (max 200KB)');
    return;
  }
  
  // 2. Parse SVG
  const parsed = parseSVG(svgContent);
  
  // 3. Save to storage
  const projectId = saveProject(svgContent, getDefaultSettings());
  
  // 4. Load into editor
  setCurrentProject(projectId);
};
```

### On Settings Change

```typescript
// Debounced auto-save (every 1 second of inactivity)
const handleSettingsChange = useDebouncedCallback((settings: AnimationSettings) => {
  if (currentProjectId) {
    updateProject(currentProjectId, { animationSettings: settings });
  }
}, 1000);
```

---

## Storage Utilities

```typescript
// Generate unique ID
const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Extract name from SVG or filename
const extractIconName = (svg: string): string | null => {
  // Try to get from <title> element
  const titleMatch = svg.match(/<title>([^<]+)<\/title>/i);
  if (titleMatch) return titleMatch[1];
  
  // Try to get from id attribute on root
  const idMatch = svg.match(/<svg[^>]*id="([^"]+)"/i);
  if (idMatch) return idMatch[1];
  
  return null;
};

// Format relative time
const formatRelativeTime = (timestamp: number): string => {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
};
```

---

## Error Handling

| Scenario | Handling |
|----------|----------|
| localStorage full | Clear oldest, retry, show warning |
| Corrupted JSON | Reset storage, start fresh |
| Private browsing | Warn user data won't persist |
| SVG too large | Reject with error message |

```typescript
const persistStorage = (storage: StorageState): boolean => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));
    return true;
  } catch (e) {
    if (e instanceof DOMException && e.name === 'QuotaExceededError') {
      // Try removing oldest
      if (storage.projects.length > 1) {
        storage.projects.pop();
        return persistStorage(storage);
      }
    }
    console.error('Storage failed:', e);
    return false;
  }
};
```

---

## Future: Cloud Storage (with Auth)

When auth is added:

| Feature | Implementation |
|---------|----------------|
| Unlimited storage | Store in database |
| Sync across devices | Real-time sync |
| Share projects | Shareable links |
| Team workspaces | Collaboration |

Migration path:
1. On login, upload local projects to cloud
2. Merge with existing cloud projects
3. Continue using localStorage as cache

---

## Implementation Checklist

- [ ] Create storage utilities (`lib/storage.ts`)
- [ ] Add StoredProject type to `types.ts`
- [ ] Implement save on upload
- [ ] Implement auto-save on settings change
- [ ] Add Recent icons UI to AddSVGPanel
- [ ] Add delete functionality
- [ ] Add "Clear All" with confirmation
- [ ] Auto-restore last project on visit
- [ ] Add toast notifications for storage events
- [ ] Handle storage errors gracefully

---

*Document Version: 1.0*  
*Created: December 20, 2024*
