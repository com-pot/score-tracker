import { derived, get, writable } from "svelte/store"

export function createTrackingStore(key: string) {
    const games = writable<TrackedGame[]>([])

    if (typeof window !== "undefined" && typeof window.localStorage !== "undefined") {
        games.set(parse(localStorage.getItem(key) || undefined))
    }

    return {
        games,

        addGame(name: string) {
            if (get(games).find((game) => game.name === name)) {
                return false
            }
            games.update((games) => [...games, { name }])
            const list = get(games)
            localStorage.setItem(key, JSON.stringify(list))

            return true
        },

        removeGame(name: string) {
            games.update((games) => games.filter((game) => game.name !== name))
            const list = get(games)
            localStorage.setItem(key, JSON.stringify(list))
            localStorage.removeItem(name)
        },
    }
}

function parse(str: string = ""): TrackedGame[] {
    const games: TrackedGame[] = []

    try {
        let parsed = JSON.parse(str || "[]")
        if (!Array.isArray(parsed)) {
            console.warn("wrong format");
            parsed = []
        }
        parsed.forEach((item: TrackedGame) => games.push(item))
    } catch (e) {
        console.error("failed to parse items", e)
    }

    return games
}

export type TrackedGame = {
    name: string,
}

export const defaultTrackingStore = createTrackingStore("cp/st:games")

type Player = { name: string }
type TrackedScore = { player: string, round: number, attempts: (number | null)[] }
export type TrackedGameData = {
    readonly rules: Readonly<GameRules>,
    players: Player[],
    scores: TrackedScore[],
}

type GameRules = {
    attempts: number,
    options: { value: number, label?: string }[],
}

type PlayerStanding = {
    player: Player["name"],
    points: number,
    position: number,
}

const defaultRules = {
    attempts: 5,
    options: [{ value: 1 }, { value: 0 }],
}

export function useGame(gameName: string, storage: ReturnType<typeof createGameStorage>) {
    const gameData = writable<TrackedGameData>(storage.load(gameName))
    const targetRound = writable(0)
    const currentRound = derived([gameData], ([{ scores }]) => {
        let maxRound = scores[0]?.round || 1
        scores.forEach((score) => {
            if (score.round > maxRound) maxRound = score.round
        })
        return maxRound
    })
    
    const playerScores = derived([gameData, currentRound, targetRound], ([{ rules, players, scores }, currentRound, targetRound]) => {
        const entries = players.map((player) => {
            const roundAttempts = Array.from({ length: Math.max(currentRound, targetRound) })
                .map((): TrackedScore["attempts"] => {
                    return Array.from({length: rules.attempts}).map(() => null)
                })
            
            scores
                .filter((score) => score.player === player.name)
                .forEach((score) => roundAttempts[score.round - 1] = score.attempts)

            let total = 0
            roundAttempts.forEach((attempts) => attempts.forEach((points) =>  total += points || 0))
            return [player.name, { points: { total, roundPoints: roundAttempts } }] as const
        })

        return Object.fromEntries(entries)
    })

    const playerStandings = derived([playerScores], ([scores]): PlayerStanding[] => {
        const standings = Object.entries(scores)
            .map(([playerName, score]) => ({player: playerName, points: score.points.total, position: 0}))
            .sort((a, b) => -(a.points - b.points))

        let lastPoints = -1
        let lastPosition = 0
        for (let i = 0; i < standings.length; i++) {
            const standing = standings[i]
            if (standing.points === lastPoints) {
                standing.position = lastPosition
                continue
            }
            lastPoints = standing.points
            standing.position = lastPosition = lastPosition + 1
        }

        return standings
    })

    const standingPedestals = derived([playerStandings], ([standings]) => {
        const byPosition: Record<string, {points: number, position: number, standings: PlayerStanding[]}> = {}
        standings.forEach((standing) => {
            if (!byPosition[standing.position]) {
                byPosition[standing.position] = {
                    points: standing.points,
                    position: standing.position,
                    standings: []
                }
            }
            byPosition[standing.position].standings.push(standing)
        })

        return Object.values(byPosition)
    })

    try {
        gameData.set(storage.load(gameName))
    } catch {
        // hic sunt leones - we're okay if game data does not exist yet
    }


    const persistGameData = () => storage.save(gameName, get(gameData))

    return {
        get rules() {
            return get(gameData).rules
        },
        gameData,
        currentRound,
        targetRound,
        playerScores,
        playerStandings,
        standingPedestals,

        addPlayer(player: Player) {
            gameData.update((data) => {
                if (data.players.find((p) => p.name === player.name)) {
                    console.warn("Player already exists");
                } else {
                    data.players.push(player)
                }

                return data
            })

            persistGameData()
        },
        putScoreObj(score: Readonly<TrackedScore>) {
            this.putScore(score.player, score.round, score.attempts)
        },
        putScore(player: Player["name"], round: TrackedScore["round"], attempts: TrackedScore["attempts"]) {
            gameData.update((data) => {
                const iScore = data.scores.findIndex((score) => score.player === player && score.round === round)
                if (iScore === -1) {
                    data.scores.push({ player, round, attempts })
                    return data
                }

                data.scores[iScore].attempts = attempts
                return data
            })

            persistGameData()
        },
        proceedRound() {
            const round = get(currentRound)
            targetRound.set(round + 1)
        },
    }
}

export function createGameStorage(type: "localstorage", options: Record<string, any>) {
    if (type === "localstorage") {
        const prefix = options?.prefix || ""

        return {
            save(key: string, gameData: TrackedGameData) {
                localStorage.setItem(prefix + key, JSON.stringify(gameData))
            },
            load(key: string): TrackedGameData {
                // We used to not have prefixed game keys. Try to move them
                const backwardsDataStr = localStorage.getItem(key)
                if (backwardsDataStr) {
                    try {
                        const data = JSON.parse(backwardsDataStr)
                        if (!data.players || !data.scores) throw new Error("do-nothing")
                        
                        localStorage.setItem(prefix + key, backwardsDataStr)
                        localStorage.removeItem(key)
                    } catch (e) {
                        // we might have hit non-game key. Do nothing
                    }
                }

                const data = JSON.parse(localStorage.getItem(prefix + key) || "{}") as TrackedGameData
                if (!data.rules) (data as any).rules = defaultRules
                if (!data.players) data.players = []
                if (!data.scores) data.scores = []
            
                return data
            }
        }
    }

    throw new Error("unspupported game storage type: " + type)
}

export function useActiveRound(gameRules: Readonly<GameRules>) {
    const round = writable({
        player: "",
        round: 0,
        attempts: [] as (number|null)[],
    })

    return {
        ...round,

        reset() {
            this.set({
                player: "",
                round: 0,
                attempts: Array.from({length: gameRules.attempts}).map(() => null),
            })
        },
    }
}
