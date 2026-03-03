'use client';

import React from 'react';
import { X } from 'lucide-react';
import Plan, { PlanTodo } from '@/components/Plan';

interface ProgressModalProps {
  isOpen: boolean;
  onClose?: () => void;
  title: string;
  description?: string;
  todos: PlanTodo[];
  allowClose?: boolean;
}

export default function ProgressModal({
  isOpen,
  onClose,
  title,
  description,
  todos,
  allowClose = false,
}: ProgressModalProps) {
  if (!isOpen) return null;

  const allCompleted = todos.every((t) => t.status === 'completed');
  const canClose = allowClose || allCompleted;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={canClose ? onClose : undefined}
      />
      
      {/* Modal */}
      <div className="relative bg-[#0a0a0a] border border-gray-800 rounded-lg sm:rounded-xl shadow-2xl w-full max-w-[340px] sm:max-w-md max-h-[85vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
        {/* Close Button */}
        {canClose && onClose && (
          <button
            onClick={onClose}
            className="absolute top-2 right-2 sm:top-3 sm:right-3 text-gray-400 hover:text-white transition-colors z-10"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        )}
        
        {/* Content */}
        <div className="p-3 sm:p-4">
          <Plan
            id="progress-modal"
            title={title}
            description={description}
            todos={todos}
          />
          
          {/* Action Buttons (when completed) */}
          {allCompleted && onClose && (
            <div className="mt-3 sm:mt-4">
              <button
                onClick={onClose}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
