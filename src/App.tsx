import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';
import { DollarSign, Clock, UserCircle, Menu } from 'lucide-react';
import Header from './components/Header';
import Balance from './components/Balance';
import Actions from './components/Actions';
import TransactionHistory from './components/TransactionHistory';
import Profile from './components/Profile';
import Settings from './components/Settings';
import SignIn from './components/SignIn';

function App() {
  const [balance, setBalance] = useState(0);
  const [activeSection, setActiveSection] = useState('home');
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      const unsubscribe = onSnapshot(doc(db, 'users', user.uid), (doc) => {
        if (doc.exists()) {
          setBalance(doc.data().balance || 0);
        }
      });
      return () => unsubscribe();
    }
  }, [user]);

  const handleSendMoney = async (amount: number, recipientEmail: string) => {
    if (user && amount <= balance) {
      try {
        const recipientQuery = await db.collection('users').where('email', '==', recipientEmail).get();
        if (recipientQuery.empty) {
          throw new Error('Recipient not found.');
        }
        const recipientDoc = recipientQuery.docs[0];

        await db.runTransaction(async (transaction) => {
          // Update sender's balance
          transaction.update(doc(db, 'users', user.uid), {
            balance: balance - amount
          });

          // Update recipient's balance
          transaction.update(recipientDoc.ref, {
            balance: recipientDoc.data().balance + amount
          });

          // Create transaction records
          const transactionData = {
            amount,
            timestamp: serverTimestamp(),
          };

          transaction.set(doc(db, 'transactions', Date.now().toString()), {
            ...transactionData,
            type: 'send',
            userId: user.uid,
            recipientEmail,
          });

          transaction.set(doc(db, 'transactions', (Date.now() + 1).toString()), {
            ...transactionData,
            type: 'receive',
            userId: recipientDoc.id,
            senderEmail: user.email,
          });
        });

        console.log('Money sent successfully');
      } catch (error) {
        console.error('Error sending money:', error);
      }
    }
  };

  const handleRequestMoney = async (amount: number, fromEmail: string) => {
    if (user) {
      try {
        const fromUserQuery = await db.collection('users').where('email', '==', fromEmail).get();
        if (fromUserQuery.empty) {
          throw new Error('User to request money from not found.');
        }
        const fromUserDoc = fromUserQuery.docs[0];

        const requestData = {
          amount,
          requesterId: user.uid,
          requesterEmail: user.email,
          fromEmail,
          fromUserId: fromUserDoc.id,
          status: 'pending',
          timestamp: serverTimestamp(),
        };

        await setDoc(doc(db, 'moneyRequests', Date.now().toString()), requestData);

        console.log('Money request sent successfully');
      } catch (error) {
        console.error('Error requesting money:', error);
      }
    }
  };

  const renderActiveSection = () => {
    if (!user) return null;
    
    switch (activeSection) {
      case 'home':
        return (
          <>
            <Balance balance={balance} />
            <Actions onSend={handleSendMoney} onRequest={handleRequestMoney} currentUserEmail={user.email} />
            <TransactionHistory userId={user.uid} />
          </>
        );
      case 'activity':
        return <TransactionHistory userId={user.uid} />;
      case 'profile':
        return <Profile />;
      case 'settings':
        return <Settings />;
      default:
        return null;
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Router>
      <div className="min-h-screen bg-black text-white flex flex-col">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8">
          <Routes>
            <Route path="/signin" element={<SignIn />} />
            <Route
              path="/"
              element={
                user ? (
                  renderActiveSection()
                ) : (
                  <Navigate to="/signin" replace />
                )
              }
            />
          </Routes>
        </main>
        {user && (
          <nav className="bg-gray-900 p-4">
            <ul className="flex justify-around">
              <li>
                <button onClick={() => setActiveSection('home')} className={`p-2 rounded ${activeSection === 'home' ? 'bg-primary' : ''}`}>
                  <DollarSign />
                </button>
              </li>
              <li>
                <button onClick={() => setActiveSection('activity')} className={`p-2 rounded ${activeSection === 'activity' ? 'bg-primary' : ''}`}>
                  <Clock />
                </button>
              </li>
              <li>
                <button onClick={() => setActiveSection('profile')} className={`p-2 rounded ${activeSection === 'profile' ? 'bg-primary' : ''}`}>
                  <UserCircle />
                </button>
              </li>
              <li>
                <button onClick={() => setActiveSection('settings')} className={`p-2 rounded ${activeSection === 'settings' ? 'bg-primary' : ''}`}>
                  <Menu />
                </button>
              </li>
            </ul>
          </nav>
        )}
      </div>
    </Router>
  );
}

export default App;