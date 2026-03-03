'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { ChainData } from '@/types/chain';
import { fetchChains } from '@/lib/apiCache';
import { Copy, CheckCircle } from 'lucide-react';

export default function CheatSheetPage() {
  const params = useParams();
  const [chains, setChains] = useState<ChainData[]>([]);
  const [selectedChain, setSelectedChain] = useState<ChainData | null>(null);
  const [copied, setCopied] = useState('');
  const [customCheatSheet, setCustomCheatSheet] = useState<string | null>(null);

  // Validator operation inputs
  const [moniker, setMoniker] = useState('');
  const [identity, setIdentity] = useState('');
  const [details, setDetails] = useState('Professional validator providing secure and reliable infrastructure');
  const [website, setWebsite] = useState('');
  const [securityContact, setSecurityContact] = useState('');
  const [commissionRate, setCommissionRate] = useState('0.1');
  const [commissionMaxRate, setCommissionMaxRate] = useState('0.2');
  const [commissionMaxChangeRate, setCommissionMaxChangeRate] = useState('0.01');
  const [minSelfDelegation, setMinSelfDelegation] = useState('1');

  // Governance inputs
  const [proposalTitle, setProposalTitle] = useState('');
  const [proposalDescription, setProposalDescription] = useState('');

  // Port configuration
  const [customPort, setCustomPort] = useState('26');

  // Set Vars inputs
  const [wallet, setWallet] = useState('wallet');
  const [nodeName, setNodeName] = useState('');

  // Token operation inputs
  const [transferToAddress, setTransferToAddress] = useState('');
  const [transferAmount, setTransferAmount] = useState('1000000');
  const [delegateAmount, setDelegateAmount] = useState('1000000');
  const [delegateToValoper, setDelegateToValoper] = useState('');
  const [redelegateAmount, setRedelegateAmount] = useState('1000000');
  const [redelegateToValoper, setRedelegateToValoper] = useState('');
  const [unbondAmount, setUnbondAmount] = useState('1000000');

  // Sync check inputs
  const [networkRpc, setNetworkRpc] = useState('');
  const [nodeHomeDir, setNodeHomeDir] = useState('');

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
        // Set default network RPC from chain data
        if (chain.rpc && chain.rpc.length > 0) {
          setNetworkRpc(chain.rpc[0].address);
        }
        // Set default home directory
        const chainBaseName = chain.chain_name.replace(/-mainnet|-test$/i, '');
        setNodeHomeDir(`$HOME/.${chainBaseName}`);
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
            // Set default network RPC from chain data
            if (chain.rpc && chain.rpc.length > 0) {
              setNetworkRpc(chain.rpc[0].address);
            }
            // Set default home directory
            const chainBaseName = chain.chain_name.replace(/-mainnet|-test$/i, '');
            setNodeHomeDir(`$HOME/.${chainBaseName}`);
          }
        })
        .catch(error => console.error('Error loading chains:', error));
    }
  }, [params]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(''), 2000);
  };

  if (!selectedChain) return null;

  const baseName = selectedChain.chain_name.replace(/-mainnet|-test$/i, '');
  const binary = `${baseName}d`;
  const chainId = selectedChain.chain_id;

  // Get accurate denom from chain data
  const feeToken = (selectedChain as any)?.fees?.fee_tokens?.[0];
  const denom = feeToken?.denom || selectedChain.assets?.[0]?.base || 'utoken';

  const sections = [
    {
      title: 'Set Vars',
      commands: [
        {
          label: 'Set Variables',
          cmd: `echo "export WALLET=\\"${wallet}\\"" >> $HOME/.bash_profile
echo "export MONIKER=\\"${nodeName || '$MONIKER'}\\"" >> $HOME/.bash_profile
echo "export ${baseName.toUpperCase()}_CHAIN_ID=\\"${chainId}\\"" >> $HOME/.bash_profile
echo "export ${baseName.toUpperCase()}_PORT=\\"${customPort}\\"" >> $HOME/.bash_profile
source $HOME/.bash_profile`
        },
        {
          label: 'Load Variables',
          cmd: `source $HOME/.bash_profile`
        },
      ]
    },
    {
      title: 'Check Sync Status 🔄',
      commands: [
        {
          label: 'Check Sync Status (Live Monitor)',
          cmd: `#!/bin/bash

# Node home directory
node_home="${nodeHomeDir || `$HOME/.${baseName}`}"

# Get RPC port from config
rpc_port=$(grep -m 1 -oP '^laddr = "\\K[^"]+' "$node_home/config/config.toml" | cut -d ':' -f 3)

# Network RPC endpoint
network_rpc="${networkRpc || 'https://rpc.example.com'}"

echo -e "\\033[1;36m========================================\\033[0m"
echo -e "\\033[1;36m       Sync Status Monitor\\033[0m"
echo -e "\\033[1;36m========================================\\033[0m"
echo -e "\\033[1;33mNode Home:\\033[0m $node_home"
echo -e "\\033[1;33mLocal RPC:\\033[0m localhost:$rpc_port"
echo -e "\\033[1;33mNetwork RPC:\\033[0m $network_rpc"
echo -e "\\033[1;36m========================================\\033[0m"
echo ""

while true; do
  # Get local height
  local_height=$(curl -s localhost:$rpc_port/status | jq -r '.result.sync_info.latest_block_height')
  
  # Get network height
  network_height=$(curl -s $network_rpc/status | jq -r '.result.sync_info.latest_block_height')
  
  # Validate heights
  if ! [[ "$local_height" =~ ^[0-9]+$ ]] || ! [[ "$network_height" =~ ^[0-9]+$ ]]; then
    echo -e "\\033[1;31m❌ Error: Invalid block height data. Retrying...\\033[0m"
    sleep 5
    continue
  fi
  
  # Calculate blocks left
  blocks_left=$((network_height - local_height))
  
  # Calculate sync percentage
  sync_percentage=$(awk "BEGIN {printf \\"%.2f\\", ($local_height / $network_height) * 100}")
  
  # Determine sync status
  if [ $blocks_left -le 10 ]; then
    status="\\033[1;32m✅ SYNCED\\033[0m"
  elif [ $blocks_left -le 100 ]; then
    status="\\033[1;33m⚡ ALMOST SYNCED\\033[0m"
  else
    status="\\033[1;31m🔄 SYNCING\\033[0m"
  fi
  
  # Display status
  echo -e "\\033[1;36m[$(date '+%Y-%m-%d %H:%M:%S')]\\033[0m $status"
  echo -e "\\033[1;33mNode Height:\\033[1;34m $local_height\\033[0m \\033[1;33m| Network Height:\\033[1;36m $network_height\\033[0m"
  echo -e "\\033[1;33mBlocks Left:\\033[1;31m $blocks_left\\033[0m \\033[1;33m| Progress:\\033[1;32m $sync_percentage%\\033[0m"
  echo -e "\\033[1;36m----------------------------------------\\033[0m"
  
  sleep 5
done`
        },
        {
          label: 'Check Sync Status (One-time)',
          cmd: `node_home="${nodeHomeDir || `$HOME/.${baseName}`}"
rpc_port=$(grep -m 1 -oP '^laddr = "\\K[^"]+' "$node_home/config/config.toml" | cut -d ':' -f 3)
local_height=$(curl -s localhost:$rpc_port/status | jq -r '.result.sync_info.latest_block_height')
network_height=$(curl -s ${networkRpc || 'https://rpc.example.com'}/status | jq -r '.result.sync_info.latest_block_height')
blocks_left=$((network_height - local_height))

echo "Node Height: $local_height"
echo "Network Height: $network_height"
echo "Blocks Left: $blocks_left"`
        },
        {
          label: 'Check if Node is Catching Up',
          cmd: `${binary} status 2>&1 | jq -r '.SyncInfo.catching_up'`
        }
      ]
    },
    {
      title: 'Service operations ⚙️',
      commands: [
        { label: 'Check logs', cmd: `sudo journalctl -u ${binary} -fo cat` },
        { label: 'Start service', cmd: `sudo systemctl start ${binary}` },
        { label: 'Stop service', cmd: `sudo systemctl stop ${binary}` },
        { label: 'Restart service', cmd: `sudo systemctl restart ${binary}` },
        { label: 'Check service status', cmd: `sudo systemctl status ${binary}` },
        { label: 'Reload services', cmd: 'sudo systemctl daemon-reload' },
        { label: 'Enable Service', cmd: `sudo systemctl enable ${binary}` },
        { label: 'Disable Service', cmd: `sudo systemctl disable ${binary}` },
        { label: 'Node info', cmd: `${binary} status 2>&1 | jq` },
        { label: 'Your node peer', cmd: `echo $(${binary} tendermint show-node-id)'@'$(wget -qO- eth0.me)':'$(cat $HOME/.${baseName}/config/config.toml | sed -n '/Address to listen for incoming connection/{n;p;}' | sed 's/.*://; s/".*//')` },
      ]
    },
    {
      title: 'Key management',
      commands: [
        { label: 'Add New Wallet', cmd: `${binary} keys add $WALLET` },
        { label: 'Restore executing wallet', cmd: `${binary} keys add $WALLET --recover` },
        { label: 'List All Wallets', cmd: `${binary} keys list` },
        { label: 'Delete wallet', cmd: `${binary} keys delete $WALLET` },
        { label: 'Check Balance', cmd: `${binary} q bank balances $WALLET_ADDRESS` },
        { label: 'Export Key (save to wallet.backup)', cmd: `${binary} keys export $WALLET` },
        { label: 'Import Key (restore from wallet.backup)', cmd: `${binary} keys import $WALLET wallet.backup` },
      ]
    },
    {
      title: 'Tokens',
      commands: [
        { label: 'Withdraw all rewards', cmd: `${binary} tx distribution withdraw-all-rewards --from $WALLET --chain-id ${chainId} --gas auto --gas-adjustment 1.5 -y` },
        { label: 'Withdraw rewards and commission', cmd: `${binary} tx distribution withdraw-rewards $VALOPER_ADDRESS --from $WALLET --commission --chain-id ${chainId} --gas auto --gas-adjustment 1.5 -y` },
        { label: 'Check your balance', cmd: `${binary} query bank balances $WALLET_ADDRESS` },
        { label: 'Delegate to Yourself', cmd: `${binary} tx staking delegate $(${binary} keys show $WALLET --bech val -a) ${delegateAmount}${denom} --from $WALLET --chain-id ${chainId} --gas auto --gas-adjustment 1.5 -y` },
        { label: 'Delegate', cmd: `${binary} tx staking delegate ${delegateToValoper || '<TO_VALOPER_ADDRESS>'} ${delegateAmount}${denom} --from $WALLET --chain-id ${chainId} --gas auto --gas-adjustment 1.5 -y` },
        { label: 'Redelegate', cmd: `${binary} tx staking redelegate $VALOPER_ADDRESS ${redelegateToValoper || '<TO_VALOPER_ADDRESS>'} ${redelegateAmount}${denom} --from $WALLET --chain-id ${chainId} --gas auto --gas-adjustment 1.5 -y` },
        { label: 'Unbond', cmd: `${binary} tx staking unbond $(${binary} keys show $WALLET --bech val -a) ${unbondAmount}${denom} --from $WALLET --chain-id ${chainId} --gas auto --gas-adjustment 1.5 -y` },
        { label: 'Transfer Funds', cmd: `${binary} tx bank send $WALLET_ADDRESS ${transferToAddress || '<TO_WALLET_ADDRESS>'} ${transferAmount}${denom} --gas auto --gas-adjustment 1.5 -y` },
      ]
    },
    {
      title: 'Validator operations',
      commands: [
        {
          label: 'Create New Validator', cmd: `${binary} tx staking create-validator \\
--amount 1000000${denom} \\
--from $WALLET \\
--commission-rate ${commissionRate} \\
--commission-max-rate ${commissionMaxRate} \\
--commission-max-change-rate ${commissionMaxChangeRate} \\
--min-self-delegation ${minSelfDelegation} \\
--pubkey $(${binary} tendermint show-validator) \\
--moniker "${moniker || '$MONIKER'}" \\
--identity "${identity}" \\
--details "${details}" \\${website ? `\n--website "${website}" \\` : ''}${securityContact ? `\n--security-contact "${securityContact}" \\` : ''}
--chain-id ${chainId} \\
--gas auto --gas-adjustment 1.5 \\
-y` },
        {
          label: 'Edit Existing Validator', cmd: `${binary} tx staking edit-validator \\
--commission-rate ${commissionRate} \\
--new-moniker "${moniker || '$MONIKER'}" \\
--identity "${identity}" \\
--details "${details}" \\${website ? `\n--website "${website}" \\` : ''}${securityContact ? `\n--security-contact "${securityContact}" \\` : ''}
--from $WALLET \\
--chain-id ${chainId} \\
--gas auto --gas-adjustment 1.5 \\
-y` },
        { label: 'Validator info', cmd: `${binary} status 2>&1 | jq` },
        { label: 'Validator Details', cmd: `${binary} q staking validator $(${binary} keys show $WALLET --bech val -a)` },
        { label: 'Jailing info', cmd: `${binary} q slashing signing-info $(${binary} tendermint show-validator)` },
        { label: 'Slashing parameters', cmd: `${binary} q slashing params` },
        { label: 'Unjail validator', cmd: `${binary} tx slashing unjail --from $WALLET --chain-id ${chainId} --gas auto --gas-adjustment 1.5 -y` },
        { label: 'Active Validators List', cmd: `${binary} q staking validators -oj --limit=2000 | jq '.validators[] | select(.status=="BOND_STATUS_BONDED")' | jq -r '(.tokens|tonumber/pow(10; 6)|floor|tostring) + " \\t " + .description.moniker' | sort -gr | nl` },
        { label: 'Check Validator key', cmd: `[[ $(${binary} q staking validator $VALOPER_ADDRESS -oj | jq -r .consensus_pubkey.key) = $(${binary} status | jq -r .ValidatorInfo.PubKey.value) ]] && echo -e "Your key status is ok" || echo -e "Your key status is error"` },
        { label: 'Signing info', cmd: `${binary} q slashing signing-info $(${binary} tendermint show-validator)` },
      ]
    },
    {
      title: 'Governance',
      commands: [
        {
          label: 'Create New Text Proposal', cmd: `${binary} tx gov submit-proposal \\
--title "${proposalTitle || 'Proposal Title'}" \\
--description "${proposalDescription || 'Proposal Description'}" \\
--deposit 1000000${denom} \\
--type Text \\
--from $WALLET \\
--gas auto --gas-adjustment 1.5 \\
-y` },
        { label: 'Proposals List', cmd: `${binary} query gov proposals` },
        { label: 'View proposal', cmd: `${binary} query gov proposal 1` },
        { label: 'Vote', cmd: `${binary} tx gov vote 1 yes --from $WALLET --chain-id ${chainId} --gas auto --gas-adjustment 1.5 -y` },
      ]
    },
    {
      title: 'Update Port Configuration',
      commands: [
        {
          label: 'Update Ports',
          cmd: `# Set custom port
PORT=${customPort}

# Update app.toml ports
sed -i.bak -e "s%:1317%:\${PORT}317%g; \\
s%:8080%:\${PORT}080%g; \\
s%:9090%:\${PORT}090%g; \\
s%:9091%:\${PORT}091%g; \\
s%:8545%:\${PORT}545%g; \\
s%:8546%:\${PORT}546%g; \\
s%:6065%:\${PORT}065%g" $HOME/.${baseName}/config/app.toml

# Update config.toml ports
sed -i.bak -e "s%:26658%:\${PORT}658%g; \\
s%:26657%:\${PORT}657%g; \\
s%:6060%:\${PORT}060%g; \\
s%:26656%:\${PORT}656%g; \\
s%^external_address = \\"\\"%%external_address = \\"$(wget -qO- eth0.me):\${PORT}656\\"%; \\
s%:26660%:\${PORT}660%g" $HOME/.${baseName}/config/config.toml

echo "Ports updated successfully!"
echo "API: \${PORT}317"
echo "gRPC: \${PORT}090"
echo "P2P: \${PORT}656"
echo "RPC: \${PORT}657"`
        },
      ]
    },
  ];

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
            <h1 className="text-2xl font-bold text-white mb-2">Cheat Sheet</h1>
            <p className="text-sm text-white">
              Useful commands for node operators
            </p>
          </div>

          <div className="space-y-6">
            {sections.map((section, idx) => (
              <div key={idx} className="bg-[#1a1a1a] rounded-lg border border-gray-800 p-6">
                <h2 className="text-xl font-bold text-white mb-4">{section.title}</h2>

                {/* Check Sync Status Input Fields */}
                {section.title === 'Check Sync Status 🔄' && (
                  <div className="mb-6 bg-[#0f0f0f] rounded-lg p-4 border border-gray-700">
                    <h3 className="text-sm font-semibold text-white mb-3">Sync Monitor Configuration</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-white mb-1">Node Home Directory</label>
                        <input
                          type="text"
                          value={nodeHomeDir}
                          onChange={(e) => setNodeHomeDir(e.target.value)}
                          placeholder={`$HOME/.${baseName}`}
                          className="w-full bg-[#1a1a1a] border border-gray-700 rounded px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                        />
                        <p className="mt-1 text-xs text-gray-400">
                          Path to your node's config directory
                        </p>
                      </div>
                      <div>
                        <label className="block text-xs text-white mb-1">Network RPC Endpoint</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={networkRpc}
                            onChange={(e) => setNetworkRpc(e.target.value)}
                            placeholder="https://rpc.example.com"
                            className="flex-1 bg-[#1a1a1a] border border-gray-700 rounded px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                          />
                          {selectedChain?.rpc && selectedChain.rpc.length > 1 && (
                            <select
                              onChange={(e) => setNetworkRpc(e.target.value)}
                              className="bg-[#1a1a1a] border border-gray-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                            >
                              <option value="">Select RPC</option>
                              {selectedChain.rpc.map((rpc, idx) => (
                                <option key={idx} value={rpc.address}>
                                  {rpc.provider || `RPC ${idx + 1}`}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-gray-400">
                          💡 Select from available RPCs or enter custom endpoint
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Set Vars Input Fields */}
                {section.title === 'Set Vars' && (
                  <div className="mb-6 bg-[#0f0f0f] rounded-lg p-4 border border-gray-700">
                    <h3 className="text-sm font-semibold text-white mb-3">Configuration Variables</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs text-white mb-1">Wallet Name</label>
                        <input
                          type="text"
                          value={wallet}
                          onChange={(e) => setWallet(e.target.value)}
                          placeholder="wallet"
                          className="w-full bg-[#1a1a1a] border border-gray-700 rounded px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-white mb-1">Moniker</label>
                        <input
                          type="text"
                          value={nodeName}
                          onChange={(e) => setNodeName(e.target.value)}
                          placeholder="Your node name"
                          className="w-full bg-[#1a1a1a] border border-gray-700 rounded px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-white mb-1">Port Prefix</label>
                        <input
                          type="text"
                          value={customPort}
                          onChange={(e) => setCustomPort(e.target.value)}
                          placeholder="26"
                          className="w-full bg-[#1a1a1a] border border-gray-700 rounded px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Token Operations Input Fields */}
                {section.title === 'Tokens' && (
                  <div className="mb-6 bg-[#0f0f0f] rounded-lg p-4 border border-gray-700">
                    <h3 className="text-sm font-semibold text-white mb-3">Token Operation Parameters</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs text-white mb-1">Transfer To Address</label>
                        <input
                          type="text"
                          value={transferToAddress}
                          onChange={(e) => setTransferToAddress(e.target.value)}
                          placeholder="Recipient address"
                          className="w-full bg-[#1a1a1a] border border-gray-700 rounded px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-white mb-1">Transfer Amount</label>
                        <input
                          type="text"
                          value={transferAmount}
                          onChange={(e) => setTransferAmount(e.target.value)}
                          placeholder="1000000"
                          className="w-full bg-[#1a1a1a] border border-gray-700 rounded px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-white mb-1">Delegate Amount</label>
                        <input
                          type="text"
                          value={delegateAmount}
                          onChange={(e) => setDelegateAmount(e.target.value)}
                          placeholder="1000000"
                          className="w-full bg-[#1a1a1a] border border-gray-700 rounded px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-white mb-1">Delegate To Valoper</label>
                        <input
                          type="text"
                          value={delegateToValoper}
                          onChange={(e) => setDelegateToValoper(e.target.value)}
                          placeholder="Validator operator address"
                          className="w-full bg-[#1a1a1a] border border-gray-700 rounded px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-white mb-1">Redelegate Amount</label>
                        <input
                          type="text"
                          value={redelegateAmount}
                          onChange={(e) => setRedelegateAmount(e.target.value)}
                          placeholder="1000000"
                          className="w-full bg-[#1a1a1a] border border-gray-700 rounded px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-white mb-1">Redelegate To Valoper</label>
                        <input
                          type="text"
                          value={redelegateToValoper}
                          onChange={(e) => setRedelegateToValoper(e.target.value)}
                          placeholder="New validator address"
                          className="w-full bg-[#1a1a1a] border border-gray-700 rounded px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-white mb-1">Unbond Amount</label>
                        <input
                          type="text"
                          value={unbondAmount}
                          onChange={(e) => setUnbondAmount(e.target.value)}
                          placeholder="1000000"
                          className="w-full bg-[#1a1a1a] border border-gray-700 rounded px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-gray-400">
                      💡 Amounts are in micro units (e.g., 1000000 = 1 token)
                    </p>
                  </div>
                )}

                {/* Validator Operations Input Fields */}
                {section.title === 'Validator operations' && (
                  <div className="mb-6 bg-[#0f0f0f] rounded-lg p-4 border border-gray-700">
                    <h3 className="text-sm font-semibold text-white mb-3">Validator Configuration</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs text-white mb-1">Moniker</label>
                        <input
                          type="text"
                          value={moniker}
                          onChange={(e) => setMoniker(e.target.value)}
                          placeholder="Your validator name"
                          className="w-full bg-[#1a1a1a] border border-gray-700 rounded px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-white mb-1">Identity (Keybase)</label>
                        <input
                          type="text"
                          value={identity}
                          onChange={(e) => setIdentity(e.target.value)}
                          placeholder="Keybase ID"
                          className="w-full bg-[#1a1a1a] border border-gray-700 rounded px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-white mb-1">Website</label>
                        <input
                          type="text"
                          value={website}
                          onChange={(e) => setWebsite(e.target.value)}
                          placeholder="https://example.com"
                          className="w-full bg-[#1a1a1a] border border-gray-700 rounded px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-white mb-1">Commission Rate</label>
                        <input
                          type="text"
                          value={commissionRate}
                          onChange={(e) => setCommissionRate(e.target.value)}
                          placeholder="0.1"
                          className="w-full bg-[#1a1a1a] border border-gray-700 rounded px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-white mb-1">Max Commission Rate</label>
                        <input
                          type="text"
                          value={commissionMaxRate}
                          onChange={(e) => setCommissionMaxRate(e.target.value)}
                          placeholder="0.2"
                          className="w-full bg-[#1a1a1a] border border-gray-700 rounded px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-white mb-1">Max Change Rate</label>
                        <input
                          type="text"
                          value={commissionMaxChangeRate}
                          onChange={(e) => setCommissionMaxChangeRate(e.target.value)}
                          placeholder="0.01"
                          className="w-full bg-[#1a1a1a] border border-gray-700 rounded px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-white mb-1">Min Self Delegation</label>
                        <input
                          type="text"
                          value={minSelfDelegation}
                          onChange={(e) => setMinSelfDelegation(e.target.value)}
                          placeholder="1"
                          className="w-full bg-[#1a1a1a] border border-gray-700 rounded px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-white mb-1">Security Contact</label>
                        <input
                          type="text"
                          value={securityContact}
                          onChange={(e) => setSecurityContact(e.target.value)}
                          placeholder="security@example.com"
                          className="w-full bg-[#1a1a1a] border border-gray-700 rounded px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div className="md:col-span-2 lg:col-span-3">
                        <label className="block text-xs text-white mb-1">Details</label>
                        <textarea
                          value={details}
                          onChange={(e) => setDetails(e.target.value)}
                          placeholder="Validator description"
                          rows={2}
                          className="w-full bg-[#1a1a1a] border border-gray-700 rounded px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Governance Input Fields */}
                {section.title === 'Governance' && (
                  <div className="mb-6 bg-[#0f0f0f] rounded-lg p-4 border border-gray-700">
                    <h3 className="text-sm font-semibold text-white mb-3">Proposal Configuration</h3>
                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <label className="block text-xs text-white mb-1">Proposal Title</label>
                        <input
                          type="text"
                          value={proposalTitle}
                          onChange={(e) => setProposalTitle(e.target.value)}
                          placeholder="Enter proposal title"
                          className="w-full bg-[#1a1a1a] border border-gray-700 rounded px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-white mb-1">Proposal Description</label>
                        <textarea
                          value={proposalDescription}
                          onChange={(e) => setProposalDescription(e.target.value)}
                          placeholder="Enter proposal description"
                          rows={3}
                          className="w-full bg-[#1a1a1a] border border-gray-700 rounded px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Port Configuration Input */}
                {section.title === 'Update Port Configuration' && (
                  <div className="mb-6 bg-[#0f0f0f] rounded-lg p-4 border border-gray-700">
                    <h3 className="text-sm font-semibold text-white mb-3">Port Settings</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-white mb-1">Custom Port Prefix</label>
                        <input
                          type="text"
                          value={customPort}
                          onChange={(e) => setCustomPort(e.target.value)}
                          placeholder="26"
                          className="w-full bg-[#1a1a1a] border border-gray-700 rounded px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                        />
                        <p className="mt-1 text-xs text-gray-400">
                          Example: 26 → API: 26317, gRPC: 26090, P2P: 26656, RPC: 26657
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                <div className="space-y-3">
                  {section.commands.map((item, cmdIdx) => (
                    <div key={cmdIdx} className="bg-[#0f0f0f] rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-white">{item.label}</span>
                        <button
                          onClick={() => copyToClipboard(item.cmd, `${idx}-${cmdIdx}`)}
                          className="p-1.5 hover:bg-gray-800 rounded transition-colors"
                        >
                          {copied === `${idx}-${cmdIdx}` ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <Copy className="w-4 h-4 text-gray-400" />
                          )}
                        </button>
                      </div>
                      <code className="block text-xs text-white font-mono whitespace-pre-wrap break-all">
                        {item.cmd}
                      </code>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
