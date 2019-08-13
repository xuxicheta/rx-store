import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

interface StoreOptions {
  name: string;
  cache?: number;
}

type Middleware<T> = (oldState: Readonly<T>, newState: Readonly<T>) => T;

export class Store<T extends Object> {
  protected data: BehaviorSubject<T>;
  private loading: BehaviorSubject<boolean>;
  private cacheStatus: BehaviorSubject<boolean>;
  private cacheStart: Date;
  private cache: number;
  private cacheTimer: number;
  private updateMiddlewares: Middleware<T>[] = [];

  constructor(
    private initialData: T,
    options: StoreOptions,
  ) {
    this.data = new BehaviorSubject(initialData);
    this.loading = new BehaviorSubject(false);
    this.cacheStatus = new BehaviorSubject(false);
    this.cache = options.cache;
  }

  public getValue() {
    return this.data.getValue();
  }

  public select() {
    return this.data.asObservable();
  }

  public update(value: Partial<T>) {
    this.data.next(this.applyMiddlewares(value));
  }

  public set(value: T) {
    this.update(value);
    this.loading.next(false);
    if (this.cache) {
      this.setCacheStatus(true);
    }
  }

  public reset() {
    this.data.next(this.initialData);
  }

  public setLoading(loading: boolean) {
    this.loading.next(loading);
  }

  public selectLoading() {
    return this.loading.asObservable();
  }

  public getLoading() {
    this.loading.getValue();
  }

  public fetch(fetchingFunction: () => Observable<T>) {
    this.setLoading(true);
    fetchingFunction().pipe(
      tap(result => this.set(result)),
      tap(() => this.setLoading(false)),
    )
  }

  public setCacheStatus(status: boolean) {
    this.cacheStatus.next(status);
    window.clearTimeout(this.cacheTimer);
    if (status) {
      this.cacheStart = new Date();
      this.cacheTimer = window.setTimeout(() => {
        this.setCacheStatus(false)
      })
    }
  }

  public hasCache() {
    return !!this.cache;
  }

  public selectCache() {
    return this.cacheStatus.asObservable();
  }

  public getCache() {
    return this.cacheStatus.getValue();
  }

  public addMiddleware(middleware: Middleware<T>) {
    this.updateMiddlewares.push(middleware);
  }

  public clearMiddlewares() {
    this.updateMiddlewares = [];
  }

  private applyMiddlewares(value: Partial<T>) {
    const oldState = this.getValue();
    let newState: T = {
      ...this.getValue(),
      ...value,
    };

    this.updateMiddlewares.forEach(middleware => {
      newState = middleware.call(this, oldState, newState);
    })
    return newState;
  }
}