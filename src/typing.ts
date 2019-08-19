export interface StoreOptions {
  name: string;
  cache?: number;
}

export type StoreMiddleware<T> = (oldState: Readonly<T>, newState: Readonly<T>) => T;

export type ID = string | number;

export interface EntityStoreOptions<IdKey extends string> {
  name: string;
  cache?: number;
  idKey: IdKey;
}

export interface EntityState<T> {
  entities: T[],
  activeId: ID;
}