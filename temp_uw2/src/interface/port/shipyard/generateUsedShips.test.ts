import { describe, it, expect, beforeEach } from 'vitest';
import generateUsedShips from './generateUsedShips';
import { getUsedShips } from '../../../state/selectors';
import state from '../../../state/state';
import { shipData } from '../../../data/shipData';

describe('generateUsedShips: Shipyard Inventory Generation & Low-Industry Guard', () => {
  beforeEach(() => {
    state.usedShipsAtPort = {};
  });

  it('generates valid ships for standard European ports like Lisbon (port 1)', () => {
    state.portId = '1';
    const usedShips = generateUsedShips('1');
    const shipIds = Object.values(usedShips);

    expect(shipIds.length).toBeGreaterThanOrEqual(2);
    shipIds.forEach((sId) => {
      expect(sId).toBeDefined();
      expect(shipData[sId]).toBeDefined();
      expect(typeof shipData[sId].name).toBe('string');
    });
  });

  it('handles low-industry ports (e.g. Porto Velho port 51, industry 75) without returning undefined ships', () => {
    state.portId = '51'; // Porto Velho (industry 75, industryId 11 requiring >= 400)
    const usedShips = generateUsedShips('51');
    const shipIds = Object.values(usedShips);

    expect(shipIds.length).toBeGreaterThanOrEqual(2);
    shipIds.forEach((sId) => {
      expect(sId).toBeDefined();
      expect(shipData[sId]).toBeDefined();
      expect(shipData[sId].name).toBeTruthy();
    });
  });

  it('getUsedShips selector sanitizes any stale or corrupted undefined entries in state', () => {
    state.portId = '51';
    // Inject corrupted legacy state
    state.usedShipsAtPort['51'] = { 'bad-uuid-1': undefined as any };

    const sanitizedUsedShips = getUsedShips();
    const shipIds = Object.values(sanitizedUsedShips);

    expect(shipIds.length).toBeGreaterThanOrEqual(2);
    shipIds.forEach((sId) => {
      expect(sId).toBeDefined();
      expect(shipData[sId]).toBeDefined();
    });
  });
});
