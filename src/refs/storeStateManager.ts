export default class storeManager {
    _storage: Map<string, object>;
    _storage_cnt: Map<string, number>;

    constructor() {
        this._storage = new Map();
        this._storage_cnt = new Map();
        this.store = this.store.bind(this);
        this.delete = this.delete.bind(this);
        this.set = this.set.bind(this);
        this.get = this.get.bind(this);
    }
    get(key: string, kind: string): any {
        if (!key) throw new Error("store state error : invalid key");
        if (kind) key = kind + '_' + key;
        let item: object | undefined = this._storage.get(key);
        if (item) return item;
        let localItem = localStorage.getItem(key);
        if (!localItem) return undefined;

        let res: any = JSON.parse(localItem);
        if (res === 0 || res) {
            this._storage.set(key, res);
            return res;
        }
        return undefined;
    }
    set(key: string, item: any, kind: string): void {
        if (!key) throw new Error("store state error : invalid key");
        if (kind) key = kind + '_' + key;
        this._storage.set(key, item);
        localStorage.setItem(key, JSON.stringify(item));
        const cnt = this._storage_cnt.get(key);
        if (!cnt) this._storage_cnt.set(key, 1);
    }

    store(key: string, kind: string): void {
        if (!key) throw new Error("store state error : invalid key");
        if (kind) key = kind + '_' + key;
        let cnt = this._storage_cnt.get(key);
        this._storage_cnt.set(key, (cnt) ? cnt + 1 : 1);
    }
    delete(key: string, kind: string): void {
        if (!key) throw new Error("store state error : invalid key");
        if (kind) key = kind + '_' + key;
        let cnt: number = this._storage_cnt.get(key)!;
        if (cnt > 1) {
            this._storage_cnt.set(key, cnt - 1);
        } else if (cnt === 1) {
            this._storage_cnt.delete(key);
            this._storage.delete(key);
            localStorage.removeItem(key);
        }
    }
}