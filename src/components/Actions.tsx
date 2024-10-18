import React, { useState, useEffect, useRef } from 'react';
import { Send, DollarSign } from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

interface ActionsProps {
  onSend: (amount: number, recipientEmail: string) => void;
  onRequest: (amount: number, fromEmail: string) => void;
  currentUserEmail: string;
}

interface User {
  id: string;
  email: string;
}

const Actions: React.FC<ActionsProps> = ({ onSend, onRequest, currentUserEmail }) => {
  const [amount, setAmount] = useState('');
  const [email, setEmail] = useState('');
  const [actionType, setActionType] = useState<'send' | 'request'>('send');
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      const usersCollection = collection(db, 'users');
      const usersSnapshot = await getDocs(usersCollection);
      const usersList = usersSnapshot.docs
        .map(doc => ({ id: doc.id, email: doc.data().email }))
        .filter(user => user.email !== currentUserEmail);
      setUsers(usersList);
    };

    fetchUsers();
  }, [currentUserEmail]);

  useEffect(() => {
    if (email.length > 0) {
      const filtered = users.filter(user => 
        user.email.toLowerCase().includes(email.toLowerCase())
      );
      setFilteredUsers(filtered);
      setShowDropdown(true);
    } else {
      setFilteredUsers([]);
      setShowDropdown(false);
    }
  }, [email, users]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleAction = () => {
    const numAmount = parseFloat(amount);
    if (!isNaN(numAmount) && numAmount > 0 && email && email !== currentUserEmail) {
      if (actionType === 'send') {
        onSend(numAmount, email);
      } else {
        onRequest(numAmount, email);
      }
      setAmount('');
      setEmail('');
    }
  };

  const handleSelectUser = (selectedEmail: string) => {
    setEmail(selectedEmail);
    setShowDropdown(false);
  };

  return (
    <div className="my-8">
      <div className="flex flex-col mb-4">
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Enter amount"
          className="p-2 rounded text-black mb-2"
        />
        <div className="relative">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={actionType === 'send' ? "Recipient's email" : "From email"}
            className="w-full p-2 rounded text-black"
          />
          {showDropdown && filteredUsers.length > 0 && (
            <ul ref={dropdownRef} className="absolute z-10 w-full bg-gray-700 border border-gray-600 rounded mt-1 max-h-40 overflow-y-auto">
              {filteredUsers.map((user) => (
                <li
                  key={user.id}
                  className="p-2 hover:bg-gray-600 cursor-pointer text-white"
                  onClick={() => handleSelectUser(user.email)}
                >
                  {user.email}
                </li>
              ))}
            </ul>
          )}
        </div>
        <button
          onClick={handleAction}
          className="bg-primary hover-bg-primary p-2 rounded flex items-center justify-center mt-2"
          disabled={!email || email === currentUserEmail}
        >
          {actionType === 'send' ? <Send size={20} className="mr-2" /> : <DollarSign size={20} className="mr-2" />}
          {actionType === 'send' ? 'Send' : 'Request'}
        </button>
      </div>
      <button
        onClick={() => setActionType(actionType === 'send' ? 'request' : 'send')}
        className="w-full bg-primary hover-bg-primary p-2 rounded flex items-center justify-center"
      >
        {actionType === 'send' ? 'Switch to Request' : 'Switch to Send'}
      </button>
    </div>
  );
};

export default Actions;