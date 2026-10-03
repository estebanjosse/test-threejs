export function installObservation(target, search, snapshot) {
  if (new URLSearchParams(search).get('exploration') === '1') {
    Object.defineProperty(target, 'crystalObservation', { value: () => structuredClone(snapshot()) });
  }
}
