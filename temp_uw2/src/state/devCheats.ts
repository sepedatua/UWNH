import state from './state';
import { updateGeneral } from './actionsPort';

/**
 * Injects gold into the currently active protagonist's balance.
 *
 * @param amount Number of gold pieces to add (defaults to 10,000 = 1 Ingot). Negative numbers deduct gold (clamped to 0).
 * @returns The new gold balance.
 */
export const injectGold = (amount: number = 10000): number => {
  const numericAmount = Number(amount);
  if (isNaN(numericAmount)) {
    console.warn(
      `[DevCheats] ⚠️ Invalid gold amount specified: ${amount}. Please provide a valid number.`,
    );
    return state.gold;
  }

  const delta = Math.floor(numericAmount);
  state.gold = Math.max(0, state.gold + delta);
  updateGeneral();

  const ingots = Math.floor(state.gold / 10000);
  const coins = state.gold % 10000;
  const protagonistName = state.protagonistName || 'Captain';
  const protagonistId = state.protagonistId || '1';

  console.log(
    `%c[DevCheats] 💰 Injected ${delta >= 0 ? '+' : ''}${delta.toLocaleString()} Gold into "${protagonistName}" (ID: ${protagonistId}).\n` +
      `Current Balance: ${state.gold.toLocaleString()} Gold (${ingots.toLocaleString()} Ingots, ${coins.toLocaleString()} Coins)`,
    'color: #ffd700; font-weight: bold; background: #1c1814; padding: 4px 8px; border-radius: 4px;',
  );

  return state.gold;
};

/**
 * Sets the currently active protagonist's gold to an exact amount.
 *
 * @param amount Exact number of gold pieces to set (clamped to >= 0).
 * @returns The new gold balance.
 */
export const setGold = (amount: number): number => {
  const numericAmount = Number(amount);
  if (isNaN(numericAmount)) {
    console.warn(
      `[DevCheats] ⚠️ Invalid gold amount specified: ${amount}. Please provide a valid number.`,
    );
    return state.gold;
  }

  const rounded = Math.max(0, Math.floor(numericAmount));
  state.gold = rounded;
  updateGeneral();

  const ingots = Math.floor(state.gold / 10000);
  const coins = state.gold % 10000;
  const protagonistName = state.protagonistName || 'Captain';
  const protagonistId = state.protagonistId || '1';

  console.log(
    `%c[DevCheats] 💰 Set Gold of "${protagonistName}" (ID: ${protagonistId}) to ${state.gold.toLocaleString()} Gold (${ingots.toLocaleString()} Ingots, ${coins.toLocaleString()} Coins).`,
    'color: #ffd700; font-weight: bold; background: #1c1814; padding: 4px 8px; border-radius: 4px;',
  );

  return state.gold;
};

/**
 * Returns the currently active protagonist's gold balance.
 *
 * @returns The current gold balance.
 */
export const getGoldBalance = (): number => {
  const ingots = Math.floor(state.gold / 10000);
  const coins = state.gold % 10000;
  const protagonistName = state.protagonistName || 'Captain';

  console.log(
    `%c[DevCheats] 💰 Current Gold for "${protagonistName}": ${state.gold.toLocaleString()} Gold (${ingots.toLocaleString()} Ingots, ${coins.toLocaleString()} Coins).`,
    'color: #ffd700; font-weight: bold; background: #1c1814; padding: 4px 8px; border-radius: 4px;',
  );

  return state.gold;
};

/**
 * Initializes and binds gold cheat commands to the global window object.
 */
export const initDevCheats = () => {
  if (typeof window === 'undefined') return;

  const w = window as any;
  w.injectGold = injectGold;
  w.setGold = setGold;
  w.getGold = getGoldBalance;

  w.uw2 = {
    ...(w.uw2 || {}),
    injectGold,
    setGold,
    getGold: getGoldBalance,
    state,
  };

  console.log(
    '%c⚓ [DevCheats] Gold commands registered for currently played protagonist:\n' +
      '  👉 injectGold(10000)   — Add gold (default: 10,000 / 1 Ingot)\n' +
      '  👉 setGold(50000)      — Set exact gold balance\n' +
      '  👉 getGold()           — Check current balance and ingots breakdown',
    'color: #ffd700; font-family: monospace; font-size: 11px; background: #261f18; padding: 6px 10px; border-left: 3px solid #ffd700; border-radius: 2px;',
  );
};
