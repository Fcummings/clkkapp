import React, { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { setDoc, doc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useNavigate } from 'react-router-dom';

const SignIn: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (isSignUp) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await sendEmailVerification(userCredential.user);
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          firstName,
          lastName,
          email,
          memberSince: new Date().toISOString()
        });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      navigate('/');
    } catch (error) {
      setError(isSignUp ? 'Failed to create an account. Please try again.' : 'Failed to sign in. Please check your credentials.');
      console.error(error);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-8">
      <h2 className="text-2xl font-bold mb-4">{isSignUp ? 'Sign Up' : 'Sign In'}</h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        {isSignUp && (
          <>
            <input
              type="text"
              placeholder="First Name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required={isSignUp}
              className="w-full p-2 rounded bg-gray-800"
            />
            <input
              type="text"
              placeholder="Last Name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required={isSignUp}
              className="w-full p-2 rounded bg-gray-800"
            />
          </>
        )}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full p-2 rounded bg-gray-800"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full p-2 rounded bg-gray-800"
        />
        <button type="submit" className="w-full bg-primary hover-bg-primary p-2 rounded">
          {isSignUp ? 'Sign Up' : 'Sign In'}
        </button>
      </form>
      <p className="mt-4 text-center">
        {isSignUp ? 'Already have an account?' : "Don't have an account?"}
        <button
          onClick={() => setIsSignUp(!isSignUp)}
          className="ml-2 text-primary hover:underline"
        >
          {isSignUp ? 'Sign In' : 'Sign Up'}
        </button>
      </p>
    </div>
  );
};

export default SignIn;