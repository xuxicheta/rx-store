import glob from 'window-or-global';
import { Subject, Subscription } from 'rxjs';
import { Store } from 'store';


export class SundukUtils {
  static changes$ = new Subject<any>();

  static meta = {
    prod: false,
    __stores: {} as Record<string, Store<any>>,
    __subscriptions: {} as Record<string, Subscription>,
    changes: SundukUtils.changes$.asObservable(),
  }

  static enableSundukProdMode() {
    SundukUtils.meta.prod = true;
  }

  static addStore<T>(name: string, store: Store<T>) {
    if (SundukUtils.meta.prod) {
      return;
    }
    if (SundukUtils.meta.__stores.hasOwnProperty(name)) {
      throw new Error('duplicate store names');
    }
    SundukUtils.meta.__stores[name] = store;
    SundukUtils.meta.__subscriptions[name] = store.select().subscribe(SundukUtils.changes$);
    SundukUtils.sendSundukMessage('addStore', { name })
  }

  static removeStore(name: string) {
    if (SundukUtils.meta.prod) {
      return;
    }
    SundukUtils.meta.__subscriptions[name].unsubscribe();
    delete SundukUtils.meta.__stores[name];
    delete SundukUtils.meta.__subscriptions[name];
    SundukUtils.sendSundukMessage('removeStore', { name })
  }

  static sendSundukMessage(type: string, context: any) {
    if ('postMessage' in glob) {
      glob.postMessage({
        message: 'sunduk:message',
        type,
        context,
      }, "*");
    }
  }
}

glob.__SUNDUK_META__ = SundukUtils.meta;
