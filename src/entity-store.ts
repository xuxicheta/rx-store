import { Store } from './store';
import { map, distinctUntilChanged } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { EntityStoreOptions, ID, EntityState } from 'typing';

export class EntityStore<T extends Record<IdKey, ID>, IdKey extends string> extends Store<EntityState<T>> {
  private idKey: IdKey;

  constructor(
    options: EntityStoreOptions<IdKey>,
  ) {
    const data: EntityState<T> = {
      entities: [],
      activeId: null,
    };
    super(data, options);
    this.idKey = options.idKey;
  }

  public setEntities(entities: T[]): void {
    this.update({ entities: this.sort(entities) });
  }

  public selectAll(): Observable<T[]> {
    return this.select().pipe(
      map(value => value.entities)
    );
  }

  public selectEntity(id: ID): Observable<T> {
    return this.selectAll().pipe(
      map(entities => entities.find(el => (el[this.idKey] as ID) === id)),
      distinctUntilChanged(),
    );
  }

  public getAll(): T[] {
    return this.getValue().entities;
  }

  public getEntity(id: ID): T {
    return this.getAll().find(el => el[this.idKey] === id)
  }

  public setActiveId(activeId: ID): void {
    if (this.getEntity(activeId) === undefined) {
      throw new Error('no entity with this id');
    }
    this.update({ activeId });
  }

  public getActiveId(): ID {
    return this.getValue().activeId;
  }

  public getActive(): T {
    return this.getEntity(this.getActiveId());
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

  public updateEntity(id: ID, entity: Partial<T>): void {
    const existed: T = this.getEntity(id);
    const entities: T[] = this.getAll().slice();
    const index: number = entities.indexOf(existed);
    if (index === -1) {
      throw new Error('attempt to update nonexistent entity');
    }
    entities[index] = {
      ...entities[index],
      ...entity,
    };
    this.setEntities(entities);
  }

  public addEntity(entity: T) {
    if(this.getEntity(entity[this.idKey])) {
      throw new Error('id duplicate');
    }
    const entities = this.getAll().slice();
    entities.push(entity);
    this.setEntities(entities);
  }

  public removeEntity(id: ID) {
    const e = this.getEntity(id);
    if (!e) {
      throw new Error('no such id');
    }
    const entities = this.getAll().slice();
    const index = entities.indexOf(e);
    entities.splice(index, 1);
    this.setEntities(entities);
  }

  private sort(entities: T[]): T[] {
    return entities.sort((a, b) => +a[this.idKey] - +b[this.idKey])
  }
}