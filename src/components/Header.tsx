import React from 'react';
import { DollarSign } from 'lucide-react';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

const Header: React.FC = () => {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate('/signin');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <header className="bg-primary p-4 flex justify-between items-center">
      <DollarSign size={32} />
      <h1 className="text-2xl font-bold">CLKK APP</h1>
      {auth.currentUser ? (
        <button onClick={handleSignOut} className="text-sm">Sign Out</button>
      ) : (
        <button onClick={() => navigate('/signin')} className="text-sm">Sign In</button>
      )}
    </header>
  );
};

export default Header;