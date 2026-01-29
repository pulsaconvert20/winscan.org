'use client';

import { useState, useEffect } from 'react';
import { ArrowUpRight, ArrowDownLeft, CheckCircle, XCircle, Loader2, ExternalLink } from 'lucide-react';
import { fetchApi } from '@/lib/api';
import Link from 'next/link';

interface IBCTransaction {
  height: string;
  txHash: string;
  messages: string;
  status: 'success' | 'failed';
  time: string;
  sender?: string;
  receiver?: string;
  denom?: string;
  amount?: string;
}

interface IBCChannelTransactionsProps {
  chainName: string;
  chainPath: string;
  channelId: string;
  counterpartyChannelId: string;
  counterpartyChainName: string;
}

export default function IBCChannelTransactions({
  chainName,
  chainPath,
  channelId,
  counterpartyChannelId,
  counterpartyChainName
}: IBCChannelTransactionsProps) {
  const [activeTab, setActiveTab] = useState<'out' | 'in'>('out');
  const [transactions, setTransactions] = useState<IBCTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const limit = 10;

  useEffect(() => {
    fetchTransactions();
  }, [chainName, channelId, activeTab, page]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await fetchApi(
        `/api/ibc/transactions?chain=${chainName}&channel=${channelId}&direction=${activeTab}&limit=${limit}&offset=${page * limit}`
      );
      const data = await response.json();
      setTransactions(data.transactions || []);
      setTotal(data.total || 0);
    } catch (error) {
      console.error('Error fetching IBC transactions:', error);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const truncateHash = (hash: string) => {
    if (!hash) return '';
    return `${hash.slice(0, 16)}...${hash.slice(-8)}`;
  };

  return (
    <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 overflow-hidden">
      {/* Header with Tabs */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">
            Transactions ({channelId})
          </h3>
          <div className="text-sm text-gray-400">
            {counterpartyChainName} ({counterpartyChannelId})
          </div>
        </div>
        
        {/* Tab Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => { setActiveTab('out'); setPage(0); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'out'
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                : 'bg-gray-800 text-gray-400 hover:text-white border border-transparent'
            }`}
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>Transfer Out</span>
          </button>
          <button
            onClick={() => { setActiveTab('in'); setPage(0); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'in'
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : 'bg-gray-800 text-gray-400 hover:text-white border border-transparent'
            }`}
          >
            <ArrowDownLeft className="w-4 h-4" />
            <span>Transfer In</span>
          </button>
        </div>
      </div>

      {/* Transaction Table */}
      {loading ? (
        <div className="p-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-400">Loading transactions...</p>
        </div>
      ) : transactions.length === 0 ? (
        <div className="p-12 text-center">
          <p className="text-gray-400">No {activeTab === 'out' ? 'outgoing' : 'incoming'} transactions found</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#111111] border-b border-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Height
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Tx Hash
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Messages
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Time
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {transactions.map((tx, index) => (
                  <tr key={index} className="hover:bg-[#111111] transition-colors">
                    <td className="px-4 py-3">
                      <Link 
                        href={`/${chainPath}/blocks/${tx.height}`}
                        className="text-blue-400 hover:text-blue-300 font-mono text-sm"
                      >
                        {tx.height}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Link 
                        href={`/${chainPath}/transactions/${tx.txHash}`}
                        className="text-blue-400 hover:text-blue-300 font-mono text-sm flex items-center gap-1"
                      >
                        {truncateHash(tx.txHash)}
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-gray-300 text-sm">{tx.messages}</span>
                        {tx.status === 'success' ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500" />
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-gray-400 text-sm">{formatTime(tx.time)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {total > limit && (
            <div className="p-4 border-t border-gray-800 flex items-center justify-between">
              <div className="text-sm text-gray-400">
                Showing {page * limit + 1} - {Math.min((page + 1) * limit, total)} of {total}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="px-3 py-1 rounded bg-gray-800 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={(page + 1) * limit >= total}
                  className="px-3 py-1 rounded bg-gray-800 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
