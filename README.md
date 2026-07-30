# Chronicle

A story bible for novelists, built on one idea: **the timeline is the source of truth.**

Most worldbuilding tools treat a character as a document you edit. That works right up until
the character changes — and characters changing is the entire point of a novel. In Chronicle a
character has no traits of their own. Events give them traits, and their state at any moment is
*derived* by replaying every event up to that point.

Drag the scrubber to chapter five and every character sheet, relationship, and location on the
screen becomes what it was in chapter five.

## What it does

- **Scrub through the story.** A slider walks the whole timeline. The world state re-derives on
  every step, and anything the current event just changed is highlighted.
- **Two orderings.** Events sort chronologically (when they happened) or narratively (where they
  land in the book), so a flashback can be event one and chapter three at the same time.
- **Relationships that evolve.** "Mentor she trusts" becomes "the man who burned her home"
  because an event said so — and the old value is still there if you scrub back.
- **Whereabouts for free.** Taking part in an event puts a character in that event's location, so
  "who was where, when" falls out of the data rather than being tracked by hand.
- **Continuity checks.** Flags a character acting after they die, or being in two places at the
  same in-world time. Deliberately conservative — a checker that cries wolf gets switched off.
- **Local-first.** Everything lives in `localStorage`. No account, no server, works offline.
  Export and import the whole database as JSON so the writer owns their work.

## Running it

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # unit tests for the replay engine
npm run build    # type-check and produce dist/
```

First launch loads a sample story, *The Salt Road*, so the timeline has something to say.

## How it's put together

| File | Job |
| --- | --- |
| [`src/types.ts`](src/types.ts) | The data model, and the line between stored and derived state |
| [`src/world.ts`](src/world.ts) | The replay engine — pure functions, no React, fully tested |
| [`src/store.tsx`](src/store.tsx) | React context holding the database, persisted on every change |
| [`src/components/TimelineView.tsx`](src/components/TimelineView.tsx) | The scrubber and the world-at-this-moment view |

The interesting decision is that `world.ts` knows nothing about React. `deriveWorld(data, index)`
takes a project and a position and returns the state of the world, which makes the core idea
testable without rendering anything — see [`src/world.test.ts`](src/world.test.ts).

## Stack

React 19, TypeScript, Vite. No UI library, no state library, no backend — the styling is
hand-written CSS and the state is one context plus a set of actions.
