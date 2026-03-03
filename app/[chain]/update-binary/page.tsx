'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { ChainData } from '@/types/chain';
import { Download, Copy, CheckCircle, Package, Terminal, RefreshCw } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { fetchChains } from '@/lib/apiCache';

interface ReleaseInfo {
  version: string;
  name: string;
  published_at: string;
  body: string;
  html_url: string;
  assets: Array<{
    name: string;
    size: number;
    download_url: string;
  }>;
}

export default function UpdateBinaryPage() {
  const params = useParams();
  const { language } = useLanguage();
  const [chains, setChains] = useState<ChainData[]>([]);
  const [selectedChain, setSelectedChain] = useState<ChainData | null>(null);
  const [releaseInfo, setReleaseInfo] = useState<ReleaseInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState('');
  const [serviceName, setServiceName] = useState('');
  const [homeDir, setHomeDir] = useState('');
  const [binaryName, setBinaryName] = useState('');
  const [customDownloadUrl, setCustomDownloadUrl] = useState('');
  const [customVersion, setCustomVersion] = useState('');

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
        const baseName = chain.chain_name.replace(/-mainnet|-test$/i, '');
        setServiceName(`${baseName}d`);
        setHomeDir(`$HOME/.${baseName}`);
        setBinaryName(`${baseName}d`);
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
            const baseName = chain.chain_name.replace(/-mainnet|-test$/i, '');
            setServiceName(`${baseName}d`);
            setHomeDir(`$HOME/.${baseName}`);
            setBinaryName(`${baseName}d`);
          }
        })
        .catch(error => console.error('Error loading chains:', error));
    }
  }, [params]);

  const fetchReleaseInfo = async () => {
    if (!selectedChain?.github) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/github-releases?repo=${encodeURIComponent(selectedChain.github)}`);
      const data = await response.json();
      
      if (response.ok) {
        setReleaseInfo(data);
      } else {
        console.warn('Failed to fetch release info:', data.error || 'Unknown error');
        setReleaseInfo(null);
      }
    } catch (error) {
      console.warn('Error fetching release info:', error);
      setReleaseInfo(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedChain) {
      fetchReleaseInfo();
    }
  }, [selectedChain]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(''), 2000);
  };

  const generateStandardUpdateScript = () => {
    if (!releaseInfo || !selectedChain) return '';
    
    const baseName = selectedChain.chain_name.replace(/-mainnet|-test$/i, '');
    const service = serviceName || `${baseName}d`;
    const home = homeDir || `$HOME/.${baseName}`;
    const binary = binaryName || `${baseName}d`;
    const version = customVersion || releaseInfo.version;
    
    // Use custom download URL if provided, otherwise find from assets
    let downloadUrl = customDownloadUrl;
    if (!downloadUrl) {
      const binaryAsset = releaseInfo.assets.find(asset => 
        asset.name.toLowerCase().includes('linux') && 
        (asset.name.toLowerCase().includes('amd64') || asset.name.toLowerCase().includes('x86_64'))
      );
      downloadUrl = binaryAsset 
        ? binaryAsset.download_url 
        : `${selectedChain.github}/releases/download/${version}/${binary}`;
    }
    
    return `#!/bin/bash

# Update Binary - Standard Cosmos
# Chain: ${selectedChain.chain_name}
# Version: ${version}

# Stop the service
sudo systemctl stop ${service}

# Backup current binary
sudo cp $(which ${binary}) $(which ${binary}).backup

# Download new binary
cd $HOME
wget -O ${binary}.tar.gz "${downloadUrl}"

# Extract if it's a tar.gz file
if [[ "${downloadUrl}" == *.tar.gz ]]; then
  tar -xzf ${binary}.tar.gz
  rm ${binary}.tar.gz
fi

# Make it executable
chmod +x ${binary}

# Move to bin directory
sudo mv ${binary} $(which ${binary})

# Verify version
${binary} version

# Start the service
sudo systemctl start ${service}

# Check logs
journalctl -u ${service} -f`;
  };

  const generateCosmovisorUpdateScript = () => {
    if (!releaseInfo || !selectedChain) return '';
    
    const baseName = selectedChain.chain_name.replace(/-mainnet|-test$/i, '');
    const service = serviceName || `${baseName}d`;
    const home = homeDir || `$HOME/.${baseName}`;
    const binary = binaryName || `${baseName}d`;
    const version = customVersion || releaseInfo.version;
    
    // Use custom download URL if provided, otherwise find from assets
    let downloadUrl = customDownloadUrl;
    if (!downloadUrl) {
      const binaryAsset = releaseInfo.assets.find(asset => 
        asset.name.toLowerCase().includes('linux') && 
        (asset.name.toLowerCase().includes('amd64') || asset.name.toLowerCase().includes('x86_64'))
      );
      downloadUrl = binaryAsset 
        ? binaryAsset.download_url 
        : `${selectedChain.github}/releases/download/${version}/${binary}`;
    }
    
    return `#!/bin/bash

# Update Binary - Cosmovisor
# Chain: ${selectedChain.chain_name}
# Version: ${version}

# Stop the service
sudo systemctl stop ${service}

# Create upgrade directory
mkdir -p ${home}/cosmovisor/upgrades/${version}/bin

# Download new binary
cd $HOME
wget -O ${binary}.tar.gz "${downloadUrl}"

# Extract if it's a tar.gz file
if [[ "${downloadUrl}" == *.tar.gz ]]; then
  tar -xzf ${binary}.tar.gz
  rm ${binary}.tar.gz
fi

# Make it executable
chmod +x ${binary}

# Move to cosmovisor upgrade directory
mv ${binary} ${home}/cosmovisor/upgrades/${version}/bin/

# Verify version
${home}/cosmovisor/upgrades/${version}/bin/${binary} version

# Create symlink for auto-upgrade (optional)
# ln -sf ${home}/cosmovisor/upgrades/${version} ${home}/cosmovisor/current

# Start the service
sudo systemctl start ${service}

# Check logs
journalctl -u ${service} -f`;
  };

  const generateManualSteps = () => {
    if (!releaseInfo || !selectedChain) return [];
    
    const baseName = selectedChain.chain_name.replace(/-mainnet|-test$/i, '');
    const service = serviceName || `${baseName}d`;
    const binary = binaryName || `${baseName}d`;
    const version = releaseInfo.version;
    
    // Find binary asset from release assets
    const binaryAsset = releaseInfo.assets.find(asset => 
      asset.name.toLowerCase().includes('linux') && 
      (asset.name.toLowerCase().includes('amd64') || asset.name.toLowerCase().includes('x86_64'))
    );
    
    const downloadUrl = binaryAsset 
      ? binaryAsset.download_url 
      : `${selectedChain.github}/releases/download/${version}/${binary}`;
    
    const isArchive = downloadUrl.includes('.tar.gz') || downloadUrl.includes('.zip');
    
    const steps = [
      {
        title: 'Stop Your Node',
        description: 'Stop the running node service',
        command: `sudo systemctl stop ${service}`
      },
      {
        title: 'Backup Current Binary',
        description: 'Create a backup of your current binary',
        command: `sudo cp $(which ${binary}) $(which ${binary}).backup`
      },
      {
        title: 'Download New Binary',
        description: `Download version ${version} from GitHub`,
        command: `cd $HOME && wget -O ${binary}${isArchive ? '.tar.gz' : ''} "${downloadUrl}"`
      }
    ];
    
    if (isArchive) {
      steps.push({
        title: 'Extract Archive',
        description: 'Extract the downloaded archive',
        command: `tar -xzf ${binary}.tar.gz && rm ${binary}.tar.gz`
      });
    }
    
    steps.push(
      {
        title: 'Make Executable',
        description: 'Set executable permissions',
        command: `chmod +x ${binary}`
      },
      {
        title: 'Replace Binary',
        description: 'Move new binary to bin directory',
        command: `sudo mv ${binary} $(which ${binary})`
      },
      {
        title: 'Verify Version',
        description: 'Check the installed version',
        command: `${binary} version`
      },
      {
        title: 'Start Node',
        description: 'Start the node service',
        command: `sudo systemctl start ${service}`
      },
      {
        title: 'Check Logs',
        description: 'Monitor the node logs',
        command: `journalctl -u ${service} -f`
      }
    );
    
    return steps;
  };

  // If chain doesn't have GitHub link, show message
  if (!selectedChain?.github) {
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
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-white mb-2 flex items-center">
                <Download className="w-8 h-8 mr-3" />
                Update Binary
              </h1>
            </div>

            <div className="bg-[#1a1a1a] rounded-lg p-8 border border-gray-800 text-center">
              <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-white mb-2">No GitHub Repository</h2>
              <p className="text-gray-400">
                This chain does not have a GitHub repository configured.
              </p>
            </div>
          </main>
        </div>
      </div>
    );
  }

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
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center">
              <Download className="w-8 h-8 mr-3" />
              Update Binary
            </h1>
            <p className="text-gray-400">
              Update your node to the latest version from GitHub releases
            </p>
          </div>

          {loading ? (
            <div className="text-center py-20">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              <p className="mt-4 text-gray-400">Loading release information...</p>
            </div>
          ) : releaseInfo ? (
            <div className="space-y-6">
              {/* Release Info */}
              <div className="bg-[#1a1a1a] rounded-lg p-6 border border-gray-800">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-white mb-2 flex items-center">
                      <Package className="w-5 h-5 mr-2" />
                      Latest Release
                    </h2>
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-mono">
                        {releaseInfo.version}
                      </span>
                      <span className="text-gray-400 text-sm">
                        Released: {new Date(releaseInfo.published_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={fetchReleaseInfo}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Refresh</span>
                  </button>
                </div>

                {releaseInfo.body && (
                  <div className="mt-4 p-4 bg-[#0f0f0f] rounded-lg">
                    <h3 className="text-sm font-semibold text-gray-400 mb-2">Release Notes:</h3>
                    <div className="text-sm text-gray-300 whitespace-pre-wrap max-h-64 overflow-y-auto">
                      {releaseInfo.body}
                    </div>
                  </div>
                )}

                {/* Available Assets */}
                {releaseInfo.assets && releaseInfo.assets.length > 0 && (
                  <div className="mt-4 p-4 bg-[#0f0f0f] rounded-lg">
                    <h3 className="text-sm font-semibold text-gray-400 mb-3">Available Assets:</h3>
                    <div className="space-y-2">
                      {releaseInfo.assets.map((asset, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-[#1a1a1a] rounded p-3 group">
                          <div className="flex-1">
                            <p className="text-sm text-white font-mono">{asset.name}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              Size: {(asset.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                          <a
                            href={asset.download_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-4 px-3 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 text-sm rounded transition-colors flex items-center gap-2"
                          >
                            <Download className="w-3 h-3" />
                            Download
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-4">
                  <a
                    href={releaseInfo.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    View on GitHub →
                  </a>
                </div>
              </div>

              {/* Configuration Inputs */}
              <div className="bg-[#1a1a1a] rounded-lg p-6 border border-gray-800">
                <h2 className="text-xl font-bold text-white mb-2 flex items-center">
                  <Terminal className="w-5 h-5 mr-2" />
                  Configuration
                </h2>
                <p className="text-sm text-gray-400 mb-4">
                  Leave empty to use default values from chain configuration and latest release
                </p>
                
                {/* Binary Configuration */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-white mb-3">Binary Configuration</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        Download URL (Optional)
                      </label>
                      <input
                        type="text"
                        value={customDownloadUrl}
                        onChange={(e) => setCustomDownloadUrl(e.target.value)}
                        placeholder={releaseInfo?.assets?.[0]?.download_url || "Auto-detect from latest release"}
                        className="w-full bg-[#0f0f0f] border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors text-sm"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Default: {releaseInfo?.assets?.[0] ? 'Latest release asset' : 'Auto-detect'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        Version (Optional)
                      </label>
                      <input
                        type="text"
                        value={customVersion}
                        onChange={(e) => setCustomVersion(e.target.value)}
                        placeholder={releaseInfo?.version || "Latest version"}
                        className="w-full bg-[#0f0f0f] border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Default: {releaseInfo?.version || 'Latest'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Node Configuration */}
                <div>
                  <h3 className="text-sm font-semibold text-white mb-3">Node Configuration</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        Service Name
                      </label>
                      <input
                        type="text"
                        value={serviceName}
                        onChange={(e) => setServiceName(e.target.value)}
                        placeholder={`${selectedChain?.chain_name.replace(/-mainnet|-test$/i, '')}d (default)`}
                        className="w-full bg-[#0f0f0f] border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                      />
                      <p className="mt-1 text-xs text-gray-500">Default: {selectedChain?.chain_name.replace(/-mainnet|-test$/i, '')}d</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        Home Directory
                      </label>
                      <input
                        type="text"
                        value={homeDir}
                        onChange={(e) => setHomeDir(e.target.value)}
                        placeholder={`$HOME/.${selectedChain?.chain_name.replace(/-mainnet|-test$/i, '')} (default)`}
                        className="w-full bg-[#0f0f0f] border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                      />
                      <p className="mt-1 text-xs text-gray-500">Default: $HOME/.{selectedChain?.chain_name.replace(/-mainnet|-test$/i, '')}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        Binary Name
                      </label>
                      <input
                        type="text"
                        value={binaryName}
                        onChange={(e) => setBinaryName(e.target.value)}
                        placeholder={`${selectedChain?.chain_name.replace(/-mainnet|-test$/i, '')}d (default)`}
                        className="w-full bg-[#0f0f0f] border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                      />
                      <p className="mt-1 text-xs text-gray-500">Default: {selectedChain?.chain_name.replace(/-mainnet|-test$/i, '')}d</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Standard Cosmos Update */}
              <div className="bg-[#1a1a1a] rounded-lg p-6 border border-gray-800">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-white">Standard Cosmos Update</h2>
                  <button
                    onClick={() => copyToClipboard(generateStandardUpdateScript(), 'standard')}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
                  >
                    {copied === 'standard' ? (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copy Script</span>
                      </>
                    )}
                  </button>
                </div>
                
                <pre className="bg-[#0f0f0f] rounded-lg p-4 overflow-x-auto text-sm text-gray-300 font-mono">
                  {generateStandardUpdateScript()}
                </pre>
                <div className="mt-4 bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                  <p className="text-blue-400 text-sm">
                    💡 <strong>Tip:</strong> This script is for standard Cosmos SDK installations without Cosmovisor
                  </p>
                </div>
              </div>

              {/* Cosmovisor Update */}
              <div className="bg-[#1a1a1a] rounded-lg p-6 border border-gray-800">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-white">Cosmovisor Update</h2>
                  <button
                    onClick={() => copyToClipboard(generateCosmovisorUpdateScript(), 'cosmovisor')}
                    className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 rounded-lg transition-colors"
                  >
                    {copied === 'cosmovisor' ? (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copy Script</span>
                      </>
                    )}
                  </button>
                </div>
                
                <pre className="bg-[#0f0f0f] rounded-lg p-4 overflow-x-auto text-sm text-gray-300 font-mono">
                  {generateCosmovisorUpdateScript()}
                </pre>
                <div className="mt-4 bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                  <p className="text-green-400 text-sm">
                    💡 <strong>Tip:</strong> This script prepares the binary for Cosmovisor auto-upgrade
                  </p>
                </div>
              </div>

              {/* Warning */}
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-6">
                <p className="text-yellow-500 font-medium mb-2">⚠️ Important Notes:</p>
                <ul className="text-gray-400 text-sm space-y-1 list-disc list-inside">
                  <li>Always backup your validator keys before updating</li>
                  <li>Test the update on a non-validator node first if possible</li>
                  <li>Make sure you have enough disk space for the new binary</li>
                  <li>Monitor your node logs after the update</li>
                  <li>Keep the backup binary in case you need to rollback</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="bg-[#1a1a1a] rounded-lg p-8 border border-gray-800 text-center">
              <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-white mb-2">No Releases Found</h2>
              <p className="text-gray-400 mb-4">
                No releases found for this repository or unable to fetch release information.
              </p>
              <div className="space-y-3">
                <a
                  href={`${selectedChain.github}/releases`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                >
                  View Releases on GitHub →
                </a>
                <p className="text-sm text-gray-500">
                  You can manually download binaries from the GitHub releases page
                </p>
              </div>
              
              {/* Manual Download Instructions */}
              <div className="mt-6 p-4 bg-[#0f0f0f] rounded-lg text-left">
                <h3 className="text-sm font-semibold text-gray-400 mb-3">Manual Download Steps:</h3>
                <ol className="text-sm text-gray-300 space-y-2 list-decimal list-inside">
                  <li>Visit the <a href={`${selectedChain.github}/releases`} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">GitHub releases page</a></li>
                  <li>Find the latest release for your platform (usually linux-amd64)</li>
                  <li>Download the binary file</li>
                  <li>Extract if it's an archive (tar.gz, zip)</li>
                  <li>Make it executable: <code className="text-blue-400 bg-black/50 px-2 py-1 rounded">chmod +x binary-name</code></li>
                  <li>Move to your bin directory: <code className="text-blue-400 bg-black/50 px-2 py-1 rounded">sudo mv binary-name /usr/local/bin/</code></li>
                </ol>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
