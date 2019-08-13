import { Store } from '../src/store';

interface Item {
  name: string;
  title: string;
  age: number;
}

function initialState(): Item {
  return {
    name: 'Richard',
    title: 'king',
    age: 42,
  }
}

class ItemState {
  private store = new Store<Item>(initialState(), { name: 'item' });

  public data$ = this.store.select();

  get data() {
    return this.store.getValue();
  }
}

const itemState = new ItemState();

itemState.data$.subscribe(data => console.log(data));
console.log(itemState.data);