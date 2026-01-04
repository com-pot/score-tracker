import type { ContestDefinition } from "./_common";

export type EnduranceParameters = {

}

export const definition: ContestDefinition<EnduranceParameters> = {
    id: "endurance",
    name: {
        cs: "Vytrvalost",
        en: "Endurance",
    },
    rules: {
        type: "object",
        properties: {},
    },
    rulePresets: [],
}
