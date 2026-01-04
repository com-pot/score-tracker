<script lang="ts">
    import { goto } from '$app/navigation';
    import app from '$lib/app';
    import { supportedContests } from '$lib/contests';
    import { type GameSpec, useGameStorage } from '$lib/game.svelte';
    import { getI18n } from '$lib/I18n';
    import type { PageProps } from './$types';

    const {
        data,
    }: PageProps = $props()
    const i18n = getI18n();
    const gameStorage = useGameStorage(data.storageRef);

    let listInvalidation = $state(1)
    const gamesRaw = $derived(listInvalidation ? await gameStorage.list() : [])
    const list = $derived(
            gamesRaw.map((game) => ({
                ...game,
                contest: supportedContests.find((c) => c.id === game.contest)!,
            }))
            .filter((game) => !!game.contest)
    )

    const newGame = $state({
        name: "",
        contest: supportedContests[0].id,
    })

    const nameAvailable = $derived.by(() => {
        if (!newGame.name) return false
        return !list.find((game) => game.name === newGame.name)
    })
    async function createGame(game: GameSpec) {
        await gameStorage.create(newGame)

        await goto("/game/" + game.name)
    }

    async function copyToClipboard(name: GameSpec["name"]) {
        const game = await gameStorage.load(name)

        navigator.clipboard.writeText(JSON.stringify({
            game,
        }, null, 2))
    }

    async function addFromClipboard() {
        const text = await navigator.clipboard.readText()
        const {game} = JSON.parse(text)

        if (!game?.name) {
            console.warn("Oops", {game});
            return
        }

        return createGame(game)
    }
</script>

<svelte:head>
    <title>Home</title>
    <meta name="description" content="Svelte demo app" />
</svelte:head>

<section>
    <h1 class="app-name">{app.name}</h1>

    <div class="row">
        <div class="col-md-5" data-name="game-list">
            <div class="heading">
                <h2>Existující hry</h2>
                <button class="btn btn-text btn-link" onclick={addFromClipboard}>Načíst ze schránky</button>
            </div>
            <ul class="tile-list">
                {#each list as game (game.name)}
                <li class="tile" data-contest={game.contest.id}>
                    <div class="tile-body">
                        <a href="{`/game/${game.name}`}">{game.name}</a>
                        <small>{i18n.t(game.contest.name)}</small>
                    </div>
                    
                    <div class="actions btn-group">
                        <button type="button" class="btn btn-primary btn-sm dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false" aria-label="Akce hry"></button>
                        <ul class="dropdown-menu">
                            <li>
                                <button class="dropdown-item" onclick={() => copyToClipboard(game.name)}>Kopírovat do schránky</button>
                            </li>
                            <li><hr class="dropdown-divider"></li>
                            <li><button class="dropdown-item text-danger" onclick={() => gameStorage.delete(game.name).then(() => listInvalidation++)}>Smazat</button></li>
                        </ul>
                    </div>
                    <div class="dropdown"></div>
                </li>
                {/each}
            </ul>
        </div>

        <div class="col-md-7" data-name="create-game">
            <h2>Vytvořit novou hru</h2>
            <form onsubmit={(e) => (e.preventDefault(), createGame(newGame))}>
                <div class="auto-grid row-compact">
                    {#each supportedContests as contest (contest.id)}
                    <label class="card card-sm">
                        <div class="card-input">
                            <input type="radio"
                                name="contest"
                                value={contest.id}
                                disabled={!contest.loadBundle}
                                bind:group={newGame.contest}
                            />
                        </div>
                        <div class="card-body">
                            <span class="name">{i18n.t(contest.name)}</span>
                        </div>
                    </label>
                    {/each}
                </div>

                <div class="input-group mt-3">
                    <input class="form-control" name="newGameName"
                        type="text"
                        bind:value={newGame.name}
                    >
                    <button class="btn btn-outline-secondary"
                        disabled="{!nameAvailable}"
                    >+</button>
                </div>
            </form>
        </div>
    </div>
</section>

<style lang="scss">
[data-contest] {
    .tile-body {
        display: flex;
        flex-direction: column;

        small {
            color: var(--bs-gray);
        }
    }
    .actions .btn {
        align-self: start;
        border-top-left-radius: 0;
        border-bottom-right-radius: 0;
    }
}
</style>