import type { SceneDocument } from '../model/SceneDocument';
import type { SceneSnapshot } from '../model/types';
import type { EditorCommand } from './HistoryStack';

/** Restore a full document snapshot on undo/redo. */
export class SnapshotCommand implements EditorCommand {
  public constructor(
    public readonly label: string,
    private readonly document: SceneDocument,
    private readonly before: SceneSnapshot,
    private readonly after: SceneSnapshot,
  ) {}

  public execute(): void {
    this.document.fromSnapshot(this.after);
  }

  public undo(): void {
    this.document.fromSnapshot(this.before);
  }
}

/** Capture before/after around a mutation and return an already-applied command. */
export function captureSnapshotCommand(
  document: SceneDocument,
  label: string,
  mutate: () => void,
): SnapshotCommand {
  const before = document.toSnapshot();
  mutate();
  const after = document.toSnapshot();
  return new SnapshotCommand(label, document, before, after);
}
