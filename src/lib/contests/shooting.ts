import type { I18nString } from "$lib/I18n";
import type { Actor, ContestBundle, ContestDefinition } from "./_common";

export type ShootingParameters = {
    attempts: number;
    options: {
        value: number;
        label?: I18nString,
    }[];
}

export type ShootingScoreEntry = {
    player: Actor["id"], round: number,
    attempts: (number | null)[],
}

export type ShootingGameState = {
    players: Actor[],
    scores: ShootingScoreEntry[],
}

export const definition: ContestDefinition<ShootingParameters> = {
    id: "shooting",
    name: {
        cs: "Střelba",
        en: "Shooting",
    },
    rules: {
        type: "object",
        properties: {
            attempts: {
                type: "number",
                minimum: 1,
                'x-i18n': { cs: "Pokusů v kole", en: "Attempts per round" },
            },
            options: {
                type: "array",
                items: {
                    type: "object",
                    properties: {
                        value: {
                            type: "number",
                            'x-i18n': { cs: "Hodnota", en: "Value" },
                        },
                        label: {
                            type: "string",
                            'x-i18n': { cs: "Popisek", en: "Label" },
                        },
                    },
                    required: ["value"],
                },
                'x-i18n': { cs: "Možnosti skóre", en: "Score options" },
            },
        },
    },
    rulePresets: [
        {
            id: "5-hit-miss",
            name: { cs: "5 pokusů, ano/ne", en: "5 attempts, hit/miss" },
            rules: {
                attempts: 5,
                options: [{ value: 1 }, { value: 0 }],
            },
        },
    ],

    async loadBundle() {
        const bundle: ContestBundle = {
            sanitizeGameSpec: (spec) => {
                const rules = spec.rules || this.rulePresets[0].rules
                const state = spec.state || {} as ShootingGameState
                if (!state.players) state.players = []
                if (!state.scores) state.scores = []

                return {
                    ...spec,
                    rules,
                    state,
                }
            },
        }

        return bundle
    },
}
