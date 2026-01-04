import type { ContestDefinition } from "./_common";

export type EnduranceParameters = {

}

export const definition: ContestDefinition<EnduranceParameters> = {
    id: "race",
    name: {
        cs: "Závod",
        en: "Race",
    },
    rules: {
        type: "object",
        properties: {},
    },
    rulePresets: [],
}
