<script lang="ts">
    import { onMount } from "svelte";
    import AttemptsIndicator from "$lib/components/AttemptsIndicator.svelte";
    import { useGameStorage } from "$lib/game.svelte";
    import { goto } from "$app/navigation";
    import Dialog from "$lib/components/Dialog.svelte";
    import type { PageProps } from "./$types";
    import { ShootingGame, ShootingRound } from "$lib/contests/shooting.svelte";
    import { getContestBundle } from "$lib/contests";
    import type { ShootingGameState, ShootingParameters } from "$lib/contests/shooting";
    import { getI18n } from "$lib/I18n";
    import { NewPlayer } from "$lib/contests/_player.svelte";
    
    const i18n = getI18n()

    const  {
        data,
    }: PageProps = $props();

    const gameStorage = useGameStorage(data.storageRef)
    const gameSpecRaw = $derived(await gameStorage.load(data.gameRef.name))
    const bundle = $derived(await getContestBundle(gameSpecRaw))
    const gameSpec = $derived(await (async () => bundle.sanitizeGameSpec(gameSpecRaw))())
    
    const game = new ShootingGame(data.gameRef.name, gameSpec.rules as ShootingParameters, {
        initialState: gameSpec?.state as ShootingGameState,
        onChange(state) {
            if (!gameSpec?.name) return

            gameStorage.save(gameSpec.name, {
                name: gameSpec.name,
                contest: gameSpec.contest,
                rules: gameSpec.rules,
                state: state,
            })
        },
    })

    let dialog = $state<ReturnType<typeof Dialog>|null>(null)
    const activeRound = new ShootingRound({
        get game() { return game },
        onSelect(data) {
            if (!data) {
                dialog?.ctrl.isOpen && dialog?.ctrl.close("clearSelection")
                return
            }

            dialog?.ctrl.open()
                .then((result) => {
                    console.log("dialog done", result)
                    game.putScoreObj(result as any)
                })
                .finally(() => {
                    activeRound.reset()
                })
        },
    });
    const visibleRounds = $derived.by(() => {
        let round = activeRound.data?.round || 0;
        if (game.targetRound > round) round = game.targetRound

        let rounds = [];
        for (let i = 1; i <= round; i++) {
            rounds.push(i);
        }
        return rounds;
    });

    const newPlayer = new NewPlayer({
        get players() { return game.players },
    })

    function addPlayer() {
        if (!newPlayer.nameAvailable) return;

        game.addPlayer(newPlayer.flush());
    }

    function storeRoundInfoToUrl(player: string, round: number) {
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

    onMount(() => {
        activeRound.reset()

        const loc = new URL(window.location.toString())
        const playerName = loc.searchParams.get("player")
        const round = Number(loc.searchParams.get("round"))

        const player = game.players.find((player) => player.name === playerName);
        const currentRound = game.currentRound
        if (!player || round > currentRound) {
            storeRoundInfoToUrl("", 0)
        } else {
            activeRound.select(player, round);
        }
        
        let first = true
        $effect(() => {
            const round = activeRound.data
            if (round) {
                storeRoundInfoToUrl(round.player, round.round)
            } else {
                storeRoundInfoToUrl("", 0)
            }
        })
    });

</script>

<section>
    <h1>Hra: {game.name}</h1>
    <div class="subtitle">
        <a href="/game/{game.name}/results" class="btn btn-link">Výsledky</a>
    </div>
    <form class="players" onsubmit={(e) => (e.preventDefault(), addPlayer())}>
        <span>Přidat hráče</span>
        <div class="input-group mb-3">
            <input class="form-control" name="newPlayerName"
                type="text"
                bind:value={newPlayer.name}
            >
            <button class="btn btn-outline-primary"
                disabled="{!newPlayer.nameAvailable}"
            >+</button>
        </div>
    </form>

    <hr />

    <div class="scores" style={`--players: ${game.players.length};`}>
        <div class="head" data-name="round-num">Kolo</div>
        {#each Object.entries(game.playerScores) as [player, { points }]}
            <div class="head" data-name="player">
                <span data-name="name">{player}</span>
            </div>
        {/each}

        {#each visibleRounds as round (round)}
            <div data-name="round-num" data-round={round}>{round}</div>
            {#each game.players as player (player.id)}
                <div class={[
                    "round-points",
                    round === activeRound.data?.round && "current-round",
                    player.name === activeRound.data?.player && "current-player",
                    ].join(' ')}
                    data-round={round} data-player={player.name}
                    role="button" tabindex={-1}
                    onclick={() => activeRound.select(player, round)}
                    onkeydown={(e) => e.key === 'Enter' && activeRound.select(player, round)}
                >
                    <AttemptsIndicator attemptPoints={game.playerScores[player.id]?.points.roundPoints[round - 1]}/>
                </div>
            {/each}
        {/each}
        <div class="head foot actions">
            <button onclick={() => game.proceedRound()} class="btn btn-outline-secondary">Další kolo</button>
        </div>

        <div class="head foot">Celkem</div>

        {#each Object.values(game.playerScores) as { points }}
            <div class="foot" data-name="player">
                <span data-name="total-points">{points.total}</span>
            </div>
        {/each}
    </div>
    
    <div class="grid-stack round-controls">
        <div class="card round-inactive" aria-current="{!activeRound.data?.round ? 'step' : 'false'}">
        </div>
    </div>
</section>

<Dialog bind:this={dialog} controls={false}>
    {#snippet children(ctrl)}
    <div class="card round-active round-controls">
        <div class="card-body">
            <div class="flow-row -center">
                <div class="badge-value" data-name="round">
                    <div class="caption">Kolo</div>
                    <div class="value">{activeRound.data?.round}</div>
                </div>
                <div class="badge-value" data-name="player">
                    <div class="caption">Hráč</div>
                    <div class="value">{activeRound.data?.player}</div>
                </div>
            </div>

            <div class="attempt">
                <AttemptsIndicator attemptPoints={activeRound.data?.attempts || []} highlight={activeRound.attempt}/>
                <div class="options">
                    {#each game.rules.options as opt (opt.value)}
                    <button class="btn btn-outline-primary"
                        onclick={() => activeRound.mark(opt.value) }
                        disabled={activeRound.isComplete || !activeRound.data?.player}
                    >{opt.label && i18n.t(opt.label) || opt.value}</button>
                    {/each}
                    <button class="btn -icon btn-outline-info" aria-label="Opravit"
                        disabled={!activeRound.data?.player || activeRound.attempt < 1}
                        onclick={() => activeRound.redoAttempt()}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><path fill="currentColor" d="M22 3H7c-.69 0-1.23.35-1.59.88L0 12l5.41 8.11c.36.53.9.89 1.59.89h15a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2m-3 12.59L17.59 17L14 13.41L10.41 17L9 15.59L12.59 12L9 8.41L10.41 7L14 10.59L17.59 7L19 8.41L15.41 12"/></svg>
                        <span class="line"></span>
                    </button>
                </div>
            </div>

            <hr>
            
            <div class="flow-row -center">
                <button class="btn btn-outline-secondary" onclick={() => ctrl.close('cancel')} disabled={!activeRound.data?.player}>Storno</button>
                <button class="btn btn-outline-primary" onclick={() => ctrl.confirm(activeRound.data)} disabled={!activeRound.isComplete}>Potvrdit</button>
                <button class="btn btn-outline-info" onclick={() => activeRound.redoRound()} disabled={!activeRound.data?.player || activeRound.attempt < 1}>Opravit kolo</button>
            </div>
        </div>
    </div>
    {/snippet}
</Dialog>

<style lang="scss">
    .scores {
        display: grid;
        grid-template-columns: 6ch repeat(var(--players), minmax(0, 1fr));
        row-gap: 1rem;
        column-gap: 0.25rem;

        .head, [data-name="round-num"] {
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

        .head {
            position: sticky;
            top: 0;
            padding: 0.25em 0.2em;
            
            // Keep same as `body {` background
            background-attachment: fixed;
            background-color: var(--color-bg-1);
            background-size: 100vw 100vh;
            background-image: radial-gradient(50% 50% at 50% 50%, rgba(255, 255, 255, 0.75) 0%, rgba(255, 255, 255, 0) 100%), linear-gradient(180deg, var(--color-bg-0) 0%, var(--color-bg-1) 15%, var(--color-bg-2) 50%);
        }
        .actions {
            grid-column: 1 / span calc(1 + var(--players));
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
