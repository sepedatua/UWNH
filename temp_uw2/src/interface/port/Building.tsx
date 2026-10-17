import { useEffect } from 'react';
import Shipyard from './shipyard/Shipyard';
import BuildingMenu from '../common/BuildingMenu';
import Harbor from './harbor/Harbor';
import BuildingWrapper from './BuildingWrapper';
import { buildings } from '../../data/buildingData';
import useBuilding from './hooks/useBuilding';
import Lodge from './Lodge';
import Bank from './bank/Bank';
import Church from './Church';
import ItemShop from './ItemShop';
import Pub from './Pub';
import Market from './market/Market';
import Palace from './Palace';
import Guild from './Guild';
import Mansion from './Mansion';
import FortuneTeller from './FortuneTeller';
import { isDay } from '../../state/selectors';
import logger from '../../logger';
import state from '../../state/state';

interface Props {
  buildingId: string;
}

export default function Building({ buildingId }: Props) {
  const { options } = buildings[buildingId];
  const { back } = useBuilding();

  useEffect(() => {
    const bName = buildings[buildingId]?.name || `Building ${buildingId}`;
    logger.info('PortLocation', `Entered ${bName} (ID: ${buildingId}) in Port ${state.portId}`);
    return () => {
      logger.info('PortLocation', `Exited ${bName} (ID: ${buildingId}) in Port ${state.portId}`);
    };
  }, [buildingId]);

  const isNight = !isDay();
  const openAtNight = ['2', '4', '5']; // Pub, Harbor, Lodge open 24/7

  if (isNight && !openAtNight.includes(buildingId)) {
    return (
      <BuildingWrapper
        buildingId={buildingId}
        vendorMessageBox={{
          body: 'The doors are bolted shut for the night. Business hours are 4:00 AM to 8:00 PM. (You may stay at the Lodge or visit the Pub).',
          acknowledge: back,
        }}
        menu={
          <BuildingMenu
            options={[{ label: 'Leave', value: 'Leave' }]}
            onSelect={() => back()}
            onCancel={() => back()}
          />
        }
      />
    );
  }

  if (buildingId === '1') {
    return <Market />;
  }

  if (buildingId === '2') {
    return <Pub />;
  }

  if (buildingId === '3') {
    return <Shipyard />;
  }

  if (buildingId === '4') {
    return <Harbor />;
  }

  if (buildingId === '5') {
    return <Lodge />;
  }

  if (buildingId === '6') {
    return <Palace />;
  }

  if (buildingId === '7') {
    return <Guild />;
  }

  if (buildingId === '8') {
    return <Mansion />;
  }

  if (buildingId === '9') {
    return <Bank />;
  }

  if (buildingId === '10') {
    return <ItemShop />;
  }

  if (buildingId === '11') {
    return <Church />;
  }

  if (buildingId === '12') {
    return <FortuneTeller />;
  }

  const menu = (
    <BuildingMenu
      options={options.map((option) => ({
        label: option,
        value: option,
        disabled: option !== 'Sail',
      }))}
      onSelect={() => {}}
      onCancel={back}
    />
  );

  return (
    <BuildingWrapper
      buildingId={buildingId}
      vendorMessageBox={{
        body: 'This feature is not implemented yet. Press ESC to exit this building.',
      }}
      menu={menu}
    />
  );
}
