import { readContract, writeContract, waitForTransactionReceipt } from '@wagmi/core';
import { parseEther } from 'viem';
import { config } from '../lib/rainbowkit-config';

// NFT Contract Configuration
const NFT_CONTRACT_ADDRESS = '0xDF49DBA5A46966A02314c7f3cf95D8D6e3719bD5';
const NFT_CONTRACT_ABI = [
  {
    inputs: [{ name: 'owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: '_quantity', type: 'uint256' }],
    name: 'mint',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'remainingSupply',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

/**
 * 检查指定地址是否持有NFT
 * @param userAddress 用户钱包地址
 * @returns Promise<boolean> 是否持有NFT
 */
export async function checkUserHasNFT(userAddress: string): Promise<boolean> {
  try {
    console.log('NFT Utils: Checking NFT balance for address:', userAddress);
    
    // 如果是游客用户，直接返回false
    if (userAddress.startsWith('guest_')) {
      console.log('NFT Utils: Guest user detected, hasNFT = false');
      return false;
    }
    
    // 调用合约的balanceOf方法检查NFT余额
    const balance = await readContract(config, {
      address: NFT_CONTRACT_ADDRESS as `0x${string}`,
      abi: NFT_CONTRACT_ABI,
      functionName: 'balanceOf',
      args: [userAddress as `0x${string}`],
    });
    
    const hasNFT = Number(balance) > 0;
    console.log('NFT Utils: NFT balance check result:', {
      address: userAddress,
      balance: Number(balance),
      hasNFT
    });
    
    return hasNFT;
  } catch (error) {
    console.error('NFT Utils: Error checking NFT balance:', error);
    // 在出错时返回false，避免阻塞游戏流程
    return false;
  }
}

/**
 * 获取用户的NFT余额数量
 * @param userAddress 用户钱包地址
 * @returns Promise<number> NFT数量
 */
export async function getUserNFTBalance(userAddress: string): Promise<number> {
  try {
    if (userAddress.startsWith('guest_')) {
      return 0;
    }
    
    const balance = await readContract(config, {
      address: NFT_CONTRACT_ADDRESS as `0x${string}`,
      abi: NFT_CONTRACT_ABI,
      functionName: 'balanceOf',
      args: [userAddress as `0x${string}`],
    });
    
    return Number(balance);
  } catch (error) {
    console.error('NFT Utils: Error getting NFT balance:', error);
    return 0;
  }
}

/**
 * 获取合约剩余供应量
 * @returns Promise<number> 剩余供应量
 */
export async function getRemainingSupply(): Promise<number> {
  try {
    const remaining = await readContract(config, {
      address: NFT_CONTRACT_ADDRESS as `0x${string}`,
      abi: NFT_CONTRACT_ABI,
      functionName: 'remainingSupply',
    });
    
    return Number(remaining);
  } catch (error) {
    console.error('NFT Utils: Error getting remaining supply:', error);
    return 0;
  }
}

/**
 * Mint NFT
 * @param quantity 要mint的数量
 * @param pricePerNFT 每个NFT的价格（MON）
 * @returns Promise<{ success: boolean; hash?: string; error?: string }>
 */
export async function mintNFT(quantity: number, pricePerNFT: number = 0.1): Promise<{
  success: boolean;
  hash?: string;
  error?: string;
}> {
  try {
    console.log('NFT Utils: Starting mint process:', {
      quantity,
      pricePerNFT,
      totalCost: quantity * pricePerNFT
    });

    // 计算总价格
    const totalPrice = parseEther((quantity * pricePerNFT).toString());
    
    // 调用合约的mint方法
    const hash = await writeContract(config, {
      address: NFT_CONTRACT_ADDRESS as `0x${string}`,
      abi: NFT_CONTRACT_ABI,
      functionName: 'mint',
      args: [BigInt(quantity)],
      value: totalPrice,
    });

    console.log('NFT Utils: Transaction sent, hash:', hash);

    // 等待交易确认
    const receipt = await waitForTransactionReceipt(config, {
      hash,
    });

    console.log('NFT Utils: Transaction confirmed:', {
      hash,
      status: receipt.status,
      blockNumber: receipt.blockNumber
    });

    if (receipt.status === 'success') {
      return {
        success: true,
        hash
      };
    } else {
      return {
        success: false,
        error: 'Transaction failed'
      };
    }

  } catch (error: unknown) {
    console.error('NFT Utils: Error minting NFT:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // 处理用户拒绝交易
    if (errorMessage.includes('User rejected')) {
      return {
        success: false,
        error: 'User rejected the transaction'
      };
    }
    
    // 处理余额不足
    if (errorMessage.includes('insufficient funds')) {
      return {
        success: false,
        error: 'Insufficient funds for transaction'
      };
    }
    
    // 处理其他错误
    return {
      success: false,
      error: errorMessage || 'Unknown error occurred during minting'
    };
  }
} 