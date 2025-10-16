
'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';

const Ready = () => {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/dashboard');
    }, 3000); // Redirect after 3 seconds

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="text-center">
      <h2 className="text-2xl font-bold">Setup Complete!</h2>
      <p>Redirecting you to the dashboard...</p>
    </div>
  );
};

export default Ready;
