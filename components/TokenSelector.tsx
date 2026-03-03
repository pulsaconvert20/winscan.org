'use client';

import { useState } from 'react';
import { Search, X, ChevronDown } from 'lucide-react';
import Image from 'next/image';

interface Token {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  logo?: string;
  balance?: string;
}

interface TokenSelectorProps {
  tokens: Token[];
  selectedToken: Token | null;
  onSelect: (token: Token) => void;
  excludeToken?: Token | null;
  label?: string;
  formatBalance?: (balance: string, decimals: number) => string;
}

export default function TokenSelector({
  tokens,
  selectedToken,
  onSelect,
  excludeToken,
  label = 'Select',
  formatBalance
}: TokenSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTokens = tokens
    .filter(token => excludeToken ? token.address !== excludeToken.address : true)
    .filter(token => 
      token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      token.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      token.address.toLowerCase().includes(searchQuery.toLowerCase())
    );

  return (
    <div className="relative w-full">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white hover:bg-gray-700 transition-all flex items-center justify-between gap-2 min-w-[140px]"
      >
        <div className="flex items-center gap-2">
          {selectedToken ? (
            <>
              {selectedToken.logo && (
                <Image 
                  src={selectedToken.logo} 
                  alt={selectedToken.symbol}
                  width={20}
                  height={20}
                  className="w-5 h-5 rounded-full"
                  unoptimized
                />
              )}
              <span className="font-medium">{selectedToken.symbol}</span>
            </>
          ) : (
            <span className="text-gray-400">{label}</span>
          )}
        </div>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-[100]" 
            onClick={() => setIsOpen(false)}
          />
          
          <div className="absolute top-full left-0 right-0 mt-2 bg-[#1a1a1a] border border-gray-700 rounded-xl shadow-2xl z-[101] overflow-hidden w-full min-w-[320px]">
            <div className="p-3 border-b border-gray-700 bg-[#1a1a1a]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search name, symbol or address..."
                  className="w-full pl-10 pr-10 py-2 bg-[#0f0f0f] border border-gray-700 rounded-lg text-white text-sm outline-none focus:border-blue-500 transition-all"
                  autoFocus
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="max-h-[400px] overflow-y-auto scrollbar-thin">
              {filteredTokens.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-sm">
                  No tokens found
                </div>
              ) : (
                <div className="p-2">
                  {filteredTokens.map((token) => (
                    <button
                      key={token.address}
                      onClick={() => {
                        onSelect(token);
                        setIsOpen(false);
                        setSearchQuery('');
                      }}
                      className={`w-full p-3 rounded-lg hover:bg-gray-800 transition-all flex items-center justify-between group ${
                        selectedToken?.address === token.address ? 'bg-gray-800' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {token.logo ? (
                          <Image 
                            src={token.logo} 
                            alt={token.symbol}
                            width={32}
                            height={32}
                            className="w-8 h-8 rounded-full"
                            unoptimized
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                            {token.symbol.substring(0, 2).toUpperCase()}
                          </div>
                        )}
                        
                        <div className="text-left">
                          <div className="font-medium text-white text-sm">{token.symbol}</div>
                          <div className="text-xs text-gray-400 truncate max-w-[180px]">{token.name}</div>
                        </div>
                      </div>

                      <div className="text-right">
                        {token.balance && formatBalance && (
                          <div className="text-sm text-white font-medium">
                            {formatBalance(token.balance, token.decimals)}
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="p-2 border-t border-gray-700 bg-[#0f0f0f]">
              <div className="text-xs text-gray-400 text-center">
                {filteredTokens.length} token{filteredTokens.length !== 1 ? 's' : ''} available
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
