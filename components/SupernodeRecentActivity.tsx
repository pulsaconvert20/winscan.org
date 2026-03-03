'use client';

import { useEffect, useState } from 'react';
import { Clock, ExternalLink, CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface Action {
  id: string;
  type: string;
  creator: string;
  state: string;
  block_height: number;
  register_tx_id?: string;
  finalize_tx_id?: string;
  register_tx_time?: string;
  finalize_tx_time?: string;
  mime_type?: string;
  size?: number;
  price?: {
    denom: string;
    amount: string;
  };
  transactions?: Array<{
    tx_type: string;
    tx_hash: string;
    height: number;
    block_time: string;
    gas_wanted: number;
    gas_used: number;
    action_price?: string;
    tx_fee?: string;
  }>;
}

interface SupernodeRecentActivityProps {
  address: string;
}

export default function SupernodeRecentActivity({ address }: SupernodeRecentActivityProps) {
  const [actions, setActions] = useState<Action[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    fetch(`/api/supernode/actions?supernode=${address}&limit=50&include_transactions=true`)
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        console.log('Actions API response:', data); // Debug log
        // Handle different response formats
        let actionsArray: Action[] = [];

        if (Array.isArray(data)) {
          actionsArray = data;
        } else if (data.items && Array.isArray(data.items)) {
          actionsArray = data.items;
        } else if (data.actions && Array.isArray(data.actions)) {
          actionsArray = data.actions;
        } else if (data.data && Array.isArray(data.data)) {
          actionsArray = data.data;
        } else {
          console.warn('Unexpected API response format:', data);
        }

        setActions(actionsArray);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching actions:', error);
        setError(error.message);
        setLoading(false);
      });
  }, [address]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatAmount = (amount?: string, denom?: string) => {
    if (!amount) return 'N/A';
    const value = parseInt(amount) / 1000000; // Convert from ulume to lume
    return `${value.toFixed(0)} ${denom?.replace('u', '') || 'lume'}`;
  };

  const getStateColor = (state: string) => {
    switch (state.toLowerCase()) {
      case 'finalized':
      case 'approved':
        return 'text-green-400 bg-green-500/20';
      case 'pending':
        return 'text-yellow-400 bg-yellow-500/20';
      case 'expired':
      case 'rejected':
        return 'text-red-400 bg-red-500/20';
      default:
        return 'text-gray-400 bg-gray-500/20';
    }
  };

  if (loading) {
    return (
      <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-12">
        <div className="flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          <span className="ml-3 text-gray-400">Loading recent activity...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#1a1a1a] border border-red-800 rounded-xl p-12">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-red-400 font-semibold mb-2">Error loading actions</p>
          <p className="text-gray-400 text-sm">{error}</p>
          <p className="text-gray-500 text-xs mt-2">API: /api/supernode/{address}/actions</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl overflow-hidden">
      <div className="p-6 border-b border-gray-800">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-500" />
          Recent Activity
        </h2>
        <p className="text-gray-400 text-sm mt-1">Total: {actions.length} actions</p>
      </div>

      {actions.length === 0 ? (
        <div className="p-12 text-center">
          <Clock className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">No recent activity</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          {/* Table Header */}
          <div className="bg-[#0f1419] border-b border-gray-800 px-6 py-3">
            <div className="grid grid-cols-6 gap-4 text-xs font-semibold text-gray-500 uppercase">
              <div>Time</div>
              <div>Event</div>
              <div>Amount</div>
              <div>Tx Hash</div>
              <div>Height</div>
              <div>State</div>
            </div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-gray-800/50">
            {actions.map((action) => {
              const tx = action.transactions?.[action.transactions.length - 1];
              const time = action.finalize_tx_time || action.register_tx_time;

              return (
                <div
                  key={action.id}
                  className="px-6 py-3 hover:bg-[#0f1419] transition-colors"
                >
                  <div className="grid grid-cols-6 gap-4 items-center">
                    {/* Time */}
                    <div className="text-sm text-gray-400">
                      {formatDate(time)}
                    </div>

                    {/* Event */}
                    <div>
                      <span className="text-sm text-cyan-400 font-medium">
                        {action.type === 'cascade' ? 'Finalize' : action.type}
                      </span>
                    </div>

                    {/* Amount */}
                    <div className="text-sm text-white font-mono">
                      {formatAmount(tx?.action_price, 'ulume')}
                    </div>

                    {/* Tx Hash */}
                    <div>
                      {tx?.tx_hash ? (
                        <a
                          href={`https://explorer.lumera.io/lumera-mainnet/transactions/${tx.tx_hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-400 hover:text-blue-300 font-mono flex items-center gap-1 group"
                        >
                          <span className="truncate max-w-[140px]">{tx.tx_hash.slice(0, 16)}...{tx.tx_hash.slice(-6)}</span>
                          <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                        </a>
                      ) : (
                        <span className="text-sm text-gray-600">-</span>
                      )}
                    </div>

                    {/* Height */}
                    <div className="text-sm text-gray-300 font-mono">
                      {action.block_height.toLocaleString()}
                    </div>

                    {/* State */}
                    <div>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${getStateColor(action.state)}`}>
                        {action.state === 'Finalized' || action.state === 'Approved' ? (
                          <CheckCircle className="w-3 h-3" />
                        ) : action.state === 'Expired' || action.state === 'Rejected' ? (
                          <XCircle className="w-3 h-3" />
                        ) : (
                          <Clock className="w-3 h-3" />
                        )}
                        {action.state}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
