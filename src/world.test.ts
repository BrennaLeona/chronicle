import { describe, expect, it } from 'vitest';
import { characterHistory, deriveWorld, findContinuityIssues, orderEvents } from './world';
import { sampleDatabase } from './sampleData';
import type { ProjectData } from './types';

const data: ProjectData = sampleDatabase().data['salt-road'];

/** Index of an event within the chronological ordering. */
const at = (id: string) =>
  orderEvents(data.events, 'chronological').findIndex((event) => event.id === id);

describe('orderEvents', () => {
  it('puts the flashback first chronologically but third in the book', () => {
    const chrono = orderEvents(data.events, 'chronological');
    const narrative = orderEvents(data.events, 'narrative');

    expect(chrono[0].id).toBe('ev-fire');
    expect(narrative[2].id).toBe('ev-fire');
    expect(narrative[0].id).toBe('ev-package');
  });
});

describe('deriveWorld', () => {
  it('gives every character their base sheet before the story starts', () => {
    const world = deriveWorld(data, -1);
    const mira = world.characters.mira;

    expect(world.currentEvent).toBeNull();
    expect(mira.attributes.Motivation.value).toBe('Get through the winter');
    expect(mira.attributes.Occupation.value).toBe('Unemployed');
    expect(mira.onstage).toBe(false);
    expect(mira.placeId).toBeNull();
  });

  it('replays attribute changes up to the chosen moment and no further', () => {
    const afterFire = deriveWorld(data, at('ev-fire'));
    expect(afterFire.characters.mira.attributes.Motivation.value).toBe('Find who set the fire');
    expect(afterFire.characters.sela.attributes.Status.value).toBe('Missing');

    // Cassian is not dead yet, even though a later event kills him.
    expect(afterFire.characters.cassian.attributes.Status.value).toBe('Alive');

    const end = deriveWorld(data, at('ev-tide'));
    expect(end.characters.cassian.attributes.Status.value).toBe('Dead');
    expect(end.characters.mira.attributes.Motivation.value).toBe('Rebuild the farmstead');
  });

  it('tracks a relationship changing meaning over the course of the story', () => {
    const trusted = deriveWorld(data, at('ev-package'));
    expect(trusted.characters.mira.relationships.cassian.value).toBe('mentor she trusts');

    const betrayed = deriveWorld(data, at('ev-ledger'));
    expect(betrayed.characters.mira.relationships.cassian.value).toBe(
      'the man who burned her home',
    );
  });

  it('flags exactly the values the current event just changed', () => {
    const world = deriveWorld(data, at('ev-ledger'));
    // Set by this event...
    expect(world.characters.cassian.attributes.Secret.justChanged).toBe(true);
    // ...but this one has been true since chapter one.
    expect(world.characters.mira.attributes.Occupation.justChanged).toBe(false);
  });

  it('derives where everyone is from the events they took part in', () => {
    const world = deriveWorld(data, at('ev-sela'));

    expect(world.characters.mira.placeId).toBe('saltworks');
    expect(world.characters.sela.placeId).toBe('saltworks');
    // Cassian was last seen at the harbour and has not moved since.
    expect(world.characters.cassian.placeId).toBe('kelm');
    expect(world.occupancy.saltworks.sort()).toEqual(['mira', 'sela', 'toven']);
  });

  it('brings a character onstage only once they appear', () => {
    expect(deriveWorld(data, at('ev-package')).characters.toven.onstage).toBe(false);
    expect(deriveWorld(data, at('ev-dusk')).characters.toven.onstage).toBe(true);
  });
});

describe('characterHistory', () => {
  it('returns only the events a character touches, in chronological order', () => {
    const history = characterHistory(data, 'sela').map((event) => event.id);
    expect(history).toEqual(['ev-fire', 'ev-sela']);
  });
});

describe('findContinuityIssues', () => {
  it('is quiet on a consistent story', () => {
    expect(findContinuityIssues(data)).toEqual([]);
  });

  it('catches a dead character turning up in a later scene', () => {
    const broken: ProjectData = {
      ...data,
      events: [
        ...data.events,
        {
          id: 'ev-ghost',
          projectId: 'salt-road',
          title: 'Cassian Has A Word',
          summary: '',
          when: 1900,
          narrativeOrder: 8,
          chapter: 'Ch. 8',
          placeId: 'kelm',
          participantIds: ['cassian'],
          changes: [],
        },
      ],
    };

    const issues = findContinuityIssues(broken);
    expect(issues).toHaveLength(1);
    expect(issues[0].severity).toBe('error');
    expect(issues[0].message).toContain('already dead');
  });

  it('catches a character being in two places at the same time', () => {
    const broken: ProjectData = {
      ...data,
      events: [
        ...data.events,
        {
          id: 'ev-double',
          projectId: 'salt-road',
          title: 'Elsewhere, Somehow',
          summary: '',
          // Same in-world time as "The Saltworks at Dusk", different place.
          when: 1827,
          narrativeOrder: 9,
          chapter: 'Ch. 9',
          placeId: 'kelm',
          participantIds: ['mira'],
          changes: [],
        },
      ],
    };

    const issues = findContinuityIssues(broken);
    expect(issues.some((issue) => issue.message.includes('two places at once'))).toBe(true);
  });
});
