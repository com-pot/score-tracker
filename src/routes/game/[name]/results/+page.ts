import type { GameStorageRef } from "$lib/game.svelte";
import type { PageLoad } from "./$types";

// No SSR because we load game from local storage
export const ssr = false;

export const load: PageLoad = ({ params }) => {
    return {
        storageRef: {type: "local", key: "cp/st:"} satisfies GameStorageRef,
        gameRef: { name: params.name },
    }
}
