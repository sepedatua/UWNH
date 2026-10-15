import { describe, it, expect } from 'vitest';
import autopilotManager from '../src/game/world/autopilotManager';
import { positionAdjacentToPort } from '../src/state/selectors';
import Assets from '../src/assets';
import fs from 'fs';

describe('Debug LOS', () => {
  it('prints segments', () => {
    const tilemap = fs.readFileSync('src/data/assets/worldTilemap.wasm');
    Assets.set('worldTilemap', tilemap);

    const sundaDock = positionAdjacentToPort('92');
    const malaccaDock = positionAdjacentToPort('59');
    const paseiDock = positionAdjacentToPort('91');

    console.log('sundaDock:', sundaDock);
    console.log('malaccaDock:', malaccaDock);
    console.log('paseiDock:', paseiDock);

    console.log('\n--- SUNDA TO MALACCA ---');
    const pathM = autopilotManager.findPath(sundaDock, malaccaDock, false);
    if (pathM) {
      for (let i = 0; i < pathM.length - 1; i++) {
        const p1 = pathM[i];
        const p2 = pathM[i + 1];
        const clear = autopilotManager.hasWaterLineOfSight(p1, p2);
        console.log(`Segment ${i}: (${p1.x}, ${p1.y}) -> (${p2.x}, ${p2.y}) : clear=${clear}`);
      }
    }

    console.log('\n--- SUNDA TO PASEI ---');
    const pathP = autopilotManager.findPath(sundaDock, paseiDock, false);
    if (pathP) {
      for (let i = 0; i < pathP.length - 1; i++) {
        const p1 = pathP[i];
        const p2 = pathP[i + 1];
        const clear = autopilotManager.hasWaterLineOfSight(p1, p2);
        console.log(`Segment ${i}: (${p1.x}, ${p1.y}) -> (${p2.x}, ${p2.y}) : clear=${clear}`);
      }
    }
  });
});
