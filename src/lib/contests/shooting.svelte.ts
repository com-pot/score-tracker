import type { Actor, GameOpts } from "./_common";
import type { ShootingGameState, ShootingParameters, ShootingScoreEntry } from "./shooting";

export class ShootingGame {
    public constructor(
        // Used as ID
        public readonly name: string,
        public readonly rules: ShootingParameters,
        private opts: GameOpts<ShootingGameState>,
    ) {
        if (opts.initialState) {
            this.state = structuredClone(opts.initialState);
        }
    }

    public state: ShootingGameState = $state({
        players: [],
        scores: [],
    })
    public get players(): Readonly<Actor[]> {
        return this.state.players
    }
    public targetRound = $state(0)
    public currentRound = $derived.by(() => {
        let maxRound = this.state.scores[0]?.round || 1
        this.state.scores.forEach((score) => {
            if (score.round > maxRound) maxRound = score.round
        })
        return maxRound
    })

    public playerScores = $derived.by((): Record<string, {points: {total: number, roundPoints: ShootingScoreEntry["attempts"][]}}> => {
        const entries = this.state.players.map((player) => {
            const roundAttempts = Array.from({ length: Math.max(this.currentRound, this.targetRound) })
                .map((): ShootingScoreEntry["attempts"] => Array.from({ length: this.rules.attempts }).map(() => null))

            this.state.scores
                .filter((score) => score.player === player.name)
                .forEach((score) => roundAttempts[score.round - 1] = score.attempts)

            let total = 0
            roundAttempts.forEach((attempts) => attempts.forEach((points) =>  total += points || 0))
            return [player.id, { points: { total, roundPoints: roundAttempts } }] as const
        })

        return Object.fromEntries(entries)
    })
    
    public playerStandings = $derived.by((): PlayerStanding[] => {
        const standings = Object.entries(this.playerScores)
            .map(([playerId, score]): PlayerStanding => ({
                player: this.state.players.find((p) => p.id === playerId) || {id: playerId, name: playerId},
                points: score.points.total,
                position: 0,
            }))
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
    
    public standingPedestals = $derived.by(() => {
        const byPosition: Record<string, {points: number, position: number, standings: PlayerStanding[]}> = {}
        this.playerStandings.forEach((standing) => {
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
    
    addPlayer(player: Actor) {
        // FIXME: does not compare the i18n objects
        const existing = this.state.players.find((p) => p.id === player.id || p.name === player.name)
        if (existing) {
            console.warn("Player already exists");
            return false
        }
        this.state.players.push(player)
        this.opts.onChange(this.state)
    }
    putScoreObj(score: Readonly<ShootingScoreEntry>) {
        this.putScore(score.player, score.round, score.attempts)
    }
    putScore(player: Actor["id"], round: ShootingScoreEntry["round"], attempts: ShootingScoreEntry["attempts"]) {
        const iScore = this.state.scores.findIndex((score) => score.player === player && score.round === round)
        if (iScore === -1) {
            this.state.scores.push({ player, round, attempts })
        } else {
            this.state.scores[iScore].attempts = attempts
        }

        this.opts.onChange(this.state)
    }
    proceedRound() {
        this.targetRound = this.targetRound + 1
    }
}

export class ShootingRound {
    constructor(private readonly opts: {
        game: ShootingGame,

        onSelect(data: unknown|null): void,
    }) {
    }

    data = $state(null as null | {
        player: Actor["id"],
        round: number,
        attempts: (number|null)[],
    });

    attempt = $state(0);
    isComplete = $derived.by(() => this.attempt >= this.opts.game.rules.attempts)

    reset() {
        this.data = null
        this.attempt = 0
    }

    init() {
        this.data = {
            player: "",
            round: 0,
            attempts: Array.from({length: this.opts.game.rules.attempts}).map(() => null),
        }
    }

    mark(points: number) {
        if (!this.data?.player) {
            console.warn("No active round");
            return
        }

        this.data.attempts[this.attempt] = points
        if (this.attempt < this.opts.game.rules.attempts) {
            this.attempt += 1
        }
    }
    select(player: Actor, round: number) {
        if (this.data?.player && this.attempt) {
            console.warn("active score already selected");
            return
        }

        let score = this.opts.game.state.scores.find((score) => score.player === player.id && score.round === round);
        if (!score) {
            score = { player: player.id, round, attempts: Array.from({length: this.opts.game.rules.attempts}).map(() => null) };
        } else {
            score = { ...score, attempts: score.attempts.slice() };
        }

        this.data = score
        this.attempt = score.attempts.findLastIndex((points) => points !== null) + 1
        this.opts.onSelect?.(this.data)
    }
    redoAttempt() {
        if (!this.data) {
            return
        }
        this.attempt = Math.max(0, this.attempt - 1)
        this.data.attempts[this.attempt] = null
    }
    redoRound() {
        this.attempt = 0
    }
}

type PlayerStanding = {
    player: Actor,
    points: number,
    position: number,
}
