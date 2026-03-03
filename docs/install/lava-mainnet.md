# Lava Network Mainnet Node Installation Guide

## Chain Information

- **Chain ID**: `lava-mainnet-1`
- **Network Type**: Mainnet
- **Recommended Version**: `v3.0.0`
- **Bech32 Prefix**: `lava@`
- **Native Denom**: `ulava` (LAVA)
- **Min Gas Price**: `0.025ulava`

## Prerequisites

- Ubuntu 20.04+ or similar Linux distribution
- 4+ CPU cores
- 8GB+ RAM
- 200GB+ SSD storage
- Go 1.21+ installed

## Installation Steps

### 1. Install Dependencies

```bash
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
```

### 2. Download and Install Binary

```bash
# Clone repository
cd $HOME
git clone https://github.com/lavanet/lava
cd $(basename https://github.com/lavanet/lava .git)

# Checkout recommended version
git checkout v3.0.0

# Build binary
make install

# Verify installation
$(basename https://github.com/lavanet/lava .git)d version
```

### 3. Initialize Node

```bash
# Set variables
MONIKER="your-moniker-name"
CHAIN_ID="lava-mainnet-1"

# Initialize node
$(basename https://github.com/lavanet/lava .git || chainName)d init $MONIKER --chain-id $CHAIN_ID

# Download genesis file
curl -Ls https://lava.rest.lava.build/genesis > $HOME/.lava-mainnet/config/genesis.json

# Verify genesis
$(basename https://github.com/lavanet/lava .git || chainName)d validate-genesis
```

### 4. Configure Node

```bash
# Set minimum gas price
sed -i 's/minimum-gas-prices = ""/minimum-gas-prices = "0.025ulava"/' $HOME/.lava-mainnet/config/app.toml

# Set pruning (optional)
sed -i 's/pruning = "default"/pruning = "custom"/' $HOME/.lava-mainnet/config/app.toml
sed -i 's/pruning-keep-recent = "0"/pruning-keep-recent = "100"/' $HOME/.lava-mainnet/config/app.toml
sed -i 's/pruning-interval = "0"/pruning-interval = "10"/' $HOME/.lava-mainnet/config/app.toml

# Set peers
PEERS="PEER_LIST_HERE"
sed -i "s/persistent_peers = \"\"/persistent_peers = \"$PEERS\"/" $HOME/.lava-mainnet/config/config.toml

# Set seeds (if available)
SEEDS="SEED_LIST_HERE"
sed -i "s/seeds = \"\"/seeds = \"$SEEDS\"/" $HOME/.lava-mainnet/config/config.toml
```

### 5. Create Systemd Service

```bash
sudo tee /etc/systemd/system/lava-mainnetd.service > /dev/null <<EOF
[Unit]
Description=Lava Network Mainnet Node
After=network-online.target

[Service]
User=$USER
ExecStart=$(which $(basename https://github.com/lavanet/lava .git || chainName)d) start
Restart=on-failure
RestartSec=3
LimitNOFILE=65535

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd and enable service
sudo systemctl daemon-reload
sudo systemctl enable lava-mainnetd
```

### 6. Start Node

```bash
# Start service
sudo systemctl start lava-mainnetd

# Check logs
sudo journalctl -u lava-mainnetd -f -o cat

# Check sync status
$(basename https://github.com/lavanet/lava .git || chainName)d status 2>&1 | jq .SyncInfo
```

## State Sync (Recommended for Faster Sync)

```bash
# Stop node
sudo systemctl stop lava-mainnetd

# Reset data
$(basename https://github.com/lavanet/lava .git || chainName)d tendermint unsafe-reset-all --home $HOME/.lava-mainnet

# Get trust height and hash
SNAP_RPC="https://lava.tendermintrpc.lava.build"
LATEST_HEIGHT=$(curl -s $SNAP_RPC/block | jq -r .result.block.header.height)
TRUST_HEIGHT=$((LATEST_HEIGHT - 2000))
TRUST_HASH=$(curl -s "$SNAP_RPC/block?height=$TRUST_HEIGHT" | jq -r .result.block_id.hash)

# Configure state sync
sed -i.bak -E "s|^(enable[[:space:]]+=[[:space:]]+).*$|\1true| ; \
s|^(rpc_servers[[:space:]]+=[[:space:]]+).*$|\1\"$SNAP_RPC,$SNAP_RPC\"| ; \
s|^(trust_height[[:space:]]+=[[:space:]]+).*$|\1$TRUST_HEIGHT| ; \
s|^(trust_hash[[:space:]]+=[[:space:]]+).*$|\1\"$TRUST_HASH\"|" $HOME/.lava-mainnet/config/config.toml

# Start node
sudo systemctl start lava-mainnetd
```

## Useful Commands

### Check Node Status
```bash
$(basename https://github.com/lavanet/lava .git || chainName)d status 2>&1 | jq
```

### Check Logs
```bash
sudo journalctl -u lava-mainnetd -f -o cat
```

### Restart Node
```bash
sudo systemctl restart lava-mainnetd
```

### Stop Node
```bash
sudo systemctl stop lava-mainnetd
```

### Create Validator
```bash
$(basename https://github.com/lavanet/lava .git || chainName)d tx staking create-validator \
  --amount=1000000ulava \
  --pubkey=$($(basename https://github.com/lavanet/lava .git || chainName)d tendermint show-validator) \
  --moniker="your-moniker" \
  --chain-id=lava-mainnet-1 \
  --commission-rate="0.10" \
  --commission-max-rate="0.20" \
  --commission-max-change-rate="0.01" \
  --min-self-delegation="1" \
  --gas="auto" \
  --gas-adjustment="1.5" \
  --gas-prices="0.025ulava" \
  --from=wallet
```

## Endpoints

- **RPC**: https://lava.tendermintrpc.lava.build
- **API**: https://lava.rest.lava.build


## Resources

- **GitHub**: https://github.com/lavanet/lava





## Support

For support and questions, please visit:
- [WinScan Explorer](https://winsnip.xyz)
- [WinScan Telegram](https://t.me/winsnip)

---

*Generated by WinScan - Multi-chain Blockchain Explorer*
