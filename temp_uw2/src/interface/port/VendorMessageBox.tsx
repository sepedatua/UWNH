import MessageBox from '../common/MessageBox';
import Assets from '../../assets';
import { VendorMessageBoxType } from '../quest/getMessageBoxes';
import Confirm from '../common/Confirm';

interface Props {
  buildingId: string;
  messageBox: VendorMessageBoxType;
}

export default function VendorMessageBox({ buildingId, messageBox }: Props) {
  return (
    <div className="flex" data-test="vendorMessageBox">
      <div className="p-4 pr-0">
        <img src={Assets.buildings(buildingId)} alt="" className="w-[272px]" />
      </div>
      <div className={messageBox !== null ? '' : 'invisible'}>
        <MessageBox>
          <div className="w-[448px] min-h-[224px] h-auto text-2xl px-4 py-2 flex flex-col justify-between">
            {messageBox !== null && (
              <>
                <div className="leading-relaxed">{messageBox.body}</div>
                {messageBox.acknowledge && (
                  <img
                    src={Assets.images('dialogCaretDown').toDataURL()}
                    alt=""
                    className="w-8 h-8 animate-ping mx-auto mt-4"
                  />
                )}
                {messageBox.confirm && (
                  <div className="flex justify-end mt-2">
                    <Confirm
                      onYes={messageBox.confirm.yes}
                      onNo={messageBox.confirm.no}
                      isInline
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </MessageBox>
      </div>
    </div>
  );
}
