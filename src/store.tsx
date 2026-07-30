import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type {
  Change,
  Character,
  Database,
  ID,
  NewChange,
  Place,
  Project,
  ProjectData,
  StoryEvent,
} from './types';
import { emptyDatabase, loadDatabase, newId, saveDatabase } from './storage';
import { sampleDatabase } from './sampleData';

const PALETTE = ['#c2703f', '#5b7fb5', '#6a9c78', '#8f6ba8', '#b5644f', '#4f8a8b', '#a8834a', '#7b6bad'];

interface ChronicleStore {
  db: Database;
  projects: Project[];
  getData: (projectId: ID) => ProjectData;

  createProject: (title: string, premise: string, timeUnit: string) => ID;
  updateProject: (projectId: ID, patch: Partial<Project>) => void;
  deleteProject: (projectId: ID) => void;

  addCharacter: (projectId: ID, name: string) => ID;
  updateCharacter: (projectId: ID, characterId: ID, patch: Partial<Character>) => void;
  deleteCharacter: (projectId: ID, characterId: ID) => void;

  addPlace: (projectId: ID, name: string) => ID;
  updatePlace: (projectId: ID, placeId: ID, patch: Partial<Place>) => void;
  deletePlace: (projectId: ID, placeId: ID) => void;

  addEvent: (projectId: ID, title: string) => ID;
  updateEvent: (projectId: ID, eventId: ID, patch: Partial<StoryEvent>) => void;
  deleteEvent: (projectId: ID, eventId: ID) => void;

  addChange: (projectId: ID, eventId: ID, change: NewChange) => void;
  updateChange: (projectId: ID, eventId: ID, changeId: ID, patch: Partial<Change>) => void;
  deleteChange: (projectId: ID, eventId: ID, changeId: ID) => void;

  replaceDatabase: (db: Database) => void;
  loadSample: () => void;
}

const StoreContext = createContext<ChronicleStore | null>(null);

const EMPTY_DATA: ProjectData = { characters: [], places: [], events: [] };

export function ChronicleProvider({ children }: { children: ReactNode }) {
  // First run gets the sample story rather than an empty screen.
  const [db, setDb] = useState<Database>(() => loadDatabase() ?? sampleDatabase());

  useEffect(() => {
    saveDatabase(db);
  }, [db]);

  /** Apply `fn` to one project's data and stamp the project as updated. */
  const mutate = useCallback((projectId: ID, fn: (data: ProjectData) => ProjectData) => {
    setDb((previous) => {
      const existing = previous.data[projectId] ?? EMPTY_DATA;
      return {
        ...previous,
        projects: previous.projects.map((project) =>
          project.id === projectId ? { ...project, updatedAt: new Date().toISOString() } : project,
        ),
        data: { ...previous.data, [projectId]: fn(existing) },
      };
    });
  }, []);

  const store = useMemo<ChronicleStore>(() => {
    const mutateEvent = (projectId: ID, eventId: ID, fn: (event: StoryEvent) => StoryEvent) =>
      mutate(projectId, (data) => ({
        ...data,
        events: data.events.map((event) => (event.id === eventId ? fn(event) : event)),
      }));

    return {
      db,
      projects: db.projects,
      getData: (projectId) => db.data[projectId] ?? EMPTY_DATA,

      createProject: (title, premise, timeUnit) => {
        const id = newId();
        const now = new Date().toISOString();
        setDb((previous) => ({
          ...previous,
          projects: [
            ...previous.projects,
            { id, title, premise, timeUnit: timeUnit || 'Day', createdAt: now, updatedAt: now },
          ],
          data: { ...previous.data, [id]: { characters: [], places: [], events: [] } },
        }));
        return id;
      },

      updateProject: (projectId, patch) =>
        setDb((previous) => ({
          ...previous,
          projects: previous.projects.map((project) =>
            project.id === projectId
              ? { ...project, ...patch, updatedAt: new Date().toISOString() }
              : project,
          ),
        })),

      deleteProject: (projectId) =>
        setDb((previous) => {
          const data = { ...previous.data };
          delete data[projectId];
          return {
            ...previous,
            projects: previous.projects.filter((project) => project.id !== projectId),
            data,
          };
        }),

      addCharacter: (projectId, name) => {
        const id = newId();
        mutate(projectId, (data) => ({
          ...data,
          characters: [
            ...data.characters,
            {
              id,
              projectId,
              name,
              role: '',
              color: PALETTE[data.characters.length % PALETTE.length],
              base: { Status: 'Alive' },
              notes: '',
            },
          ],
        }));
        return id;
      },

      updateCharacter: (projectId, characterId, patch) =>
        mutate(projectId, (data) => ({
          ...data,
          characters: data.characters.map((character) =>
            character.id === characterId ? { ...character, ...patch } : character,
          ),
        })),

      // Deleting a character has to scrub them out of every event too, or the
      // replay is left holding references to somebody who no longer exists.
      deleteCharacter: (projectId, characterId) =>
        mutate(projectId, (data) => ({
          ...data,
          characters: data.characters.filter((character) => character.id !== characterId),
          events: data.events.map((event) => ({
            ...event,
            participantIds: event.participantIds.filter((id) => id !== characterId),
            changes: event.changes.filter(
              (change) =>
                change.characterId !== characterId &&
                !(change.kind === 'relationship' && change.otherId === characterId),
            ),
          })),
        })),

      addPlace: (projectId, name) => {
        const id = newId();
        mutate(projectId, (data) => ({
          ...data,
          places: [...data.places, { id, projectId, name, description: '' }],
        }));
        return id;
      },

      updatePlace: (projectId, placeId, patch) =>
        mutate(projectId, (data) => ({
          ...data,
          places: data.places.map((place) => (place.id === placeId ? { ...place, ...patch } : place)),
        })),

      deletePlace: (projectId, placeId) =>
        mutate(projectId, (data) => ({
          ...data,
          places: data.places.filter((place) => place.id !== placeId),
          events: data.events.map((event) =>
            event.placeId === placeId ? { ...event, placeId: null } : event,
          ),
        })),

      addEvent: (projectId, title) => {
        const id = newId();
        mutate(projectId, (data) => {
          const lastWhen = data.events.reduce((max, event) => Math.max(max, event.when), 0);
          const lastOrder = data.events.reduce((max, event) => Math.max(max, event.narrativeOrder), 0);
          return {
            ...data,
            events: [
              ...data.events,
              {
                id,
                projectId,
                title,
                summary: '',
                when: lastWhen + 1,
                narrativeOrder: lastOrder + 1,
                chapter: '',
                placeId: null,
                participantIds: [],
                changes: [],
              },
            ],
          };
        });
        return id;
      },

      updateEvent: (projectId, eventId, patch) => mutateEvent(projectId, eventId, (event) => ({ ...event, ...patch })),

      deleteEvent: (projectId, eventId) =>
        mutate(projectId, (data) => ({
          ...data,
          events: data.events.filter((event) => event.id !== eventId),
        })),

      addChange: (projectId, eventId, change) =>
        mutateEvent(projectId, eventId, (event) => ({
          ...event,
          changes: [...event.changes, { ...change, id: newId() } as Change],
        })),

      updateChange: (projectId, eventId, changeId, patch) =>
        mutateEvent(projectId, eventId, (event) => ({
          ...event,
          changes: event.changes.map((change) =>
            change.id === changeId ? ({ ...change, ...patch } as Change) : change,
          ),
        })),

      deleteChange: (projectId, eventId, changeId) =>
        mutateEvent(projectId, eventId, (event) => ({
          ...event,
          changes: event.changes.filter((change) => change.id !== changeId),
        })),

      replaceDatabase: (next) => setDb(next),
      loadSample: () => setDb(sampleDatabase()),
    };
  }, [db, mutate]);

  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

export function useChronicle(): ChronicleStore {
  const store = useContext(StoreContext);
  if (!store) throw new Error('useChronicle must be used inside a ChronicleProvider');
  return store;
}

export { emptyDatabase };
