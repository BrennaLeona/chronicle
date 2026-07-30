import { useRef, useState } from 'react';
import { useChronicle } from './store';
import { exportDatabase, parseImported } from './storage';
import { ProjectList } from './components/ProjectList';
import { TimelineView } from './components/TimelineView';
import { CharactersView } from './components/CharactersView';
import { PlacesView } from './components/PlacesView';
import { ChecksView } from './components/ChecksView';
import { DeleteButton } from './components/ui';
import { findContinuityIssues } from './world';
import type { ID } from './types';

type Tab = 'timeline' | 'characters' | 'places' | 'checks';

export default function App() {
  const { db, projects, getData, deleteProject, replaceDatabase, loadSample } = useChronicle();
  const [openId, setOpenId] = useState<ID | null>(null);
  const [tab, setTab] = useState<Tab>('timeline');
  const fileInput = useRef<HTMLInputElement>(null);

  const project = projects.find((candidate) => candidate.id === openId) ?? null;
  const data = project ? getData(project.id) : null;
  const issueCount = data ? findContinuityIssues(data).length : 0;

  const handleImport = async (file: File) => {
    try {
      replaceDatabase(parseImported(await file.text()));
      setOpenId(null);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'That file could not be read.');
    }
  };

  return (
    <div className="app">
      <header className="topbar">
        <button className="brand" onClick={() => setOpenId(null)}>
          Chron<span>i</span>cle
        </button>
        {project && <span className="topbar-title">{project.title}</span>}

        <span className="spacer" />

        {project ? (
          <DeleteButton
            label="Delete story"
            onDelete={() => {
              deleteProject(project.id);
              setOpenId(null);
            }}
          />
        ) : (
          <>
            <button className="btn btn-sm btn-ghost" onClick={loadSample}>
              Load sample story
            </button>
            <button className="btn btn-sm" onClick={() => fileInput.current?.click()}>
              Import
            </button>
          </>
        )}

        <button className="btn btn-sm" onClick={() => exportDatabase(db)}>
          Export
        </button>

        <input
          ref={fileInput}
          type="file"
          accept="application/json"
          style={{ display: 'none' }}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void handleImport(file);
            event.target.value = '';
          }}
        />
      </header>

      {!project || !data ? (
        <ProjectList
          onOpen={(id) => {
            setOpenId(id);
            setTab('timeline');
          }}
        />
      ) : (
        <>
          <nav className="tabs">
            <button
              className={`tab ${tab === 'timeline' ? 'active' : ''}`}
              onClick={() => setTab('timeline')}
            >
              Timeline<span className="count">{data.events.length}</span>
            </button>
            <button
              className={`tab ${tab === 'characters' ? 'active' : ''}`}
              onClick={() => setTab('characters')}
            >
              Characters<span className="count">{data.characters.length}</span>
            </button>
            <button
              className={`tab ${tab === 'places' ? 'active' : ''}`}
              onClick={() => setTab('places')}
            >
              Places<span className="count">{data.places.length}</span>
            </button>
            <button
              className={`tab ${tab === 'checks' ? 'active' : ''}`}
              onClick={() => setTab('checks')}
            >
              Checks{issueCount > 0 && <span className="count">{issueCount}</span>}
            </button>
          </nav>

          {tab === 'timeline' && <TimelineView key={project.id} project={project} />}
          {tab === 'characters' && <CharactersView key={project.id} project={project} />}
          {tab === 'places' && <PlacesView key={project.id} project={project} />}
          {tab === 'checks' && <ChecksView key={project.id} project={project} />}
        </>
      )}
    </div>
  );
}
