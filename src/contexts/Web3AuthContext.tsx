
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ethers } from 'ethers';

interface Web3User {
  id: string;
  address: string;
  username?: string;
  nonce: string;
  created_at: string;
  last_login?: string;
}

interface Web3AuthContextType {
  user: Web3User | null;
  isConnecting: boolean;
  signInWithEthereum: () => Promise<void>;
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

  useEffect(() => {
    // Check if user is already logged in
    const savedUser = localStorage.getItem('web3_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const generateNonce = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  };

  const signInWithEthereum = async () => {
    if (!window.ethereum) {
      alert('Please install MetaMask to continue');
      return;
    }

    setIsConnecting(true);
    try {
      // Request account access
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();

      // Generate a nonce for this session
      const nonce = generateNonce();
      
      // Create message to sign
      const message = `Sign this message to authenticate with Cyber Snake Arena.\n\nNonce: ${nonce}\nAddress: ${address}`;

      // Sign the message
      const signature = await signer.signMessage(message);

      // Verify signature (simplified verification)
      const recoveredAddress = ethers.verifyMessage(message, signature);
      if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
        throw new Error('Signature verification failed');
      }

      // Create user record for local storage
      const userRecord: Web3User = {
        id: address,
        address,
        username: `${address.slice(0, 6)}...${address.slice(-4)}`,
        nonce,
        created_at: new Date().toISOString(),
        last_login: new Date().toISOString()
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

  const signOut = () => {
    setUser(null);
    localStorage.removeItem('web3_user');
  };

  return (
    <Web3AuthContext.Provider value={{
      user,
      isConnecting,
      signInWithEthereum,
      signOut,
      isAuthenticated: !!user
    }}>
      {children}
    </Web3AuthContext.Provider>
  );
};
