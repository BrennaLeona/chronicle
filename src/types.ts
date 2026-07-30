/**
 * Chronicle's data model.
 *
 * The core idea: a character does not "have" attributes. Events do.
 * A character's traits, relationships, and whereabouts at any point in the
 * story are *derived* by replaying every event up to that moment.
 * See `world.ts` for the replay logic.
 */

export type ID = string;

export interface Project {
  id: ID;
  title: string;
  premise: string;
  /** Label for the unit of in-world time, e.g. "Day", "Year", "Cycle". */
  timeUnit: string;
  createdAt: string;
  updatedAt: string;
}

export interface Character {
  id: ID;
  projectId: ID;
  name: string;
  role: string;
  /** Hex colour used to identify this character across the timeline UI. */
  color: string;
  /** Attributes true before the first event — who they are at page one. */
  base: Record<string, string>;
  notes: string;
}

export interface Place {
  id: ID;
  projectId: ID;
  name: string;
  description: string;
}

/**
 * A single mutation the story makes to the world. Changes only ever live
 * inside an event, which is what gives them their position in time.
 */
export type Change =
  | {
      id: ID;
      kind: 'attribute';
      characterId: ID;
      /** e.g. "Status", "Eye colour", "Occupation" */
      key: string;
      value: string;
    }
  | {
      id: ID;
      kind: 'relationship';
      characterId: ID;
      otherId: ID;
      /** e.g. "sworn enemy". An empty string severs the relationship. */
      value: string;
    };

/**
 * `Omit` on a union collapses it to the properties every member shares, which
 * would lose `key` and `otherId`. Distributing first keeps both shapes intact.
 */
export type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

/** A change before it has been given an id. */
export type NewChange = DistributiveOmit<Change, 'id'>;

export interface StoryEvent {
  id: ID;
  projectId: ID;
  title: string;
  summary: string;
  /** Position on the in-world clock. Drives chronological ordering. */
  when: number;
  /** Where this lands in the finished book. Drives narrative ordering. */
  narrativeOrder: number;
  /** Free-text placement label, e.g. "Ch. 4" or "Prologue". */
  chapter: string;
  placeId: ID | null;
  participantIds: ID[];
  changes: Change[];
}

/** Everything belonging to one story, as persisted. */
export interface ProjectData {
  characters: Character[];
  places: Place[];
  events: StoryEvent[];
}

export interface Database {
  version: 1;
  projects: Project[];
  data: Record<ID, ProjectData>;
}

// ---------------------------------------------------------------------------
// Derived (never persisted — always recomputed from events)
// ---------------------------------------------------------------------------

/** An attribute value plus the event responsible for it. */
export interface Sourced {
  value: string;
  /** null when the value comes from the character's base sheet. */
  sourceEventId: ID | null;
  /** True when the most recent event set this value — used to highlight it. */
  justChanged: boolean;
}

export interface CharacterState {
  character: Character;
  attributes: Record<string, Sourced>;
  relationships: Record<ID, Sourced>;
  placeId: ID | null;
  /** False until the character takes part in an event. */
  onstage: boolean;
  /** The most recent event this character appeared in. */
  lastEventId: ID | null;
}

export interface WorldState {
  /** Keyed by character id. */
  characters: Record<ID, CharacterState>;
  /** The event the world is currently wound to, or null at "before the story". */
  currentEvent: StoryEvent | null;
  /** Characters present at each place, keyed by place id. */
  occupancy: Record<ID, ID[]>;
}

export type Ordering = 'chronological' | 'narrative';
