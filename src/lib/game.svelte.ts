import type { ContestRules } from "./contests";
import { LocalGameStorage } from "./game/storage.svelte";

export type GameStorageRef = {
    type: "local",
    key: string,
}

export function useGameStorage(ref: GameStorageRef) {
    if (ref.type === "local") {
        const prefix = ref.key || ""

        return new LocalGameStorage(prefix)
    }

    throw new Error("unspupported game storage type: " + ref.type)
}

export type GameSpec<
    Contest extends string = string,
    Rules extends ContestRules = Record<string, unknown>,
    State extends Record<string, unknown> = Record<string, unknown>,
> = {
    name: string,
    contest: Contest,
    rules?: Rules,

    state?: State,
}
