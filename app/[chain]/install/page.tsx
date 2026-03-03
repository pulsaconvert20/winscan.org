'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { ChainData } from '@/types/chain';
import { Copy, CheckCircle, RefreshCw } from 'lucide-react';
import { fetchChains } from '@/lib/apiCache';

export default function InstallPage() {
  const params = useParams();
  const [chains, setChains] = useState<ChainData[]>([]);
  const [selectedChain, setSelectedChain] = useState<ChainData | null>(null);
  const [copied, setCopied] = useState<{[key: string]: boolean}>({});
  const [nodeName, setNodeName] = useState('test');
  const [wallet, setWallet] = useState('wallet');
  const [port, setPort] = useState('26');
  const [goVersion, setGoVersion] = useState('1.22.0');
  const [pruning, setPruning] = useState('custom');
  const [pruningKeepRecent, setPruningKeepRecent] = useState('100');
  const [pruningInterval, setPruningInterval] = useState('19');
  const [fetchedGasPrice, setFetchedGasPrice] = useState<number | null>(null);
  const [gasPriceLoading, setGasPriceLoading] = useState(false);
  const [customInstallDoc, setCustomInstallDoc] = useState<string | null>(null);

  // Fetch gas price from RPC
  const fetchGasPriceFromRPC = async (chain: ChainData) => {
    if (!chain.rpc || chain.rpc.length === 0) return;
    
    setGasPriceLoading(true);
    try {
      // Try to get minimum gas price from node config
      const rpcUrl = chain.rpc[0].address;
      const response = await fetch(`${rpcUrl}/abci_query?path="/cosmos/base/tendermint/v1beta1/node_info"`);
      
      if (response.ok) {
        const data = await response.json();
        // Try to parse minimum gas prices from node info
        const nodeInfo = data.result?.response?.value;
        if (nodeInfo) {
          // Decode base64 if needed
          let decoded = nodeInfo;
          try {
            decoded = atob(nodeInfo);
            const parsed = JSON.parse(decoded);
            if (parsed.application_version?.cosmos_sdk_version) {
              // Successfully got node info, now try to get gas price from another endpoint
            }
          } catch (e) {
            // Not base64 or not JSON
          }
        }
      }
      
      // Alternative: Get from recent transactions
      const txResponse = await fetch(`/api/transactions?chain=${chain.chain_id}&limit=10`);
      if (txResponse.ok) {
        const txData = await txResponse.json();
        if (txData.transactions && txData.transactions.length > 0) {
          // Calculate average gas price from recent transactions
          let totalGasPrice = 0;
          let count = 0;
          
          txData.transactions.forEach((tx: any) => {
            if (tx.tx?.auth_info?.fee?.amount?.[0]) {
              const feeAmount = parseInt(tx.tx.auth_info.fee.amount[0].amount);
              const gasLimit = parseInt(tx.tx.auth_info.fee.gas_limit);
              if (gasLimit > 0) {
                totalGasPrice += feeAmount / gasLimit;
                count++;
              }
            }
          });
          
          if (count > 0) {
            const avgGasPrice = totalGasPrice / count;
            // Use 80% of average as minimum
            setFetchedGasPrice(avgGasPrice * 0.8);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching gas price from RPC:', error);
    } finally {
      setGasPriceLoading(false);
    }
  };

  // Load custom install documentation from GitHub
  useEffect(() => {
    const chainName = params?.chain as string;
    if (chainName) {
      // Fetch directly from GitHub
      fetch(`https://raw.githubusercontent.com/winsnip-official/Docs/main/install/${chainName}.md`)
        .then(res => res.ok ? res.text() : null)
        .then(text => setCustomInstallDoc(text))
        .catch(() => setCustomInstallDoc(null));
    }
  }, [params]);

  useEffect(() => {
    const cachedChains = sessionStorage.getItem('chains');
    
    if (cachedChains) {
      const data = JSON.parse(cachedChains);
      setChains(data);
      const chainName = params?.chain as string;
      const chain = chainName 
        ? data.find((c: ChainData) => c.chain_name.toLowerCase().replace(/\s+/g, '-') === chainName.toLowerCase())
        : data[0];
      if (chain) {
        setSelectedChain(chain);
        fetchGasPriceFromRPC(chain);
      }
    } else {
      fetchChains()
        .then(data => {
          sessionStorage.setItem('chains', JSON.stringify(data));
          setChains(data);
          const chainName = params?.chain as string;
          const chain = chainName 
            ? data.find((c: ChainData) => c.chain_name.toLowerCase().replace(/\s+/g, '-') === chainName.toLowerCase())
            : data[0];
          if (chain) {
            setSelectedChain(chain);
            fetchGasPriceFromRPC(chain);
          }
        })
        .catch(error => console.error('Error loading chains:', error));
    }
  }, [params]);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied({...copied, [key]: true});
    setTimeout(() => setCopied({...copied, [key]: false}), 2000);
  };

  if (!selectedChain) return null;

  const baseName = selectedChain.chain_name.replace(/-mainnet$|-testnet$|-test$/i, '');
  const binary = `${baseName}d`;
  const chainId = selectedChain.chain_id;
  
  // Get accurate gas price from chain data
  const feeToken = (selectedChain as any)?.fees?.fee_tokens?.[0];
  const denom = feeToken?.denom || selectedChain.assets?.[0]?.base || 'utoken';
  
  // Calculate gas price: prioritize fetched from RPC, then chain data
  let gasPrice = 0.001;
  if (fetchedGasPrice !== null) {
    // Use fetched gas price from RPC (most accurate)
    gasPrice = fetchedGasPrice;
  } else if (feeToken) {
    // Fallback to chain data
    if (feeToken.low_gas_price !== undefined && feeToken.low_gas_price !== null) {
      gasPrice = feeToken.low_gas_price;
    } else if (feeToken.fixed_min_gas_price !== undefined && feeToken.fixed_min_gas_price !== null) {
      gasPrice = feeToken.fixed_min_gas_price;
    } else if (feeToken.average_gas_price !== undefined && feeToken.average_gas_price !== null) {
      gasPrice = feeToken.average_gas_price * 0.8;
    }
  }
  
  const envPrefix = baseName.toUpperCase();

  const CopyButton = ({ text, id }: { text: string; id: string }) => (
    <button
      onClick={() => copyToClipboard(text, id)}
      className="flex items-center gap-2 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 rounded text-sm text-white transition-colors"
    >
      {copied[id] ? (
        <>
          <CheckCircle className="w-4 h-4" />
          <span>Copied!</span>
        </>
      ) : (
        <>
          <Copy className="w-4 h-4" />
          <span>Copy</span>
        </>
      )}
    </button>
  );


  return (
    <div className="min-h-screen bg-[#0a0a0a] flex">
      <Sidebar selectedChain={selectedChain} />
      
      <div className="flex-1 flex flex-col">
        <Header 
          chains={chains}
          selectedChain={selectedChain}
          onSelectChain={setSelectedChain}
        />

        <main className="flex-1 mt-32 md:mt-16 p-3 md:p-6 overflow-auto">
        {/* Chain Header */}
        {selectedChain && (
          <div className="mb-8 flex flex-col items-center">
            <div className="w-24 h-24 mb-4">
              <img 
                src={selectedChain.logo} 
                alt={selectedChain.chain_name}
                className="w-full h-full rounded-full"
              />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              {(selectedChain as any)?.pretty_name?.replace(/\s+(Mainnet|Testnet)$/i, '') || baseName}
            </h1>
            <p className="text-white mb-4">
              Network Overview & Statistics
            </p>
            <div className="flex items-center gap-4">
              {selectedChain.github && (
                <a
                  href={selectedChain.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] hover:bg-gray-800 border border-gray-700 rounded-lg transition-colors text-white text-sm"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                  GitHub
                </a>
              )}
              {(selectedChain as any).explorers && (selectedChain as any).explorers[0] && (
                <a
                  href={(selectedChain as any).explorers[0].url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] hover:bg-gray-800 border border-gray-700 rounded-lg transition-colors text-white text-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  Link
                </a>
              )}
            </div>
          </div>
        )}


        {/* Header Section */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Installation</h2>
            <p className="text-sm text-white">
              Recommended Hardware: 4 Cores, 8GB RAM, 200GB of storage (NVME)
            </p>
          </div>
        </div>

        {/* Install Dependencies */}
        <div className="mb-8">
          <h3 className="text-xl font-bold text-white mb-4">Install Dependencies</h3>
          <div className="relative bg-[#0f0f0f] rounded-lg border border-gray-800">
            <div className="absolute top-3 right-3 z-10">
              <CopyButton text={`sudo apt update && sudo apt upgrade -y
sudo apt install curl git wget htop tmux build-essential jq make lz4 gcc unzip -y`} id="dependencies" />
            </div>
            <pre className="p-6 overflow-x-auto text-xs leading-relaxed">
              <code className="text-gray-300 font-mono">
{`sudo apt update && sudo apt upgrade -y
sudo apt install curl git wget htop tmux build-essential jq make lz4 gcc unzip -y`}
              </code>
            </pre>
          </div>
        </div>

        {/* Install Go */}
        <div className="mb-8">
          <h3 className="text-xl font-bold text-white mb-4">Install Go</h3>
          
          {/* Go Version Input */}
          <div className="mb-4">
            <label className="block text-xs text-white mb-1">Go Version</label>
            <input
              type="text"
              value={goVersion}
              onChange={(e) => setGoVersion(e.target.value)}
              placeholder="1.22.0"
              className="w-full md:w-48 bg-[#1a1a1a] border border-gray-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="relative bg-[#0f0f0f] rounded-lg border border-gray-800">
            <div className="absolute top-3 right-3 z-10">
              <CopyButton text={`cd $HOME
VER="${goVersion}"
wget "https://golang.org/dl/go$VER.linux-amd64.tar.gz"
sudo rm -rf /usr/local/go
sudo tar -C /usr/local -xzf "go$VER.linux-amd64.tar.gz"
rm "go$VER.linux-amd64.tar.gz"
[ ! -f ~/.bash_profile ] && touch ~/.bash_profile
echo "export PATH=$PATH:/usr/local/go/bin:~/go/bin" >> ~/.bash_profile
source $HOME/.bash_profile
[ ! -d ~/go/bin ] && mkdir -p ~/go/bin`} id="go" />
            </div>
            <pre className="p-6 overflow-x-auto text-xs leading-relaxed">
              <code className="text-gray-300 font-mono">
{`cd $HOME
VER="${goVersion}"
wget "https://golang.org/dl/go$VER.linux-amd64.tar.gz"
sudo rm -rf /usr/local/go
sudo tar -C /usr/local -xzf "go$VER.linux-amd64.tar.gz"
rm "go$VER.linux-amd64.tar.gz"
[ ! -f ~/.bash_profile ] && touch ~/.bash_profile
echo "export PATH=$PATH:/usr/local/go/bin:~/go/bin" >> ~/.bash_profile
source $HOME/.bash_profile
[ ! -d ~/go/bin ] && mkdir -p ~/go/bin`}
              </code>
            </pre>
          </div>
        </div>


        {/* Set Vars */}
        <div className="mb-8">
          <h3 className="text-xl font-bold text-white mb-4">Set Vars</h3>
          <p className="text-sm text-white mb-4">Configuration:</p>
          
          {/* Input Fields */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            <div>
              <label className="block text-xs text-white mb-1">Wallet</label>
              <input
                type="text"
                value={wallet}
                onChange={(e) => setWallet(e.target.value)}
                className="w-full bg-[#1a1a1a] border border-gray-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-white mb-1">Moniker</label>
              <input
                type="text"
                value={nodeName}
                onChange={(e) => setNodeName(e.target.value)}
                className="w-full bg-[#1a1a1a] border border-gray-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-white mb-1">Port</label>
              <input
                type="text"
                value={port}
                onChange={(e) => setPort(e.target.value)}
                className="w-full bg-[#1a1a1a] border border-gray-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="relative bg-[#0f0f0f] rounded-lg border border-gray-800">
            <div className="absolute top-3 right-3 z-10">
              <CopyButton text={`echo "export WALLET=\\"${wallet}\\"" >> $HOME/.bash_profile
echo "export MONIKER=\\"${nodeName}\\"" >> $HOME/.bash_profile
echo "export ${envPrefix}_CHAIN_ID=\\"${chainId}\\"" >> $HOME/.bash_profile
echo "export ${envPrefix}_PORT=\\"${port}\\"" >> $HOME/.bash_profile
source $HOME/.bash_profile`} id="vars" />
            </div>
            <pre className="p-6 overflow-x-auto text-xs leading-relaxed">
              <code className="text-gray-300 font-mono">
{`echo "export WALLET=\\"${wallet}\\"" >> $HOME/.bash_profile
echo "export MONIKER=\\"${nodeName}\\"" >> $HOME/.bash_profile
echo "export ${envPrefix}_CHAIN_ID=\\"${chainId}\\"" >> $HOME/.bash_profile
echo "export ${envPrefix}_PORT=\\"${port}\\"" >> $HOME/.bash_profile
source $HOME/.bash_profile`}
              </code>
            </pre>
          </div>
        </div>

        {/* Download Binary */}
        <div className="mb-8">
          <h3 className="text-xl font-bold text-white mb-4">Download Binary</h3>
          {customInstallDoc && customInstallDoc.includes('### 2. Download and Install Binary') ? (
            <div className="relative bg-[#0f0f0f] rounded-lg border border-gray-800">
              <div className="absolute top-3 right-3 z-10">
                <CopyButton text={customInstallDoc.split('### 2. Download and Install Binary')[1]?.split('```bash')[1]?.split('```')[0]?.trim() || ''} id="binary" />
              </div>
              <pre className="p-6 overflow-x-auto text-xs leading-relaxed">
                <code className="text-gray-300 font-mono">
{customInstallDoc.split('### 2. Download and Install Binary')[1]?.split('```bash')[1]?.split('```')[0]?.trim()}
                </code>
              </pre>
            </div>
          ) : (
            <div className="relative bg-[#0f0f0f] rounded-lg border border-gray-800">
              <div className="absolute top-3 right-3 z-10">
                <CopyButton text={`cd $HOME
wget -O ${binary}.tar.gz "$(curl -s https://api.github.com/repos/$(echo ${selectedChain.github} | sed 's|https://github.com/||')/releases/latest | jq -r '.assets[] | select(.name | contains("linux") and (contains("amd64") or contains("x86_64"))) | .browser_download_url' | head -1)"
tar -xzf ${binary}.tar.gz
rm -f install.sh ${binary}.tar.gz
chmod +x ${binary}
sudo mv ${binary} /usr/local/bin/
[ -f "libwasmvm.x86_64.so" ] && sudo mv libwasmvm.x86_64.so /usr/lib/
[ -f "libwasmvm.so" ] && sudo mv libwasmvm.so /usr/lib/`} id="binary" />
              </div>
              <pre className="p-6 overflow-x-auto text-xs leading-relaxed">
                <code className="text-gray-300 font-mono">
{`cd $HOME
wget -O ${binary}.tar.gz "$(curl -s https://api.github.com/repos/$(echo ${selectedChain.github} | sed 's|https://github.com/||')/releases/latest | jq -r '.assets[] | select(.name | contains("linux") and (contains("amd64") or contains("x86_64"))) | .browser_download_url' | head -1)"
tar -xzf ${binary}.tar.gz
rm -f install.sh ${binary}.tar.gz
chmod +x ${binary}
sudo mv ${binary} /usr/local/bin/
[ -f "libwasmvm.x86_64.so" ] && sudo mv libwasmvm.x86_64.so /usr/lib/
[ -f "libwasmvm.so" ] && sudo mv libwasmvm.so /usr/lib/`}
                </code>
              </pre>
            </div>
          )}
        </div>


        {/* Initialize */}
        <div className="mb-8">
          <h3 className="text-xl font-bold text-white mb-4">Initialize</h3>
          <div className="relative bg-[#0f0f0f] rounded-lg border border-gray-800">
            <div className="absolute top-3 right-3 z-10">
              <CopyButton text={`${binary} init $MONIKER --chain-id ${envPrefix}_CHAIN_ID
sed -i \\
  -e "s/chain-id = .*/chain-id = \\"${envPrefix}_CHAIN_ID\\"/" \\
  -e "s/keyring-backend = .*/keyring-backend = \\"os\\"/" \\
  -e "s/node = .*/node = \\"tcp:\\/\\/localhost:\${${envPrefix}_PORT}657\\"/" $HOME/.${baseName}/config/client.toml`} id="init" />
            </div>
            <pre className="p-6 overflow-x-auto text-xs leading-relaxed">
              <code className="text-gray-300 font-mono">
{`${binary} init $MONIKER --chain-id ${envPrefix}_CHAIN_ID
sed -i \\
  -e "s/chain-id = .*/chain-id = \\"${envPrefix}_CHAIN_ID\\"/" \\
  -e "s/keyring-backend = .*/keyring-backend = \\"os\\"/" \\
  -e "s/node = .*/node = \\"tcp:\\/\\/localhost:\${${envPrefix}_PORT}657\\"/" $HOME/.${baseName}/config/client.toml`}
              </code>
            </pre>
          </div>
        </div>

        {/* Download Genesis & Addrbook */}
        <div className="mb-8">
          <h3 className="text-xl font-bold text-white mb-4">Download Genesis & Addrbook</h3>
          
          {/* Genesis Section */}
          {customInstallDoc && customInstallDoc.includes('# Download genesis file') ? (
            <>
              <p className="text-sm text-white mb-2">Download Genesis</p>
              <div className="relative bg-[#0f0f0f] rounded-lg border border-gray-800 mb-4">
                <div className="absolute top-3 right-3 z-10">
                  <CopyButton text={(() => {
                    const section = customInstallDoc.split('# Download genesis file')[1];
                    if (!section) return '';
                    const codeMatch = section.match(/```bash\n([\s\S]*?)```/);
                    return codeMatch ? codeMatch[1].trim() : '';
                  })()} id="genesis" />
                </div>
                <pre className="p-6 overflow-x-auto text-xs leading-relaxed">
                  <code className="text-gray-300 font-mono">
{(() => {
  const section = customInstallDoc.split('# Download genesis file')[1];
  if (!section) return '';
  const codeMatch = section.match(/```bash\n([\s\S]*?)```/);
  return codeMatch ? codeMatch[1].trim() : '';
})()}
                  </code>
                </pre>
              </div>

              {/* Addrbook Section */}
              {customInstallDoc.includes('# Download addrbook') && (
                <>
                  <p className="text-sm text-white mb-2">Download Addrbook</p>
                  <div className="relative bg-[#0f0f0f] rounded-lg border border-gray-800">
                    <div className="absolute top-3 right-3 z-10">
                      <CopyButton text={(() => {
                        const section = customInstallDoc.split('# Download addrbook')[1];
                        if (!section) return '';
                        const codeMatch = section.match(/```bash\n([\s\S]*?)```/);
                        return codeMatch ? codeMatch[1].trim() : '';
                      })()} id="addrbook" />
                    </div>
                    <pre className="p-6 overflow-x-auto text-xs leading-relaxed">
                      <code className="text-gray-300 font-mono">
{(() => {
  const section = customInstallDoc.split('# Download addrbook')[1];
  if (!section) return '';
  const codeMatch = section.match(/```bash\n([\s\S]*?)```/);
  return codeMatch ? codeMatch[1].trim() : '';
})()}
                      </code>
                    </pre>
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="relative bg-[#0f0f0f] rounded-lg border border-gray-800">
              <div className="absolute top-3 right-3 z-10">
                <CopyButton text={(selectedChain as any).codebase?.genesis_url 
                  ? `wget -O $HOME/.${baseName}/config/genesis.json "${(selectedChain as any).codebase.genesis_url}"`
                  : selectedChain.rpc?.[0]
                  ? `wget -O $HOME/.${baseName}/config/genesis.json "${selectedChain.rpc[0].address}/genesis"`
                  : `# Download genesis manually`} id="genesis" />
              </div>
              <pre className="p-6 overflow-x-auto text-xs leading-relaxed">
                <code className="text-gray-300 font-mono">
{(selectedChain as any).codebase?.genesis_url 
  ? `wget -O $HOME/.${baseName}/config/genesis.json "${(selectedChain as any).codebase.genesis_url}"`
  : selectedChain.rpc?.[0]
  ? `wget -O $HOME/.${baseName}/config/genesis.json "${selectedChain.rpc[0].address}/genesis"`
  : `# Download genesis manually`}
                </code>
              </pre>
            </div>
          )}
        </div>

        {/* Configure Node - Peers */}
        <div className="mb-8">
          <h3 className="text-xl font-bold text-white mb-4">Configure Node</h3>
          <p className="text-sm text-white mb-4">Configure peers</p>
          <div className="relative bg-[#0f0f0f] rounded-lg border border-gray-800">
            <div className="absolute top-3 right-3 z-10">
              <CopyButton text={`SEEDS="${(selectedChain as any).seeds?.map((s: any) => `${s.id}@${s.address}`).join(',') || ''}"
${selectedChain.rpc?.[0] ? `PEERS=$(curl -sS ${selectedChain.rpc[0].address}/net_info | jq -r '.result.peers[] | select(.connection_status.SendMonitor.Active == true) | "\\(.node_info.id)@\\(.remote_ip):\\(.node_info.listen_addr | split(":") | .[-1])"' | paste -sd, -)` : 'PEERS=""'}
sed -i -e "s/^seeds *=.*/seeds = \\"$SEEDS\\"/; s/^persistent_peers *=.*/persistent_peers = \\"$PEERS\\"/" $HOME/.${baseName}/config/config.toml`} id="peers" />
            </div>
            <pre className="p-6 overflow-x-auto text-xs leading-relaxed">
              <code className="text-gray-300 font-mono">
{`SEEDS="${(selectedChain as any).seeds?.map((s: any) => `${s.id}@${s.address}`).join(',') || ''}"
${selectedChain.rpc?.[0] ? `PEERS=$(curl -sS ${selectedChain.rpc[0].address}/net_info | jq -r '.result.peers[] | select(.connection_status.SendMonitor.Active == true) | "\\(.node_info.id)@\\(.remote_ip):\\(.node_info.listen_addr | split(":") | .[-1])"' | paste -sd, -)` : 'PEERS=""'}
sed -i -e "s/^seeds *=.*/seeds = \\"$SEEDS\\"/; s/^persistent_peers *=.*/persistent_peers = \\"$PEERS\\"/" $HOME/.${baseName}/config/config.toml`}
              </code>
            </pre>
          </div>
        </div>


        {/* Update Ports */}
        <div className="mb-8">
          <p className="text-sm text-white mb-4">Update app.toml ports</p>
          <div className="relative bg-[#0f0f0f] rounded-lg border border-gray-800">
            <div className="absolute top-3 right-3 z-10">
              <CopyButton text={`sed -i.bak -e "s%:1317%:\${${envPrefix}_PORT}317%g;
s%:8080%:\${${envPrefix}_PORT}080%g;
s%:9090%:\${${envPrefix}_PORT}090%g;
s%:9091%:\${${envPrefix}_PORT}091%g;
s%:8545%:\${${envPrefix}_PORT}545%g;
s%:8546%:\${${envPrefix}_PORT}546%g;
s%:6065%:\${${envPrefix}_PORT}065%g" $HOME/.${baseName}/config/app.toml`} id="app-ports" />
            </div>
            <pre className="p-6 overflow-x-auto text-xs leading-relaxed">
              <code className="text-gray-300 font-mono">
{`sed -i.bak -e "s%:1317%:\${${envPrefix}_PORT}317%g;
s%:8080%:\${${envPrefix}_PORT}080%g;
s%:9090%:\${${envPrefix}_PORT}090%g;
s%:9091%:\${${envPrefix}_PORT}091%g;
s%:8545%:\${${envPrefix}_PORT}545%g;
s%:8546%:\${${envPrefix}_PORT}546%g;
s%:6065%:\${${envPrefix}_PORT}065%g" $HOME/.${baseName}/config/app.toml`}
              </code>
            </pre>
          </div>
        </div>

        {/* Update config.toml ports */}
        <div className="mb-8">
          <p className="text-sm text-white mb-4">Update config.toml ports</p>
          <div className="relative bg-[#0f0f0f] rounded-lg border border-gray-800">
            <div className="absolute top-3 right-3 z-10">
              <CopyButton text={`sed -i.bak -e "s%:26658%:\${${envPrefix}_PORT}658%g;
s%:26657%:\${${envPrefix}_PORT}657%g;
s%:6060%:\${${envPrefix}_PORT}060%g;
s%:26656%:\${${envPrefix}_PORT}656%g;
s%^external_address = \\"\\"% external_address = \\"$(wget -qO- eth0.me):\${${envPrefix}_PORT}656\\"%;
s%:26660%:\${${envPrefix}_PORT}660%g" $HOME/.${baseName}/config/config.toml`} id="config-ports" />
            </div>
            <pre className="p-6 overflow-x-auto text-xs leading-relaxed">
              <code className="text-gray-300 font-mono">
{`sed -i.bak -e "s%:26658%:\${${envPrefix}_PORT}658%g;
s%:26657%:\${${envPrefix}_PORT}657%g;
s%:6060%:\${${envPrefix}_PORT}060%g;
s%:26656%:\${${envPrefix}_PORT}656%g;
s%^external_address = \\"\\"% external_address = \\"$(wget -qO- eth0.me):\${${envPrefix}_PORT}656\\"%;
s%:26660%:\${${envPrefix}_PORT}660%g" $HOME/.${baseName}/config/config.toml`}
              </code>
            </pre>
          </div>
        </div>

        {/* Configure Pruning */}
        <div className="mb-8">
          <h3 className="text-xl font-bold text-white mb-4">Configure Pruning</h3>
          <p className="text-sm text-white mb-4">Pruning Strategy: Select a strategy to manage your node's storage usage. 💡Recommended for Validators to fine-tune storage.</p>
          
          {/* Pruning Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            <div>
              <label className="block text-xs text-white mb-1">Pruning</label>
              <select
                value={pruning}
                onChange={(e) => setPruning(e.target.value)}
                className="w-full bg-[#1a1a1a] border border-gray-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              >
                <option value="default">default</option>
                <option value="nothing">nothing</option>
                <option value="everything">everything</option>
                <option value="custom">custom</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-white mb-1">Keep Recent (blocks)</label>
              <input
                type="text"
                value={pruningKeepRecent}
                onChange={(e) => setPruningKeepRecent(e.target.value)}
                disabled={pruning !== 'custom'}
                className="w-full bg-[#1a1a1a] border border-gray-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 disabled:text-gray-500 disabled:cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-xs text-white mb-1">Interval (blocks)</label>
              <input
                type="text"
                value={pruningInterval}
                onChange={(e) => setPruningInterval(e.target.value)}
                disabled={pruning !== 'custom'}
                className="w-full bg-[#1a1a1a] border border-gray-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 disabled:text-gray-500 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          <div className="relative bg-[#0f0f0f] rounded-lg border border-gray-800">
            <div className="absolute top-3 right-3 z-10">
              <CopyButton text={`sed -i -e "s/^pruning *=.*/pruning = \\"${pruning}\\"/" $HOME/.${baseName}/config/app.toml 
sed -i -e "s/^pruning-keep-recent *=.*/pruning-keep-recent = \\"${pruningKeepRecent}\\"/" $HOME/.${baseName}/config/app.toml
sed -i -e "s/^pruning-interval *=.*/pruning-interval = \\"${pruningInterval}\\"/" $HOME/.${baseName}/config/app.toml`} id="pruning" />
            </div>
            <pre className="p-6 overflow-x-auto text-xs leading-relaxed">
              <code className="text-gray-300 font-mono">
{`sed -i -e "s/^pruning *=.*/pruning = \\"${pruning}\\"/" $HOME/.${baseName}/config/app.toml 
sed -i -e "s/^pruning-keep-recent *=.*/pruning-keep-recent = \\"${pruningKeepRecent}\\"/" $HOME/.${baseName}/config/app.toml
sed -i -e "s/^pruning-interval *=.*/pruning-interval = \\"${pruningInterval}\\"/" $HOME/.${baseName}/config/app.toml`}
              </code>
            </pre>
          </div>
        </div>


        {/* Set Minimum Gas Fee */}
        <div className="mb-8">
          <h3 className="text-xl font-bold text-white mb-4">Set Minimum Gas Fee & Other Parameters</h3>
          
          {/* Gas Price Info */}
          <div className="mb-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-400 font-medium">
                  {gasPriceLoading ? (
                    <>⏳ Fetching gas price from network...</>
                  ) : fetchedGasPrice !== null ? (
                    <>✅ Gas price fetched from recent transactions</>
                  ) : (
                    <>ℹ️ Using gas price from chain configuration</>
                  )}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Current minimum gas price: <span className="text-white font-mono">{gasPrice.toFixed(6)}{denom}</span>
                </p>
              </div>
              {!gasPriceLoading && (
                <button
                  onClick={() => fetchGasPriceFromRPC(selectedChain)}
                  className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 rounded text-sm transition-colors flex items-center gap-2"
                >
                  <RefreshCw className="w-3 h-3" />
                  Refresh
                </button>
              )}
            </div>
          </div>

          <div className="relative bg-[#0f0f0f] rounded-lg border border-gray-800">
            <div className="absolute top-3 right-3 z-10">
              <CopyButton text={`sed -i 's|minimum-gas-prices =.*|minimum-gas-prices = "${gasPrice}${denom}"|g' $HOME/.${baseName}/config/app.toml
sed -i -e "s/prometheus = false/prometheus = true/" $HOME/.${baseName}/config/config.toml
sed -i -e "s/^indexer *=.*/indexer = \\"null\\"/" $HOME/.${baseName}/config/config.toml`} id="gas" />
            </div>
            <pre className="p-6 overflow-x-auto text-xs leading-relaxed">
              <code className="text-gray-300 font-mono">
{`sed -i 's|minimum-gas-prices =.*|minimum-gas-prices = "${gasPrice}${denom}"|g' $HOME/.${baseName}/config/app.toml
sed -i -e "s/prometheus = false/prometheus = true/" $HOME/.${baseName}/config/config.toml
sed -i -e "s/^indexer *=.*/indexer = \\"null\\"/" $HOME/.${baseName}/config/config.toml`}
              </code>
            </pre>
          </div>
        </div>

        {/* Create Service */}
        <div className="mb-8">
          <h3 className="text-xl font-bold text-white mb-4">Create Service</h3>
          <div className="relative bg-[#0f0f0f] rounded-lg border border-gray-800">
            <div className="absolute top-3 right-3 z-10">
              <CopyButton text={`sudo tee /etc/systemd/system/${binary}.service > /dev/null <<EOF
[Unit]
Description=${(selectedChain as any).pretty_name || selectedChain.chain_name} node
After=network-online.target

[Service]
User=$USER
WorkingDirectory=$HOME/.${baseName}
ExecStart=$(which ${binary}) start --home $HOME/.${baseName}
Restart=on-failure
RestartSec=5
LimitNOFILE=65535

[Install]
WantedBy=multi-user.target
EOF`} id="service" />
            </div>
            <pre className="p-6 overflow-x-auto text-xs leading-relaxed">
              <code className="text-gray-300 font-mono">
{`sudo tee /etc/systemd/system/${binary}.service > /dev/null <<EOF
[Unit]
Description=${(selectedChain as any).pretty_name || selectedChain.chain_name} node
After=network-online.target

[Service]
User=$USER
WorkingDirectory=$HOME/.${baseName}
ExecStart=$(which ${binary}) start --home $HOME/.${baseName}
Restart=on-failure
RestartSec=5
LimitNOFILE=65535

[Install]
WantedBy=multi-user.target
EOF`}
              </code>
            </pre>
          </div>
        </div>

        {/* Start Service */}
        <div className="mb-8">
          <h3 className="text-xl font-bold text-white mb-4">Start Service</h3>
          <div className="relative bg-[#0f0f0f] rounded-lg border border-gray-800">
            <div className="absolute top-3 right-3 z-10">
              <CopyButton text={`sudo systemctl daemon-reload
sudo systemctl enable ${binary}
sudo systemctl restart ${binary} && sudo journalctl -u ${binary} -fo cat`} id="start" />
            </div>
            <pre className="p-6 overflow-x-auto text-xs leading-relaxed">
              <code className="text-gray-300 font-mono">
{`sudo systemctl daemon-reload
sudo systemctl enable ${binary}
sudo systemctl restart ${binary} && sudo journalctl -u ${binary} -fo cat`}
              </code>
            </pre>
          </div>
        </div>


        {/* Useful Commands */}
        <div className="mb-8">
          <h3 className="text-xl font-bold text-white mb-4">Useful Commands</h3>
          <p className="text-sm text-white mb-4">INFO: For a complete guide to creating a validator, visit our Cheat Sheet & Key Management page. It covers all the necessary commands and crucial steps for securing your keys.</p>
          
          <div className="space-y-4">
            <div>
              <p className="text-sm text-white mb-2">Check logs</p>
              <div className="relative bg-[#0f0f0f] rounded-lg border border-gray-800">
                <div className="absolute top-3 right-3 z-10">
                  <CopyButton text={`sudo journalctl -u ${binary} -fo cat`} id="logs" />
                </div>
                <pre className="p-6 overflow-x-auto text-xs leading-relaxed">
                  <code className="text-gray-300 font-mono">
{`sudo journalctl -u ${binary} -fo cat`}
                  </code>
                </pre>
              </div>
            </div>

            <div>
              <p className="text-sm text-white mb-2">Check Sync</p>
              <div className="relative bg-[#0f0f0f] rounded-lg border border-gray-800">
                <div className="absolute top-3 right-3 z-10">
                  <CopyButton text={`${binary} status 2>&1 | jq .SyncInfo`} id="sync" />
                </div>
                <pre className="p-6 overflow-x-auto text-xs leading-relaxed">
                  <code className="text-gray-300 font-mono">
{`${binary} status 2>&1 | jq .SyncInfo`}
                  </code>
                </pre>
              </div>
            </div>
          </div>
        </div>

        {/* Delete Node */}
        <div className="mb-8">
          <h3 className="text-xl font-bold text-white mb-4">Delete Node</h3>
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-4">
            <p className="text-red-400 text-sm">
              <strong>🚨 Warning:</strong> These commands will completely remove your node. Make sure to backup important data first!
            </p>
          </div>
          <div className="relative bg-[#0f0f0f] rounded-lg border border-red-800">
            <div className="absolute top-3 right-3 z-10">
              <CopyButton text={`sudo systemctl stop ${binary}
sudo systemctl disable ${binary}
sudo rm -rf /etc/systemd/system/${binary}.service
sudo rm $(which ${binary})
sudo rm -rf $HOME/.${baseName}
sed -i "/${envPrefix}_/d" $HOME/.bash_profile`} id="delete" />
            </div>
            <pre className="p-6 overflow-x-auto text-xs leading-relaxed">
              <code className="text-gray-300 font-mono">
{`sudo systemctl stop ${binary}
sudo systemctl disable ${binary}
sudo rm -rf /etc/systemd/system/${binary}.service
sudo rm $(which ${binary})
sudo rm -rf $HOME/.${baseName}
sed -i "/${envPrefix}_/d" $HOME/.bash_profile`}
              </code>
            </pre>
          </div>
        </div>

      </main>
      </div>
    </div>
  );
}
