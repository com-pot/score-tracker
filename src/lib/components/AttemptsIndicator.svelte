<script>
    /** @type {(number|null)[]} */
    export let attemptPoints;

    /** @type {number | undefined} */
    export let highlight = undefined;

    $: total = attemptPoints?.reduce((sum, points) => (sum || 0) + (points || 0), 0) || 0

</script>

<div class="attempts">
    <ul>
        {#each attemptPoints as attempt, i}
        {#if attempt === null}
        <li class={["empty", i === highlight && 'highlight'].join(" ")}></li>
        {:else}
        <li data-value={attempt} class={i === highlight && 'highlight' || ''}>
            <span class="label">{attempt}</span>
        </li>
        {/if}
        {/each}
    </ul>
    <!-- <div class="total">{total}</div> -->
</div>

<style lang="scss">
    .attempts {
        --marker-size: 0.5em;
        display: grid;
        place-items: center;

        > * {
            grid-area: 1 / 1;
        }

        ul {
            list-style: none;
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            gap: 0.25em;
            
            margin: 0;
            padding: 0;

            max-width: 5ch;

            li {
                display: block;
                width: var(--marker-size);
                height: var(--marker-size);
                
                border: 2px dotted transparent;
                border-radius: 0.5em;

                &.empty {
                    border-color: gray;
                }

                &[data-value] {
                    border-style: solid;
                    border-color: black;
                }
                &[data-value="1"] {
                    background-color: black;
                }

                &.highlight {
                    outline-color: hotpink;
                    outline-style: dashed;
                    outline-width: 4px;
                    outline-offset: 0px;

                    animation: outline-breathe 0.75s infinite alternate ease-in;
                }

                .label {
                    opacity: 0;
                }
            }
        }
        .total {
            font-weight: bold;
            margin-block-end: 0.75em;
        }
    }

    @keyframes outline-breathe {
        0% {
            outline-offset: 0px;
        }
        100% {
            outline-offset: 5px;
        }
    }
</style>