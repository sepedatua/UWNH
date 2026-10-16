import state from '../../state/state';
import { Village, getVillageById, getNearbyVillage } from '../../data/villageData';
import { Discovery, getDiscoveryById } from '../../data/discoveryData';
import { getPlayerFleet } from '../../state/selectorsFleet';
import soundManager from '../../interface/sound/soundManager';

export interface VillageActionResult {
  success: boolean;
  message: string;
  discovery?: Discovery;
  crewLost?: number;
  foodGained?: number;
  waterGained?: number;
  goldGained?: number;
  friendshipDelta?: number;
  newFriendship?: number;
}

export const getVillageFriendship = (villageId: string): number => {
  if (!state.villageFriendship) {
    state.villageFriendship = {};
  }
  if (state.villageFriendship[villageId] !== undefined) {
    return state.villageFriendship[villageId];
  }
  const vil = getVillageById(villageId);
  return vil ? vil.initialFriendship : 40;
};

export const setVillageFriendship = (villageId: string, val: number): number => {
  if (!state.villageFriendship) {
    state.villageFriendship = {};
  }
  const clamped = Math.max(0, Math.min(100, Math.round(val)));
  state.villageFriendship[villageId] = clamped;
  return clamped;
};

export const isVillagePlundered = (villageId: string): boolean => {
  return (state.plunderedVillages || []).includes(villageId);
};

export const isDiscoveryFound = (discoveryId: string): boolean => {
  return (state.discoveries || []).includes(discoveryId);
};

export const getAvailableLuxuryGifts = (): { type: string; name: string; quantity: number }[] => {
  const fleet = getPlayerFleet();
  const luxuries: { type: string; name: string; quantity: number }[] = [];
  
  const luxuryTypes = [
    'wine', 'spices', 'velvet', 'silk', 'coral', 'glass_beads', 
    'jewelry', 'amber', 'perfume', 'tea', 'sugar', 'dye'
  ];

  for (const ship of fleet) {
    for (const item of ship.cargo) {
      if (luxuryTypes.includes(item.type.toLowerCase()) && item.quantity > 0) {
        const existing = luxuries.find((l) => l.type === item.type);
        if (existing) {
          existing.quantity += item.quantity;
        } else {
          luxuries.push({
            type: item.type,
            name: item.type.charAt(0).toUpperCase() + item.type.slice(1).replace('_', ' '),
            quantity: item.quantity,
          });
        }
      }
    }
  }

  return luxuries;
};

/**
 * Perform Search / Exploration Action
 */
export const conductVillageSearch = (village: Village): VillageActionResult => {
  const friendship = getVillageFriendship(village.id);
  const discovery = getDiscoveryById(village.discoveryId);

  if (!discovery) {
    return {
      success: false,
      message: 'Your landing party explored the surrounding terrain, but found no notable landmarks or ancient ruins.',
    };
  }

  if (isDiscoveryFound(discovery.id)) {
    return {
      success: true,
      discovery,
      message: `The local discovery—${discovery.name} (${discovery.icon})—has already been unearthed and logged in your exploration journal!`,
    };
  }

  // Check for hostile native ambush if friendship is very low
  if (friendship < 25 && Math.random() < 0.45) {
    const fleet = getPlayerFleet();
    const casualties = Math.floor(Math.random() * 4) + 2;
    if (fleet[0] && fleet[0].crew > casualties) {
      fleet[0].crew -= casualties;
    }
    soundManager.playSfx('cannonFire');
    return {
      success: false,
      crewLost: casualties,
      message: `AMBUSH! Suspicious native warriors attacked your exploration party from the underbrush! ${casualties} sailors were lost in the skirmish before you could retreat to the shoreline.`,
    };
  }

  // Success roll: guaranteed if 100% friendship, otherwise based on difficulty and friendship
  const difficulty = discovery.difficulty || 40;
  const baseSuccessChance = friendship >= 100 ? 1.0 : (friendship * 0.65 + (100 - difficulty) * 0.35) / 100;
  const roll = Math.random();

  if (roll <= baseSuccessChance) {
    if (!state.discoveries) state.discoveries = [];
    state.discoveries.push(discovery.id);

    if (!state.fame) state.fame = { adventure: 0, trade: 0, piracy: 0 };
    state.fame.adventure = (state.fame.adventure || 0) + discovery.fameReward;

    soundManager.playSfx('fanfare');

    // If monster, crew panic/desertion chance
    let crewDeserted = 0;
    let monsterNotice = '';
    if (discovery.category === 'monster' && Math.random() < 0.5) {
      const fleet = getPlayerFleet();
      crewDeserted = Math.floor(Math.random() * 3) + 1;
      if (fleet[0] && fleet[0].crew > crewDeserted) {
        fleet[0].crew -= crewDeserted;
      }
      monsterNotice = ` Terrified by the monstrous beast, ${crewDeserted} superstitious sailors panicked and deserted!`;
    }

    return {
      success: true,
      discovery,
      crewLost: crewDeserted,
      message: `EUREKA! You have discovered the legendary ${discovery.name} (${discovery.icon})!\nRank: ${discovery.rank} | Adventure Fame +${discovery.fameReward}!${monsterNotice}`,
    };
  }

  // Search failed
  return {
    success: false,
    message: 'Your landing party hacked through the wild interior for hours, but could not uncover any hidden relics or wondrous beasts. The tribal elders suggest offering gifts to gain their guidance.',
  };
};

/**
 * Perform Feast / Gift Offering
 */
export const conductVillageFeast = (
  village: Village,
  giftType: 'food' | 'water' | 'cargo',
  cargoType?: string,
): VillageActionResult => {
  const currentFriendship = getVillageFriendship(village.id);
  const fleet = getPlayerFleet();
  if (!fleet[0]) {
    return { success: false, message: 'No flagship available to supply gifts.' };
  }

  let delta = 0;
  let giftName = '';

  if (giftType === 'food') {
    const foodItem = fleet[0].cargo.find((c) => c.type === 'food');
    if (!foodItem || foodItem.quantity < 10) {
      return { success: false, message: 'Not enough food provisions to host a generous feast (requires 10 barrels).' };
    }
    foodItem.quantity -= 10;
    delta = Math.floor(Math.random() * 10) + 15; // +15% to +25%
    giftName = '10 barrels of salt beef and ship biscuits';
  } else if (giftType === 'water') {
    const waterItem = fleet[0].cargo.find((c) => c.type === 'water');
    if (!waterItem || waterItem.quantity < 10) {
      return { success: false, message: 'Not enough fresh water to offer gifts (requires 10 barrels).' };
    }
    waterItem.quantity -= 10;
    delta = Math.floor(Math.random() * 8) + 12; // +12% to +20%
    giftName = '10 casks of fresh water';
  } else if (giftType === 'cargo' && cargoType) {
    let found = false;
    for (const ship of fleet) {
      const item = ship.cargo.find((c) => c.type === cargoType && c.quantity > 0);
      if (item) {
        item.quantity -= 1;
        found = true;
        break;
      }
    }
    if (!found) {
      return { success: false, message: `No ${cargoType} in fleet cargo holds to present.` };
    }
    delta = Math.floor(Math.random() * 15) + 35; // +35% to +50%!
    giftName = `1 crate of exotic ${cargoType.replace('_', ' ')}`;
  }

  const newFriendship = setVillageFriendship(village.id, currentFriendship + delta);
  soundManager.playSfx('shipBell');

  let elderReaction = `The villagers gladly accepted your gift of ${giftName}. Friendship increased by +${delta}% (now ${newFriendship}%).`;
  if (newFriendship >= 100) {
    elderReaction += `\n\n✨ The Tribal Elder is deeply touched by your honor and nobility: "You are truly a friend of our people, Captain. Venture northeast past the twin palms, and our sacred wonder shall reveal itself to you!"`;
  }

  return {
    success: true,
    friendshipDelta: delta,
    newFriendship,
    message: elderReaction,
  };
};

/**
 * Perform Plunder Action
 */
export const conductVillagePlunder = (village: Village): VillageActionResult => {
  const fleet = getPlayerFleet();
  if (!fleet[0]) {
    return { success: false, message: 'No fleet available to conduct raid.' };
  }

  // Plunder rewards
  const foodLoot = Math.floor(Math.random() * 15) + 15; // 15-30
  const waterLoot = Math.floor(Math.random() * 15) + 15; // 15-30
  const goldLoot = Math.floor(Math.random() * 1500) + 800; // 800-2300

  // Casualties from defenders
  const casualties = Math.floor(Math.random() * 5) + 3; // 3-7
  if (fleet[0].crew > casualties) {
    fleet[0].crew -= casualties;
  }

  // Allocate provisions
  let foodItem = fleet[0].cargo.find((c) => c.type === 'food');
  if (foodItem) {
    foodItem.quantity += foodLoot;
  } else {
    fleet[0].cargo.push({ type: 'food', quantity: foodLoot });
  }

  let waterItem = fleet[0].cargo.find((c) => c.type === 'water');
  if (waterItem) {
    waterItem.quantity += waterLoot;
  } else {
    fleet[0].cargo.push({ type: 'water', quantity: waterLoot });
  }

  state.gold += goldLoot;

  // Morale & Loyalty penalties
  state.morale = Math.max(10, (state.morale || 80) - 15);
  if (!state.fame) state.fame = { adventure: 0, trade: 0, piracy: 0 };
  state.fame.piracy = (state.fame.piracy || 0) + 120;

  // Friendship plunges to 0
  setVillageFriendship(village.id, 0);

  if (!state.plunderedVillages) {
    state.plunderedVillages = [];
  }
  if (!state.plunderedVillages.includes(village.id)) {
    state.plunderedVillages.push(village.id);
  }

  soundManager.playSfx('cannonFire');

  return {
    success: true,
    foodGained: foodLoot,
    waterGained: waterLoot,
    goldGained: goldLoot,
    crewLost: casualties,
    newFriendship: 0,
    message: `RAID RESULT:\nYour armed landing party overpowered the settlement defenders, looting ${foodLoot} food, ${waterLoot} fresh water, and ${goldLoot} gold coins.\n\nHowever, fierce native resistance cost ${casualties} sailor lives. The villagers are now permanently ENRAGED (Friendship 0%). Crew morale dropped by 15 points, and your First Mate voiced grave disgust at your cruelty! (Piracy Fame +120).`,
  };
};

/**
 * Perform Rest & Wait Action
 */
export const conductVillageWait = (village: Village): VillageActionResult => {
  const fleet = getPlayerFleet();
  const totalCrew = fleet.reduce((sum, s) => sum + s.crew, 0);
  
  // 1 day consumption
  const foodNeeded = Math.ceil(totalCrew * 0.1);
  const waterNeeded = Math.ceil(totalCrew * 0.1);

  if (fleet[0]) {
    const food = fleet[0].cargo.find((c) => c.type === 'food');
    const water = fleet[0].cargo.find((c) => c.type === 'water');
    if (food) food.quantity = Math.max(0, food.quantity - foodNeeded);
    if (water) water.quantity = Math.max(0, water.quantity - waterNeeded);
  }

  // Advance day
  state.dayAtSea = (state.dayAtSea || 0) + 1;
  state.timePassed = (state.timePassed || 0) + 1440; // 24 hours

  // Resting in a friendly village slightly boosts morale
  const friendship = getVillageFriendship(village.id);
  if (friendship >= 50) {
    state.morale = Math.min(100, (state.morale || 80) + 4);
  }

  soundManager.playSfx('shipBell');

  return {
    success: true,
    message: `Your fleet anchored peacefully in the cove for 24 hours. Sailors rested under the shade, recovering fatigue and morale. Consumed ${foodNeeded} food and ${waterNeeded} water.`,
  };
};
