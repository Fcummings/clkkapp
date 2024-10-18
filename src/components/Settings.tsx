import React from 'react';

const Settings: React.FC = () => {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Settings</h2>
      <ul className="space-y-2">
        <li className="bg-gray-800 p-3 rounded">
          <button className="w-full text-left">Notification Preferences</button>
        </li>
        <li className="bg-gray-800 p-3 rounded">
          <button className="w-full text-left">Security Settings</button>
        </li>
        <li className="bg-gray-800 p-3 rounded">
          <button className="w-full text-left">Linked Accounts</button>
        </li>
        <li className="bg-gray-800 p-3 rounded">
          <button className="w-full text-left">Add CLKK Bank</button>
        </li>
        <li className="bg-gray-800 p-3 rounded">
          <button className="w-full text-left">Privacy Policy</button>
        </li>
        <li className="bg-gray-800 p-3 rounded">
          <button className="w-full text-left">Terms of Service</button>
        </li>
      </ul>
    </div>
  );
};

export default Settings;