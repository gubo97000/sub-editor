import { browser } from '$app/environment';

/**
 * @template T
 */
export class LocalStore {
    /** @type {T} */
    value = $state();

    /** @type {string} */
    key = '';

    /**
     * @param {string} key
     * @param {T} value
     */
    constructor(key, value) {
        this.key = key;
        this.value = value;

        if (browser) {
            const item = localStorage.getItem(key);
            if (item) this.value = this.deserialize(item);
        }

        $effect(() => {
            localStorage.setItem(this.key, this.serialize(this.value));
        });
    }

    /**
     * @param {T} value
     * @returns {string}
     */
    serialize(value) {
        return JSON.stringify(value);
    }

    /**
     * @param {string} item
     * @returns {T}
     */
    deserialize(item) {
        return JSON.parse(item);
    }
}

/**
 * @template T
 * @param {string} key
 * @param {T} value
 * @returns {LocalStore<T>}
 */
export function localStore(key, value) {
    return new LocalStore(key, value);
}