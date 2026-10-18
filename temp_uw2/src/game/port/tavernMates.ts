import state, { Role } from '../../state/state';
import getSailor, { Sailor } from '../../data/sailorData';
import { updateGeneral } from '../../state/actionsPort';
import soundManager from '../../interface/sound/soundManager';

export interface TavernMate {
  sailorId: string;
  name: string;
  homePortId: string;
  signingBonus: number;
  monthlyWage: number;
  introQuote: string;
  hiredQuote: string;
  rejectQuote: string;
  requiredFame: number;
}

export const TAVERN_MATES: TavernMate[] = [
  {
    sailorId: '35',
    name: 'Andreas Baes',
    homePortId: '1', // Lisbon
    signingBonus: 350,
    monthlyWage: 25,
    introQuote: '“I’ve weathered storms in the Atlantic and exchanged cannon fire with Barbary corsairs. Looking for an able officer?”',
    hiredQuote: '“An honor to sail with ye, Commodore! I shall ready my compass and pistols at once!”',
    rejectQuote: '“I don’t sail with greenhorns, mate. Gain some more nautical renown and maybe we’ll talk.”',
    requiredFame: 100,
  },
  {
    sailorId: '40',
    name: 'Miguel Leal',
    homePortId: '1', // Lisbon
    signingBonus: 500,
    monthlyWage: 35,
    introQuote: '“A sturdy ship needs an unwavering hand on the helm and steady nerve behind the cannons. I am at your service.”',
    hiredQuote: '“My blade and nautical charts are yours, Captain. Let us chart new waters together!”',
    rejectQuote: '“Your fleet’s reputation does not yet match my caliber. Build your fame first.”',
    requiredFame: 400,
  },
  {
    sailorId: '38',
    name: 'Camilo Stefan',
    homePortId: '2', // Seville
    signingBonus: 280,
    monthlyWage: 20,
    introQuote: '“Gold makes the world sail, friend. A shrewd bookkeeper can save you thousands in market duties.”',
    hiredQuote: '“A wise investment, Captain! Every maravedi in your cargo hold will be rigorously accounted for.”',
    rejectQuote: '“I require a merchant commander with deeper pockets and grander enterprise.”',
    requiredFame: 150,
  },
  {
    sailorId: '45',
    name: 'Diego Silva',
    homePortId: '4', // Barcelona
    signingBonus: 320,
    monthlyWage: 24,
    introQuote: '“The Mediterranean is rife with cutthroats. You’ll want my gunnery when the broadsides start flying.”',
    hiredQuote: '“My guns belong to your squadron now! Lead us to glory!”',
    rejectQuote: '“You don’t look ready for real naval combat yet, Captain.”',
    requiredFame: 200,
  },
  {
    sailorId: '44',
    name: 'Zaganos',
    homePortId: '5', // Algiers
    signingBonus: 450,
    monthlyWage: 30,
    introQuote: '“I know every hidden cove and ambush reef from Gibraltar to Alexandria. Are you bold enough to hire a corsair?”',
    hiredQuote: '“Ha! A commander with true courage! We shall plunder the richest prize vessels on the seven seas!”',
    rejectQuote: '“You are too timid to lead men of my temperament. Begone!”',
    requiredFame: 350,
  },
  {
    sailorId: '46',
    name: 'Jean Lafitte',
    homePortId: '8', // Marseille
    signingBonus: 420,
    monthlyWage: 32,
    introQuote: '“A glass of fine Bordeaux, a swift caravel, and cannons loaded with grapeshot—that is the life for me.”',
    hiredQuote: '“Splendid! I shall make your gun crews the most feared artillerymen on the Mediterranean!”',
    rejectQuote: '“You lack the flair and reputation of a true maritime master.”',
    requiredFame: 300,
  },
  {
    sailorId: '47',
    name: 'Pierino',
    homePortId: '9', // Genoa
    signingBonus: 300,
    monthlyWage: 22,
    introQuote: '“The stars in the night sky speak a language of coordinates. With me at your bridge, you will never lose your bearings.”',
    hiredQuote: '“I will plot the true courses across the deepest oceans under your banner!”',
    rejectQuote: '“Come back when your navigational accomplishments match my expectations.”',
    requiredFame: 120,
  },
  {
    sailorId: '42',
    name: 'Cesare Fedrici',
    homePortId: '14', // Venice
    signingBonus: 480,
    monthlyWage: 30,
    introQuote: '“Venice taught me the secrets of commerce, and the Levant taught me how to survive maritime expeditions.”',
    hiredQuote: '“Agreed! Let us fill your holds with eastern silk and fine spices!”',
    rejectQuote: '“A Venetian merchant officer answers only to prestigious fleet commanders.”',
    requiredFame: 250,
  },
  {
    sailorId: '39',
    name: 'Salim',
    homePortId: '3', // Istanbul
    signingBonus: 180,
    monthlyWage: 15,
    introQuote: '“Salaam alaikum, traveler! I know the bazaar merchants and spice routes of the East. Need an interpreter?”',
    hiredQuote: '“May Allah bless our voyages with fair winds and abundant fortunes!”',
    rejectQuote: '“Your name carries little weight in the markets of the Sublime Porte.”',
    requiredFame: 50,
  },
  {
    sailorId: '43',
    name: 'Lawrence Edward',
    homePortId: '29', // Nantes
    signingBonus: 380,
    monthlyWage: 26,
    introQuote: '“I have surveyed the Bay of Biscay and drafted nautical charts for the crown. I seek a captain destined for the New World.”',
    hiredQuote: '“Together, we shall chart territories no European mapmaker has ever laid eyes on!”',
    rejectQuote: '“Your navigational deeds are not yet sufficient to warrant my employment.”',
    requiredFame: 220,
  },
  {
    sailorId: '36',
    name: 'Matthew Baker',
    homePortId: '30', // London
    signingBonus: 400,
    monthlyWage: 28,
    introQuote: '“I know timber, sails, and cannon carriages like the back of my hand. Your ships will sail faster under my command.”',
    hiredQuote: '“Splendid choice, Captain! I’ll keep every vessel in your squadron taut and seaworthy!”',
    rejectQuote: '“I build and command ships only for admirals of renown.”',
    requiredFame: 200,
  },
  {
    sailorId: '41',
    name: 'Anthony Sherley',
    homePortId: '31', // Bristol
    signingBonus: 360,
    monthlyWage: 26,
    introQuote: '“An English privateer never shies away from a prize ship laden with Spanish bullion. Care for an extra gunner?”',
    hiredQuote: '“By the Queen, we shall give the enemy a taste of cold English iron!”',
    rejectQuote: '“You don’t have the stomach or reputation for real privateering yet.”',
    requiredFame: 250,
  },
  {
    sailorId: '37',
    name: 'Hans Hucken',
    homePortId: '34', // Amsterdam
    signingBonus: 220,
    monthlyWage: 18,
    introQuote: '“I am a student of cartography and natural philosophy. Take me aboard and I will record all our discoveries!”',
    hiredQuote: '“Dank u wel, Captain! I shall document every flora, fauna, and port we encounter!”',
    rejectQuote: '“My scholars at the university advise me to join a more prominent expedition.”',
    requiredFame: 80,
  },
  {
    sailorId: '50',
    name: 'Vasco de Ataide',
    homePortId: '71', // Mozambique
    signingBonus: 550,
    monthlyWage: 36,
    introQuote: '“The currents of the Indian Ocean are savage and unforgiving. Without an experienced navigator, you will be dashed on the reefs.”',
    hiredQuote: '“I accept your commission. Follow my lead around the Cape of Storms!”',
    rejectQuote: '“Few captains survive these southern seas. Prove yourself first.”',
    requiredFame: 500,
  },
  {
    sailorId: '48',
    name: 'Duarte Barbosa',
    homePortId: '86', // Goa
    signingBonus: 600,
    monthlyWage: 40,
    introQuote: '“From Malabar to the Spice Islands, I speak the tongues of the eastern sultans and know where diamonds and pepper hide.”',
    hiredQuote: '“We shall conquer the spice markets of the East together!”',
    rejectQuote: '“You must achieve greater trading and adventure fame before seeking my counsel.”',
    requiredFame: 650,
  },
  {
    sailorId: '51',
    name: 'Alfonso de Albuquerque',
    homePortId: '93', // Calicut
    signingBonus: 950,
    monthlyWage: 55,
    introQuote: '“I command fleets with absolute discipline and shattered the blockade of Ormuz. Do you have what it takes to command an Admiral?”',
    hiredQuote: '“A worthy commander at last! Our armada shall rule the Indian Ocean!”',
    rejectQuote: '“You are a mere novice on the world stage. Only a Grand Commodore may command Albuquerque!”',
    requiredFame: 1000,
  },
  {
    sailorId: '49',
    name: 'Fernao Mendes',
    homePortId: '96', // Macao
    signingBonus: 500,
    monthlyWage: 32,
    introQuote: '“I have traded silk in Nagasaki and survived pirate raids in the South China Sea. Need an experienced Asian factor?”',
    hiredQuote: '“Fair winds, Captain! Our holds shall overflow with porcelain, lacquer, and tea!”',
    rejectQuote: '“The Far East demands commanders with legendary reputation.”',
    requiredFame: 450,
  },
];

/**
 * Returns the hireable mate present in the given port's tavern who is not yet recruited
 */
export const getAvailableTavernMate = (portId: string | null): (TavernMate & { sailor: Sailor }) | null => {
  if (!portId) return null;

  // Check if player already recruited this mate
  const recruitedSailorIds = new Set((state.mates || []).map((m) => m.sailorId));

  const found = TAVERN_MATES.find(
    (m) => m.homePortId === portId && !recruitedSailorIds.has(m.sailorId),
  );

  if (!found) return null;

  return {
    ...found,
    sailor: getSailor(found.sailorId),
  };
};

/**
 * Checks whether the protagonist meets the hiring requirements for a tavern mate
 */
export const canRecruitTavernMate = (
  mate: TavernMate,
): { canRecruit: boolean; reason?: string } => {
  if ((state.mates || []).length >= 30) {
    return {
      canRecruit: false,
      reason: 'Your fleet company is at maximum capacity (30 Mates)!',
    };
  }

  if (state.gold < mate.signingBonus) {
    return {
      canRecruit: false,
      reason: `Insufficient gold coins! You need ${mate.signingBonus} Gold for the upfront hiring bonus.`,
    };
  }

  // Calculate protagonist prestige
  const totalFame =
    (state.fame?.adventure || 0) +
    (state.fame?.trade || 0) +
    (state.fame?.piracy || 0);

  // Tavern treat bonus: High fleet morale (recently treated tavern) softens mate requirement by 25%
  const isTavernWarmedUp = (state.morale || 80) >= 85;
  const effectiveFameNeeded = isTavernWarmedUp
    ? Math.round(mate.requiredFame * 0.75)
    : mate.requiredFame;

  if (totalFame < effectiveFameNeeded) {
    return {
      canRecruit: false,
      reason: mate.rejectQuote,
    };
  }

  return { canRecruit: true };
};

/**
 * Recruits a tavern mate into the player's fleet company
 */
export const recruitTavernMate = (
  mate: TavernMate,
  assignedRole: Role = null,
): { success: boolean; message: string } => {
  const check = canRecruitTavernMate(mate);
  if (!check.canRecruit) {
    return { success: false, message: check.reason || mate.rejectQuote };
  }

  // Deduct gold signing bonus
  state.gold -= mate.signingBonus;

  // Add to player mates
  state.mates = state.mates || [];
  state.mates.push({
    sailorId: mate.sailorId,
    role: assignedRole,
  });

  soundManager.playSfx('fanfare');
  updateGeneral();

  return {
    success: true,
    message: mate.hiredQuote,
  };
};

/**
 * Safely assigns a role to a mate, ensuring 1-to-1 uniqueness across the fleet
 */
export const assignMateRole = (
  sailorId: string,
  newRole: Role,
): { success: boolean; message: string } => {
  const mate = (state.mates || []).find((m) => m.sailorId === sailorId);
  if (!mate) {
    return { success: false, message: 'Mate not found in fleet roster.' };
  }

  // If assigning a unique role (non-null), unassign whoever had it previously
  if (newRole !== null) {
    const existingHolder = state.mates.find(
      (m) => m.role === newRole && m.sailorId !== sailorId,
    );
    if (existingHolder) {
      existingHolder.role = null;
    }
  }

  mate.role = newRole;
  soundManager.playSfx('shipBell');
  updateGeneral();

  return {
    success: true,
    message: `Assigned role successfully.`,
  };
};

/**
 * Unassigns a mate's role back to reserve/passenger status
 */
export const unassignMateRole = (sailorId: string): void => {
  const mate = (state.mates || []).find((m) => m.sailorId === sailorId);
  if (mate) {
    mate.role = null;
    soundManager.playSfx('shipBell');
    updateGeneral();
  }
};
