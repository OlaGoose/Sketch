'use client';

import { KeyIcon } from '@heroicons/react/24/outline';

export function AccessRequiredView() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-loft-yellow text-loft-black p-8 text-center font-sans">
      <div className="bg-white border-4 border-loft-black p-12 shadow-loft max-w-md w-full">
        <KeyIcon className="h-16 w-16 mx-auto mb-6 text-loft-black" />
        <h1 className="text-3xl font-black mb-4">ACCESS REQUIRED</h1>
        <p className="mb-8 font-medium">
          To create cinematic masterpieces with Gemini, set a valid Google
          Gemini API key in your environment (.env.local):
          NEXT_PUBLIC_GEMINI_API_KEY=your_key
        </p>
        <a
          href="/"
          className="block w-full bg-black text-white px-8 py-4 font-black text-xl hover:translate-x-1 hover:translate-y-1 hover:shadow-none shadow-loft-sm transition-all border-2 border-transparent text-center"
        >
          GO BACK
        </a>
      </div>
    </div>
  );
}
