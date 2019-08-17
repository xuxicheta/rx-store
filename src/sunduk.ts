import glob from 'window-or-global';
import { Observable, Subject, Subscription } from 'rxjs';
import { Store } from 'store';

const globSubj = new Subject();

const sunduk = {
  prod: false,
  __stores: {} as Record<string, Store<any>>,
  __subscriptions: {} as Record<string, Subscription>,
  event: globSubj.asObservable(),
}

glob.__sunduk = sunduk;

export function enableSundukProdMode() {
  sunduk.prod = true;
}

export function addStore(name: string, store: Store<any>) {
  if (sunduk.prod) {
    return;
  }
  if (sunduk.__stores.hasOwnProperty(name)) {
    throw new Error('duplicate store names');
  }
  sunduk.__stores[name] = store;
  sunduk.__subscriptions[name] = store.select().subscribe(globSubj);
}

export function removeStore(name: string) {
  if (sunduk.prod) {
    return;
  }
  sunduk.__subscriptions[name].unsubscribe();
  delete sunduk.__stores[name];
  delete sunduk.__subscriptions[name];
}
