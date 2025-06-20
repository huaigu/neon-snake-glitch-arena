
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAccount, useConnect, useDisconnect, useSignMessage } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { checkUserHasNFT } from '../utils/nftUtils';

interface Web3User {
  id: string;
  address: string;
  username?: string;
  nonce: string;
  created_at: string;
  last_login?: string;
  isGuest?: boolean;
  hasNFT?: boolean;
}

interface Web3AuthContextType {
  user: Web3User | null;
  isConnecting: boolean;
  signInWithEthereum: () => Promise<void>;
  signInAsGuest: () => Promise<void>;
  signOut: () => void;
  isAuthenticated: boolean;
}

const Web3AuthContext = createContext<Web3AuthContextType | undefined>(undefined);

export const useWeb3Auth = () => {
  const context = useContext(Web3AuthContext);
  if (!context) {
    throw new Error('useWeb3Auth must be used within a Web3AuthProvider');
  }
  return context;
};

interface Web3AuthProviderProps {
  children: ReactNode;
}

export const Web3AuthProvider: React.FC<Web3AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<Web3User | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  
  // Wagmi hooks
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { signMessage } = useSignMessage();

  useEffect(() => {
    // Check if user is already logged in
    const savedUser = localStorage.getItem('web3_user');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      console.log('Web3Auth: Restored user from localStorage:', {
        address: parsedUser.address,
        hasNFT: parsedUser.hasNFT,
        isGuest: parsedUser.isGuest
      });
      setUser(parsedUser);
    }
  }, []);

  // 当wagmi连接状态变化时，同步用户状态
  useEffect(() => {
    if (isConnected && address) {
      // 如果wagmi已连接但本地没有用户，创建用户记录
      const existingUser = localStorage.getItem('web3_user');
      if (existingUser) {
        const parsedUser = JSON.parse(existingUser);
        if (parsedUser.address === address && !parsedUser.isGuest) {
          setUser(parsedUser);
        }
      }
    } else if (!isConnected) {
      // 如果钱包断开连接，清除非游客用户
      const currentUser = localStorage.getItem('web3_user');
      if (currentUser) {
        const parsedUser = JSON.parse(currentUser);
        if (!parsedUser.isGuest) {
          setUser(null);
          localStorage.removeItem('web3_user');
        }
      }
    }
  }, [isConnected, address]);

  const generateNonce = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  };

  const generateGuestId = () => {
    return 'guest_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
  };

  const signInWithEthereum = async () => {
    setIsConnecting(true);
    try {
      // 如果还没有连接钱包，先连接
      if (!isConnected) {
        const connector = connectors.find(c => c.id === 'injected') || connectors[0];
        await connect({ connector });
        // 等待连接完成
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      if (!address) {
        throw new Error('No address available after connection');
      }

      // Generate a nonce for this session
      const nonce = generateNonce();
      
      // Create message to sign
      const message = `Sign this message to authenticate with Cyber Snake Arena.\n\nNonce: ${nonce}\nAddress: ${address}`;

      // Sign the message using wagmi
      const signMessageResult = await new Promise<string>((resolve, reject) => {
        signMessage(
          { message, account: address as `0x${string}` },
          {
            onSuccess: (signature) => resolve(signature),
            onError: (error) => reject(error),
          }
        );
      });

      // 检测用户是否持有NFT
      const hasNFT = await checkUserHasNFT(address);
      console.log('Web3Auth: NFT detection result for', address, ':', hasNFT);

      // Create user record for local storage
      const userRecord: Web3User = {
        id: address,
        address,
        username: `${address.slice(0, 6)}...${address.slice(-4)}`,
        nonce,
        created_at: new Date().toISOString(),
        last_login: new Date().toISOString(),
        isGuest: false,
        hasNFT
      };

      // Set user as authenticated
      setUser(userRecord);
      localStorage.setItem('web3_user', JSON.stringify(userRecord));
    } catch (error) {
      console.error('Authentication failed:', error);
      alert('Authentication failed. Please try again.');
    } finally {
      setIsConnecting(false);
    }
  };

  const signInAsGuest = async () => {
    setIsConnecting(true);
    try {
      // Generate a unique guest ID
      const guestId = generateGuestId();
      const nonce = generateNonce();
      
      // Create guest user record
      const guestRecord: Web3User = {
        id: guestId,
        address: guestId,
        username: `Guest_${guestId.slice(-6)}`,
        nonce,
        created_at: new Date().toISOString(),
        last_login: new Date().toISOString(),
        isGuest: true,
        hasNFT: false // 游客用户默认没有NFT
      };

      // Set user as authenticated
      setUser(guestRecord);
      localStorage.setItem('web3_user', JSON.stringify(guestRecord));
    } catch (error) {
      console.error('Guest authentication failed:', error);
      alert('Guest authentication failed. Please try again.');
    } finally {
      setIsConnecting(false);
    }
  };

  const signOut = () => {
    // 断开钱包连接
    if (isConnected && !user?.isGuest) {
      disconnect();
    }
    setUser(null);
    localStorage.removeItem('web3_user');
  };

  return (
    <Web3AuthContext.Provider value={{
      user,
      isConnecting,
      signInWithEthereum,
      signInAsGuest,
      signOut,
      isAuthenticated: !!user
    }}>
      {children}
    </Web3AuthContext.Provider>
  );
};
