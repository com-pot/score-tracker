// No SSR because we load game from local storage
export const ssr = false;

/** @type {import('./$types').PageLoad} */
export function load({ params }) {
    return {
        game: {
            name: params.name,
        },
    }
}
