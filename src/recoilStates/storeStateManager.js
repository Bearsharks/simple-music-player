export default class storeStateManager {
    constructor(storeState) {
        if (storeState) {
            this.storeState = storeState[0];
            this.setStoreState = storeState[1];
        }
        this.storeState = null;
        this.setStoreState = null;
        this.store = this.store.bind(this);
        this.delete = this.delete.bind(this);
        this.get = this.get.bind(this);
        this.set = this.set.bind(this);
        this.init = this.init.bind(this);
        this.count = this.count.bind(this);
    }
    init(storeState) {
        this.storeState = storeState[0];
        this.setStoreState = storeState[1];
    }
    get(key) {
        const item = localStorage.getItem(key)
        if (item) return JSON.parse(item);
        return undefined;
    }
    set(key, item) {
        if (item) {
            if (typeof item === 'object') localStorage.setItem(key, JSON.stringify(item));
            else localStorage.setItem(key, item);
        }
    }
    store(key, item) {
        if (!key) throw new Error("store state error : invalid key");
        let cnt = this.storeState.get(key);
        this.setStoreState(m => m.set(key, cnt ? cnt + 1 : 1));
        if (item) {
            this.set(key, item);
        }
    }
    count(key) {
        let cnt = this.storeState.get(key);
        return cnt ? cnt : 0;
    }
    append(key, item) {
        const newitem = [...this.get(key), ...item];
        localStorage.setItem(key, JSON.stringify(newitem));
    }
    delete(key) {
        let cnt = this.storeState.get(key);
        if (cnt > 1) {
            this.storeState.set(key, cnt - 1);
        } else if (cnt === 1) {
            this.storeState.delete(key);
            localStorage.removeItem(key);
        }
    }
}