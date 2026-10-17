import Assets from './assets';
import Input from './input';
import renderInterface from './interface/Interface';
import createWorld from './game/world/world';
import createPort from './game/port/port';

import state from './state/state';
import { updateGeneral } from './state/actionsPort';
import { setDockedFleetPositions } from './state/actionsWorld';
import { initDevCheats } from './state/devCheats';
import logger from './logger';

initDevCheats();

let lastPortId: string | null = 'INITIAL';

const start = async () => {
  try {
    logger.info('App', '🚀 Starting Uncharted Waters II Engine...');
    await Assets.load();
    logger.info('App', '✅ Assets loaded.');

    Input.setup();
    logger.info('App', '✅ Input handlers registered.');

    await renderInterface();
    logger.info('App', '✅ Interface mounted.');

    updateGeneral();
    setDockedFleetPositions();
    logger.info('App', `✅ Engine ready. Starting port: ${state.portId}`);
  } catch (err: any) {
    logger.fatal('App', `Fatal initialization error: ${err.message}`, err);
    return;
  }

  const loop = () => {
    try {
      const canvas = document.getElementById('camera') as HTMLCanvasElement | null;
      if (!canvas) {
        // Canvas not mounted yet (e.g. during combat or React hydration)
        requestAnimationFrame(loop);
        return;
      }

      // Check black screen health
      logger.checkBlackScreen();

      // Detect state transitions
      if (lastPortId !== state.portId) {
        logger.info(
          'StateTransition',
          `Scene switched: ${lastPortId === 'INITIAL' ? 'Init' : (lastPortId ? `Port ${lastPortId}` : 'High Seas')} -> ${state.portId ? `Port ${state.portId}` : 'High Seas'}`,
        );
        lastPortId = state.portId;
      }

      if (state.portId !== null) {
        if (!state.port) {
          logger.info('Port', `Creating port instance for portId: ${state.portId}`);
          state.port = createPort(state.portId);
        }

        if (state.buildingId === null) {
          state.port.update();
          state.port.draw();
          logger.recordFrameRender();
        } else {
          logger.recordFrameRender();
        }
      }

      if (state.portId === null) {
        if (!state.world) {
          logger.info('World', 'Creating high seas world instance');
          state.world = createWorld();
        }

        state.world.update();
        state.world.draw();
        logger.recordFrameRender();
      }
    } catch (err: any) {
      logger.error('GameLoop', `Game loop exception: ${err.message}`, err);
    }

    requestAnimationFrame(loop);
  };

  requestAnimationFrame(loop);
};

void start();

