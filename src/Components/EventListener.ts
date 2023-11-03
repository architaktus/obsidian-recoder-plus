export interface Listener {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this: Document, ev: Event): any;
}

///////////////////////////////////////////////////////////////////////////////
export function onElement(
    el: Document,
    event: keyof HTMLElementEventMap,
    selector: string,
    listener: Listener,
    options?: { capture?: boolean; }
) {
    el.on(event, selector, listener, options);
    return () => el.off(event, selector, listener, options);
}


export function withTimeout<T>(ms: number, promise: Promise<T>): Promise<T> {
    const timeout = new Promise((resolve, reject) => {
        const id = setTimeout(() => {
            clearTimeout(id);
            reject(`timed out after ${ms} ms`)
        }, ms)
    })
    return Promise.race([
        promise,
        timeout
    ]) as Promise<T>
}



