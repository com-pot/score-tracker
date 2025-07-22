export function createControlablePromise<T>(): ControlablePromise<T> {
    let resolve: ControlablePromise<T>["resolve"] = () => console.error("resolve not ready yet")
    let reject: ControlablePromise<T>["reject"] = () => console.error("reject not ready yet")

    const p = (() => new Promise<T>((res, rej) => {
        resolve = res
        reject = rej
    }))()

    return {
        promise: p,
        resolve,
        reject,
    }
}

export type ControlablePromise<T> = {
    promise: Promise<T>,
    resolve: (value: T) => void,
    reject: (reason: any) => void,
}