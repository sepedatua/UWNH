import Assets from '../../assets';
import createMap from '../../map';
import PercentNextMove from '../../percentNextMove';
import createWorldCharacters from './worldCharacters';
import { getTimeOfDay } from '../../state/selectors';
import { worldTimeTick } from '../../state/actionsWorld';
import {
  drawCamera,
  drawCharacter,
  getCameraPosition,
  getFromToAccountingForWrapAround,
} from './sharedUtils';
import { TILE_SIZE } from '../../constants';
import {
  calculateSightRadius,
  isEntityWithinLineOfSight,
  renderFogOfWarTiles,
  renderHeavyFogMistOverlay,
} from './fogOfWarRenderer';
import explorationManager from './explorationManager';
import seaWeather from './seaWeather';

const createWorld = () => {
  const canvas = document.getElementById('camera') as HTMLCanvasElement;
  const context = canvas.getContext('2d', { alpha: false })!;

  const width = canvas.width / TILE_SIZE;
  const height = canvas.height / TILE_SIZE;

  const map = createMap([Math.ceil(width + 1), Math.ceil(height + 1)]);

  const characters = createWorldCharacters(map);

  return {
    update: () => {
      PercentNextMove.update();

      if (PercentNextMove.get() !== 0) {
        return;
      }

      worldTimeTick();

      characters.update();

      const pPos = characters.player().position(0);
      const sight = calculateSightRadius();
      explorationManager.revealAroundPosition(pPos.x, pPos.y, sight.finalRadiusTiles);
    },
    draw: () => {
      const player = characters.player();
      const camera = getCameraPosition(
        player,
        { width, height },
        map,
        PercentNextMove.get(),
        true,
      );

      const playerPos = player.position(PercentNextMove.get());
      const sight = calculateSightRadius();

      drawCamera(context, { ...camera, width, height }, map, getTimeOfDay());

      // 1. Reveal tiles around the flagship as it sails across the ocean
      explorationManager.revealAroundPosition(
        playerPos.x,
        playerPos.y,
        sight.finalRadiusTiles,
      );

      // 2. Render authentic 16-bit jagged tile-aligned Fog of War shroud over uncharted waters
      renderFogOfWarTiles(
        context,
        { ...camera, width, height },
        canvas.width,
        canvas.height,
      );

      const npcs = characters.npcs();

      npcs.forEach((npc) => {
        const npcPos = npc.position(PercentNextMove.get());
        if (isEntityWithinLineOfSight(playerPos, npcPos, sight.finalRadiusTiles)) {
          drawCharacter(
            context,
            Assets.images('worldShips'),
            npc,
            camera,
            PercentNextMove.get(),
          );
        }
      });

      // player drawn last as there’s no collision at sea
      drawCharacter(
        context,
        Assets.images('worldShips'),
        player,
        camera,
        PercentNextMove.get(),
      );

      // 3. If in Heavy Fog weather anomaly, render drifting translucent sea mist overlay
      if (seaWeather.isFoggy()) {
        renderHeavyFogMistOverlay(context, canvas.width, canvas.height);
      }
    },
    characters: () => characters,
  };
};

export type World = ReturnType<typeof createWorld>;

export default createWorld;
