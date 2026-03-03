const fs = require('fs');
const path = require('path');

const chainsDir = path.join(process.cwd(), 'Chains');
const docsDir = path.join(process.cwd(), 'docs', 'install');

// Create docs/install directory if not exists
if (!fs.existsSync(docsDir)) {
  fs.mkdirSync(docsDir, { recursive: true });
}

// Read all chain files
const chainFiles = fs.readdirSync(chainsDir).filter(f => f.endsWith('.json'));

console.log(`\n🚀 Generating install documentation for ${chainFiles.length} chains...\n`);

chainFiles.forEach(file => {
  const chainData = JSON.parse(fs.readFileSync(path.join(chainsDir, file), 'utf8'));
  
  const chainName = chainData.chain_name;
  const prettyName = chainData.pretty_name || chainName;
  const chainId = chainData.chain_id;
  const version = chainData.codebase?.recommended_version || 'latest';
  const gitRepo = chainData.codebase?.git_repo || '';
  const bech32Prefix = chainData.bech32_prefix || chainData.addr_prefix || '';
  const denom = chainData.assets?.[0]?.base || '';
  const symbol = chainData.assets?.[0]?.symbol || '';
  const minGasPrice = chainData.fees?.fee_tokens?.[0]?.fixed_min_gas_price || 0;
  
  // Get RPC and API endpoints
  const rpcEndpoint = chainData.rpc?.[0]?.address || '';
  const apiEndpoint = chainData.api?.[0]?.address || '';
  const grpcEndpoint = chainData.grpc?.[0]?.address || '';
  
  // Check if it's testnet or mainnet
  const isTestnet = chainData.network_type === 'testnet' || chainName.includes('test');
  
  const markdown = `# ${prettyName} Node Installation Guide

## Chain Information

- **Chain ID**: \`${chainId}\`
- **Network Type**: ${isTestnet ? 'Testnet' : 'Mainnet'}
- **Recommended Version**: \`${version}\`
- **Bech32 Prefix**: \`${bech32Prefix}\`
- **Native Denom**: \`${denom}\` (${symbol})
- **Min Gas Price**: \`${minGasPrice}${denom}\`

## Prerequisites

- Ubuntu 20.04+ or similar Linux distribution
- 4+ CPU cores
- 8GB+ RAM
- 200GB+ SSD storage
- Go 1.21+ installed

## Installation Steps

### 1. Install Dependencies

\`\`\`bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y curl git jq lz4 build-essential

# Install Go (if not already installed)
cd $HOME
wget "https://golang.org/dl/go1.21.6.linux-amd64.tar.gz"
sudo rm -rf /usr/local/go
sudo tar -C /usr/local -xzf "go1.21.6.linux-amd64.tar.gz"
rm "go1.21.6.linux-amd64.tar.gz"

# Set Go environment variables
echo "export PATH=$PATH:/usr/local/go/bin:$HOME/go/bin" >> $HOME/.bash_profile
source $HOME/.bash_profile
\`\`\`

### 2. Download and Install Binary

${gitRepo ? `\`\`\`bash
# Clone repository
cd $HOME
git clone ${gitRepo}
cd $(basename ${gitRepo} .git)

# Checkout recommended version
git checkout ${version}

# Build binary
make install

# Verify installation
$(basename ${gitRepo} .git)d version
\`\`\`` : '```bash\n# Download binary from official source\n# Contact chain team for binary download link\n```'}

### 3. Initialize Node

\`\`\`bash
# Set variables
MONIKER="your-moniker-name"
CHAIN_ID="${chainId}"

# Initialize node
$(basename ${gitRepo} .git || chainName)d init $MONIKER --chain-id $CHAIN_ID

# Download genesis file
curl -Ls ${apiEndpoint ? apiEndpoint.replace('/api', '') + '/genesis' : 'GENESIS_URL'} > $HOME/.${chainName}/config/genesis.json

# Verify genesis
$(basename ${gitRepo} .git || chainName)d validate-genesis
\`\`\`

### 4. Configure Node

\`\`\`bash
# Set minimum gas price
sed -i 's/minimum-gas-prices = ""/minimum-gas-prices = "${minGasPrice}${denom}"/' $HOME/.${chainName}/config/app.toml

# Set pruning (optional)
sed -i 's/pruning = "default"/pruning = "custom"/' $HOME/.${chainName}/config/app.toml
sed -i 's/pruning-keep-recent = "0"/pruning-keep-recent = "100"/' $HOME/.${chainName}/config/app.toml
sed -i 's/pruning-interval = "0"/pruning-interval = "10"/' $HOME/.${chainName}/config/app.toml

# Set peers
PEERS="PEER_LIST_HERE"
sed -i "s/persistent_peers = \\"\\"/persistent_peers = \\"$PEERS\\"/" $HOME/.${chainName}/config/config.toml

# Set seeds (if available)
SEEDS="SEED_LIST_HERE"
sed -i "s/seeds = \\"\\"/seeds = \\"$SEEDS\\"/" $HOME/.${chainName}/config/config.toml
\`\`\`

### 5. Create Systemd Service

\`\`\`bash
sudo tee /etc/systemd/system/${chainName}d.service > /dev/null <<EOF
[Unit]
Description=${prettyName} Node
After=network-online.target

[Service]
User=$USER
ExecStart=$(which $(basename ${gitRepo} .git || chainName)d) start
Restart=on-failure
RestartSec=3
LimitNOFILE=65535

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd and enable service
sudo systemctl daemon-reload
sudo systemctl enable ${chainName}d
\`\`\`

### 6. Start Node

\`\`\`bash
# Start service
sudo systemctl start ${chainName}d

# Check logs
sudo journalctl -u ${chainName}d -f -o cat

# Check sync status
$(basename ${gitRepo} .git || chainName)d status 2>&1 | jq .SyncInfo
\`\`\`

## State Sync (Recommended for Faster Sync)

\`\`\`bash
# Stop node
sudo systemctl stop ${chainName}d

# Reset data
$(basename ${gitRepo} .git || chainName)d tendermint unsafe-reset-all --home $HOME/.${chainName}

# Get trust height and hash
SNAP_RPC="${rpcEndpoint}"
LATEST_HEIGHT=$(curl -s $SNAP_RPC/block | jq -r .result.block.header.height)
TRUST_HEIGHT=$((LATEST_HEIGHT - 2000))
TRUST_HASH=$(curl -s "$SNAP_RPC/block?height=$TRUST_HEIGHT" | jq -r .result.block_id.hash)

# Configure state sync
sed -i.bak -E "s|^(enable[[:space:]]+=[[:space:]]+).*$|\\1true| ; \\
s|^(rpc_servers[[:space:]]+=[[:space:]]+).*$|\\1\\"$SNAP_RPC,$SNAP_RPC\\"| ; \\
s|^(trust_height[[:space:]]+=[[:space:]]+).*$|\\1$TRUST_HEIGHT| ; \\
s|^(trust_hash[[:space:]]+=[[:space:]]+).*$|\\1\\"$TRUST_HASH\\"|" $HOME/.${chainName}/config/config.toml

# Start node
sudo systemctl start ${chainName}d
\`\`\`

## Useful Commands

### Check Node Status
\`\`\`bash
$(basename ${gitRepo} .git || chainName)d status 2>&1 | jq
\`\`\`

### Check Logs
\`\`\`bash
sudo journalctl -u ${chainName}d -f -o cat
\`\`\`

### Restart Node
\`\`\`bash
sudo systemctl restart ${chainName}d
\`\`\`

### Stop Node
\`\`\`bash
sudo systemctl stop ${chainName}d
\`\`\`

### Create Validator
\`\`\`bash
$(basename ${gitRepo} .git || chainName)d tx staking create-validator \\
  --amount=1000000${denom} \\
  --pubkey=$($(basename ${gitRepo} .git || chainName)d tendermint show-validator) \\
  --moniker="your-moniker" \\
  --chain-id=${chainId} \\
  --commission-rate="0.10" \\
  --commission-max-rate="0.20" \\
  --commission-max-change-rate="0.01" \\
  --min-self-delegation="1" \\
  --gas="auto" \\
  --gas-adjustment="1.5" \\
  --gas-prices="${minGasPrice}${denom}" \\
  --from=wallet
\`\`\`

## Endpoints

${rpcEndpoint ? `- **RPC**: ${rpcEndpoint}` : ''}
${apiEndpoint ? `- **API**: ${apiEndpoint}` : ''}
${grpcEndpoint ? `- **gRPC**: ${grpcEndpoint}` : ''}

## Resources

${gitRepo ? `- **GitHub**: ${gitRepo}` : ''}
${chainData.website ? `- **Website**: ${chainData.website}` : ''}
${chainData.twitter ? `- **Twitter**: ${chainData.twitter}` : ''}
${chainData.telegram ? `- **Telegram**: ${chainData.telegram}` : ''}
${chainData.discord ? `- **Discord**: ${chainData.discord}` : ''}

## Support

For support and questions, please visit:
- [WinScan Explorer](https://winsnip.xyz)
- [WinScan Telegram](https://t.me/winsnip)

---

*Generated by WinScan - Multi-chain Blockchain Explorer*
`;

  // Write markdown file
  const outputFile = path.join(docsDir, `${chainName}.md`);
  fs.writeFileSync(outputFile, markdown);
  console.log(`✅ Generated: ${chainName}.md`);
});

console.log(`\n✨ Successfully generated ${chainFiles.length} installation guides in docs/install/\n`);
