
import { Multisynq } from '@multisynq/client';

export class PlayerModel extends Multisynq.Model {
  viewId!: string;
  name!: string;
  address!: string;
  currentRoomId!: string | null;
  isReady!: boolean;

  init(payload: { viewId: string; name: string; address: string }) {
    console.log('PlayerModel: Initializing player:', payload);
    
    this.viewId = payload.viewId;
    this.name = payload.name;
    this.address = payload.address;
    this.currentRoomId = null;
    this.isReady = false;
  }

  getState() {
    return {
      viewId: this.viewId,
      name: this.name,
      address: this.address,
      currentRoomId: this.currentRoomId,
      isReady: this.isReady
    };
  }
}

PlayerModel.register("PlayerModel");
