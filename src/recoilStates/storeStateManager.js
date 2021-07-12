export default class storeStateManager {
    constructor(ss) {
        this.storeState = ss[0];
        this.setStoreState = ss[1];
        this.store = this.store.bind(this);
        this.delete = this.delete.bind(this);
    }
    get(key) {
        const item = localStorage.getItem(key)
        if (item) return JSON.parse(item);
        return undefined;
    }
    store(key, item) {
        let cnt = this.storeState.get(key);
        if (cnt) {
            this.storeState.set(key, cnt + 1);
        } else {
            this.storeState.set(key, 1);
        }
        if (item) {
            if (typeof item === 'object') localStorage.setItem(key, JSON.stringify(item));
            else localStorage.setItem(key, item);
        }
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