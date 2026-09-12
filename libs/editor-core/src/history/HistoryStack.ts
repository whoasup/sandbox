export interface EditorCommand {
  readonly label: string;
  execute(): void;
  undo(): void;
}

const DEFAULT_LIMIT = 100;

/**
 * Session-only undo/redo stack (~100 entries). New pushes clear the redo
 * branch. Not persisted to IndexedDB.
 */
export class HistoryStack {
  private readonly undoStack: EditorCommand[] = [];
  private readonly redoStack: EditorCommand[] = [];

  public constructor(private readonly limit = DEFAULT_LIMIT) {}

  public get canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  public get canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  public get undoLabel(): string | null {
    return this.undoStack[this.undoStack.length - 1]?.label ?? null;
  }

  public get redoLabel(): string | null {
    return this.redoStack[this.redoStack.length - 1]?.label ?? null;
  }

  /** Execute the command, push it, and clear redo. */
  public push(cmd: EditorCommand): void {
    cmd.execute();
    this.undoStack.push(cmd);
    this.redoStack.length = 0;
    this.trim();
  }

  /**
   * Record a command that was already applied (e.g. a document mutation
   * performed outside `execute`). Does not call `execute` again.
   */
  public pushExecuted(cmd: EditorCommand): void {
    this.undoStack.push(cmd);
    this.redoStack.length = 0;
    this.trim();
  }

  public undo(): void {
    const cmd = this.undoStack.pop();
    if (!cmd) return;
    cmd.undo();
    this.redoStack.push(cmd);
  }

  public redo(): void {
    const cmd = this.redoStack.pop();
    if (!cmd) return;
    cmd.execute();
    this.undoStack.push(cmd);
  }

  public clear(): void {
    this.undoStack.length = 0;
    this.redoStack.length = 0;
  }

  private trim(): void {
    while (this.undoStack.length > this.limit) {
      this.undoStack.shift();
    }
  }
}
