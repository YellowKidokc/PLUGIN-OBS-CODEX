export class SequenceManager {
  private sequences = new Map<string, number>();

  next(trail: string): number {
    const current = this.sequences.get(trail) ?? 0;
    const nextValue = current + 1;
    this.sequences.set(trail, nextValue);
    return nextValue;
  }

  set(trail: string, value: number): void {
    this.sequences.set(trail, value);
  }
}
