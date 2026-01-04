import type { I18nString } from "$lib/I18n";
import { createSlug } from "$lib/string";
import type { Actor } from "./_common";

export class NewPlayer {
    constructor(
        private opts: {
            players: Readonly<Actor[]>,
        },
    ) {}

    data: Actor = $state({id: "", name: ""});
    get name(): string {
        if (typeof this.data.name === "string") {
            return this.data.name
        }
        return "";
    }
    set name(value: string) {
        this.data.name = value
        this.data.id = createSlug(value)
    }

    nameAvailable = $derived.by(() => {
        return !this.opts.players.find((p) => p.id === this.data.id)
    })

    flush() {
        const result = this.data
        this.data = {id: "", name: ""}
        return result
    }
}
