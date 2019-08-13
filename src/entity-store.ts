import { Store } from './store';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';

type ID = string | number;

interface EntityStoreOptions<IdKey extends string> {
  name: string;
  cache?: number;
  idKey: IdKey;
}

interface EntityState<T> {
  entities: T[],
  activeId: ID;
}

function initialData<T>(): EntityState<T> {
  return {
    entities: [],
    activeId: null,
  }
}

export class EntityStore<T extends Record<IdKey, ID>, IdKey extends string> extends Store<EntityState<T>> {
  private idKey: IdKey;

  constructor(
    options: EntityStoreOptions<IdKey>,
  ) {
    const data: EntityState<T> = {
      ...initialData,
      entities: [],
      activeId: null,
    };
    super(data, options);
    this.idKey = options.idKey;
  }

  public setEntities(entities: T[]): void {
    this.update({ entities });
  }

  public selectAll(): Observable<T[]> {
    return this.select().pipe(
      map(value => value.entities)
    );
  }

  public selectEntity(id: ID): Observable<T> {
    return this.selectAll().pipe(
      map(entities => entities.find(el => (el[this.idKey] as ID) === id))
    );
  }

  public getAll(): T[] {
    return this.getValue().entities;
  }

  public getEntity(id: ID): T {
    return this.getAll().find(el => el[this.idKey] === id)
  }

  public setActiveId(activeId: ID): void {
    this.update({ activeId });
  }

  public getActiveId(): ID {
    return this.getValue().activeId;
  }

  public getActive(): T {
    return this.getValue().entities.find(entity => entity[this.idKey] === this.getActiveId());
  }

  public selectActiveId(): Observable<ID> {
    return this.select().pipe(
      map(value => value.activeId)
    );
  }

  public selectActive(): Observable<T> {
    return this.selectActiveId().pipe(
      map(activeId => this.getEntity(activeId))
    )
  }

  public updateEntity(id: ID, entity: T): void {
    const existed: T = this.getEntity(id);
    const entities: T[] = this.getAll().slice();
    const index: number = entities.indexOf(existed);
    if (index === -1) {
      throw new Error('attempt to update nonexistent entity');
    }
    entities[index] = {
      ...entities[index],
      entity,
    };
    this.setEntities(entities);
  }
}