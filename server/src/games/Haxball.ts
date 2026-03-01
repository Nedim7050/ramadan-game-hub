import { Game, GameResult, Player } from './GameInterface';

type Vector = { x: number; y: number };
type Circle = { pos: Vector; vel: Vector; r: number };
type HaxPlayer = Circle & { id: string; color: string; input: { x: number; y: number; kick: boolean }; team: 'red' | 'blue' };

export type HaxballState = {
    players: Player[];
    teams: Record<string, 'red' | 'blue' | null>;
    haxPlayers: Record<string, HaxPlayer>;
    ball: Circle;
    scores: { red: number; blue: number };
    status: 'lobby' | 'playing' | 'goal' | 'finished';
    timeRemaining: number;
    timerTick: number;
};

const FIELD_W = 800;
const FIELD_H = 400;
const GOAL_Y_MIN = 130;
const GOAL_Y_MAX = 270;

const PLAYER_R = 15;
const BALL_R = 10;
const ACCEL = 1500;
const MAX_VEL = 250;
const BALL_FRICTION = 0.98;
const PLAYER_FRICTION = 0.90;

export class Haxball implements Game<HaxballState, { input: { x: number, y: number, kick: boolean } }> {
    init(players: Player[]): HaxballState {
        const teams: Record<string, 'red' | 'blue' | null> = {};
        players.forEach(p => teams[p.id] = null);

        return {
            players,
            teams,
            haxPlayers: {},
            ball: { pos: { x: FIELD_W / 2, y: FIELD_H / 2 }, vel: { x: 0, y: 0 }, r: BALL_R },
            scores: { red: 0, blue: 0 },
            status: 'lobby',
            timeRemaining: 180, // 3 minutes
            timerTick: 0
        };
    }

    applyAction(state: HaxballState, action: any, playerId: string) {
        if (state.status === 'lobby') {
            if (action.type === 'join_team') {
                state.teams[playerId] = action.team;
                return { newState: state };
            }
            if (action.type === 'start_game') {
                if (state.players.some(p => !state.teams[p.id])) return { newState: state };

                let blueCount = 0;
                let redCount = 0;

                state.players.forEach((p) => {
                    const team = state.teams[p.id]!;
                    const color = team === 'blue' ? '#3b82f6' : '#ef4444';
                    const startX = team === 'blue' ? 200 : 600;
                    const isSecond = team === 'blue' ? ++blueCount > 1 : ++redCount > 1;
                    const startY = 200 + (isSecond ? 50 : -50);

                    state.haxPlayers[p.id] = {
                        id: p.id,
                        team,
                        color,
                        pos: { x: startX, y: startY },
                        vel: { x: 0, y: 0 },
                        r: PLAYER_R,
                        input: { x: 0, y: 0, kick: false }
                    };
                });
                state.status = 'playing';
            }
            return { newState: state };
        }

        if (state.status !== 'playing' && state.status !== 'goal') return { newState: state };
        if (action.input) {
            const hp = state.haxPlayers[playerId];
            if (hp) {
                hp.input = action.input;
            }
        }
        return { newState: state };
    }

    tickPhysics(state: HaxballState, dt: number) {
        if (state.status === 'finished') return { newState: state };

        if (state.status === 'goal') {
            state.timerTick += dt;
            if (state.timerTick > 3) { // 3 seconds wait after goal
                if (state.scores.red >= 3 || state.scores.blue >= 3) {
                    state.status = 'finished';
                } else {
                    this.resetPositions(state);
                    state.status = 'playing';
                    state.timerTick = 0;
                }
            }
            return { newState: state };
        }

        // 1. Time Logic (dt is approx 1/30)
        state.timerTick += dt;
        if (state.timerTick >= 1) {
            state.timeRemaining -= 1;
            state.timerTick -= 1;
            if (state.timeRemaining <= 0) {
                state.status = 'finished';
                return { newState: state };
            }
        }

        // 2. Player Movement
        for (const hp of Object.values(state.haxPlayers)) {
            // Apply input acceleration
            hp.vel.x += hp.input.x * ACCEL * dt;
            hp.vel.y += hp.input.y * ACCEL * dt;

            // Apply friction
            hp.vel.x *= PLAYER_FRICTION;
            hp.vel.y *= PLAYER_FRICTION;

            // Cap velocity
            const speed = Math.hypot(hp.vel.x, hp.vel.y);
            if (speed > MAX_VEL) {
                hp.vel.x = (hp.vel.x / speed) * MAX_VEL;
                hp.vel.y = (hp.vel.y / speed) * MAX_VEL;
            }

            // Move
            hp.pos.x += hp.vel.x * dt;
            hp.pos.y += hp.vel.y * dt;

            // Wall collisions (Player)
            if (hp.pos.x < hp.r) { hp.pos.x = hp.r; hp.vel.x = 0; }
            if (hp.pos.x > FIELD_W - hp.r) { hp.pos.x = FIELD_W - hp.r; hp.vel.x = 0; }
            if (hp.pos.y < hp.r) { hp.pos.y = hp.r; hp.vel.y = 0; }
            if (hp.pos.y > FIELD_H - hp.r) { hp.pos.y = FIELD_H - hp.r; hp.vel.y = 0; }
        }

        // 3. Ball Movement
        const b = state.ball;
        b.vel.x *= BALL_FRICTION;
        b.vel.y *= BALL_FRICTION;
        b.pos.x += b.vel.x * dt;
        b.pos.y += b.vel.y * dt;

        // 4. Ball - Wall Collisions
        if (b.pos.y < b.r) { b.pos.y = b.r; b.vel.y *= -0.8; }
        if (b.pos.y > FIELD_H - b.r) { b.pos.y = FIELD_H - b.r; b.vel.y *= -0.8; }

        // Top/Bottom walls of goal
        if (b.pos.x < b.r || b.pos.x > FIELD_W - b.r) {
            // Un peu de marge pour le poteau
            const isGoal = b.pos.y > GOAL_Y_MIN + b.r && b.pos.y < GOAL_Y_MAX - b.r;
            if (!isGoal) {
                if (b.pos.x < b.r) { b.pos.x = b.r; b.vel.x *= -0.8; }
                if (b.pos.x > FIELD_W - b.r) { b.pos.x = FIELD_W - b.r; b.vel.x *= -0.8; }
            }
        }

        // 5. Player - Ball Collisions & Player - Player Collisions
        const bodies: Circle[] = [...Object.values(state.haxPlayers), b];
        for (let i = 0; i < bodies.length; i++) {
            for (let j = i + 1; j < bodies.length; j++) {
                const b1 = bodies[i];
                const b2 = bodies[j];
                const dx = b2.pos.x - b1.pos.x;
                const dy = b2.pos.y - b1.pos.y;
                const dist = Math.hypot(dx, dy);

                let effectiveR1 = b1.r;
                let effectiveR2 = b2.r;

                // Kick expands reach slightly
                if ((b1 as any).input?.kick && b2 === b) effectiveR1 += 3;
                if ((b2 as any).input?.kick && b1 === b) effectiveR2 += 3;

                const minDist = effectiveR1 + effectiveR2;

                if (dist < minDist && dist > 0) {
                    const nx = dx / dist;
                    const ny = dy / dist;

                    // Push apart
                    const overlap = minDist - dist;
                    b1.pos.x -= nx * (overlap / 2);
                    b1.pos.y -= ny * (overlap / 2);
                    b2.pos.x += nx * (overlap / 2);
                    b2.pos.y += ny * (overlap / 2);

                    // If it's a kick, add huge impulse to ball over velocity
                    // Standard elasticity
                    const dvx = b2.vel.x - b1.vel.x;
                    const dvy = b2.vel.y - b1.vel.y;
                    const velAlongNormal = dvx * nx + dvy * ny;
                    if (velAlongNormal < 0) {
                        const bounce = 0.5;
                        let impulse = -(1 + bounce) * velAlongNormal;
                        // Massive kick modifier
                        if ((b1 as any).input?.kick && b2 === b) impulse += 200;
                        if ((b2 as any).input?.kick && b1 === b) impulse += 200;

                        const mass1 = b1 === b ? 1 : 3; // players are heavier
                        const mass2 = b2 === b ? 1 : 3;
                        const invMassSum = (1 / mass1) + (1 / mass2);

                        const imp = impulse / invMassSum;

                        b1.vel.x -= (1 / mass1) * imp * nx;
                        b1.vel.y -= (1 / mass1) * imp * ny;
                        b2.vel.x += (1 / mass2) * imp * nx;
                        b2.vel.y += (1 / mass2) * imp * ny;
                    }
                }
            }
        }

        // 5.5 Re-apply Player Wall Bounds to prevent clipping after collision
        for (const hp of Object.values(state.haxPlayers)) {
            if (hp.pos.x < hp.r) { hp.pos.x = hp.r; }
            if (hp.pos.x > FIELD_W - hp.r) { hp.pos.x = FIELD_W - hp.r; }
            if (hp.pos.y < hp.r) { hp.pos.y = hp.r; }
            if (hp.pos.y > FIELD_H - hp.r) { hp.pos.y = FIELD_H - hp.r; }
        }

        // 6. Check Goals
        if (b.pos.x < 0) { // fully crossed goal line roughly
            state.scores.red++;
            state.status = 'goal';
            state.timerTick = 0;
        } else if (b.pos.x > FIELD_W) {
            state.scores.blue++;
            state.status = 'goal';
            state.timerTick = 0;
        }

        return { newState: state };
    }

    private resetPositions(state: HaxballState) {
        state.ball.pos = { x: FIELD_W / 2, y: FIELD_H / 2 };
        state.ball.vel = { x: 0, y: 0 };
        Object.values(state.haxPlayers).forEach(hp => {
            hp.vel = { x: 0, y: 0 };
            hp.pos.x = hp.team === 'blue' ? 200 : 600;
            hp.pos.y = 200; // Simplified reset, ideally staggered
        });
    }

    isOver(state: HaxballState): boolean {
        return state.status === 'finished';
    }

    getResult(state: HaxballState): GameResult {
        let winners: string[] = [];
        if (state.scores.blue > state.scores.red) {
            winners = Object.values(state.haxPlayers).filter(p => p.team === 'blue').map(p => p.id);
        } else if (state.scores.red > state.scores.blue) {
            winners = Object.values(state.haxPlayers).filter(p => p.team === 'red').map(p => p.id);
        }

        return {
            winners,
            summary: { scores: state.scores, msg: state.scores.blue === state.scores.red ? 'Match Nul!' : 'Victoire!' }
        };
    }
}
