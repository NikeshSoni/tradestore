'use client';
import { SignIn } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";

function SignInWithAlert() {
  const searchParams = useSearchParams();
  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {
    const message = searchParams.get('message');
    if (message === 'noaccount') {
      setShowAlert(true);
      // Auto-hide alert after 5 seconds
      const timer = setTimeout(() => {
        setShowAlert(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      {showAlert && (
        <div className="mb-4 p-4 bg-yellow-500/20 border border-yellow-500 rounded-lg text-yellow-400 max-w-md w-full text-center">
          <p className="font-medium">You don't have account, please sign up first</p>
        </div>
      )}
      <SignIn />
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <SignInWithAlert />
    </Suspense>
  );
}
