<script>
    import { onDestroy, onMount } from "svelte";
    import { derived, get, writable } from "svelte/store";
    import AttemptsIndicator from "$lib/components/AttemptsIndicator.svelte";
    import { useActiveRound, useGame } from "$lib/score/trackingStore";
    import { defaultGameStorage } from "$lib/games";
    import { goto } from "$app/navigation";

    /** @type {import('./$types').PageData} */
    export let data;

    const game = useGame(data.game.name, defaultGameStorage);
    const gameData = game.gameData;
    const playerScores = game.playerScores;

    const visibleRounds = derived([game.currentRound, game.targetRound], ([round, targetRound]) => {
        if (targetRound > round) round = targetRound
        let rounds = [];
        for (let i = 1; i <= round; i++) {
            rounds.push(i);
        }
        return rounds;
    });

    const attempt = writable(0)
    const roundComplete = derived([attempt], ([attempt]) => attempt >= game.rules.attempts)
    const attemptCtrl = {
        mark(/**@type {number}*/points) {
            if (!$activeRound.player) {
                console.warn("No active round");
                return
            }
            const n = get(attempt)
            $activeRound.attempts[n] = points
            if (n < game.rules.attempts) {
                attempt.set(n + 1)
            }
        }
    }

    const activeRound = useActiveRound(game.rules);
    function select(/**@type {string}*/ player, /**@type {number}*/ round) {
        if ($activeRound.player && $attempt) {
            console.warn("active score already selected");
            return
        }

        const data = get(gameData);
        let score = data.scores.find(
            (score) => score.player === player && score.round === round
        );
        if (!score) {
            score = { player, round, attempts: Array.from({length: game.rules.attempts}).map(() => null) };
        } else {
            score = { ...score, attempts: score.attempts.slice() };
        }
        activeRound.set(score);
        let setAttempts = score.attempts.findLastIndex((points) => points !== null) + 1
        
        attempt.set(setAttempts)
    }
    function clearSelection() {
        activeRound.reset()
        attempt.set(0)
    }
    clearSelection()

    function confirmAttempt() {
        if (!$activeRound) {
            console.warn("No active round");
            return
        }
        game.putScoreObj($activeRound)
        clearSelection()
    }
    function redoAttempt() {
        attempt.update((num) => Math.max(0, num - 1))
        $activeRound.attempts[$attempt] = null
    }
    function redoRound() {
        attempt.set(0)
    }
    function proceedRound() {
        game.proceedRound()
    }

    let newPlayerName = writable("");
    let newPlayerNameAvailable = derived(
        [game.gameData, newPlayerName],
        ([gameData, name]) => {
            if (!name) return false;
            return !gameData.players.find((p) => p.name === name);
        }
    );
    function addPlayer() {
        if (!$newPlayerNameAvailable) return;

        const name = get(newPlayerName);
        game.addPlayer({ name });
        newPlayerName.set("")
    }

    /**
     * @param {string} player
     * @param {number} round
     */
    function storeRoundInfoToUrl(player, round) {
        const url = new URL(window.location.toString())
            if (!round) {
                url.searchParams.delete("round")
                url.searchParams.delete("player")
            } else {
                url.searchParams.set("round", "" + round)
                url.searchParams.set("player", player)
            }

            goto(url, {replaceState: true, noScroll: true})
    }

    /** @type {import('svelte/store').Unsubscriber[]}*/
    const unsubscribers = []
    onMount(() => {
        const loc = new URL(window.location.toString())
        const playerName = loc.searchParams.get("player")
        const round = Number(loc.searchParams.get("round"))

        const data = get(gameData);
        const player = data.players.find((player) => player.name === playerName);
        const currentRound = get(game.currentRound)
        if (!player || round > currentRound) {
            storeRoundInfoToUrl("", 0)
        } else {
            select(player.name, round);
        }
        

        let first = true
        unsubscribers.push(activeRound.subscribe((round) => {
            if (first) {
                first = false;
                return;
            }
            storeRoundInfoToUrl(round.player, round.round)
        }))
        
    });
    onDestroy(() => unsubscribers.forEach((unsubscribe) => unsubscribe()))
</script>

<section>
    <h1>Hra: {data.game.name}</h1>
    <form class="players" on:submit|preventDefault={addPlayer}>
        <span>Přidat hráče</span>
        <div class="input-group mb-3">
            <input class="form-control" name="newPlayerName"
                type="text"
                bind:value={$newPlayerName}
            >
            <button class="btn btn-outline-primary"
                disabled="{!$newPlayerNameAvailable}"
            >+</button>
        </div>
    </form>

    <hr />

    <div class="scores" style={`--players: ${$gameData.players.length};`}>
        <div class="head" data-name="round-num">Kolo</div>
        {#each Object.entries($playerScores) as [player, { points }]}
            <div class="head" data-name="player">
                <span data-name="name">{player}</span>
            </div>
        {/each}

        {#each $visibleRounds as round}
            <div class="head" data-name="round-num" data-round={round}>{round}</div>
            {#each $gameData.players as player}
                <div class={[
                    "round-points",
                    round === $activeRound.round && "current-round",
                    player.name === $activeRound.player && "current-player",
                    ].join(' ')}
                    data-round={round} data-player={player.name}
                    role="button" tabindex={-1}
                    on:click={() => select(player.name, round)}
                    on:keydown={(e) => e.key === 'Enter' && select(player.name, round)}
                >
                    <AttemptsIndicator attemptPoints={$playerScores[player.name]?.points.roundPoints[round - 1]}/>
                </div>
            {/each}
        {/each}

        <div class="head foot">Celkem</div>

        {#each Object.entries($playerScores) as [player, { points }]}
            <div class="foot" data-name="player">
                <span data-name="total-points">{points.total}</span>
            </div>
        {/each}
    </div>
    
    <div class="grid-stack round-controls">
        <div class="card round-active" aria-current="{$activeRound.round ? 'step' : 'false'}">
            <div class="card-body">
                <div class="flow-row -center">
                    <div class="badge-value" data-name="round">
                        <div class="caption">Kolo</div>
                        <div class="value">{$activeRound.round}</div>
                    </div>
                    <div class="badge-value" data-name="player">
                        <div class="caption">Hráč</div>
                        <div class="value">{$activeRound.player}</div>
                    </div>
                </div>

                <div class="attempt">
                    <AttemptsIndicator attemptPoints={$activeRound.attempts} highlight={$attempt}/>
                    <div class="options">
                        {#each game.rules.options as opt}
                        <button class="btn btn-outline-primary"
                            on:click={() => attemptCtrl.mark(opt.value) }
                            disabled={$roundComplete || !$activeRound.player}
                        >{opt.label || opt.value}</button>
                        {/each}
                        <button class="btn -icon btn-outline-info" on:click={redoAttempt} disabled={!$activeRound.player || $attempt < 1}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><path fill="currentColor" d="M22 3H7c-.69 0-1.23.35-1.59.88L0 12l5.41 8.11c.36.53.9.89 1.59.89h15a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2m-3 12.59L17.59 17L14 13.41L10.41 17L9 15.59L12.59 12L9 8.41L10.41 7L14 10.59L17.59 7L19 8.41L15.41 12"/></svg>
                            <span class="line"></span>
                        </button>
                    </div>
                </div>

                <hr>
                
                <div class="flow-row -center">
                    <button class="btn btn-outline-secondary" on:click={clearSelection} disabled={!$activeRound.player}>Storno</button>
                    <button class="btn btn-outline-primary" on:click={confirmAttempt} disabled={!$roundComplete}>Potvrdit</button>
                    <button class="btn btn-outline-info" on:click={redoRound} disabled={!$activeRound.player || $attempt < 1}>Opravit kolo</button>
                </div>
            </div>
        </div>

        <div class="card round-inactive" aria-current="{!$activeRound.round ? 'step' : 'false'}">
            <div class="card-body">
                <div class="buttons">
                    <button on:click={proceedRound} class="btn btn-outline-secondary">Další kolo</button>
                    <a href="/game/{data.game.name}/results" class="btn btn-link">Výsledky</a>
                </div>
            </div>
        </div>
    </div>
</section>

<style lang="scss">
    .scores {
        display: grid;
        grid-template-columns: 6ch repeat(var(--players), minmax(0, 1fr));
        row-gap: 1rem;
        column-gap: 0.25rem;

        .head {
            font-weight: bold;
        }
        .head[data-name="player"] {
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        .foot[data-name="player"] {
            place-self: center;
            font-size: 1.5rem;
        }

        .round-points {
            display: grid;
            place-content: center;
            padding: 0.25rem;
        }

        :is(.current-round.current-player) {
            background-color: lightgray;
        }
    }

.round-controls {

    .flow-row {
        max-width: 50ch;
        margin: 0 auto;
    }
    .badge-value[data-name="round"] {
        flex: 1;
        min-width: min(12ch, 100%);
        .value {
            text-align: center;
        }
    }
    .badge-value[data-name="player"] {
        flex: 4;
        min-width: min(25ch, 100%);
    }

    .attempt {
        margin-block-start: 2rem;
        display: flex;
        flex-direction: row;
        justify-content: center;
        flex-wrap: wrap;
        align-items: center;
        gap: 1rem;

        :global(.attempt-indicator) {
            font-size: 2rem;
        }
    }

    > .card {
        transition: opacity 0.15s ease-in-out;
        place-self: start stretch;
    }
    > [aria-current="false"] {
        opacity: 0;
        pointer-events: none;
    }
}
</style>
