import type { GameSpec } from "$lib/game.svelte"

export class LocalGameStorage {
    constructor(private prefix: string) {
        
    }

    private get listKey() {
        return this.prefix + "[games]"
    }

    async list(): Promise<GameSpec[]> {
        if (typeof window !== "undefined" && typeof window.localStorage !== "undefined") {
            return this.parseGameListStr(localStorage.getItem(this.listKey) || undefined)
        }
        return []
    }
    async create(game: GameSpec): Promise<GameSpec> {
        const list = await this.list()

        const existing = list.find((g) => g.name === game.name)
        if (existing) {
            throw new Error("game with the same name already exists: " + game.name)
        }
        list.push(game)
        this.save(game.name, game)
        localStorage.setItem(this.listKey, JSON.stringify(list))
        return game
    }
    async save(key: string, state: GameSpec) {
        localStorage.setItem(this.prefix + key, JSON.stringify(state))
        return true
    }
    async load(key: string): Promise<GameSpec> {
        const data = JSON.parse(localStorage.getItem(this.prefix + key) || "{}") as GameSpec
        if (!data.name || !data.contest) {
            throw new Error("failed to load game state: invalid data")
        }
    
        return data
    }
    async delete(name: GameSpec["name"]) {
        const list = (await this.list())
            .filter((game) => game.name !== name)
        localStorage.setItem(this.listKey, JSON.stringify(list))
        localStorage.removeItem(this.prefix + name)
    }

    private parseGameListStr(str: string = ""): GameSpec[] {
        const games: GameSpec[] = []

        try {
            let parsed = JSON.parse(str || "[]")
            if (!Array.isArray(parsed)) {
                throw new Error("wrong format")
            }
            parsed.forEach((item: GameSpec) => {
                games.push({
                    name: item.name,
                    // initially there was only one type of contests
                    contest: item.contest || "shooting",
                    rules: item.rules,
                })
            })
        } catch (e) {
            console.error("failed to parse items", e)
        }

        return games
    }
}
