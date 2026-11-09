import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import { signIn, signOut } from '@/services/chiroAuth';

export default function ChiroSignIn() {
  const { authError } = useAuth();
  const [error, setError] = useState('');

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-5">
      <section className="w-full max-w-md rounded-xl bg-white p-8 shadow border">
        <div className="text-center mb-8">
          <img
            src="/logo-chiro-192.png"
            alt="Chiro City Administration"
            className="mx-auto h-20 w-20 rounded-full object-cover mb-4"
          />
          <h1 className="text-3xl font-bold mb-2">Chiro City</h1>
          <p className="text-slate-600">Trade and Business Management</p>
        </div>
        <h2 className="text-xl font-semibold mb-3">Sign in</h2>
        <p className="mb-6">Use your Chiro Auth account to access CCTBM.</p>
        {(error || authError) && (
          <p role="alert" className="text-red-600 mb-4">
            {error || authError}
          </p>
        )}
        <button
          className="w-full bg-blue-700 text-white rounded-lg p-3"
          onClick={() => signIn().catch((e) => setError(e.message))}
        >
          Sign in with Chiro Auth
        </button>
        <button
          className="w-full border rounded-lg p-3 mt-3"
          onClick={() => signOut().catch((e) => setError(e.message))}
        >
          Sign out / switch account
        </button>
        <p className="mt-6 text-sm text-slate-600">
          Your administrator must grant access to CCTBM.
        </p>
      </section>
    </main>
  );
}
