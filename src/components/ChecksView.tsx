import { useChronicle } from '../store';
import { findContinuityIssues, findUnusedCharacters } from '../world';
import type { Project } from '../types';

export function ChecksView({ project }: { project: Project }) {
  const { getData } = useChronicle();
  const data = getData(project.id);

  const issues = findContinuityIssues(data);
  const unused = findUnusedCharacters(data);
  const undated = data.events.filter((event) => !event.placeId);
  const emptyEvents = data.events.filter((event) => event.changes.length === 0);

  const clean = issues.length === 0 && unused.length === 0 && undated.length === 0 && emptyEvents.length === 0;

  return (
    <div className="detail" style={{ margin: '0 auto' }}>
      <h1>Checks</h1>
      <p className="sub">
        Contradictions the timeline can prove on its own, plus a few gentler nudges.
      </p>

      {clean && (
        <div className="card">
          <p className="empty" style={{ padding: 0 }}>
            Nothing to flag. Everyone is where they should be, and nobody is doing anything after
            they die.
          </p>
        </div>
      )}

      {issues.length > 0 && (
        <div className="card">
          <h2>Contradictions</h2>
          {issues.map((issue, index) => {
            const event = data.events.find((candidate) => candidate.id === issue.eventId);
            return (
              <div className={`warn ${issue.severity}`} key={`${issue.eventId}-${index}`}>
                {issue.message}
                {event && (
                  <div className="where">
                    {event.chapter || 'unplaced'} · {project.timeUnit} {event.when}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {unused.length > 0 && (
        <div className="card">
          <h2>Characters who never appear</h2>
          <p className="empty" style={{ padding: '0 0 10px' }}>
            Written down but never used. Either they belong in a scene, or they belong in the bin.
          </p>
          {unused.map((character) => (
            <div className="warn warning" key={character.id}>
              {character.name} isn't in any event.
            </div>
          ))}
        </div>
      )}

      {(emptyEvents.length > 0 || undated.length > 0) && (
        <div className="card">
          <h2>Loose ends</h2>
          {emptyEvents.map((event) => (
            <div className="warn warning" key={event.id}>
              "{event.title}" doesn't change anything about the world.
              <div className="where">
                If nothing is different afterwards, ask what the scene is for.
              </div>
            </div>
          ))}
          {undated.map((event) => (
            <div className="warn warning" key={`place-${event.id}`}>
              "{event.title}" has no setting.
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
