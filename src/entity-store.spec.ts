import * as faker from 'faker';
import { first } from 'rxjs/operators';
import { EntityStore } from './entity-store';
import { ID } from './typing';

interface TestObject {
  objectId: ID;
  name: string;
  age: number;
  date: Date;
}

function getTestSample(v: any, i: number): TestObject {
  return {
    objectId: i + 1,
    name: faker.name.firstName(),
    age: faker.random.number({ min: 1, max: 100 }),
    date: faker.date.recent(),
  }
}

function createMockList() {
  return Array.from(Array(10), getTestSample);
}

let mockList: TestObject[];
let store: EntityStore<TestObject, 'objectId'>;

describe('basic entity', () => {
  beforeEach(() => {
    store = new EntityStore<TestObject, 'objectId'>({ name: 'test', idKey: 'objectId' });
    mockList = createMockList();
  });

  it('created', () => {
    expect(store).toBeInstanceOf(EntityStore);
  });

  it('initial getAll', () => {
    const result = store.getAll();
    expect(result).toBeInstanceOf(Array);
    expect(result.length).toBe(0);
  });

  test('setEntities', () => {
    store.setEntities(mockList);
    const result = store.getAll();
    expect(result.length).toBe(10);
    expect(result).toEqual(expect.arrayContaining(mockList));
  });

  it('updateEntity', () => {
    store.setEntities(mockList);
    store.updateEntity(1, { name: 'COps12' });
    store.updateEntity(7, { age: 81 });
    const result = store.getAll();
    expect(result.length).toBe(10);
    expect(result[0].name).toBe('COps12');
    expect(result[0].name).not.toBe(mockList[0].name);
    expect(result[6].age).toBe(81);
  });

  it('empty updateEntity', () => {
    store.setEntities(mockList);
    store.updateEntity(1, {});
    const result = store.getAll();
    expect(result.length).toBe(10);
    expect(result[0].name).toBe(mockList[0].name);
  });

  it('addEntity', () => {
    store.setEntities(mockList);
    const adding = getTestSample(null, 20);
    store.addEntity(adding);
    const result = store.getAll();
    expect(result.length).toBe(11);
    expect(result[10].name).toBe(adding.name);
  });

  it('removeEntity', () => {
    store.setEntities(mockList);
    store.removeEntity(9);
    const result = store.getAll();
    expect(result.length).toBe(9);
  })
});

describe('active', () => {
  beforeEach(() => {
    store = new EntityStore<TestObject, 'objectId'>({ name: 'test', idKey: 'objectId' });
    mockList = createMockList();
    store.setEntities(mockList);
  });

  it('no active', () => {
    const result = store.getActive();
    expect(result).toBeUndefined();
  });

  it('set active and getActiveId', () => {
    store.setActiveId(2);
    const result = store.getActiveId();
    expect(result).toBe(2);
  });

  it('set nonexistent active id', () => {
    expect(() => store.setActiveId(1000)).toThrow();
  })

  it('get active', () => {
    store.setActiveId(4);
    const result = store.getActive();
    expect(result.name).toBe(mockList[3].name);
    expect(result.objectId).toBe(4);
  });
});

describe('observable entity', () => {
  beforeEach(() => {
    store = new EntityStore<TestObject, 'objectId'>({ name: 'test', idKey: 'objectId' });
    mockList = createMockList();
  });

  it('select value', async () => {
    await expect(store.selectAll().pipe(first()).toPromise()).resolves.toMatchObject([]);
  })

  it('pulsating on setEntities', () => {
    const listener = jest.fn();
    store.selectAll().subscribe(listener);
    store.setEntities(mockList);
    expect(listener).toBeCalledTimes(2);
  });

  it('pulsating on updateEntity', () => {
    const listener = jest.fn(state => state.length);
    store.selectAll().subscribe(listener);
    store.setEntities(mockList);
    store.updateEntity(5, { name: 'lol' });
    expect(listener).toBeCalledTimes(3);
    expect(listener).toHaveLastReturnedWith(10);
  });

  it('pulsating on updateEntity with selectEntity', () => {
    const listener = jest.fn();
    store.setEntities(mockList);
    store.selectEntity(4).subscribe(listener);
    store.updateEntity(4, { name: 'lol' });
    expect(listener).toBeCalledTimes(2);
  });

  it('pulsating on updateEntity with selectEntity other entity', () => {
    const listener = jest.fn();
    store.setEntities(mockList);
    store.selectEntity(2).subscribe(listener);
    store.updateEntity(4, { name: 'lol' });
    expect(listener).toBeCalledTimes(1);
  });

  it('select on updateEntity', async () => {
    store.setEntities(mockList);
    store.updateEntity(4, { name: 'lol' });
    await expect(store.selectEntity(4).pipe(first()).toPromise()).resolves.toMatchObject({ name: 'lol', age: mockList[3].age });
  });

  it('pulsating on addEntity', () => {
    const listener = jest.fn(state => state.length);
    store.selectAll().subscribe(listener);
    store.setEntities(mockList);
    const adding = getTestSample(null, 20);
    store.addEntity(adding);
    expect(listener).toBeCalledTimes(3);
    expect(listener).toHaveLastReturnedWith(11);
  });

  it('pulsating on removeEntity', () => {
    const listener = jest.fn(state => state.length);
    store.selectAll().subscribe(listener);
    store.setEntities(mockList);
    store.removeEntity(6);
    expect(listener).toBeCalledTimes(3);
    expect(listener).toHaveLastReturnedWith(9);
  });
});





