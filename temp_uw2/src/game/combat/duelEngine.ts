import {
  AttackerStance,
  DefenderStance,
  DuelFighter,
  DuelState,
} from './combatTypes';
import soundManager from '../../interface/sound/soundManager';

export interface DuelRoundResult {
  playerStance: AttackerStance;
  enemyStance: DefenderStance;
  playerDamageDealt: number;
  enemyDamageDealt: number;
  meterShift: number; // positive = pushes toward player victory
  message: string;
  isGameOver: boolean;
  winner: 'player' | 'enemy' | null;
}

/**
 * Evaluates tactical stance advantage between attacker and defender.
 * Returns advantage multiplier:
 *  > 1.0: Attacker has upper hand
 *  < 1.0: Defender has upper hand / counter-riposte
 */
export const evaluateStanceAdvantage = (
  attack: AttackerStance,
  defense: DefenderStance,
): { attackerFactor: number; defenderFactor: number; text: string } => {
  if (attack === 'thrust') {
    if (defense === 'parry') {
      return {
        attackerFactor: 0.3,
        defenderFactor: 1.8,
        text: 'The thrust is cleanly parried! A swift counter-riposte drives back!',
      };
    }
    if (defense === 'block') {
      return {
        attackerFactor: 1.7,
        defenderFactor: 0.4,
        text: 'The razor-sharp thrust pierces right through the guard!',
      };
    }
    // dodge
    return {
      attackerFactor: 1.1,
      defenderFactor: 0.8,
      text: 'A lunging thrust grazes as the opponent evades!',
    };
  }

  if (attack === 'slash') {
    if (defense === 'block') {
      return {
        attackerFactor: 0.4,
        defenderFactor: 1.4,
        text: 'The sweeping slash is firmly blocked by the blade guard!',
      };
    }
    if (defense === 'dodge') {
      return {
        attackerFactor: 1.8,
        defenderFactor: 0.3,
        text: 'The wide slash catches the dodging opponent across the flank!',
      };
    }
    // parry
    return {
      attackerFactor: 1.2,
      defenderFactor: 0.7,
      text: 'The slashing blade overpowers the attempted parry!',
    };
  }

  // Strike (Heavy overhead/cleave)
  if (attack === 'strike') {
    if (defense === 'dodge') {
      return {
        attackerFactor: 0.2,
        defenderFactor: 2.0,
        text: 'The heavy strike swings wide! The agile dodge sets up a devastating counter!',
      };
    }
    if (defense === 'parry') {
      return {
        attackerFactor: 1.9,
        defenderFactor: 0.3,
        text: 'The thunderous strike smashes straight through the futile parry!',
      };
    }
    // block
    return {
      attackerFactor: 1.1,
      defenderFactor: 0.9,
      text: 'Steel rings fiercely as the heavy strike crashes against the guard!',
    };
  }

  return { attackerFactor: 1.0, defenderFactor: 1.0, text: 'The blades clash evenly.' };
};

/**
 * Calculates damage dealt in a duel exchange
 */
export const calculateDuelDamage = (
  attacker: DuelFighter,
  defender: DuelFighter,
  advantageFactor: number,
): { damage: number; isCrit: boolean } => {
  const basePower = attacker.weaponPower + (attacker.swordsmanship * 0.4) + (attacker.battleLevel * 2);
  const armorMitigation = defender.armorDefense * 0.5;

  // Critical strike roll based on swordsmanship
  const critRoll = Math.random() * 100;
  const isCrit = critRoll <= attacker.swordsmanship * 0.25;
  const critMultiplier = isCrit ? 1.5 : 1.0;

  const rawDamage = Math.max(
    5,
    (basePower * advantageFactor * critMultiplier) - armorMitigation,
  );

  return {
    damage: Math.round(rawDamage),
    isCrit,
  };
};

/**
 * Selects an intelligent enemy defense stance based on current duel dynamics
 */
export const selectEnemyDefenderStance = (
  playerRecentStances: AttackerStance[],
): DefenderStance => {
  // If player repeatedly uses one stance, counter it
  const lastStance = playerRecentStances[playerRecentStances.length - 1];
  const roll = Math.random();

  if (lastStance === 'thrust' && roll < 0.6) {
    return 'parry'; // counter thrust
  }
  if (lastStance === 'slash' && roll < 0.6) {
    return 'block'; // counter slash
  }
  if (lastStance === 'strike' && roll < 0.6) {
    return 'dodge'; // counter strike
  }

  // Otherwise balanced distribution
  if (roll < 0.33) return 'parry';
  if (roll < 0.66) return 'dodge';
  return 'block';
};

/**
 * Advances one combat round in the 1v1 Sword Duel
 */
export const executeDuelRound = (
  duelState: DuelState,
  playerStance: AttackerStance,
): DuelRoundResult => {
  const { playerFighter, enemyFighter } = duelState;
  const enemyStance = selectEnemyDefenderStance([]);

  soundManager.playSfx('sword');

  const { attackerFactor, defenderFactor, text } = evaluateStanceAdvantage(
    playerStance,
    enemyStance,
  );

  const playerAttack = calculateDuelDamage(playerFighter, enemyFighter, attackerFactor);
  const enemyAttack = calculateDuelDamage(enemyFighter, playerFighter, defenderFactor);

  let pDamage = 0;
  let eDamage = 0;
  let meterShift = 0;

  if (attackerFactor >= defenderFactor) {
    // Player won exchange
    pDamage = playerAttack.damage;
    eDamage = Math.round(enemyAttack.damage * 0.25);
    meterShift = Math.round(15 * attackerFactor + (playerAttack.isCrit ? 12 : 0));
  } else {
    // Enemy countered
    eDamage = enemyAttack.damage;
    pDamage = Math.round(playerAttack.damage * 0.25);
    meterShift = -Math.round(15 * defenderFactor + (enemyAttack.isCrit ? 12 : 0));
  }

  // Update fighter health
  enemyFighter.health = Math.max(0, enemyFighter.health - pDamage);
  playerFighter.health = Math.max(0, playerFighter.health - eDamage);

  // Update balance meter (clamped 0 to 200)
  duelState.balanceMeter = Math.max(0, Math.min(200, duelState.balanceMeter + meterShift));
  duelState.round += 1;

  let critText = '';
  if (playerAttack.isCrit) critText = ' 💥 Critical Strike!';
  if (enemyAttack.isCrit) critText = ' ⚠️ Enemy Critical Counter!';

  const roundMessage = `Round ${duelState.round}: [${playerStance.toUpperCase()} vs ${enemyStance.toUpperCase()}] ${text}${critText} (Dealt ${pDamage} dmg, took ${eDamage} dmg).`;
  duelState.log.unshift(roundMessage);

  // Check victory / defeat conditions
  let winner: 'player' | 'enemy' | null = null;
  if (duelState.balanceMeter >= 200 || enemyFighter.health <= 0) {
    winner = 'player';
  } else if (duelState.balanceMeter <= 0 || playerFighter.health <= 0) {
    winner = 'enemy';
  }

  duelState.winner = winner;
  const isGameOver = winner !== null;

  return {
    playerStance,
    enemyStance,
    playerDamageDealt: pDamage,
    enemyDamageDealt: eDamage,
    meterShift,
    message: roundMessage,
    isGameOver,
    winner,
  };
};

/**
 * Initializes a new 1v1 Sword Duel against an enemy commodore
 */
export const createDuelState = (
  playerName: string,
  playerSwordsmanship: number,
  playerBattleLevel: number,
  playerWeaponPower = 35,
  playerArmorDefense = 20,
  enemyName = 'Pirate Commodore Blackbeard',
  enemySwordsmanship = 75,
  enemyBattleLevel = 10,
  enemyWeaponPower = 30,
  enemyArmorDefense = 18,
): DuelState => ({
  isActive: true,
  round: 0,
  balanceMeter: 100, // 0..200, 100 = dead center
  log: ['The captains draw their blades! The duel for fleet command begins!'],
  winner: null,
  playerFighter: {
    name: playerName,
    avatarId: '1',
    weaponName: 'Finely Crafted Rapier',
    weaponPower: playerWeaponPower,
    weaponCategory: 'Fencing Sword',
    armorName: 'Plate Armor',
    armorDefense: playerArmorDefense,
    swordsmanship: playerSwordsmanship,
    battleLevel: playerBattleLevel,
    health: 100,
    maxHealth: 100,
  },
  enemyFighter: {
    name: enemyName,
    avatarId: '2',
    weaponName: 'Damascus Scimitar',
    weaponPower: enemyWeaponPower,
    weaponCategory: 'Curved Sword',
    armorName: 'Reinforced Brigandine',
    armorDefense: enemyArmorDefense,
    swordsmanship: enemySwordsmanship,
    battleLevel: enemyBattleLevel,
    health: 100,
    maxHealth: 100,
  },
});
