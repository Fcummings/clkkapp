import React from 'react';

interface BalanceProps {
  balance: number;
}

const Balance: React.FC<BalanceProps> = ({ balance }) => {
  return (
    <div className="text-center my-8">
      <h2 className="text-3xl font-bold">${balance.toFixed(2)}</h2>
      <p className="text-gray-400">Current Balance</p>
    </div>
  );
};

export default Balance;