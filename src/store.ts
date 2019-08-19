import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { StoreMiddleware, StoreOptions } from './typing';
import { SundukUtils } from './sunduk';

export class Store<T extends Object> {
  protected data: BehaviorSubject<T>;
  private loading: BehaviorSubject<boolean>;
  private cacheStatus: BehaviorSubject<boolean>;
  private cacheStart: Date;
  private cache: number;
  private cacheTimer: number;
  private updateMiddlewares: StoreMiddleware<T>[] = [];
  private storeName: string;

  constructor(
    private initialData: T,
    options: StoreOptions,
  ) {
    this.data = new BehaviorSubject(initialData);
    this.loading = new BehaviorSubject(false);
    this.cacheStatus = new BehaviorSubject(false);
    this.cache = options.cache;
    this.storeName = options.name;
    SundukUtils.addStore(this.storeName, this);
  }

  public getValue(): T {
    return this.data.getValue();
  }

  public select(): Observable<T> {
    return this.data.asObservable();
  }

  public update(value: Partial<T>): void {
    this.data.next(this.applyMiddlewares(value));
  }

  public set(value: T): void {
    this.update(value);
    this.loading.next(false);
    if (this.cache) {
      this.setCacheStatus(true);
    }
  }

  public reset(): void {
    this.data.next(this.initialData);
  }

  public setLoading(loading: boolean): void {
    this.loading.next(loading);
  }

  public selectLoading(): Observable<boolean> {
    return this.loading.asObservable();
  }

  public getLoading(): boolean {
    return this.loading.getValue();
  }

  public fetch(fetchingFunction: () => Observable<T>): Observable<T> {
    this.setLoading(true);
    return fetchingFunction().pipe(
      tap((result: T) => this.set(result)),
      tap(() => this.setLoading(false)),
    )
  }

  public setCacheStatus(status: boolean): void {
    this.cacheStatus.next(status);
    clearTimeout(this.cacheTimer);
    if (status) {
      this.cacheStart = new Date();
      this.cacheTimer = setTimeout(() => {
        this.setCacheStatus(false)
      })
    }
  }

  public hasCache(): boolean {
    return !!this.cache;
  }

  public selectCache(): Observable<boolean> {
    return this.cacheStatus.asObservable();
  }

  public getCache(): boolean {
    return this.cacheStatus.getValue();
  }

  public addMiddleware(middleware: StoreMiddleware<T>): void {
    this.updateMiddlewares.push(middleware);
  }

  public clearMiddlewares(): void {
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

  public destroy() {
    this.data.complete();
    this.loading.complete();
    this.cacheStatus.complete();
    SundukUtils.removeStore(this.storeName);
  }
}