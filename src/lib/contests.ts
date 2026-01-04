import { definition as shootingDefinition } from "./contests/shooting";
import { definition as enduranceDefinition } from "./contests/endurance";
import { definition as raceDefinition } from "./contests/race";
import type { GameSpec } from "./game.svelte";

export const supportedContests = [
    shootingDefinition,
    raceDefinition,
    enduranceDefinition,
]

export type ContestRules = Record<string, unknown>;

export async function getContestBundle(spec: GameSpec) {
    const contest = supportedContests.find((contest) => contest.id === spec.contest)

    const bundle = contest && (await contest.loadBundle?.()) || null

    if (!bundle) {
        throw new Error("failed to load contest bundle: " + spec.contest)
    }

    return bundle
}
