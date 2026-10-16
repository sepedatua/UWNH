import Assets from '../../assets';
import { classNames } from '../interfaceUtils';
import MessageBox from '../common/MessageBox';
import { CharacterMessageBoxType } from '../quest/getMessageBoxes';
import characterData from '../../data/characterData';
import getSailor from '../../data/sailorData';
import Confirm from '../common/Confirm';

export type Position = 1 | 2;

interface Props {
  messageBox: CharacterMessageBoxType;
  position: Position;
}

const positionClassMap: { [key in Position]: string } = {
  1: 'absolute top-4 left-[304px]',
  2: 'absolute top-[320px] ml-[416px]',
};

export default function CharacterMessageBox({ messageBox, position }: Props) {
  if (messageBox === null) {
    return null;
  }

  const { body, characterId, acknowledge, confirm } = messageBox;

  const { name, color = 'text-black' } =
    characterData[characterId] || getSailor(characterId);

  return (
    <div
      className={positionClassMap[position]}
      data-test={`characterMessageBox${position}`}
    >
      <MessageBox>
        <div className="flex w-[592px] min-h-[256px] h-auto text-2xl p-4">
          <img
            src={Assets.characters(characterId)}
            className="w-32 h-40 shrink-0"
            alt=""
          />
          <div className="flex-1 flex flex-col justify-between text-2xl pl-4">
            <div>
              <div className={classNames('text-base mb-2', color)}>{name}</div>
              <div className="leading-relaxed">{body}</div>
            </div>
            {acknowledge && (
              <img
                src={Assets.images('dialogCaretDown').toDataURL()}
                alt=""
                className="w-8 h-8 animate-ping mx-auto mt-4"
              />
            )}
            {confirm && (
              <div className="flex justify-end mt-2">
                <Confirm onYes={confirm.yes} onNo={confirm.no} isInline />
              </div>
            )}
          </div>
        </div>
      </MessageBox>
    </div>
  );
}
