import { Store } from './store';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';

type ID = string | number;

interface StoreOptions {
  name: string;
  cache?: number;
  idKey: string;
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

export class EntityStore<T> extends Store<EntityState<T>> {
  private idKey: string;

  constructor(
    options: StoreOptions,
  ) {
    const data: EntityState<T> = {
      ...initialData,
      entities: [],
      activeId: null,
    };
    super(data as any, options);
    this.idKey = options.idKey;
  }

  public setEntities(entities: T[]) {
    this.update({ entities });
  }

  public selectEntities() {
    return this.select().pipe(
      map(value => value.entities)
    );
  }

  public selectEntity(id: ID): Observable<T> {
    return this.selectEntities().pipe(
      map(entities => entities.find(el => el[this.idKey] === id))
    );
  }

  public getEntities(): T[] {
    return this.getValue().entities;
  }

  public getEntity(id: ID): T {
    return this.getEntities().find(el => el[this.idKey] === id)
  }

  public setActiveId(activeId: ID) {
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

  public updateEntity(id: ID, entity: T) {
    const existed = this.getEntity(id);
    const entities = this.getValue().entities.slice();
    const index = entities.indexOf(existed);
    entities[index] = {
      ...entities[index],
      entity,
    };
    this.setEntities(entities);
  }
}