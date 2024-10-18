import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db, functions } from '../firebase';
import { httpsCallable } from 'firebase/functions';

interface Transaction {
  id: string;
  type: 'send' | 'receive' | 'request';
  amount: number;
  recipientEmail?: string;
  senderEmail?: string;
  fromEmail?: string;
  status?: string;
  timestamp: any;
}

interface TransactionHistoryProps {
  userId: string;
}

const TransactionHistory: React.FC<TransactionHistoryProps> = ({ userId }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Transaction[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    const fetchTransactionsAndRequests = () => {
      const transactionsQuery = query(
        collection(db, 'transactions'),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(20)
      );

      const requestsQuery = query(
        collection(db, 'moneyRequests'),
        where('fromUserId', '==', userId),
        where('status', '==', 'pending'),
        orderBy('timestamp', 'desc')
      );

      const unsubscribeTransactions = onSnapshot(transactionsQuery, (querySnapshot) => {
        const transactionsData: Transaction[] = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Transaction));
        setTransactions(transactionsData);
      }, (error) => {
        console.error("Error fetching transactions:", error);
        setError("Error fetching transactions. Please try again later.");
      });

      const unsubscribePendingRequests = onSnapshot(requestsQuery, (querySnapshot) => {
        const pendingRequestsData: Transaction[] = querySnapshot.docs.map(doc => ({
          id: doc.id,
          type: 'request',
          amount: doc.data().amount,
          fromEmail: doc.data().requesterEmail,
          status: 'pending',
          timestamp: doc.data().timestamp,
        }));
        setPendingRequests(pendingRequestsData);
      }, (error) => {
        console.error("Error fetching pending requests:", error);
        // Don't set error state here to avoid blocking the UI
      });

      return () => {
        unsubscribeTransactions();
        unsubscribePendingRequests();
      };
    };

    fetchTransactionsAndRequests();
  }, [userId]);

  const handleRequestAction = async (requestId: string, action: 'approve' | 'reject') => {
    try {
      const handleMoneyRequest = httpsCallable(functions, 'handleMoneyRequest');
      await handleMoneyRequest({ requestId, action });
      
      // Remove the request from the pending list
      setPendingRequests(prevRequests => prevRequests.filter(req => req.id !== requestId));
    } catch (error) {
      console.error('Error handling money request:', error);
      setError("Error processing the request. Please try again later.");
    }
  };

  const renderTransactionDetails = (transaction: Transaction) => {
    if (!transaction) return 'Unknown transaction';
    
    switch (transaction.type) {
      case 'send':
        return `Sent to ${transaction.recipientEmail || 'Unknown'}`;
      case 'receive':
        return `Received from ${transaction.senderEmail || 'Unknown'}`;
      case 'request':
        return `Requested from ${transaction.fromEmail || 'Unknown'} (${transaction.status || 'Unknown'})`;
      default:
        return 'Unknown transaction type';
    }
  };

  const getTransactionColor = (transaction: Transaction) => {
    if (!transaction) return 'text-gray-400';
    
    switch (transaction.type) {
      case 'send':
        return 'text-red-500';
      case 'receive':
        return 'text-blue-400';
      case 'request':
        return transaction.status === 'pending' ? 'text-yellow-500' : 'text-green-500';
      default:
        return 'text-gray-400';
    }
  };

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className="mt-8">
      {pendingRequests.length > 0 && (
        <>
          <h3 className="text-xl font-bold mb-4">Pending Money Requests</h3>
          <ul className="space-y-2 mb-8">
            {pendingRequests.map((request) => (
              <li key={request.id} className="bg-gray-800 p-3 rounded flex justify-between items-center">
                <span>{request.fromEmail || 'Unknown'} requested ${request.amount?.toFixed(2) || '0.00'}</span>
                <div>
                  <button
                    onClick={() => handleRequestAction(request.id, 'approve')}
                    className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded mr-2"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleRequestAction(request.id, 'reject')}
                    className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded"
                  >
                    Reject
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      <h3 className="text-xl font-bold mb-4">Transaction History</h3>
      {transactions.length === 0 ? (
        <p>No transactions yet.</p>
      ) : (
        <ul className="space-y-2">
          {transactions.map((transaction) => (
            <li key={transaction.id} className="bg-gray-800 p-3 rounded flex justify-between">
              <span>{renderTransactionDetails(transaction)}</span>
              <span className={getTransactionColor(transaction)}>
                {transaction.type === 'send' ? '-' : transaction.type === 'receive' ? '+' : ''}
                ${transaction.amount?.toFixed(2) || '0.00'}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default TransactionHistory;