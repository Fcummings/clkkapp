import React, { useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

const Profile: React.FC = () => {
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      if (auth.currentUser) {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (userDoc.exists()) {
          setUserData(userDoc.data());
        }
      }
    };

    fetchUserData();
  }, []);

  if (!userData) {
    return <div>Loading...</div>;
  }

  return (
    <div className="text-center">
      <h2 className="text-2xl font-bold mb-4">User Profile</h2>
      <div className="bg-gray-800 p-4 rounded">
        <p className="mb-2"><strong>Name:</strong> {userData.firstName} {userData.lastName}</p>
        <p className="mb-2"><strong>Email:</strong> {userData.email}</p>
        <p><strong>Member Since:</strong> {new Date(userData.memberSince).toLocaleDateString()}</p>
      </div>
    </div>
  );
};

export default Profile;