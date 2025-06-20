import * as Multisynq from '@multisynq/client';

export class PlayerModel extends Multisynq.Model {
  viewId!: string;
  name!: string;
  address!: string;
  currentRoomId!: string | null;
  isReady!: boolean;
  hasNFT!: boolean;

  init(payload: { viewId: string; name: string; address: string; hasNFT?: boolean }) {
    console.log('PlayerModel: Initializing player:', payload);
    
    this.viewId = payload.viewId;
    this.name = payload.name;
    this.address = payload.address;
    this.currentRoomId = null;
    this.isReady = false;
    this.hasNFT = payload.hasNFT || false;
  }

  getState() {
    return {
      viewId: this.viewId,
      name: this.name,
      address: this.address,
      currentRoomId: this.currentRoomId,
      isReady: this.isReady,
      hasNFT: this.hasNFT
    };
  }

  // 设置NFT状态的方法
  setNFTStatus(hasNFT: boolean) {
    console.log('PlayerModel: Setting NFT status for', this.viewId, ':', hasNFT);
    this.hasNFT = hasNFT;
  }
}

PlayerModel.register("PlayerModel");
