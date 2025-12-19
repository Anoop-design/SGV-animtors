'use client';

import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { AnimationSettings, ParsedPath, ParsedSVG } from '@/types';

// Project data structure for persistence
export interface Project {
    id: string;
    name: string;
    createdAt: number;
    updatedAt: number;
    svgSource: string;
    parsedSVG: ParsedSVG | null;
    settings: AnimationSettings;
    version: number;
}

// Database schema
interface IconMotionDB extends DBSchema {
    projects: {
        key: string;
        value: Project;
        indexes: { 'by-updated': number };
    };
}

const DB_NAME = 'icon-motion-db';
const DB_VERSION = 1;
const LAST_PROJECT_KEY = 'icon-motion-last-project-id';

let dbPromise: Promise<IDBPDatabase<IconMotionDB>> | null = null;

// Initialize database
function getDB(): Promise<IDBPDatabase<IconMotionDB>> {
    if (!dbPromise) {
        dbPromise = openDB<IconMotionDB>(DB_NAME, DB_VERSION, {
            upgrade(db) {
                const store = db.createObjectStore('projects', { keyPath: 'id' });
                store.createIndex('by-updated', 'updatedAt');
            },
        });
    }
    return dbPromise;
}

// Generate unique ID
export function generateProjectId(): string {
    return `project-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Save project to IndexedDB
export async function saveProject(project: Project): Promise<void> {
    const db = await getDB();
    await db.put('projects', {
        ...project,
        updatedAt: Date.now(),
    });
    // Also save as last opened project
    localStorage.setItem(LAST_PROJECT_KEY, project.id);
}

// Load project by ID
export async function loadProject(id: string): Promise<Project | undefined> {
    const db = await getDB();
    return db.get('projects', id);
}

// Load all projects (sorted by updated time)
export async function loadAllProjects(): Promise<Project[]> {
    const db = await getDB();
    const projects = await db.getAllFromIndex('projects', 'by-updated');
    return projects.reverse(); // Most recent first
}

// Delete project
export async function deleteProject(id: string): Promise<void> {
    const db = await getDB();
    await db.delete('projects', id);

    // If this was the last project, clear the pointer
    if (localStorage.getItem(LAST_PROJECT_KEY) === id) {
        localStorage.removeItem(LAST_PROJECT_KEY);
    }
}

// Get last opened project ID
export function getLastProjectId(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(LAST_PROJECT_KEY);
}

// Create a new empty project
export function createEmptyProject(name: string = 'Untitled'): Project {
    const defaultSettings: AnimationSettings = {
        duration: 2,
        delay: 0.2,
        staggerMode: 'forward',
        staggerAmount: 0.3,
        easing: 'ease-in-out',
        customEasing: '0.4, 0, 0.2, 1',
        overrideColor: false,
        strokeColor: '#000000',
        strokeWidth: 2,
        useOriginalColors: true,
        forceStroke: false,
        lineCap: 'round',
        lineJoin: 'round',
        fillMode: 'none',
        loop: true,
        trigger: 'auto',
        transformPreset: null,
        globalTransform: {
            initial: { x: 0, y: 0, scale: 1, rotate: 0, opacity: 1 },
            final: { x: 0, y: 0, scale: 1, rotate: 0, opacity: 1 },
        },
        animationDirection: 'in',
    };

    return {
        id: generateProjectId(),
        name,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        svgSource: '',
        parsedSVG: null,
        settings: defaultSettings,
        version: 1,
    };
}

// Debounce helper
export function debounce<T extends (...args: never[]) => unknown>(
    fn: T,
    delay: number
): (...args: Parameters<T>) => void {
    let timeoutId: NodeJS.Timeout | null = null;
    return (...args: Parameters<T>) => {
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn(...args), delay);
    };
}

