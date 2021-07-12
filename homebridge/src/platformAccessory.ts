import { Service, PlatformAccessory, CharacteristicValue, CharacteristicSetCallback } from 'homebridge';
import { WebSocket } from '@oznu/ws-connect';
import { resolve4 } from 'mdns-resolver';

import { HomebridgeEsp8266AcTogglePlatform } from './platform';

interface StatusPayload {
  Active: boolean;
}

export class HomebridgeEsp8266AcToggleAccessory {
  private service: Service;
  private socket: WebSocket;

  constructor(
    private readonly platform: HomebridgeEsp8266AcTogglePlatform,
    private readonly accessory: PlatformAccessory,
    private readonly config: { host: string; port: number; name: string; serial: string },
  ) {

    this.socket = new WebSocket('', {
      options: {
        handshakeTimeout: 10000,
      },
      beforeConnect: async () => {
        try {
          const hostIp = await resolve4(this.config.host);
          const socketAddress = `ws://${this.platform.config.username}:${this.platform.config.password}@${hostIp}:${this.config.port}`;
          this.socket.setAddresss(socketAddress);
        } catch (e) {
          this.platform.log.warn(e.message);
        }
      },
    });

    this.socket.on('websocket-status', (msg) => {
      this.platform.log.info(msg);
    });

    this.socket.on('json', this.parseStatus.bind(this));

    // set accessory information
    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Name, 'AC Toggle')
      .setCharacteristic(this.platform.Characteristic.Manufacturer, 'oznu-platform')
      .setCharacteristic(this.platform.Characteristic.Model, 'ac-toggle')
      .setCharacteristic(this.platform.Characteristic.SerialNumber, this.config.serial);

    // create service
    this.service = this.accessory.getService(this.platform.Service.Fanv2) || this.accessory.addService(this.platform.Service.Fanv2);

    this.service.getCharacteristic(this.platform.Characteristic.Active)
      .on('set', this.setActiveState.bind(this));
  }

  // parse events from the ac toggle controller
  parseStatus(payload: StatusPayload) {
    this.platform.log.debug(JSON.stringify(payload));

    // update the current state
    if (payload.Active !== undefined) {
      this.service.updateCharacteristic(this.platform.Characteristic.Active, payload.Active);
    }
  }

  setActiveState(value: CharacteristicValue, callback: CharacteristicSetCallback) {
    if (!this.socket.isConnected()) {
      this.platform.log.error(`AC Toggle Not Connected - ${this.config.host}`);
      return callback(new Error('AC Toggle Not Connected'));
    }

    callback();

    const active = value ? true : false;

    this.platform.log.info(`Sending "${active}" to AC Toggle.`);

    this.socket.sendJson({
      Active: active,
      contactTime: this.platform.config.contactTime || 1000,
    });
  }

}
