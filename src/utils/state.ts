/** Keeps React state references stable when serialized backend data has not changed. */
export function retainEqualState<T>(previous: T, next: T): T {
  if (Object.is(previous, next)) {
    return previous;
  }

  return JSON.stringify(previous) === JSON.stringify(next) ? previous : next;
}
