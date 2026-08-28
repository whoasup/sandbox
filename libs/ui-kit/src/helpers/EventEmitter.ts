export type EventMap = Record<string, unknown>;

export type EventHandler<TPayload> = (payload: TPayload) => void;

/**
 * Minimal typed event emitter used as the base building block for OOP
 * domain classes (e.g. `SceneDocument`) that need to notify Vue views
 * of state changes without depending on Vue reactivity directly.
 */
export class EventEmitter<TEvents extends EventMap> {
  private readonly listeners = new Map<keyof TEvents, Set<EventHandler<unknown>>>();

  public on<TEvent extends keyof TEvents>(
    event: TEvent,
    handler: EventHandler<TEvents[TEvent]>,
  ): () => void {
    const set = this.listeners.get(event) ?? new Set<EventHandler<unknown>>();
    set.add(handler as EventHandler<unknown>);
    this.listeners.set(event, set);
    return () => this.off(event, handler);
  }

  public off<TEvent extends keyof TEvents>(
    event: TEvent,
    handler: EventHandler<TEvents[TEvent]>,
  ): void {
    this.listeners.get(event)?.delete(handler as EventHandler<unknown>);
  }

  public emit<TEvent extends keyof TEvents>(event: TEvent, payload: TEvents[TEvent]): void {
    const set = this.listeners.get(event);
    if (!set) return;
    for (const handler of [...set]) {
      (handler as EventHandler<TEvents[TEvent]>)(payload);
    }
  }

  public removeAllListeners(event?: keyof TEvents): void {
    if (event) {
      this.listeners.delete(event);
      return;
    }
    this.listeners.clear();
  }
}
