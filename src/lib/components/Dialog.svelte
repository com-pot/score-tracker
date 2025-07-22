<script lang="ts" generics="T">
    import type { Snippet } from "svelte";
    import { createControlablePromise, type ControlablePromise } from "$lib/promises";

    const {
        children,
        controls = true,
        theme,
        ...rest
    }: {
        children: Snippet<[typeof ctrl]>,
        controls?: boolean,
        theme?: string,
    } = $props()

    
    let promise: ControlablePromise<T>|null = $state(null)
    let dialogEl = $state<HTMLDialogElement>()

    function onClose() {
        console.log(arguments)
        ctrl.isOpen && ctrl.close("onClose")
    }

    export const ctrl = {
        get isOpen() {
            return !!promise
        },
        async open() {
            if (this.isOpen) {
                throw new Error("already-open")
            }
            if (!dialogEl) {
                throw new Error("popover not available")
            }
            dialogEl.showModal()
            promise = createControlablePromise()
            promise.promise
                .finally(() => {
                    dialogEl?.close()
                    promise = null
                })
            return promise.promise
        },

        confirm(value: T) {
            if (!promise) {
                throw new Error("not open")
            }
            promise.resolve(value)
        },
        close(reason: string): void {
            if (!promise) {
                throw new Error("not open")
            }
            promise.reject(reason)
        },
    }

</script>

<dialog bind:this={dialogEl} onclose={onClose} data-theme={theme} {...rest}>
    {#if controls}
    <div class="controls">
        <button class="btn btn-primary" title="Zavřít dialog" onclick={() => ctrl.close("close")}>&times;</button>
    </div>
    {/if}
    <div class="content">
        {@render children(ctrl)}
    </div>
</dialog>

<style>
    dialog:not([data-theme]) {
        background: unset;
        border: unset;
        padding: unset;
    }
</style>