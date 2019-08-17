import glob from 'window-or-global';

const sunduk = {
  prod: false,
  __stores: {} as any,
}

glob.__sunduk = sunduk;

export function enableSundukProdMode() {
  sunduk.prod = true;
}

export function addStore(name: string, store: any) {
  if (sunduk.__stores.hasOwnProperty(name)) {
    throw new Error('duplicate store names');
  }
  sunduk.__stores[name] = store;
}

export function removeStore(name: string) {
  delete sunduk.__stores[name]
}
