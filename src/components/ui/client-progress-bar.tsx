'use client';

import dynamic from 'next/dynamic';

// Dynamically import the original progress bar, ensuring it only runs on the client
const ProgressBar = dynamic(
    () => import('@/components/ui/progress-bar').then((mod) => mod.ProgressBar),
    { ssr: false }
);

// This is the new component that will be safely used in the main layout
export default function ClientProgressBar() {
    return <ProgressBar />;
}
