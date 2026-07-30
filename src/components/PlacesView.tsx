import { useState } from 'react';
import { useChronicle } from '../store';
import { orderEvents } from '../world';
import type { Project } from '../types';
import { DeleteButton, Field } from './ui';

export function PlacesView({ project }: { project: Project }) {
  const { getData, addPlace, updatePlace, deletePlace } = useChronicle();
  const data = getData(project.id);
  const [selectedId, setSelectedId] = useState<string | null>(data.places[0]?.id ?? null);

  const selected = data.places.find((place) => place.id === selectedId) ?? data.places[0] ?? null;

  const scenesHere = selected
    ? orderEvents(data.events, 'chronological').filter((event) => event.placeId === selected.id)
    : [];

  return (
    <div className="list-layout">
      <aside className="rail">
        <div className="rail-head">
          <h2>Places</h2>
          <button
            className="btn btn-sm"
            onClick={() => setSelectedId(addPlace(project.id, 'New place'))}
          >
            + Add
          </button>
        </div>

        {data.places.length === 0 && <p className="empty">Nowhere yet.</p>}

        {data.places.map((place) => (
          <button
            key={place.id}
            className={`event-row ${place.id === selected?.id ? 'current' : ''}`}
            onClick={() => setSelectedId(place.id)}
          >
            <span>
              <span className="title">{place.name}</span>
              <span className="sub">
                {data.events.filter((event) => event.placeId === place.id).length} scenes
              </span>
            </span>
          </button>
        ))}
      </aside>

      {!selected ? (
        <div className="detail">
          <p className="empty">Add a place to get started.</p>
        </div>
      ) : (
        <div className="detail">
          <h1>{selected.name}</h1>
          <p className="sub">{scenesHere.length} scenes take place here</p>

          <div className="card">
            <Field
              label="Name"
              value={selected.name}
              onChange={(value) => updatePlace(project.id, selected.id, { name: value })}
            />
            <Field
              label="Description"
              value={selected.description}
              onChange={(value) => updatePlace(project.id, selected.id, { description: value })}
              multiline
              placeholder="What it looks like, what it smells like, who avoids it."
            />
          </div>

          <div className="card">
            <h2>What happens here</h2>
            {scenesHere.length === 0 ? (
              <p className="empty" style={{ padding: 0 }}>
                No events are set here yet.
              </p>
            ) : (
              scenesHere.map((event) => (
                <div className="history-item" key={event.id}>
                  <span className="history-when">
                    {project.timeUnit} {event.when}
                  </span>
                  <span className="history-body">
                    <span className="t">{event.title}</span>
                    <span className="c">
                      {event.participantIds
                        .map((id) => data.characters.find((c) => c.id === id)?.name)
                        .filter(Boolean)
                        .join(', ') || 'nobody recorded'}
                    </span>
                  </span>
                </div>
              ))
            )}
          </div>

          <div style={{ textAlign: 'right' }}>
            <DeleteButton
              label={`Delete ${selected.name}`}
              onDelete={() => {
                deletePlace(project.id, selected.id);
                setSelectedId(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
