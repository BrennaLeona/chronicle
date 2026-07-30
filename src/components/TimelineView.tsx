import { useEffect, useMemo, useState } from 'react';
import { useChronicle } from '../store';
import { deriveWorld, orderEvents, placeName } from '../world';
import type { CharacterState, ID, Ordering, Project } from '../types';
import { EventEditor } from './EventEditor';

export function TimelineView({ project }: { project: Project }) {
  const { getData, addEvent } = useChronicle();
  const data = getData(project.id);

  const chronological = useMemo(() => orderEvents(data.events, 'chronological'), [data.events]);
  const [ordering, setOrdering] = useState<Ordering>('chronological');
  const [index, setIndex] = useState(chronological.length - 1);
  const [panelOpen, setPanelOpen] = useState(true);

  // The scrubber runs from -1 ("before the story") to the last event. Clamping
  // on read rather than in an effect keeps the index valid even on the render
  // where an event was just deleted.
  const last = chronological.length - 1;
  const position = Math.max(-1, Math.min(index, last));

  const world = useMemo(() => deriveWorld(data, position), [data, position]);
  const current = world.currentEvent;

  // Arrow keys step through the story, but not while someone is typing.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      if (event.key === 'ArrowLeft') setIndex((value) => Math.max(-1, Math.min(value, last) - 1));
      if (event.key === 'ArrowRight') setIndex((value) => Math.min(last, Math.max(-1, value) + 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [last]);

  const listed = orderEvents(data.events, ordering);
  const chronoIndexOf = (id: ID) => chronological.findIndex((event) => event.id === id);

  const cast = Object.values(world.characters).sort((a, b) => {
    if (a.onstage !== b.onstage) return a.onstage ? -1 : 1;
    return a.character.name.localeCompare(b.character.name);
  });

  const createEvent = () => {
    addEvent(project.id, 'Untitled event');
    setIndex(chronological.length); // the new event lands at the end
    setPanelOpen(true);
  };

  return (
    <div className={`timeline-layout ${panelOpen ? '' : 'no-panel'}`}>
      <aside className="rail">
        <div className="rail-head">
          <h2>Events</h2>
          <button className="btn btn-sm" onClick={createEvent}>
            + Event
          </button>
        </div>

        <div className="segmented" role="group" aria-label="Event ordering">
          <button
            className={ordering === 'chronological' ? 'active' : ''}
            onClick={() => setOrdering('chronological')}
          >
            Chronological
          </button>
          <button
            className={ordering === 'narrative' ? 'active' : ''}
            onClick={() => setOrdering('narrative')}
          >
            As written
          </button>
        </div>

        {listed.length === 0 && (
          <p className="empty">
            No events yet. Everything in Chronicle hangs off events — add the first thing that
            happens and the world will build itself from there.
          </p>
        )}

        {listed.map((event) => {
          const chronoIndex = chronoIndexOf(event.id);
          const isCurrent = chronoIndex === position;
          return (
            <button
              key={event.id}
              className={`event-row ${isCurrent ? 'current' : ''} ${chronoIndex > position ? 'future' : ''}`}
              onClick={() => {
                setIndex(chronoIndex);
                setPanelOpen(true);
              }}
            >
              <span className="event-index">{chronoIndex + 1}</span>
              <span>
                <span className="title">{event.title}</span>
                <span className="sub">
                  {event.chapter && <span>{event.chapter}</span>}
                  <span>
                    {project.timeUnit} {event.when}
                  </span>
                  {event.placeId && <span>{placeName(data.places, event.placeId)}</span>}
                </span>
                <span className="dots">
                  {event.participantIds.map((id) => {
                    const character = data.characters.find((c) => c.id === id);
                    if (!character) return null;
                    return (
                      <span key={id} className="dot" style={{ background: character.color }} />
                    );
                  })}
                </span>
              </span>
            </button>
          );
        })}
      </aside>

      <main className="stage">
        <div className="scrubber">
          <div className="scrub-head">
            <h2>{current ? current.title : 'Before the story'}</h2>
            {current?.chapter && <span className="chip">{current.chapter}</span>}
            {current && (
              <span className="chip plain">
                {project.timeUnit} {current.when}
              </span>
            )}
            {current?.placeId && (
              <span className="chip plain">{placeName(data.places, current.placeId)}</span>
            )}
          </div>

          <p className="scrub-summary">
            {current
              ? current.summary || 'No summary yet.'
              : 'Everyone as they stand before the first event — their base sheets, nothing more.'}
          </p>

          <div className="scrub-controls">
            <button
              className="step"
              onClick={() => setIndex(position - 1)}
              disabled={position <= -1}
              aria-label="Previous event"
            >
              ‹
            </button>
            <input
              type="range"
              min={-1}
              max={Math.max(last, 0)}
              value={position}
              onChange={(e) => setIndex(Number(e.target.value))}
              aria-label="Scrub through the story"
            />
            <button
              className="step"
              onClick={() => setIndex(position + 1)}
              disabled={position >= last}
              aria-label="Next event"
            >
              ›
            </button>
            <span className="chip plain">
              {position + 1} / {chronological.length}
            </span>
          </div>
        </div>

        <h3 className="section-title">The world at this moment</h3>
        {cast.length === 0 ? (
          <p className="empty">No characters yet — add some on the Characters tab.</p>
        ) : (
          <div className="world-grid">
            {cast.map((state) => (
              <CharacterCard
                key={state.character.id}
                state={state}
                world={world.characters}
                placeLabel={state.placeId ? placeName(data.places, state.placeId) : null}
              />
            ))}
          </div>
        )}
      </main>

      {panelOpen && (
        <EventEditor
          project={project}
          event={current}
          onClose={() => setPanelOpen(false)}
          onDeleted={() => setIndex(Math.max(-1, position - 1))}
        />
      )}
    </div>
  );
}

function CharacterCard({
  state,
  world,
  placeLabel,
}: {
  state: CharacterState;
  world: Record<ID, CharacterState>;
  placeLabel: string | null;
}) {
  const { character, attributes, relationships, onstage } = state;
  const attributeKeys = Object.keys(attributes).sort();
  const relationshipIds = Object.keys(relationships);

  return (
    <article
      className={`char-card ${onstage ? '' : 'offstage'}`}
      style={{ borderLeftColor: character.color }}
    >
      <h3>{character.name}</h3>
      <p className="role">{onstage ? character.role || 'No role set' : 'Not yet on the page'}</p>

      <dl>
        {attributeKeys.map((key) => (
          <div key={key} className={`attr ${attributes[key].justChanged ? 'changed' : ''}`}>
            <dt>{key}</dt>
            <dd>{attributes[key].value}</dd>
          </div>
        ))}
      </dl>

      {relationshipIds.length > 0 && (
        <div className="rel-list">
          {relationshipIds.map((id) => {
            const other = world[id];
            if (!other) return null;
            return (
              <div key={id} className={relationships[id].justChanged ? 'changed' : ''}>
                <span className="who">{other.character.name}</span> — {relationships[id].value}
              </div>
            );
          })}
        </div>
      )}

      {placeLabel && <p className="here">Last seen at {placeLabel}</p>}
    </article>
  );
}
