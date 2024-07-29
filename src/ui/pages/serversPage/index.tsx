import './style.less';
import { observer } from 'mobx-react-lite';
import { Store } from '../../../store';
import {
  ConnectionInfoPacket,
  ConnectionInfoRequestPacket,
  ServerListResponsePacket,
} from '../../../../common/packets/ConnectServerPackets';
import { useEventBus } from '../../../hooks/useEventBus';
import { CS_HOST } from '../../../consts';

export const ServersPage = observer(() => {
  const hasAnyServer = Store.serverList.length > 0;

  const onConnectClick = async (serverId: number) => {
    const packet = ConnectionInfoRequestPacket.createPacket();
    packet.ServerId = serverId;

    Store.sendToCS(packet.buffer);
  };

  useEventBus('ServerListResponse', bytes => {
    const p = new ServerListResponsePacket(bytes);
    const servers = p.getServers(p.ServerCount);
    Store.serverList = servers;
  });

  useEventBus('ConnectionInfo', async bytes => {
    const p = new ConnectionInfoPacket(bytes);
    const address = Store.config.csIp ?? CS_HOST; //use local host

    console.log(`connection info: ${address}:${p.Port}`);

    await Store.connectToGameServer(address, p.Port);
  });

  return (
    <div className="servers-page">
      {!hasAnyServer ? (
        <span>Loading...</span>
      ) : (
        <div className="list">
          {Store.serverList.map(s => {
            return (
              <div key={s.ServerId}>
                <button onClick={() => onConnectClick(s.ServerId)}>
                  Server {s.ServerId}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});
