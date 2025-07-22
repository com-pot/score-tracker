<script>
    import { goto } from '$app/navigation';
    import { defaultGameStorage } from '$lib/games';
    import { defaultTrackingStore } from '$lib/score/trackingStore';
    import { derived, get } from 'svelte/store';

    const list = derived([defaultTrackingStore.games], ([games]) => games)

    let newGameName = $state("")
    const nameAvailable = $derived.by(() => {
        const games = get(list)
        if (!newGameName) return false
        return !games.find((game) => game.name === newGameName)
    })
    async function createGame(/**@type {string}*/ name) {
        await defaultTrackingStore.addGame(name)

        await goto("/game/" + name)
    }

    function copyToClipboard(/** @type {import('$lib/score/trackingStore').TrackedGame}*/ game) {
        const data = defaultGameStorage.load(game.name)

        navigator.clipboard.writeText(JSON.stringify({
            game,
            data,
        }, null, 2))
    }

    async function addFromClipboard() {
        const text = await navigator.clipboard.readText()
        const {data, game} = JSON.parse(text)

        if (!data || !game?.name) {
            console.warn("Oops", {game, data});
            return
        }

        defaultGameStorage.save(game.name, data)

        createGame(game.name)
    }
</script>

<svelte:head>
    <title>Home</title>
    <meta name="description" content="Svelte demo app" />
</svelte:head>

<section>
    <h1>score-tracker</h1>

    <ul class="tile-list">
        {#each $list as game}
        <li class="tile">
            <div class="tile-body">
                <a href="{`/game/${game.name}`}">{game.name}</a>
            </div>
            
            <div class="actions btn-group">
                <button type="button" class="btn btn-primary btn-sm dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false" aria-label="Akce hry"></button>
                <ul class="dropdown-menu">
                    <li>
                        <button class="dropdown-item" onclick={() => copyToClipboard(game)}>Kopírovat do schránky</button>
                    </li>
                    <li><hr class="dropdown-divider"></li>
                    <li><button class="dropdown-item text-danger" onclick={() => defaultTrackingStore.removeGame(game.name)}>Smazat</button></li>
                </ul>
            </div>
            <div class="dropdown"></div>
        </li>
        {/each}

    </ul>

    <form onsubmit={(e) => (e.preventDefault(), createGame(newGameName))}>
        <div class="input-group mb-3">
            <input class="form-control" name="newGameName"
                type="text"
                bind:value={newGameName}
            >
            <button class="btn btn-outline-secondary"
                disabled="{!nameAvailable}"
            >+</button>
        </div>
    </form>
    
    <div class="mb-3">
        <button class="btn btn-outline-primary" onclick={addFromClipboard}>Načíst ze schránky</button>
    </div>
</section>

<style>
    section {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        flex: 0.6;
    }
</style>
