import { useChronicle } from '../store';
import type { Change, Project, StoryEvent } from '../types';
import { DeleteButton, Field } from './ui';

export function EventEditor({
  project,
  event,
  onClose,
  onDeleted,
}: {
  project: Project;
  event: StoryEvent | null;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const { getData, updateEvent, deleteEvent, addChange, updateChange, deleteChange } = useChronicle();
  const data = getData(project.id);

  if (!event) {
    return (
      <aside className="panel">
        <div className="panel-head">
          <h2>Event</h2>
          <button className="btn btn-sm btn-ghost" onClick={onClose}>
            Hide
          </button>
        </div>
        <p className="empty">
          You're at the start of the story, before anything has happened. Scrub forward or pick an
          event to edit it here.
        </p>
      </aside>
    );
  }

  const patch = (changes: Partial<StoryEvent>) => updateEvent(project.id, event.id, changes);

  const toggleParticipant = (characterId: string) =>
    patch({
      participantIds: event.participantIds.includes(characterId)
        ? event.participantIds.filter((id) => id !== characterId)
        : [...event.participantIds, characterId],
    });

  const firstCharacterId = data.characters[0]?.id;

  return (
    <aside className="panel">
      <div className="panel-head">
        <h2>Event</h2>
        <button className="btn btn-sm btn-ghost" onClick={onClose}>
          Hide
        </button>
      </div>

      <Field label="Title" value={event.title} onChange={(value) => patch({ title: value })} />
      <Field
        label="Summary"
        value={event.summary}
        onChange={(value) => patch({ summary: value })}
        multiline
        placeholder="What happens, in a sentence."
      />

      <div className="row2" style={{ marginTop: 12 }}>
        <Field
          label={`When (${project.timeUnit})`}
          type="number"
          value={event.when}
          onChange={(value) => patch({ when: Number(value) || 0 })}
        />
        <Field
          label="Order in book"
          type="number"
          value={event.narrativeOrder}
          onChange={(value) => patch({ narrativeOrder: Number(value) || 0 })}
        />
      </div>

      <Field
        label="Chapter"
        value={event.chapter}
        onChange={(value) => patch({ chapter: value })}
        placeholder="Ch. 4, Prologue…"
      />

      <div className="field">
        <label htmlFor="event-place">Place</label>
        <select
          id="event-place"
          value={event.placeId ?? ''}
          onChange={(e) => patch({ placeId: e.target.value || null })}
        >
          <option value="">— nowhere in particular —</option>
          {data.places.map((place) => (
            <option key={place.id} value={place.id}>
              {place.name}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label>Who is here</label>
        {data.characters.length === 0 ? (
          <p className="empty" style={{ padding: '4px 0' }}>
            No characters yet.
          </p>
        ) : (
          <div className="checks">
            {data.characters.map((character) => {
              const on = event.participantIds.includes(character.id);
              return (
                <button
                  key={character.id}
                  className={`check ${on ? 'on' : ''}`}
                  onClick={() => toggleParticipant(character.id)}
                  aria-pressed={on}
                >
                  <span className="swatch" style={{ background: character.color }} />
                  {character.name}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="field">
        <label>What this changes</label>
        {event.changes.length === 0 && (
          <p className="empty" style={{ padding: '4px 0 10px' }}>
            Nothing yet. Changes are how an event leaves a mark on the world — everything the
            timeline shows is built from them.
          </p>
        )}

        {event.changes.map((change) => (
          <ChangeRow
            key={change.id}
            change={change}
            characters={data.characters}
            onPatch={(next) => updateChange(project.id, event.id, change.id, next)}
            onDelete={() => deleteChange(project.id, event.id, change.id)}
          />
        ))}

        {firstCharacterId && (
          <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
            <button
              className="btn btn-sm"
              onClick={() =>
                addChange(project.id, event.id, {
                  kind: 'attribute',
                  characterId: event.participantIds[0] ?? firstCharacterId,
                  key: 'Status',
                  value: '',
                })
              }
            >
              + Trait
            </button>
            <button
              className="btn btn-sm"
              onClick={() =>
                addChange(project.id, event.id, {
                  kind: 'relationship',
                  characterId: event.participantIds[0] ?? firstCharacterId,
                  otherId: event.participantIds[1] ?? firstCharacterId,
                  value: '',
                })
              }
            >
              + Relationship
            </button>
          </div>
        )}
      </div>

      <div style={{ marginTop: 20, textAlign: 'right' }}>
        <DeleteButton
          label="Delete event"
          onDelete={() => {
            deleteEvent(project.id, event.id);
            onDeleted();
          }}
        />
      </div>
    </aside>
  );
}

function ChangeRow({
  change,
  characters,
  onPatch,
  onDelete,
}: {
  change: Change;
  characters: { id: string; name: string; color: string }[];
  onPatch: (patch: Partial<Change>) => void;
  onDelete: () => void;
}) {
  return (
    <div className="change-item">
      <div className="head">
        <select
          value={change.characterId}
          onChange={(e) => onPatch({ characterId: e.target.value } as Partial<Change>)}
          style={{ padding: '3px 6px', fontSize: 12 }}
        >
          {characters.map((character) => (
            <option key={character.id} value={character.id}>
              {character.name}
            </option>
          ))}
        </select>
        <button className="btn btn-sm btn-ghost btn-danger" onClick={onDelete} aria-label="Remove change">
          ×
        </button>
      </div>

      {change.kind === 'attribute' ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          <input
            value={change.key}
            placeholder="Trait"
            onChange={(e) => onPatch({ key: e.target.value } as Partial<Change>)}
            style={{ padding: '4px 7px', fontSize: 12 }}
          />
          <input
            value={change.value}
            placeholder="becomes…"
            onChange={(e) => onPatch({ value: e.target.value } as Partial<Change>)}
            style={{ padding: '4px 7px', fontSize: 12 }}
          />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          <select
            value={change.otherId}
            onChange={(e) => onPatch({ otherId: e.target.value } as Partial<Change>)}
            style={{ padding: '4px 7px', fontSize: 12 }}
          >
            {characters.map((character) => (
              <option key={character.id} value={character.id}>
                {character.name}
              </option>
            ))}
          </select>
          <input
            value={change.value}
            placeholder="is now their…"
            onChange={(e) => onPatch({ value: e.target.value } as Partial<Change>)}
            style={{ padding: '4px 7px', fontSize: 12 }}
          />
        </div>
      )}
    </div>
  );
}
