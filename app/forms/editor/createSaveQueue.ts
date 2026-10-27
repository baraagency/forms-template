/**
 * Serializes saves so an older autosave can never land after a newer one.
 * A failed save does not poison the chain.
 */
export function createSaveQueue<T>(
  save: (data: T) => Promise<number>,
): (data: T) => Promise<number> {
  let chain: Promise<unknown> = Promise.resolve();

  return (data: T) => {
    const next = chain.then(() => save(data));
    chain = next.catch(() => undefined);
    return next;
  };
}
