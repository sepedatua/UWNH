import { describe, expect, test } from 'vitest';
import {
  createDuelState,
  evaluateStanceAdvantage,
  executeDuelRound,
} from './duelEngine';

describe('duelEngine', () => {
  test('stance advantage triangle counters correctly', () => {
    // Thrust beats Block, beaten by Parry
    expect(evaluateStanceAdvantage('thrust', 'block').attackerFactor).toBeGreaterThan(1.0);
    expect(evaluateStanceAdvantage('thrust', 'parry').attackerFactor).toBeLessThan(1.0);

    // Slash beats Dodge, beaten by Block
    expect(evaluateStanceAdvantage('slash', 'dodge').attackerFactor).toBeGreaterThan(1.0);
    expect(evaluateStanceAdvantage('slash', 'block').attackerFactor).toBeLessThan(1.0);

    // Strike beats Parry, beaten by Dodge
    expect(evaluateStanceAdvantage('strike', 'parry').attackerFactor).toBeGreaterThan(1.0);
    expect(evaluateStanceAdvantage('strike', 'dodge').attackerFactor).toBeLessThan(1.0);
  });

  test('createDuelState initializes 0-200 balance meter at 100 dead center', () => {
    const duel = createDuelState('Captain João', 85, 10);
    expect(duel.isActive).toBe(true);
    expect(duel.balanceMeter).toBe(100);
    expect(duel.round).toBe(0);
    expect(duel.winner).toBeNull();
    expect(duel.playerFighter.name).toBe('Captain João');
    expect(duel.playerFighter.swordsmanship).toBe(85);
  });

  test('executeDuelRound updates health, meter, and advances round', () => {
    const duel = createDuelState('Captain João', 80, 8);
    const result = executeDuelRound(duel, 'thrust');

    expect(duel.round).toBe(1);
    expect(result.playerDamageDealt).toBeGreaterThan(0);
    expect(result.message).toContain('Round 1');
    expect(duel.log.length).toBeGreaterThan(1);
  });

  test('balance meter reaching 200 or 0 decides duel winner', () => {
    const duel = createDuelState('Captain João', 95, 15);
    duel.balanceMeter = 195;
    duel.enemyFighter.health = 5;

    // A victorious blow should conclude the duel
    const result = executeDuelRound(duel, 'thrust');
    if (duel.balanceMeter >= 200 || duel.enemyFighter.health <= 0) {
      expect(result.isGameOver).toBe(true);
      expect(result.winner).toBe('player');
    }
  });
});
