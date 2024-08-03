<script>
    import { goto } from '$app/navigation';
    import { defaultGameStorage } from '$lib/games';
    import { defaultTrackingStore } from '$lib/score/trackingStore';
    import { derived, get, writable } from 'svelte/store';

	const list = derived([defaultTrackingStore.games], ([games]) => games)

	let newGameName = writable("")
	const nameAvailable = derived([list, newGameName], ([games, name]) => {
		if (!name) return false
		return !games.find((game) => game.name === name)
	})
	function createGame(/**@type {string}*/ name) {
		defaultTrackingStore.addGame(name)

		goto("/game/" + name)
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
		
		console.log(data, game)

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
				<button type="button" class="btn btn-primary btn-sm dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false"></button>
				<ul class="dropdown-menu">
					<li>
						<button class="dropdown-item" on:click|preventDefault={() => copyToClipboard(game)}>Kopírovat do schránky</button>
					</li>
					<li><hr class="dropdown-divider"></li>
					<li><button class="dropdown-item text-danger" on:click={() => defaultTrackingStore.removeGame(game.name)}>Smazat</button></li>
				</ul>
			</div>
			<div class="dropdown"></div>
		</li>
		{/each}

	</ul>

	<div class="input-group mb-3">
		<input class="form-control" name="newGameName"
			type="text"
			bind:value={$newGameName}
		>
		<button class="btn btn-outline-secondary"
			on:click={() => createGame($newGameName)}
			disabled="{!$nameAvailable}"
		>+</button>
	</div>
	<div class="mb-3">
		<button class="btn btn-outline-primary" on:click={addFromClipboard}>Načíst ze schránky</button>
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
