'use client';
import { useState } from 'react';
import Link from 'next/link';
import { formatDistanceToNow, format } from 'date-fns';
import { Vote, CheckCircle, XCircle, Clock, TrendingUp, Calendar, FileText, ChevronRight } from 'lucide-react';
import { ChainData } from '@/types/chain';
import { executeVote, connectKeplr } from '@/lib/keplr';

interface Proposal {
  id: string;
  title: string;
  status: string;
  type: string;
  submitTime: string;
  votingStartTime: string;
  votingEndTime: string;
  yesVotes: string;
  noVotes: string;
  abstainVotes: string;
  vetoVotes: string;
}

interface ProposalsTableProps {
  proposals: Proposal[];
  chainName: string;
  chain: ChainData | null;
  t: (key: string) => string;
}

export default function ProposalsTable({ proposals, chainName, chain, t }: ProposalsTableProps) {
  const [showVoteModal, setShowVoteModal] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [voteOption, setVoteOption] = useState<number>(1); // 1=Yes, 2=Abstain, 3=No, 4=Veto
  const [isProcessing, setIsProcessing] = useState(false);
  const [txResult, setTxResult] = useState<{ success: boolean; txHash?: string; error?: string } | null>(null);
  const [gasLimit, setGasLimit] = useState('200000');
  const [memo, setMemo] = useState('Vote via WinScan');
  
  const chainPath = chainName.toLowerCase().replace(/\s+/g, '-');
  
  const handleVoteClick = (proposal: Proposal, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedProposal(proposal);
    setVoteOption(1);
    setShowVoteModal(true);
  };
  
  const handleConfirmVote = async () => {
    if (!chain || !selectedProposal) {
      alert('Missing chain or proposal information');
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // Connect wallet
      const account = await connectKeplr(chain);
      if (!account) {
        alert('Failed to connect wallet');
        setIsProcessing(false);
        return;
      }
      
      const result = await executeVote(
        chain,
        {
          voterAddress: account.address,
          proposalId: selectedProposal.id,
          option: voteOption,
        },
        gasLimit,
        memo
      );
      
      if (result.success) {
        setTxResult({ success: true, txHash: result.txHash || '' });
      } else {
        setTxResult({ success: false, error: result.error || 'Unknown error' });
      }
    } catch (error: any) {
      console.error('Vote error:', error);
      setTxResult({ success: false, error: error.message || 'Failed to vote' });
    } finally {
      setIsProcessing(false);
    }
  };
  
  const getVoteOptionLabel = (option: number) => {
    switch (option) {
      case 1: return 'Yes';
      case 2: return 'Abstain';
      case 3: return 'No';
      case 4: return 'No With Veto';
      default: return 'Unknown';
    }
  };
  
  const getVoteOptionColor = (option: number) => {
    switch (option) {
      case 1: return 'from-green-500 to-emerald-600';
      case 2: return 'from-yellow-500 to-orange-600';
      case 3: return 'from-red-500 to-rose-600';
      case 4: return 'from-purple-500 to-pink-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };
  
  const getStatusColor = (status: string) => {
    if (status.includes('VOTING')) return 'bg-blue-500/10 text-blue-500';
    if (status.includes('PASSED')) return 'bg-green-500/10 text-green-500';
    if (status.includes('REJECTED')) return 'bg-red-500/10 text-red-500';
    if (status.includes('DEPOSIT')) return 'bg-yellow-500/10 text-yellow-500';
    return 'bg-gray-500/10 text-gray-500';
  };
  const getStatusLabel = (status: string) => {
    if (status.includes('VOTING')) return t('proposals.filterVoting');
    if (status.includes('PASSED')) return t('proposals.filterPassed');
    if (status.includes('REJECTED')) return t('proposals.filterRejected');
    if (status.includes('DEPOSIT')) return 'Deposit Period';
    return status;
  };
  const getStatusIcon = (status: string) => {
    if (status.includes('VOTING')) return <Clock className="w-4 h-4" />;
    if (status.includes('PASSED')) return <CheckCircle className="w-4 h-4" />;
    if (status.includes('REJECTED')) return <XCircle className="w-4 h-4" />;
    return <Vote className="w-4 h-4" />;
  };
  const calculateVotePercentage = (votes: string, total: number) => {
    if (total === 0) return 0;
    return (parseFloat(votes) / total * 100).toFixed(2);
  };
  const formatVoteAmount = (votes: string) => {
    const num = parseFloat(votes || '0');
    if (num >= 1e12) return `${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
    return num.toFixed(0);
  };
  return (
    <div className="space-y-6">
      {proposals.length === 0 ? (
        <div className="bg-gradient-to-br from-[#1a1a1a] to-[#141414] border border-gray-800 rounded-2xl p-16 text-center">
          <div className="bg-gray-800/50 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
            <Vote className="w-12 h-12 text-gray-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-400 mb-2">{t('proposals.noProposals')}</h3>
          <p className="text-gray-500">{t('proposals.noProposalsDesc')}</p>
        </div>
      ) : (
        proposals.map((proposal) => {
          const totalVotes = parseFloat(proposal.yesVotes || '0') + 
                            parseFloat(proposal.noVotes || '0') + 
                            parseFloat(proposal.abstainVotes || '0') + 
                            parseFloat(proposal.vetoVotes || '0');
          const yesPercentage = calculateVotePercentage(proposal.yesVotes, totalVotes);
          const isVoting = proposal.status.includes('VOTING');
          const isPassed = proposal.status.includes('PASSED');
          const isRejected = proposal.status.includes('REJECTED');
          return (
            <Link
              key={proposal.id}
              href={`/${chainPath}/proposals/${proposal.id}`}
              className="block group"
            >
              <div className="bg-gradient-to-br from-[#1a1a1a] to-[#141414] border border-gray-800 rounded-2xl p-6 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300">
                {}
                <div className="flex items-start justify-between gap-4 mb-5">
                  <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl px-4 py-2">
                      <span className="text-blue-400 font-bold text-lg">#{proposal.id}</span>
                    </div>
                    <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold ${getStatusColor(proposal.status)} backdrop-blur-sm`}>
                      {getStatusIcon(proposal.status)}
                      {getStatusLabel(proposal.status)}
                    </span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                </div>
                {}
                <div className="mb-5">
                  <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors mb-2 line-clamp-2">
                    {proposal.title}
                  </h3>
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-400">
                      {proposal.type?.split('.').pop()?.replace(/([A-Z])/g, ' $1').trim() || t('proposals.unknownType')}
                    </span>
                  </div>
                </div>
                {}
                {totalVotes > 0 && (
                  <div className="mb-5">
                    {}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium text-gray-400">{t('proposals.votingResults')}</span>
                        </div>
                        <span className="text-sm font-semibold text-gray-300">
                          {formatVoteAmount(totalVotes.toString())} {t('proposals.totalVotes')}
                        </span>
                      </div>
                      {}
                      <div className="bg-gray-800 rounded-full h-3 overflow-hidden flex">
                        <div 
                          className="bg-gradient-to-r from-green-500 to-green-400 transition-all duration-500"
                          style={{ width: `${yesPercentage}%` }}
                          title={`Yes: ${yesPercentage}%`}
                        />
                        <div 
                          className="bg-gradient-to-r from-red-500 to-red-400 transition-all duration-500"
                          style={{ width: `${calculateVotePercentage(proposal.noVotes, totalVotes)}%` }}
                          title={`No: ${calculateVotePercentage(proposal.noVotes, totalVotes)}%`}
                        />
                        <div 
                          className="bg-gradient-to-r from-yellow-500 to-yellow-400 transition-all duration-500"
                          style={{ width: `${calculateVotePercentage(proposal.abstainVotes, totalVotes)}%` }}
                          title={`Abstain: ${calculateVotePercentage(proposal.abstainVotes, totalVotes)}%`}
                        />
                        <div 
                          className="bg-gradient-to-r from-purple-500 to-purple-400 transition-all duration-500"
                          style={{ width: `${calculateVotePercentage(proposal.vetoVotes, totalVotes)}%` }}
                          title={`Veto: ${calculateVotePercentage(proposal.vetoVotes, totalVotes)}%`}
                        />
                      </div>
                    </div>
                    {}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                      {}
                      <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-green-400">{t('proposals.yes')}</span>
                          <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                        </div>
                        <div className="text-lg font-bold text-green-400">{yesPercentage}%</div>
                        <div className="text-xs text-gray-500">{formatVoteAmount(proposal.yesVotes)}</div>
                      </div>
                      {}
                      <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-red-400">{t('proposals.no')}</span>
                          <XCircle className="w-3.5 h-3.5 text-red-400" />
                        </div>
                        <div className="text-lg font-bold text-red-400">
                          {calculateVotePercentage(proposal.noVotes, totalVotes)}%
                        </div>
                        <div className="text-xs text-gray-500">{formatVoteAmount(proposal.noVotes)}</div>
                      </div>
                      {}
                      <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-yellow-400">{t('proposals.abstain')}</span>
                          <Clock className="w-3.5 h-3.5 text-yellow-400" />
                        </div>
                        <div className="text-lg font-bold text-yellow-400">
                          {calculateVotePercentage(proposal.abstainVotes, totalVotes)}%
                        </div>
                        <div className="text-xs text-gray-500">{formatVoteAmount(proposal.abstainVotes)}</div>
                      </div>
                      {}
                      <div className="bg-purple-500/5 border border-purple-500/20 rounded-xl p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-purple-400">{t('proposals.veto')}</span>
                          <XCircle className="w-3.5 h-3.5 text-purple-400" />
                        </div>
                        <div className="text-lg font-bold text-purple-400">
                          {calculateVotePercentage(proposal.vetoVotes, totalVotes)}%
                        </div>
                        <div className="text-xs text-gray-500">{formatVoteAmount(proposal.vetoVotes)}</div>
                      </div>
                    </div>
                  </div>
                )}
                {}
                <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-gray-800">
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-500">{t('proposals.submitted')}</span>
                      <span className="text-gray-300 font-medium">
                        {format(new Date(proposal.submitTime), 'MMM dd, yyyy')}
                      </span>
                    </div>
                    {isVoting && proposal.votingEndTime && (
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4 text-blue-400" />
                        <span className="text-gray-500">{t('proposals.ends')}</span>
                        <span className="text-blue-400 font-medium">
                          {formatDistanceToNow(new Date(proposal.votingEndTime), { addSuffix: true })}
                        </span>
                      </div>
                    )}
                    {(isPassed || isRejected) && proposal.votingEndTime && (
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <span className="text-gray-500">{t('proposals.ended')}</span>
                        <span className="text-gray-300">
                          {formatDistanceToNow(new Date(proposal.votingEndTime), { addSuffix: true })}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {isVoting && (
                    <button
                      onClick={(e) => handleVoteClick(proposal, e)}
                      className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all hover:scale-105 active:scale-95 shadow-lg shadow-blue-500/30 flex items-center gap-2"
                    >
                      <Vote className="w-4 h-4" />
                      Vote
                    </button>
                  )}
                </div>
              </div>
            </Link>
          );
        })
      )}
      
      {/* Vote Modal */}
      {showVoteModal && selectedProposal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowVoteModal(false)}>
          <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border border-gray-800 rounded-2xl max-w-xl w-full p-8 relative shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={() => setShowVoteModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors text-2xl leading-none"
            >
              ✕
            </button>

            <div className="mb-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl p-3">
                  <Vote className="w-6 h-6 text-blue-400" />
                </div>
                <h2 className="text-2xl font-bold text-white">Vote on Proposal</h2>
              </div>
              <div className="bg-[#0a0a0a] border border-gray-800 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-blue-400 font-bold">#{selectedProposal.id}</span>
                  <span className="text-gray-500">•</span>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold ${
                    selectedProposal.status.includes('VOTING') ? 'bg-blue-500/10 text-blue-500' : 'bg-gray-500/10 text-gray-500'
                  }`}>
                    <Clock className="w-3 h-3" />
                    Active
                  </span>
                </div>
                <h3 className="text-white font-medium text-lg line-clamp-2">{selectedProposal.title}</h3>
              </div>
            </div>

            <div className="mb-6">
              <label className="text-white text-sm font-medium mb-3 block">Select Your Vote</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 1, label: 'Yes', icon: CheckCircle, borderColor: 'border-green-500', bgColor: 'bg-green-500/10', iconBg: 'bg-green-500/20', iconColor: 'text-green-400' },
                  { value: 3, label: 'No', icon: XCircle, borderColor: 'border-red-500', bgColor: 'bg-red-500/10', iconBg: 'bg-red-500/20', iconColor: 'text-red-400' },
                  { value: 2, label: 'Abstain', icon: Clock, borderColor: 'border-yellow-500', bgColor: 'bg-yellow-500/10', iconBg: 'bg-yellow-500/20', iconColor: 'text-yellow-400' },
                  { value: 4, label: 'No With Veto', icon: XCircle, borderColor: 'border-purple-500', bgColor: 'bg-purple-500/10', iconBg: 'bg-purple-500/20', iconColor: 'text-purple-400' },
                ].map((option) => {
                  const Icon = option.icon;
                  const isSelected = voteOption === option.value;
                  return (
                    <button
                      key={option.value}
                      onClick={() => setVoteOption(option.value)}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        isSelected
                          ? `${option.borderColor} ${option.bgColor}`
                          : 'border-gray-800 bg-[#0a0a0a] hover:border-gray-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          isSelected ? option.iconBg : 'bg-gray-800'
                        }`}>
                          <Icon className={`w-5 h-5 ${
                            isSelected ? option.iconColor : 'text-gray-400'
                          }`} />
                        </div>
                        <span className={`font-semibold ${
                          isSelected ? 'text-white' : 'text-gray-400'
                        }`}>
                          {option.label}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <details className="mb-6">
              <summary className="text-gray-400 text-sm cursor-pointer flex items-center gap-2 hover:text-white transition-colors">
                <span>⚙️</span> Advanced Options
              </summary>
              <div className="mt-4 space-y-4">                
                <div>
                  <label className="text-white text-sm font-medium mb-2 block">Gas Limit</label>
                  <input
                    type="text"
                    value={gasLimit}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (/^\d*$/.test(value)) {
                        setGasLimit(value);
                      }
                    }}
                    className="w-full bg-[#111111] border border-gray-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
                
                <div>
                  <label className="text-white text-sm font-medium mb-2 block">Memo</label>
                  <input
                    type="text"
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                    placeholder="Vote via WinScan"
                    className="w-full bg-[#111111] border border-gray-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>
            </details>

            <button 
              onClick={handleConfirmVote}
              disabled={isProcessing}
              className={`w-full font-semibold py-3.5 rounded-xl transition-all ${
                isProcessing
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : `bg-gradient-to-r ${getVoteOptionColor(voteOption)} text-white hover:scale-[1.02] active:scale-[0.98] shadow-lg`
              }`}
            >
              {isProcessing ? 'Processing...' : `Confirm Vote: ${getVoteOptionLabel(voteOption)}`}
            </button>
          </div>
        </div>
      )}

      {/* Transaction Result Modal */}
      {txResult && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] px-4">
          <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border border-gray-800 rounded-2xl p-8 max-w-md w-full shadow-2xl animate-scale-in">
            <div className="flex flex-col items-center text-center space-y-6">
              {txResult.success ? (
                <>
                  {/* Success Icon */}
                  <div className="relative">
                    <div className="absolute inset-0 bg-green-500/20 rounded-full blur-2xl animate-pulse"></div>
                    <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/50">
                      <svg className="w-10 h-10 text-white animate-bounce-slow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                  
                  {/* Success Message */}
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold text-white">Vote Successful!</h3>
                    <p className="text-gray-400">Your vote has been recorded on-chain</p>
                  </div>
                  
                  {/* Transaction Hash */}
                  <div className="w-full bg-[#0a0a0a] border border-gray-800 rounded-xl p-4 space-y-2">
                    <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Transaction Hash</p>
                    <div className="flex items-center gap-2">
                      <code className="text-xs text-green-400 font-mono break-all flex-1">
                        {txResult.txHash}
                      </code>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(txResult.txHash || '');
                        }}
                        className="p-2 hover:bg-gray-800 rounded-lg transition-colors flex-shrink-0"
                        title="Copy to clipboard"
                      >
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex gap-3 w-full pt-2">
                    <button
                      onClick={() => {
                        window.open(`/${chainPath}/transactions/${txResult.txHash}`, '_blank');
                      }}
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium rounded-lg transition-all hover:scale-105 active:scale-95 shadow-lg shadow-blue-500/30"
                    >
                      View in Explorer
                    </button>
                    <button
                      onClick={() => {
                        setTxResult(null);
                        setShowVoteModal(false);
                      }}
                      className="flex-1 px-4 py-3 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-lg transition-all hover:scale-105 active:scale-95"
                    >
                      Close
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {/* Error Icon */}
                  <div className="relative">
                    <div className="absolute inset-0 bg-red-500/20 rounded-full blur-2xl animate-pulse"></div>
                    <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg shadow-red-500/50">
                      <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                  </div>
                  
                  {/* Error Message */}
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold text-white">Vote Failed</h3>
                    <p className="text-gray-400">An error occurred while submitting your vote</p>
                  </div>
                  
                  {/* Error Details */}
                  <div className="w-full bg-[#0a0a0a] border border-red-900/50 rounded-xl p-4 space-y-2">
                    <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Error Details</p>
                    <p className="text-sm text-red-400 break-words">
                      {txResult.error || 'Unknown error occurred'}
                    </p>
                  </div>
                  
                  {/* Close Button */}
                  <button
                    onClick={() => setTxResult(null)}
                    className="w-full px-4 py-3 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-lg transition-all hover:scale-105 active:scale-95"
                  >
                    Close
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
