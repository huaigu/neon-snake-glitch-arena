
import * as Multisynq from '@multisynq/client';

interface Position {
  x: number;
  y: number;
}

export class SnakeModel extends Multisynq.Model {
  viewId!: string;
  name!: string;
  body!: Position[];
  direction!: Position;
  nextDirection!: Position;
  isAlive!: boolean;
  score!: number;
  color!: string;
  isSpectator!: boolean;
  boardSize!: number;
  initialPosition!: Position;
  hasNFT!: boolean;

  init(payload: {
    viewId: string;
    name: string;
    startPosition: Position;
    color: string;
    boardSize: number;
    hasNFT?: boolean;
  }) {
    console.log('SnakeModel: Initializing snake:', payload);
    
    this.viewId = payload.viewId;
    this.name = payload.name;
    this.color = payload.color;
    this.boardSize = payload.boardSize;
    this.initialPosition = payload.startPosition;
    this.isSpectator = false;
    this.hasNFT = payload.hasNFT || false;
    
    this.reset();
  }

  reset() {
    console.log('SnakeModel: Resetting snake:', this.viewId, 'to position:', this.initialPosition);
    
    // Reset to initial state - 创建3段身体，向下延伸（这样头部向上移动时不会立即碰撞）
    this.body = [
      { ...this.initialPosition },                                    // 头部
      { x: this.initialPosition.x, y: this.initialPosition.y + 1 },   // 身体1
      { x: this.initialPosition.x, y: this.initialPosition.y + 2 }    // 尾部
    ];
    
    this.direction = { x: 0, y: -1 }; // Start moving up (远离身体方向)
    this.nextDirection = { x: 0, y: -1 };
    this.isAlive = true;
    this.score = 0;
    this.isSpectator = false;
    
    console.log('SnakeModel: Snake reset with 3-segment body:', this.body);
  }

  changeDirection(newDirection: Position) {
    // Prevent 180-degree turns
    const currentDir = this.direction;
    const oppositeDirection = {
      x: -currentDir.x,
      y: -currentDir.y
    };
    
    if (newDirection.x !== oppositeDirection.x || newDirection.y !== oppositeDirection.y) {
      this.nextDirection = { ...newDirection };
      console.log('SnakeModel: Direction changed to:', newDirection);
    }
  }

  move() {
    if (!this.isAlive || this.isSpectator) return;
    
    // Update direction from queued direction
    this.direction = { ...this.nextDirection };
    
    // Calculate new head position
    const head = this.body[0];
    const newHead: Position = {
      x: head.x + this.direction.x,
      y: head.y + this.direction.y
    };
    
    // Add new head
    this.body.unshift(newHead);
    
    // Remove tail (will be added back if growing)
    this.body.pop();
    
    console.log('SnakeModel: Snake moved, new head at:', newHead);
  }

  grow() {
    if (!this.isAlive) return;
    
    // Add a segment at the tail
    const tail = this.body[this.body.length - 1];
    const secondToLast = this.body[this.body.length - 2];
    
    // Calculate tail direction
    const tailDirection = {
      x: tail.x - secondToLast.x,
      y: tail.y - secondToLast.y
    };
    
    // Add new segment behind the tail
    const newSegment: Position = {
      x: tail.x + tailDirection.x,
      y: tail.y + tailDirection.y
    };
    
    this.body.push(newSegment);
    
    console.log('SnakeModel: Snake grew, new length:', this.body.length);
  }

  die() {
    console.log('SnakeModel: Snake died:', this.viewId);
    this.isAlive = false;
  }

  getState() {
    return {
      viewId: this.viewId,
      name: this.name,
      body: this.body,
      direction: this.direction,
      isAlive: this.isAlive,
      score: this.score,
      color: this.color,
      isSpectator: this.isSpectator,
      hasNFT: this.hasNFT
    };
  }

  // 设置NFT状态的方法
  setNFTStatus(hasNFT: boolean) {
    console.log('SnakeModel: Setting NFT status for', this.viewId, ':', hasNFT);
    this.hasNFT = hasNFT;
  }
}

SnakeModel.register("SnakeModel");
