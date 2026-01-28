import React from 'react';
import { SignIn } from '@clerk/clerk-react';

export default function Login() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-950">
      <div className="p-8">
        <SignIn />
      </div>
    </div>
  );
}
