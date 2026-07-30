import type {
  Character,
  CharacterState,
  ID,
  Ordering,
  Place,
  ProjectData,
  Sourced,
  StoryEvent,
  WorldState,
} from './types';

/**
 * Sort events into the order the reader experiences them, or the order they
 * actually happened in. Chronological order is what the world replay uses;
 * narrative order is only ever a presentation choice.
 */
export function orderEvents(events: StoryEvent[], ordering: Ordering): StoryEvent[] {
  const sorted = [...events];
  if (ordering === 'narrative') {
    sorted.sort((a, b) => a.narrativeOrder - b.narrativeOrder || a.when - b.when);
  } else {
    sorted.sort((a, b) => a.when - b.when || a.narrativeOrder - b.narrativeOrder);
  }
  return sorted;
}

function sourced(value: string, sourceEventId: ID | null, justChanged: boolean): Sourced {
  return { value, sourceEventId, justChanged };
}

function blankState(character: Character): CharacterState {
  const attributes: Record<string, Sourced> = {};
  for (const [key, value] of Object.entries(character.base)) {
    attributes[key] = sourced(value, null, false);
  }
  return {
    character,
    attributes,
    relationships: {},
    placeId: null,
    onstage: false,
    lastEventId: null,
  };
}

/**
 * Replay the story from the beginning up to and including `index` in
 * chronological order, and report what the world looks like at that moment.
 *
 * Pass -1 for `index` to get the world as it stands before anything happens —
 * every character reduced to their base sheet.
 */
export function deriveWorld(data: ProjectData, index: number): WorldState {
  const chronological = orderEvents(data.events, 'chronological');
  const upTo = chronological.slice(0, Math.max(0, index + 1));
  const currentEvent = index >= 0 ? chronological[index] ?? null : null;

  const characters: Record<ID, CharacterState> = {};
  for (const character of data.characters) {
    characters[character.id] = blankState(character);
  }

  for (const event of upTo) {
    const isCurrent = event.id === currentEvent?.id;

    for (const change of event.changes) {
      const state = characters[change.characterId];
      // A change can outlive the character it referenced, if that character was
      // deleted. Skipping keeps the replay total rather than throwing.
      if (!state) continue;

      if (change.kind === 'attribute') {
        state.attributes[change.key] = sourced(change.value, event.id, isCurrent);
      } else {
        if (change.value.trim() === '') {
          delete state.relationships[change.otherId];
        } else {
          state.relationships[change.otherId] = sourced(change.value, event.id, isCurrent);
        }
      }
    }

    // Taking part in an event puts a character on stage and, if the event has a
    // setting, moves them there. This is what makes "who was where, when"
    // fall out of the timeline for free.
    for (const participantId of event.participantIds) {
      const state = characters[participantId];
      if (!state) continue;
      state.onstage = true;
      state.lastEventId = event.id;
      if (event.placeId) state.placeId = event.placeId;
    }
  }

  const occupancy: Record<ID, ID[]> = {};
  for (const place of data.places) occupancy[place.id] = [];
  for (const state of Object.values(characters)) {
    if (state.placeId && occupancy[state.placeId]) {
      occupancy[state.placeId].push(state.character.id);
    }
  }

  return { characters, currentEvent, occupancy };
}

/**
 * Every event that touched a character, in chronological order — their
 * personal history rather than the story's.
 */
export function characterHistory(data: ProjectData, characterId: ID): StoryEvent[] {
  return orderEvents(data.events, 'chronological').filter(
    (event) =>
      event.participantIds.includes(characterId) ||
      event.changes.some((change) => change.characterId === characterId),
  );
}

/**
 * Contradictions the timeline can prove on its own. This is deliberately
 * conservative — it only reports things that are certainly wrong, because a
 * checker that cries wolf gets switched off.
 */
export interface Warning {
  eventId: ID;
  severity: 'error' | 'warning';
  message: string;
}

export function findContinuityIssues(data: ProjectData): Warning[] {
  const warnings: Warning[] = [];
  const chronological = orderEvents(data.events, 'chronological');
  const byId = new Map(data.characters.map((c) => [c.id, c]));

  // Values of a "Status" attribute that mean a character can no longer act.
  const terminal = new Set(['dead', 'deceased', 'killed']);
  const status: Record<ID, string> = {};

  chronological.forEach((event, index) => {
    for (const participantId of event.participantIds) {
      const current = status[participantId];
      if (current && terminal.has(current.toLowerCase())) {
        const name = byId.get(participantId)?.name ?? 'A deleted character';
        warnings.push({
          eventId: event.id,
          severity: 'error',
          message: `${name} takes part in "${event.title}" but is already ${current.toLowerCase()}.`,
        });
      }
    }

    for (const change of event.changes) {
      if (change.kind === 'attribute' && change.key.toLowerCase() === 'status') {
        status[change.characterId] = change.value;
      }
    }

    // Two events at the same in-world time in different places, sharing a cast.
    for (let j = index + 1; j < chronological.length; j++) {
      const other = chronological[j];
      if (other.when !== event.when) break;
      if (!event.placeId || !other.placeId || event.placeId === other.placeId) continue;
      const overlap = event.participantIds.filter((id) => other.participantIds.includes(id));
      for (const id of overlap) {
        const name = byId.get(id)?.name ?? 'A deleted character';
        warnings.push({
          eventId: other.id,
          severity: 'warning',
          message: `${name} is in two places at once: "${event.title}" and "${other.title}".`,
        });
      }
    }
  });

  return warnings;
}

/** Characters with no events at all — worldbuilding that never made the page. */
export function findUnusedCharacters(data: ProjectData): Character[] {
  const used = new Set<ID>();
  for (const event of data.events) {
    event.participantIds.forEach((id) => used.add(id));
    event.changes.forEach((change) => used.add(change.characterId));
  }
  return data.characters.filter((character) => !used.has(character.id));
}

export function placeName(places: Place[], id: ID | null): string {
  if (!id) return 'Unknown';
  return places.find((place) => place.id === id)?.name ?? 'Unknown';
}
