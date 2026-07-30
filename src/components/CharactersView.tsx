import { useState } from 'react';
import { useChronicle } from '../store';
import { characterHistory, placeName } from '../world';
import type { Project } from '../types';
import { DeleteButton, Field } from './ui';

export function CharactersView({ project }: { project: Project }) {
  const { getData, addCharacter, updateCharacter, deleteCharacter } = useChronicle();
  const data = getData(project.id);
  const [selectedId, setSelectedId] = useState<string | null>(data.characters[0]?.id ?? null);
  const [newKey, setNewKey] = useState('');

  const selected = data.characters.find((character) => character.id === selectedId) ?? data.characters[0] ?? null;

  const create = () => {
    const id = addCharacter(project.id, 'New character');
    setSelectedId(id);
  };

  return (
    <div className="list-layout">
      <aside className="rail">
        <div className="rail-head">
          <h2>Characters</h2>
          <button className="btn btn-sm" onClick={create}>
            + Add
          </button>
        </div>

        {data.characters.length === 0 && <p className="empty">Nobody here yet.</p>}

        {data.characters.map((character) => (
          <button
            key={character.id}
            className={`event-row ${character.id === selected?.id ? 'current' : ''}`}
            onClick={() => setSelectedId(character.id)}
          >
            <span className="dot" style={{ background: character.color, marginTop: 5 }} />
            <span>
              <span className="title">{character.name}</span>
              <span className="sub">{character.role || 'No role set'}</span>
            </span>
          </button>
        ))}
      </aside>

      {!selected ? (
        <div className="detail">
          <p className="empty">Add a character to get started.</p>
        </div>
      ) : (
        <div className="detail">
          <h1>{selected.name}</h1>
          <p className="sub">{selected.role || 'No role set'}</p>

          <div className="card">
            <h2>Who they are</h2>
            <Field
              label="Name"
              value={selected.name}
              onChange={(value) => updateCharacter(project.id, selected.id, { name: value })}
            />
            <Field
              label="Role in the story"
              value={selected.role}
              onChange={(value) => updateCharacter(project.id, selected.id, { role: value })}
              placeholder="Protagonist, foil, the one who lies…"
            />
            <div className="field">
              <label htmlFor="char-color">Timeline colour</label>
              <input
                id="char-color"
                type="color"
                value={selected.color}
                onChange={(e) => updateCharacter(project.id, selected.id, { color: e.target.value })}
                style={{ height: 36, padding: 3 }}
              />
            </div>
            <Field
              label="Notes"
              value={selected.notes}
              onChange={(value) => updateCharacter(project.id, selected.id, { notes: value })}
              multiline
              placeholder="Anything that isn't a fact the timeline should own."
            />
          </div>

          <div className="card">
            <h2>Base sheet — who they are at page one</h2>
            <p className="empty" style={{ padding: '0 0 12px' }}>
              These are the starting values. Anything that <em>changes</em> during the story belongs
              on an event instead, so the timeline can show it changing.
            </p>

            {Object.entries(selected.base).map(([key, value]) => (
              <div className="kv-row" key={key}>
                <input value={key} readOnly />
                <input
                  value={value}
                  onChange={(e) =>
                    updateCharacter(project.id, selected.id, {
                      base: { ...selected.base, [key]: e.target.value },
                    })
                  }
                />
                <button
                  className="btn btn-sm btn-ghost btn-danger"
                  aria-label={`Remove ${key}`}
                  onClick={() => {
                    const base = { ...selected.base };
                    delete base[key];
                    updateCharacter(project.id, selected.id, { base });
                  }}
                >
                  ×
                </button>
              </div>
            ))}

            <div className="kv-row" style={{ marginTop: 12 }}>
              <input
                value={newKey}
                placeholder="New trait, e.g. Eye colour"
                onChange={(e) => setNewKey(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key !== 'Enter' || !newKey.trim()) return;
                  updateCharacter(project.id, selected.id, {
                    base: { ...selected.base, [newKey.trim()]: '' },
                  });
                  setNewKey('');
                }}
              />
              <button
                className="btn btn-sm"
                disabled={!newKey.trim()}
                onClick={() => {
                  updateCharacter(project.id, selected.id, {
                    base: { ...selected.base, [newKey.trim()]: '' },
                  });
                  setNewKey('');
                }}
              >
                Add trait
              </button>
              <span />
            </div>
          </div>

          <div className="card">
            <h2>Their history</h2>
            {(() => {
              const history = characterHistory(data, selected.id);
              if (history.length === 0) {
                return (
                  <p className="empty" style={{ padding: 0 }}>
                    {selected.name} doesn't appear in any event yet.
                  </p>
                );
              }
              return history.map((event) => {
                const theirChanges = event.changes.filter(
                  (change) => change.characterId === selected.id,
                );
                return (
                  <div className="history-item" key={event.id}>
                    <span className="history-when">
                      {project.timeUnit} {event.when}
                    </span>
                    <span className="history-body">
                      <span className="t">{event.title}</span>
                      <span className="c">
                        {event.chapter && `${event.chapter} · `}
                        {event.placeId ? placeName(data.places, event.placeId) : 'no setting'}
                        {theirChanges.map((change) => (
                          <span key={change.id}>
                            {' · '}
                            {change.kind === 'attribute'
                              ? `${change.key} → ${change.value || '(cleared)'}`
                              : `${data.characters.find((c) => c.id === change.otherId)?.name ?? '?'} → ${
                                  change.value || '(severed)'
                                }`}
                          </span>
                        ))}
                      </span>
                    </span>
                  </div>
                );
              });
            })()}
          </div>

          <div style={{ textAlign: 'right' }}>
            <DeleteButton
              label={`Delete ${selected.name}`}
              onDelete={() => {
                deleteCharacter(project.id, selected.id);
                setSelectedId(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
