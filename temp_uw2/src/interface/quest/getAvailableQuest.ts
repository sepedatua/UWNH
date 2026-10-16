import state from '../../state/state';
import { finishedQuest } from '../../state/selectors';
import { QuestId } from './questData';
import { sample } from '../../utils';

const between22and24 = (timePassed: number) => {
  const timePassedToday = timePassed % 1440;

  return timePassedToday >= 1320 || timePassedToday === 0;
};

const getAvailableQuest = (): QuestId | null => {
  // Scenario quests only activate in Scenario Mode for João Franco ('1')!
  // In Endless Mode or when playing other captains, all buildings are 100% open sandbox!
  if (state.gameMode !== 'sp_scenario' || state.protagonistId !== '1') {
    return null;
  }

  const { portId, buildingId, timePassed } = state;

  if (portId !== '1' || !buildingId) {
    return null;
  }

  // Once the Lisbon prologue concludes (harborFinal completed and João sets sail),
  // returning to Lisbon must NEVER refire the prologue quest sequence!
  // Normal facilities (Pub, Shipyard, Market, Item Shop, Church, Harbor, Bank, Lodge, Guild)
  // return null so they open the standard building menus and gameplay.
  // The Franco family mansion (8) and Royal Palace (6) remind João of his father's orders.
  if (finishedQuest('harborFinal')) {
    if (buildingId === '8') {
      return 'houseAfterQuestAndPub2';
    }

    if (buildingId === '6') {
      return 'palaceAfterQuest';
    }

    return null;
  }

  if (buildingId === '8') {
    if (!finishedQuest('houseBeforeQuest')) {
      return 'houseBeforeQuest';
    }

    if (!finishedQuest('houseAfterQuestAndPub')) {
      if (finishedQuest('pubAfterQuest') && between22and24(timePassed)) {
        return 'houseAfterQuestAndPub';
      }
      return 'houseAfterQuest';
    }

    return 'houseAfterQuestAndPub2';
  }

  if (buildingId === '2') {
    if (!finishedQuest('houseBeforeQuest')) {
      if (!finishedQuest('pubBeforeQuest')) {
        return 'pubBeforeQuest';
      }

      return 'pubBeforeQuest2';
    }

    if (!finishedQuest('pubAfterQuest')) {
      return 'pubAfterQuest';
    }

    if (!finishedQuest('houseAfterQuestAndPub')) {
      return 'pubAfterQuest2';
    }

    // Once Mother gives the Tiara, Lisbon Pub opens normally so player can hire crew/drink!
    return null;
  }

  if (['5', '7', '9'].includes(buildingId)) {
    if (!finishedQuest('houseBeforeQuest')) {
      return sample([
        'lodgeBankGuildBeforeQuestRandom1',
        'lodgeBankGuildBeforeQuestRandom2',
        'lodgeBankGuildBeforeQuestRandom3',
      ]);
    }

    // Once the initial father conversation has taken place, allow normal facility usage
    return null;
  }

  if (buildingId === '6') {
    if (!finishedQuest('houseBeforeQuest')) {
      return 'palaceBeforeQuest';
    }

    return 'palaceAfterQuest';
  }

  if (buildingId === '10') {
    if (!finishedQuest('houseBeforeQuest')) {
      return 'itemShopBeforeQuest';
    }

    if (!finishedQuest('itemShopAfterQuest')) {
      return 'itemShopAfterQuest';
    }

    // Once Marco gives the Rapier, Item Shop opens normally for buying/selling!
    return null;
  }

  if (buildingId === '3') {
    if (!finishedQuest('houseBeforeQuest')) {
      return 'shipyardBeforeQuest';
    }

    if (!finishedQuest('shipyardAfterQuest')) {
      return 'shipyardAfterQuest';
    }

    return null;
  }

  if (buildingId === '11') {
    if (!finishedQuest('houseBeforeQuest')) {
      if (!finishedQuest('churchBeforeQuest')) {
        return 'churchBeforeQuest';
      }

      return 'churchBeforeQuest2';
    }

    if (!finishedQuest('churchAfterEnrico')) {
      if (!finishedQuest('churchAfterQuest')) {
        return 'churchAfterQuest';
      }

      return 'churchAfterEnrico';
    }

    // Once Enrico has joined and church donation received, Church opens normally!
    return null;
  }

  if (buildingId === '1') {
    if (!finishedQuest('houseBeforeQuest')) {
      return 'marketBeforeQuest';
    }

    if (!finishedQuest('shipyardAfterQuest')) {
      return 'marketAfterQuestBeforeShip';
    }

    return null;
  }

  if (buildingId === '4') {
    if (!finishedQuest('houseBeforeQuest')) {
      return 'harborBeforeQuest';
    }

    if (!finishedQuest('shipyardAfterQuest')) {
      return 'harborBeforeShip';
    }

    if (!finishedQuest('churchAfterQuest')) {
      return 'harborBeforeEnrico';
    }

    if (!finishedQuest('pubAfterQuest')) {
      if (!finishedQuest('churchAfterEnrico')) {
        return 'harborAfterEnrico';
      }

      return 'harborAfterEnrico2';
    }

    if (!finishedQuest('houseAfterQuestAndPub')) {
      return 'harborAfterEnricoBeforeMother';
    }

    if (!finishedQuest('harborFinal')) {
      return 'harborFinal';
    }

    return null;
  }

  return null;
};

export default getAvailableQuest;
