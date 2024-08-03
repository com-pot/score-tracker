<script>
    import { useGame } from "$lib/score/trackingStore";
    import { defaultGameStorage } from "$lib/games";

    /** @type {import('./$types').PageData} */
    export let data;

    const game = useGame(data.game.name, defaultGameStorage);
    const {playerStandings, standingPedestals} = game

    $: displayPedestals = $standingPedestals.slice(0, 3)
</script>

<h1>Výsledky: {data.game.name}</h1>

<div class="pedestals">
    {#each displayPedestals as pedestal}
    <div class="pedestal" data-position="{pedestal.position}" style="--position: {pedestal.position}">
        <div class="players">
            {#each pedestal.standings as standing}
                <div class="player">{standing.player}</div>
            {/each}
        </div>
        <div class="box">
            <div class="position">{pedestal.position}.</div>
            <div class="points">{pedestal.points}</div>
        </div>
    </div>
    {/each}
</div>

<div class="pedestal-spacer" role="separator"></div>

<h2>Všichni hráči</h2>
<table class="table">
    <thead>
        <tr>
            <td>#</td>
            <td>Hráč</td>
            <td>Bodů</td>
        </tr>
    </thead>
    <tbody>
        {#each $playerStandings as standing, i}
            <tr>
                <td data-name="position">{standing.position}</td>
                <td data-name="player">{standing.player}</td>
                <td data-name="points">{standing.points}</td>
            </tr>
        {/each}
    </tbody>
</table>

<a href="/game/{data.game.name}" class="btn btn-link">Zpět do hry</a>

<style lang="scss">
.pedestal-spacer {
    margin-block-start: 10rem;
}
.pedestals {
    margin-block-start: 4rem;

    display: flex;
    flex-direction: row;

    > [data-position="2"] {
        order: -1;
    }

    .pedestal {
        flex: 1;

        display: flex;
        flex-direction: column;
        justify-content: flex-end;
        align-items: center;

        .players {
            font-size: 1.5rem;
        }

        .box {
            align-self: stretch;

            display: grid;
            place-items: start center;

            height: calc(5rem + (3 - var(--position)) * 1.5rem);
            background: #eee;
            border: 1px solid #cdcdcd;

            > * {
                grid-area: 1/1;
            }
            .position {
                font-size: 3rem;
                font-weight: bold;
            }
            .points {
                place-self: end end;
                padding: 0.5em;
            }
        }

        
    }
}
</style>