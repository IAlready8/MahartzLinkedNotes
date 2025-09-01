// LocalForage in-memory mock that persists per instance
type AnyMap = Map<string, any>;
const globalStorage: AnyMap = new Map();

function createStore(prefix: string) {
  return {
    keys: async () => {
      const keys: string[] = [];
      for (const k of globalStorage.keys()) {
        if (k.startsWith(prefix)) {
          keys.push(k.slice(prefix.length));
        }
      }
      return keys;
    },
    getItem: async (key: string) => {
      return globalStorage.get(prefix + key) ?? null;
    },
    setItem: async (key: string, val: any) => {
      globalStorage.set(prefix + key, val);
      return val;
    },
    removeItem: async (key: string) => {
      globalStorage.delete(prefix + key);
    },
    clear: async () => {
      for (const k of Array.from(globalStorage.keys())) {
        if (k.startsWith(prefix)) globalStorage.delete(k);
      }
    }
  };
}

const api = {
  config: (_: any) => {},
  createInstance: (opts?: any) => {
    const name = opts?.name || 'default';
    const storeName = opts?.storeName || 'store';
    const prefix = `${name}/${storeName}::`;
    return createStore(prefix);
  },
  // Global store fallbacks
  keys: async () => Array.from(globalStorage.keys()),
  getItem: async (key: string) => globalStorage.get(`default/store::${key}`) ?? null,
  setItem: async (key: string, val: any) => {
    globalStorage.set(`default/store::${key}`, val);
    return val;
  },
  removeItem: async (key: string) => {
    globalStorage.delete(`default/store::${key}`);
  },
  clear: async () => {
    for (const k of Array.from(globalStorage.keys())) {
      if (k.startsWith('default/store::')) globalStorage.delete(k);
    }
  },
  INDEXEDDB: 'IndexedDB',
  WEBSQL: 'WebSQL',
  LOCALSTORAGE: 'localStorage'
};

export default api;
