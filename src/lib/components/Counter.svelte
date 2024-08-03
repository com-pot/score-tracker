<script>
	import { spring } from 'svelte/motion';

	/** @type {number | undefined} */
	export let min = undefined;
	/** @type {number | undefined} */
	export let max = undefined;

	/** @type {"inline" | undefined} */
	export let size = undefined;
	
	export let value = 0;

	const displayed_count = spring();
	$: displayed_count.set(value);
	$: offset = modulo($displayed_count, 1);

	/**
	 * @param {number} n
	 * @param {number} m
	 */
	function modulo(n, m) {
		// handle negative numbers
		return ((n % m) + m) % m;
	}

	function adjustValue(/**@type number*/ d) {
		let target = value + d
		if (typeof min === "number" && target < min) target = min
		if (typeof max === "number" && target > max) target = max

		value = target
	}
</script>

<div class="counter" data-size="{size}">
	<button on:click={() => adjustValue(-1)} aria-label="Decrease the counter by one">
		<svg aria-hidden="true" viewBox="0 0 1 1">
			<path d="M0,0.5 L1,0.5" />
		</svg>
	</button>

	<div class="counter-viewport">
		<div class="counter-digits" style="transform: translate(0, {100 * offset}%)">
			<strong class="hidden" aria-hidden="true">{Math.floor($displayed_count + 1)}</strong>
			<strong>{Math.floor($displayed_count)}</strong>
		</div>
	</div>

	<button on:click={() => adjustValue(+1)} aria-label="Increase the counter by one">
		<svg aria-hidden="true" viewBox="0 0 1 1">
			<path d="M0,0.5 L1,0.5 M0.5,0 L0.5,1" />
		</svg>
	</button>
</div>

<style lang="scss">
	.counter {
		display: flex;
		border-top: 1px solid rgba(0, 0, 0, 0.1);
		border-bottom: 1px solid rgba(0, 0, 0, 0.1);
		margin: 1rem 0;

		&[data-size="inline"] {
			display: inline-flex;
			margin: 0;

			--buttons-size: 1em;
			--button-font-size: 1em;
			--button-svg-size: 90%;

			.counter-viewport {
				width: 2ch;
				height: 1em;

				strong {
					font-size: 1em;
				}
			}
		}
	}

	.counter button {
		width: var(--buttons-size, 2em);
		padding: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		border: 0;
		background-color: transparent;
		touch-action: manipulation;
		font-size: var(--button-font-size, 2rem);
	}

	.counter button:hover {
		background-color: var(--color-bg-1);
	}

	svg {
		width: var(--button-svg-size, 25%);
		height: var(--button-svg-size, 25%);
	}

	path {
		vector-effect: non-scaling-stroke;
		stroke-width: 2px;
		stroke: #444;
	}

	.counter-viewport {
		width: 8em;
		height: 4em;
		overflow: hidden;
		text-align: center;
		position: relative;
	}

	.counter-viewport strong {
		position: absolute;
		display: flex;
		width: 100%;
		height: 100%;
		font-weight: 400;
		color: var(--color-theme-1);
		font-size: 4rem;
		align-items: center;
		justify-content: center;
	}

	.counter-digits {
		position: absolute;
		width: 100%;
		height: 100%;
	}

	.hidden {
		top: -100%;
		user-select: none;
	}
</style>
