export interface CacheInterface<T> {
    get(key: string): T | undefined;
    set(key: string, value: T): void;
    has(key: string): boolean;
    delete(key: string): boolean;
    clear(): void;
    size: number;
}
export declare class MemoryCache<T> implements CacheInterface<T> {
    private cache;
    private maxSize;
    private ttl?;
    constructor(maxSize?: number, ttl?: number);
    get(key: string): T | undefined;
    set(key: string, value: T): void;
    has(key: string): boolean;
    delete(key: string): boolean;
    clear(): void;
    get size(): number;
    cleanupExpired(): void;
    getStats(): {
        size: number;
        maxSize: number;
        ttl?: number;
        hitRate?: number;
    };
}
//# sourceMappingURL=memoryCache.d.ts.map