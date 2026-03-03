'use client';

import React from 'react';
import { CheckCircle, Circle, Loader2, XCircle } from 'lucide-react';

export interface PlanTodo {
  id: string;
  label: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  description?: string;
}

export interface PlanProps {
  id: string;
  title: string;
  description?: string;
  todos: PlanTodo[];
  maxVisibleTodos?: number;
  className?: string;
}

export default function Plan({
  id,
  title,
  description,
  todos,
  maxVisibleTodos = 4,
  className = '',
}: PlanProps) {
  const completedCount = todos.filter((t) => t.status === 'completed').length;
  const totalCount = todos.length;
  const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  const allCompleted = completedCount === totalCount && totalCount > 0;

  const getStatusIcon = (status: PlanTodo['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0" />;
      case 'in_progress':
        return <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 animate-spin flex-shrink-0" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 flex-shrink-0" />;
      case 'pending':
      default:
        return <Circle className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 flex-shrink-0" />;
    }
  };

  const getStatusColor = (status: PlanTodo['status']) => {
    switch (status) {
      case 'completed':
        return 'text-green-500';
      case 'in_progress':
        return 'text-white';
      case 'cancelled':
        return 'text-red-500';
      case 'pending':
      default:
        return 'text-gray-500';
    }
  };

  const getStatusLabel = (status: PlanTodo['status']) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'in_progress':
        return 'In Progress';
      case 'cancelled':
        return 'Cancelled';
      case 'pending':
      default:
        return null;
    }
  };

  return (
    <div className={`bg-[#111111] border border-gray-800 rounded-lg p-2.5 sm:p-3 ${className}`}>
      {/* Header */}
      <div className="mb-2 sm:mb-3">
        <h3 className="text-white font-semibold text-xs sm:text-sm mb-0.5 sm:mb-1">{title}</h3>
        {description && (
          <p className="text-gray-400 text-[10px] sm:text-xs leading-tight">{description}</p>
        )}
      </div>

      {/* Progress Summary */}
      <div className="mb-2 sm:mb-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] sm:text-xs text-gray-400">
            {completedCount} of {totalCount} complete
          </span>
          {allCompleted && (
            <span className="text-[9px] sm:text-xs text-green-500 font-medium">✨ Done!</span>
          )}
        </div>
        {/* Progress Bar */}
        <div className="w-full bg-gray-800 rounded-full h-1 sm:h-1.5 overflow-hidden">
          <div
            className="bg-blue-500 h-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Todo List */}
      <div className="space-y-1.5 sm:space-y-2">
        {todos.slice(0, maxVisibleTodos).map((todo) => (
          <div key={todo.id} className="flex items-start gap-1.5 sm:gap-2">
            <div className="flex-shrink-0 mt-0.5">
              {getStatusIcon(todo.status)}
            </div>
            <div className="flex-1 min-w-0">
              <div className={`font-medium text-[10px] sm:text-xs leading-tight ${getStatusColor(todo.status)}`}>
                {todo.label}
              </div>
              {todo.description && (
                <div className="text-gray-400 text-[9px] sm:text-[10px] mt-0.5 leading-tight line-clamp-1">
                  {todo.description}
                </div>
              )}
            </div>
            {getStatusLabel(todo.status) && (
              <span className={`text-[9px] sm:text-[10px] font-medium ${getStatusColor(todo.status)} whitespace-nowrap flex-shrink-0`}>
                {getStatusLabel(todo.status)}
              </span>
            )}
          </div>
        ))}
        {todos.length > maxVisibleTodos && (
          <div className="text-center text-gray-500 text-[10px] sm:text-xs pt-1">
            +{todos.length - maxVisibleTodos} more
          </div>
        )}
      </div>
    </div>
  );
}

// Compact variant without header and progress bar
Plan.Compact = function PlanCompact({
  todos,
  maxVisibleTodos = 4,
  className = '',
}: Omit<PlanProps, 'id' | 'title'>) {
  const getStatusIcon = (status: PlanTodo['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />;
      case 'in_progress':
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin flex-shrink-0" />;
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />;
      case 'pending':
      default:
        return <Circle className="w-5 h-5 text-gray-600 flex-shrink-0" />;
    }
  };

  const getStatusColor = (status: PlanTodo['status']) => {
    switch (status) {
      case 'completed':
        return 'text-green-500';
      case 'in_progress':
        return 'text-white';
      case 'cancelled':
        return 'text-red-500';
      case 'pending':
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {todos.slice(0, maxVisibleTodos).map((todo) => (
        <div key={todo.id} className="flex items-center gap-3">
          {getStatusIcon(todo.status)}
          <div className="flex-1">
            <div className={`font-medium ${getStatusColor(todo.status)}`}>
              {todo.label}
            </div>
            {todo.description && (
              <div className="text-gray-400 text-xs mt-0.5">
                {todo.description}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
