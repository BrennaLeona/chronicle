import { useState } from 'react';
import { useChronicle } from '../store';
import { Field, Modal } from './ui';
import type { ID } from '../types';

export function ProjectList({ onOpen }: { onOpen: (projectId: ID) => void }) {
  const { projects, getData, createProject } = useChronicle();
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [premise, setPremise] = useState('');
  const [timeUnit, setTimeUnit] = useState('Day');

  const submit = () => {
    if (!title.trim()) return;
    const id = createProject(title.trim(), premise.trim(), timeUnit.trim());
    setCreating(false);
    setTitle('');
    setPremise('');
    setTimeUnit('Day');
    onOpen(id);
  };

  return (
    <div className="projects">
      <h1>Your stories</h1>
      <p className="lede">
        Chronicle keeps a story bible where the timeline is the source of truth. Characters don't
        simply <em>have</em> traits — events give them traits, and you can wind the story back to any
        moment to see exactly who everyone was at the time.
      </p>

      <div className="project-grid">
        {projects.map((project) => {
          const data = getData(project.id);
          return (
            <button key={project.id} className="project-card" onClick={() => onOpen(project.id)}>
              <h3>{project.title}</h3>
              <p>{project.premise || 'No premise yet.'}</p>
              <div className="meta">
                <span>{data.characters.length} characters</span>
                <span>{data.events.length} events</span>
              </div>
            </button>
          );
        })}

        <button className="project-card new" onClick={() => setCreating(true)}>
          + New story
        </button>
      </div>

      {creating && (
        <Modal title="New story" onClose={() => setCreating(false)}>
          <Field label="Title" value={title} onChange={setTitle} placeholder="The Salt Road" />
          <Field
            label="Premise"
            value={premise}
            onChange={setPremise}
            multiline
            placeholder="One or two sentences you can come back to when you lose the thread."
          />
          <Field
            label="Unit of in-world time"
            value={timeUnit}
            onChange={setTimeUnit}
            placeholder="Day, Year, Cycle…"
          />
          <div className="modal-actions">
            <button className="btn btn-ghost" onClick={() => setCreating(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={submit} disabled={!title.trim()}>
              Create
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
