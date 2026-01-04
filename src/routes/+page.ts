import type { GameStorageRef } from "$lib/game.svelte";

// since there's no dynamic data here, we can prerender
// it so that it gets served as a static asset in production
export const prerender = true;

export async function load() {
    return {
        storageRef: {type: "local", key: "cp/st:"} satisfies GameStorageRef,
    };
}
