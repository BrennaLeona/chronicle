import type { Database } from './types';

/**
 * A small worked example. It exists so the timeline has something to say the
 * first time someone opens Chronicle — an empty scrubber demonstrates nothing.
 *
 * It is deliberately built to show off the model: one event happens years
 * before the rest but appears third in the book, a mentor turns into a villain
 * through relationship changes alone, and a character's status flips to "dead"
 * partway through.
 */
export function sampleDatabase(): Database {
  const now = new Date().toISOString();

  return {
    version: 1,
    projects: [
      {
        id: 'salt-road',
        title: 'The Salt Road',
        premise:
          'A courier in a dying harbour town takes one unmarked package and discovers the man who raised her burned her family farm.',
        timeUnit: 'Day',
        createdAt: now,
        updatedAt: now,
      },
    ],
    data: {
      'salt-road': {
        characters: [
          {
            id: 'mira',
            projectId: 'salt-road',
            name: 'Mira Vale',
            role: 'Protagonist',
            color: '#c2703f',
            base: {
              Age: '24',
              'Eye colour': 'Grey',
              Occupation: 'Unemployed',
              Status: 'Alive',
              Motivation: 'Get through the winter',
            },
            notes: 'Reads people well, trusts them badly.',
          },
          {
            id: 'cassian',
            projectId: 'salt-road',
            name: 'Cassian Ord',
            role: 'Mentor, then antagonist',
            color: '#5b7fb5',
            base: {
              Age: '58',
              Occupation: 'Harbourmaster of Kelm',
              Status: 'Alive',
              Secret: 'Hidden',
            },
            notes: 'Genuinely loves Mira. That is the problem.',
          },
          {
            id: 'sela',
            projectId: 'salt-road',
            name: 'Sela Vale',
            role: "Mira's sister",
            color: '#6a9c78',
            base: { Age: '19', Occupation: 'Farmhand', Status: 'Alive' },
            notes: 'Off the page for most of the book. Has to still feel present.',
          },
          {
            id: 'toven',
            projectId: 'salt-road',
            name: 'Toven',
            role: 'Reluctant ally',
            color: '#8f6ba8',
            base: { Age: '31', Occupation: 'Smuggler', Status: 'Alive' },
            notes: 'Knows the ledger exists long before he admits it.',
          },
        ],
        places: [
          {
            id: 'kelm',
            projectId: 'salt-road',
            name: 'Harbour of Kelm',
            description: 'Six working berths, forty rotting ones. Everything arrives here.',
          },
          {
            id: 'saltworks',
            projectId: 'salt-road',
            name: 'The Saltworks',
            description: 'Abandoned evaporation pans above the town. Where people meet unseen.',
          },
          {
            id: 'farmstead',
            projectId: 'salt-road',
            name: 'Vale Farmstead',
            description: 'Burned five years before the book opens. Mira has not gone back.',
          },
        ],
        events: [
          {
            id: 'ev-fire',
            projectId: 'salt-road',
            title: 'The Night the Farmstead Burned',
            summary:
              'Fire takes the Vale farm. Mira gets out. Sela does not come out with her.',
            when: 0,
            narrativeOrder: 3,
            chapter: 'Ch. 3 — flashback',
            placeId: 'farmstead',
            participantIds: ['mira', 'sela'],
            changes: [
              { id: 'c1', kind: 'attribute', characterId: 'mira', key: 'Motivation', value: 'Find who set the fire' },
              { id: 'c2', kind: 'attribute', characterId: 'sela', key: 'Status', value: 'Missing' },
              { id: 'c3', kind: 'relationship', characterId: 'mira', otherId: 'sela', value: 'sister she is still looking for' },
            ],
          },
          {
            id: 'ev-package',
            projectId: 'salt-road',
            title: 'A Package Without a Name',
            summary: 'Cassian hands Mira a delivery with no addressee and pays double.',
            when: 1825,
            narrativeOrder: 1,
            chapter: 'Ch. 1',
            placeId: 'kelm',
            participantIds: ['mira', 'cassian'],
            changes: [
              { id: 'c4', kind: 'attribute', characterId: 'mira', key: 'Occupation', value: 'Courier' },
              { id: 'c5', kind: 'relationship', characterId: 'mira', otherId: 'cassian', value: 'mentor she trusts' },
              { id: 'c6', kind: 'relationship', characterId: 'cassian', otherId: 'mira', value: 'his most reliable courier' },
            ],
          },
          {
            id: 'ev-dusk',
            projectId: 'salt-road',
            title: 'The Saltworks at Dusk',
            summary: 'The handoff goes wrong. Mira meets Toven at knifepoint.',
            when: 1827,
            narrativeOrder: 2,
            chapter: 'Ch. 2',
            placeId: 'saltworks',
            participantIds: ['mira', 'toven'],
            changes: [
              { id: 'c7', kind: 'attribute', characterId: 'mira', key: 'Injury', value: 'Knife scar across left palm' },
              { id: 'c8', kind: 'relationship', characterId: 'mira', otherId: 'toven', value: 'a man who cut her' },
            ],
          },
          {
            id: 'ev-toven',
            projectId: 'salt-road',
            title: 'What Toven Knew',
            summary: 'Toven admits the package came from the harbourmaster, not to him.',
            when: 1830,
            narrativeOrder: 4,
            chapter: 'Ch. 4',
            placeId: 'saltworks',
            participantIds: ['mira', 'toven'],
            changes: [
              { id: 'c9', kind: 'relationship', characterId: 'mira', otherId: 'toven', value: 'wary ally' },
              { id: 'c10', kind: 'attribute', characterId: 'mira', key: 'Motivation', value: 'Prove Cassian set the fire' },
            ],
          },
          {
            id: 'ev-ledger',
            projectId: 'salt-road',
            title: "The Harbourmaster's Ledger",
            summary: 'Mira finds the entry for the lamp oil, dated the week of the fire.',
            when: 1835,
            narrativeOrder: 5,
            chapter: 'Ch. 5',
            placeId: 'kelm',
            participantIds: ['mira', 'cassian'],
            changes: [
              { id: 'c11', kind: 'attribute', characterId: 'cassian', key: 'Secret', value: 'Exposed' },
              { id: 'c12', kind: 'relationship', characterId: 'mira', otherId: 'cassian', value: 'the man who burned her home' },
            ],
          },
          {
            id: 'ev-sela',
            projectId: 'salt-road',
            title: 'Sela, Alive',
            summary: 'Cassian hid Sela for five years to keep Mira working for him.',
            when: 1837,
            narrativeOrder: 6,
            chapter: 'Ch. 6',
            placeId: 'saltworks',
            participantIds: ['mira', 'sela'],
            changes: [
              { id: 'c13', kind: 'attribute', characterId: 'sela', key: 'Status', value: 'Alive, in hiding' },
              { id: 'c14', kind: 'relationship', characterId: 'mira', otherId: 'sela', value: 'sister, found' },
            ],
          },
          {
            id: 'ev-tide',
            projectId: 'salt-road',
            title: 'Low Tide',
            summary: 'It ends on the mud flats, and Mira is the one still standing.',
            when: 1840,
            narrativeOrder: 7,
            chapter: 'Ch. 7',
            placeId: 'kelm',
            participantIds: ['mira', 'cassian', 'toven'],
            changes: [
              { id: 'c15', kind: 'attribute', characterId: 'cassian', key: 'Status', value: 'Dead' },
              { id: 'c16', kind: 'attribute', characterId: 'mira', key: 'Motivation', value: 'Rebuild the farmstead' },
              { id: 'c17', kind: 'relationship', characterId: 'mira', otherId: 'toven', value: 'friend' },
            ],
          },
        ],
      },
    },
  };
}
