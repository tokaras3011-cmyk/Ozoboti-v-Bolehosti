export const game = {};

export function bind(obj, name, get) {
  Object.defineProperty(obj, name, { get, configurable: true });
}

export function bindLet(obj, name, get, set) {
  Object.defineProperty(obj, name, { get, set, configurable: true });
}
