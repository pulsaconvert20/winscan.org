'use client';

import { Bell } from 'lucide-react';
import { useState, useEffect } from 'react';
import { ChainData } from '@/types/chain';

interface NotificationBellProps {
  selectedChain: ChainData | null;
}

export default function NotificationBell({ selectedChain }: NotificationBellProps) {
  const [hasNotifications, setHasNotifications] = useState(false);

  // Placeholder for future notification system
  useEffect(() => {
    // TODO: Implement notification checking logic
    setHasNotifications(false);
  }, [selectedChain]);

  return (
    <button
      className="relative p-2 bg-[#1a1a1a] hover:bg-gray-800 border border-gray-700 rounded-lg transition-colors duration-200"
      title="Notifications"
    >
      <Bell className="w-5 h-5 text-gray-400" />
      {hasNotifications && (
        <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
      )}
    </button>
  );
}
