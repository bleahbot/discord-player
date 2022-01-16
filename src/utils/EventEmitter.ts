// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import { EventEmitter } from "node:events";

export class PlayerEventEmitter<L extends ListenerSignature<L> = DefaultListener> extends EventEmitter {
    static defaultMaxListeners: number;
    private onWarningCallbacks: ((eventName: keyof L, events: Array<keyof L>) => unknown)[] = [];

    public constructor(public importantEvents: Array<keyof L> = [], options?: { captureRejections?: boolean }) {
        super(options);
    }

    public onWarning(cb: (eventName: keyof L, events: Array<keyof L>) => unknown) {
        if (typeof cb !== "function") throw new TypeError("Warning callback must be a function");
        this.onWarningCallbacks.push(cb);
        return this;
    }

    public addImportantEvent<U extends keyof L>(eventName: U) {
        if (this.importantEvents.includes(eventName)) return false;
        this.importantEvents.push(eventName);
        return true;
    }

    public removeImportantEvent<U extends keyof L>(eventName: U) {
        if (!this.importantEvents.includes(eventName)) return false;
        const removedEvents = this.importantEvents.splice(
            this.importantEvents.findIndex((x) => x === eventName),
            1
        );
        return removedEvents.includes(eventName);
    }

    public isImportantEvent<U extends keyof L>(eventName: U) {
        return this.importantEvents.some((x) => x === eventName);
    }

    public addListener<U extends keyof L>(event: U, listener: L[U]) {
        return super.addListener(event, listener);
    }

    public prependListener<U extends keyof L>(event: U, listener: L[U]) {
        return super.prependListener(event, listener);
    }

    public prependOnceListener<U extends keyof L>(event: U, listener: L[U]) {
        return super.prependOnceListener(event, listener);
    }

    public removeListener<U extends keyof L>(event: U, listener: L[U]) {
        return super.removeListener(event, listener);
    }

    public removeAllListeners(event?: keyof L) {
        return super.removeAllListeners(event);
    }

    public once<U extends keyof L>(event: U, listener: L[U]) {
        return super.once(event, listener);
    }

    public on<U extends keyof L>(event: U, listener: L[U]) {
        return super.on(event, listener);
    }

    public off<U extends keyof L>(event: U, listener: L[U]) {
        return super.off(event, listener);
    }

    public emit<U extends keyof L>(event: U, ...args: Parameters<L[U]>) {
        if (!this.eventNames().includes(event)) {
            this.onWarningCallbacks.forEach((cb) => {
                cb(event, this.importantEvents);
            });
        }
        return super.emit(event, ...args);
    }

    public eventNames<U extends keyof L>(): U[] {
        return super.eventNames;
    }

    public listenerCount(eventName: keyof L) {
        return super.listenerCount(eventName);
    }

    public listeners<U extends keyof L>(eventName: U): L[U][] {
        return super.listeners(eventName);
    }

    public rawListeners<U extends keyof L>(eventName: U): L[U][] {
        return super.rawListeners(eventName);
    }

    public getMaxListeners() {
        return super.getMaxListeners();
    }

    public setMaxListeners(n: number) {
        return super.setMaxListeners(n);
    }
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export type ListenerSignature<L> = {
    [E in keyof L]: (...args: any[]) => any;
};

export type DefaultListener = {
    [k: string | number | symbol]: (...args: any[]) => any;
};
/* eslint-enable @typescript-eslint/no-explicit-any */
