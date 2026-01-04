'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function IncomePage() {
    const router = useRouter();

    useEffect(() => {
        // Income feature has been removed, redirect to dashboard
        router.replace('/dashboard');
    }, [router]);

    return (
        <div className="flex items-center justify-center h-64">
            <p className="text-gray-500">Redirecting...</p>
        </div>
    );
}
