import type { GameSpec } from "$lib/game.svelte";
import type { I18nString } from "$lib/I18n";
import type { JsonSchema } from "$lib/svelte-schema/schema";

export type ContestDefinition<Rules extends object> = {
    id: string;
    name: I18nString;

    rules: JsonSchema;
    rulePresets: {
        id: string,
        name: I18nString,
        rules: Partial<Rules>,
    }[],

    loadBundle?(): Promise<ContestBundle>,
}

export type ContestBundle = {
    sanitizeGameSpec(gameSpec: GameSpec): SanitizedGameSpec,
}
export type SanitizedGameSpec = Pick<GameSpec, "name"|"contest"> & {
    rules: Record<string, unknown>,
    state: Record<string, unknown>,
}

export type ActorSlot = {
    type: "player" | "team",
}

export type Actor = {
    id: string,
    name: I18nString,
}

export type GameOpts<State> = {
    initialState?: State,
    onChange: (state: State) => void,
}
