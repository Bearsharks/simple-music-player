export default class storeManager {
    constructor() {
        this._storage = new Map();
        this._storage_cnt = new Map();
        this.store = this.store.bind(this);
        this.delete = this.delete.bind(this);
        this.get = this.get.bind(this);
        this.set = this.set.bind(this);
    }
    get(key, kind) {
        if (!key) throw new Error("store state error : invalid key");
        if (kind) key = kind + '_' + key;
        let item = this._storage.get(key);
        if (item) return item;

        item = JSON.parse(localStorage.getItem(key));
        if (item) {
            this._storage.set(key, item);
            return item;
        }
        return undefined;
    }
    set(key, item, kind) {
        if (!key) throw new Error("store state error : invalid key");
        if (kind) key = kind + '_' + key;
        this._storage.set(key, item);
        localStorage.setItem(key, JSON.stringify(item));
        const cnt = this._storage_cnt.get(key);
        if (!cnt) this._storage_cnt.set(key, 1);
    }

    store(key, kind) {
        if (!key) throw new Error("store state error : invalid key");
        if (kind) key = kind + '_' + key;
        let cnt = this._storage_cnt.get(key);
        this._storage_cnt.set(key, (cnt) ? cnt + 1 : 1);
    }
    delete(key, kind) {
        if (!key) throw new Error("store state error : invalid key");
        if (kind) key = kind + '_' + key;
        let cnt = this._storage_cnt.get(key);
        if (cnt > 1) {
            this._storage_cnt.set(key, cnt - 1);
        } else if (cnt === 1) {
            this._storage_cnt.delete(key);
            this._storage.delete(key);
            localStorage.removeItem(key);
        }
    }
}