import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';

import Right from './Right';
import Left from './Left';
import PortInfo from './port/PortInfo';
import Provisions from './world/Provisions';
import Indicators from './world/Indicators';
import Camera from './Camera';
import updateInterface from '../state/updateInterface';
import Building from './port/Building';
import { classNames } from './interfaceUtils';
import useFade from './port/hooks/useFade';

import TopBar from './TopBar';
import ErrorBoundary from './ErrorBoundary';
import SailingHUD from './world/SailingHUD';
import BattleArena from './combat/BattleArena';
import { endCombat } from '../state/actionsWorld';
import PauseOverlay from './common/PauseOverlay';
import { togglePause, setPaused } from '../state/actionsGame';
import './global.css';



type Props = {
  /*
    The state of Interface is updated outside of React. This is made possible
    by assigning setStates to an outside object. Calls to that object’s methods
    are delayed until Interface has mounted.

    Using a shared Redux Store could be a solution, but changes don’t happen
    fast enough.
   */
  resolve: () => void;
};

function Interface({ resolve }: Props) {
  const [portId, setPortId] = useState<string | null>(null);
  const [buildingId, setBuildingId] = useState<string | null>(null);
  const [timePassed, setTimePassed] = useState(0);
  const [gold, setGold] = useState(0);
  const [inCombat, setInCombat] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [combatEncounter, setCombatEncounter] = useState<{
    enemyFleetName: string;
    enemyCommodoreName: string;
  } | null>(null);


  useEffect(() => {
    resolve();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === 'Pause' || e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        togglePause();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  updateInterface.isPaused = (paused) => {
    setIsPaused(paused);
  };

  updateInterface.combat = (active, encounter) => {
    setInCombat(active);
    setCombatEncounter(encounter || null);
  };

  updateInterface.general = (general) => {
    setPortId(general.portId);
    setBuildingId(general.buildingId);
    setTimePassed(general.timePassed);
    setGold(general.gold);
  };

  const { fade, onAnimationEnd } = useFade();


  const inPort = portId !== null;

  return (
    <div className="[image-rendering:pixelated]">
      <ErrorBoundary fallbackTitle="TopBar">
        <TopBar />
      </ErrorBoundary>
      <div className="flex items-stretch">
        <ErrorBoundary fallbackTitle="Left Sidebar">
          <Left
            portId={portId}
            buildingId={buildingId}
            timePassed={timePassed}
            gold={gold}
            inCombat={inCombat}
          >
            <Provisions hidden={inPort} />
          </Left>
        </ErrorBoundary>
        <div
          className={classNames(
            'w-[1280px] h-[800px] relative select-none',
            fade ? 'fade-out' : '',
          )}
          onAnimationEnd={onAnimationEnd}
          onContextMenu={(e) => e.preventDefault()}
        >
          {inCombat && (
            <ErrorBoundary fallbackTitle="Battle Arena">
              <BattleArena
                enemyFleetName={combatEncounter?.enemyFleetName}
                enemyCommodoreName={combatEncounter?.enemyCommodoreName}
                onCombatConcluded={(victory) => endCombat(victory)}
              />
            </ErrorBoundary>
          )}
          {!inCombat && buildingId !== null && (
            <ErrorBoundary fallbackTitle="Building Interior">
              <Building buildingId={buildingId} />
            </ErrorBoundary>
          )}
          {!inCombat && (
            <div className={buildingId ? 'hidden' : ''}>
              <Camera />
            </div>
          )}
          {!inPort && buildingId === null && !inCombat && (
            <ErrorBoundary fallbackTitle="Sailing HUD">
              <SailingHUD />
            </ErrorBoundary>
          )}
          {isPaused && <PauseOverlay onResume={() => setPaused(false)} />}
        </div>

        <ErrorBoundary fallbackTitle="Right Sidebar">
          <Right>
            {inPort && <PortInfo portId={portId} />}
            <Indicators hidden={inPort} />
          </Right>
        </ErrorBoundary>
      </div>
    </div>
  );
}

const renderInterface = () =>
  new Promise<void>((resolve) => {
    const container = document.getElementById('game');
    const root = createRoot(container!);
    root.render(
      <React.StrictMode>
        <Interface resolve={resolve} />
      </React.StrictMode>,
    );
  });

export default renderInterface;
