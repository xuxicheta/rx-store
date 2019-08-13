import { Store } from './store';
import { first, delay } from 'rxjs/operators';
import { of, Observable } from 'rxjs';

interface TestObject {
  name: string;
  value: number;
  date: Date;
  object: object;
}

function initState(): TestObject {
  return {
    name: '',
    value: 0,
    date: null,
    object: {},
  }
}

function setupState(): TestObject {
  return {
    name: 'Rick',
    value: 42,
    date: new Date(),
    object: {
      mem: 15,
      di: 'do',
    },
  }
}

function fetchFunction(): Observable<TestObject> {
  return of(setupState()).pipe(
    delay(30),
  )
}

let store: Store<TestObject>;

describe('basic value', () => {
  beforeEach(() => {
    store = new Store(initState(), { name: 'test' });
  });

  it('created', () => {
    expect(store).toBeInstanceOf(Store);
  });

  it('initial value', () => {
    const result = store.getValue();
    expect(result.name).toBe('');
    expect(result.value).toBe(0);
    expect(result.date).toBeNull();
  });

  test('setup value', () => {
    store.set(setupState());
    const result = store.getValue();
    expect(result.name).toBe('Rick');
    expect(result.value).toBe(42);
    expect(result.date.getTime()).toBeLessThanOrEqual(new Date().getTime());
  });

  it('update', () => {
    store.set(setupState());
    store.update({ name: 'Bill' });
    expect(store.getValue().name).toBe('Bill');
    store.update({ value: 15 });
    expect(store.getValue().value).toBe(15);
  });

  it('empty update', () => {
    store.set(setupState());
    const state = store.getValue();
    store.update({});
    expect(store.getValue()).toMatchObject(state);
  })

  it('reset', () => {
    store.set(setupState());
    store.reset();
    const result = store.getValue();
    expect(result.name).toBe('');
    expect(result.value).toBe(0);
    expect(result.date).toBeNull();
  })

});

describe('basic cache', () => {
  beforeEach(() => {
    store = new Store(initState(), { name: 'test', cache: 100 });
  });

  it('set cache', () => {
    expect(store.hasCache()).toBeTruthy();
  });

  it('empty cache', () => {
    expect(store.getCache()).toBeFalsy();
  });

  it('set cache', () => {
    store.set(setupState());
    expect(store.getCache()).toBeTruthy();
  });

  it('expire cache', (done) => {
    store.set(setupState());
    setTimeout(() => {
      expect(store.getCache()).toBeFalsy();
      done();
    }, 110)
  }, 200)
});

describe('basic loading', () => {
  beforeEach(() => {
    store = new Store(initState(), { name: 'test' });
  });

  it('init loading', () => {
    expect(store.getLoading()).toBeFalsy();
  });

  it('set loading', () => {
    store.setLoading(true);
    expect(store.getLoading()).toBeTruthy();
    store.setLoading(false);
    expect(store.getLoading()).toBeFalsy();
  });

  it('disable loading after set', () => {
    store.setLoading(true);
    store.set(setupState());
    expect(store.getLoading()).toBeFalsy();
  })
});

describe('observable value', () => {
  beforeEach(() => {
    store = new Store(initState(), { name: 'test' });
  });

  it('select value', async () => {
    await expect(store.select().pipe(first()).toPromise()).resolves.toMatchObject(initState());
  })

  it('pulsating on set', () => {
    const listener = jest.fn();
    store.select().subscribe(listener);
    store.set(setupState());
    expect(listener).toBeCalledTimes(2);
  });

  it('pulsating on update', () => {
    const listener = jest.fn(state => state.name);
    store.select().subscribe(listener);
    store.set(setupState());
    store.update({ name: 'lol' });
    expect(listener).toBeCalledTimes(3);
    expect(listener).toHaveNthReturnedWith(1, '');
    expect(listener).toHaveNthReturnedWith(2, 'Rick');
    expect(listener).toHaveNthReturnedWith(3, 'lol');
  });

  it('pulsating on reset', () => {
    const listener = jest.fn();
    store.select().subscribe(listener);
    store.reset();
    expect(listener).toBeCalledTimes(2);
  });

  it('no pulsating', () => {
    const listener = jest.fn();
    store.select().subscribe(listener);
    expect(listener).toBeCalledTimes(1);
  })

  it('select after update', async () => {
    store.update({ object: { meat: 'beat' } });
    await expect(store.select().pipe(first()).toPromise()).resolves.toMatchObject({ object: { meat: 'beat' } });
  })
});

describe('observable loading', () => {
  beforeEach(() => {
    store = new Store(initState(), { name: 'test' });
  });

  it('set loading', () => {
    const listener = jest.fn(state => state);
    store.selectLoading().subscribe(listener);
    store.setLoading(true);
    store.setLoading(false);
    expect(listener).toHaveNthReturnedWith(1, false);
    expect(listener).toHaveNthReturnedWith(2, true);
    expect(listener).toHaveNthReturnedWith(3, false);
  });
});

describe('observable caching', () => {
  beforeEach(() => {
    store = new Store(initState(), { name: 'test', cache: 100 });
  });

  it('observe cache at set', (done) => {
    const listener = jest.fn(state => state);
    store.selectCache().subscribe(listener);
    store.set(setupState());

    setTimeout(() => {
      expect(listener).toHaveNthReturnedWith(1, false);
      expect(listener).toHaveNthReturnedWith(2, true);
      expect(listener).toHaveNthReturnedWith(3, false);
      done();
    }, 150);
  }, 200)
});

describe('fetching', () => {
  beforeEach(() => {
    store = new Store(initState(), { name: 'test', cache: 100 });
  });

  it('fetch result', async () => {
    await expect(store.fetch(fetchFunction).toPromise()).resolves.toMatchObject({ name: 'Rick', value: 42 });
  })

  it('fetch process', (done) => {
    const listener = jest.fn(state => state.name);
    store.select().subscribe(listener);
    store.fetch(fetchFunction).subscribe();
    setTimeout(() => {
      expect(listener).toHaveNthReturnedWith(1, '');
      expect(listener).toHaveNthReturnedWith(2, 'Rick');
      done();
    }, 100)
  });

  it('fetch loading process', (done) => {
    const listener = jest.fn(state => state);
    store.selectLoading().subscribe(listener);
    store.fetch(fetchFunction).subscribe();
    setTimeout(() => {
      expect(listener).toHaveNthReturnedWith(1, false);
      expect(listener).toHaveNthReturnedWith(2, true);
      expect(listener).toHaveNthReturnedWith(3, false);
      done();
    }, 100)
  })

  it('fetch cache process', (done) => {
    const listener = jest.fn(state => state);
    store.selectCache().subscribe(listener);
    store.fetch(fetchFunction).subscribe();
    setTimeout(() => {
      expect(listener).toHaveNthReturnedWith(1, false);
      expect(listener).toHaveNthReturnedWith(2, true);
      expect(listener).toHaveNthReturnedWith(3, false);
      done();
    }, 150)
  })
});

describe('middleware', () => {
  beforeEach(() => {
    store = new Store(initState(), { name: 'test' });
  });

  it('call middleware', () => {
    const listener = jest.fn((oldState, newState) => newState);
    store.addMiddleware(listener);
    store.set(setupState());
    store.update({});
    expect(listener).toBeCalledTimes(2);
  });

  it('params middleware', () => {
    const listener = jest.fn((oldState, newState) => newState);
    store.addMiddleware(listener);
    store.set(setupState());
    expect(listener).toHaveReturned()
  });

  it('stopping middleware', () => {
    const middleware = (oldState: Readonly<TestObject>, newState: Readonly<TestObject>) => oldState;
    store.addMiddleware(middleware);
    store.set(setupState());
    expect(store.getValue().name).toBe('');
  });

  it('modifying middleware', () => {
    const middleware = (oldState: Readonly<TestObject>, newState: Readonly<TestObject>) => ({ ...newState, name: 'Stan' });
    store.addMiddleware(middleware);
    store.set(setupState());
    expect(store.getValue().name).toBe('Stan');
  });
});


