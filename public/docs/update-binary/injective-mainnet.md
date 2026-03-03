# Injective Binary Update Guide

This guide will help you update your Injective node to the latest version.

## Prerequisites

- Existing Injective node installation
- Root or sudo access
- Basic knowledge of Linux commands

## Update Steps

### 1. Check Current Version

```bash
injectived version
```

### 2. Stop the Service

```bash
sudo systemctl stop injectived
```

### 3. Backup Important Files

⚠️ **Important**: Always backup your validator key and node configuration before updating!

```bash
# Backup validator key
cp $HOME/.injective/config/priv_validator_key.json $HOME/priv_validator_key.json.backup

# Backup node key
cp $HOME/.injective/config/node_key.json $HOME/node_key.json.backup
```

### 4. Download and Install New Binary

#### Option A: Download Pre-built Binary (Recommended)

```bash
cd $HOME
wget -O injectived.tar.gz "$(curl -s https://api.github.com/repos/InjectiveLabs/injective-chain-releases/releases/latest | jq -r '.assets[] | select(.name | contains("linux") and (contains("amd64") or contains("x86_64"))) | .browser_download_url' | head -1)"
tar -xzf injectived.tar.gz
rm -f install.sh injectived.tar.gz
chmod +x injectived
sudo mv injectived /usr/local/bin/
[ -f "libwasmvm.x86_64.so" ] && sudo mv libwasmvm.x86_64.so /usr/lib/
[ -f "libwasmvm.so" ] && sudo mv libwasmvm.so /usr/lib/
```

#### Option B: Build from Source

```bash
# Clone repository
cd $HOME
git clone https://github.com/InjectiveLabs/injective-chain-releases
cd $(basename https://github.com/InjectiveLabs/injective-chain-releases .git)

# Checkout recommended version
git checkout v1.13.2

# Build binary
make install

# Verify installation
$(basename https://github.com/InjectiveLabs/injective-chain-releases .git)d version
```

### 5. Verify New Version

```bash
injectived version
```

The output should show the new version number.

### 6. Start the Service

```bash
sudo systemctl start injectived
```

### 7. Check Logs

```bash
sudo journalctl -u injectived -f -o cat
```

### 8. Verify Node is Running

```bash
injectived status 2>&1 | jq .SyncInfo
```

## Rollback (If Needed)

If you encounter issues with the new version, you can rollback to the previous version:

### 1. Stop the Service

```bash
sudo systemctl stop injectived
```

### 2. Restore Previous Binary

If you kept a backup of the old binary:

```bash
sudo cp /usr/local/bin/injectived.backup /usr/local/bin/injectived
```

Or reinstall the previous version:

```bash
cd $HOME/injective-chain-releases
git checkout v1.0.0
make install
```

### 3. Start the Service

```bash
sudo systemctl start injectived
```

## Upgrade with Cosmovisor (Automated)

If you're using Cosmovisor for automated upgrades:

### 1. Create Upgrade Directory

```bash
mkdir -p $HOME/.injective/cosmovisor/upgrades/upgrade-1.13.2/bin
```

### 2. Download New Binary

```bash
cd $HOME
wget -O injectived.tar.gz "$(curl -s https://api.github.com/repos/InjectiveLabs/injective-chain-releases/releases/latest | jq -r '.assets[] | select(.name | contains("linux") and (contains("amd64") or contains("x86_64"))) | .browser_download_url' | head -1)"
tar -xzf injectived.tar.gz
chmod +x injectived
mv injectived $HOME/.injective/cosmovisor/upgrades/upgrade-1.13.2/bin/
```

### 3. Verify Binary

```bash
$HOME/.injective/cosmovisor/upgrades/upgrade-1.13.2/bin/injectived version
```

Cosmovisor will automatically switch to the new binary at the specified upgrade height.

## Common Issues

### Issue: Binary not found after update

**Solution**: Make sure the binary is in your PATH:

```bash
which injectived
```

If not found, check if it's in `/usr/local/bin/` or `$HOME/go/bin/`

### Issue: Version mismatch

**Solution**: Clear the old binary and reinstall:

```bash
sudo rm $(which injectived)
# Then reinstall using one of the methods above
```

### Issue: Node won't start after update

**Solution**: Check the logs for errors:

```bash
sudo journalctl -u injectived -n 100 --no-pager
```

Common fixes:
- Reset the node data (if not a validator): `injectived tendermint unsafe-reset-all --home $HOME/.injective`
- Check if the genesis file is correct
- Verify peer connections

### Issue: Sync issues after update

**Solution**: Try state sync or snapshot:

```bash
# Stop service
sudo systemctl stop injectived

# Reset data
injectived tendermint unsafe-reset-all --home $HOME/.injective --keep-addr-book

# Use state sync (see State Sync guide)
# Or download snapshot (see Snapshot guide)

# Start service
sudo systemctl start injectived
```

## Important Notes

- ⚠️ **Always backup your validator key** before any update
- 📢 Check official announcements for breaking changes
- 🔄 Test updates on testnet first if possible
- ⏰ Plan updates during low-traffic periods
- 👥 Coordinate with other validators for network upgrades

## Useful Commands

### Check if binary is running
```bash
ps aux | grep injectived
```

### Check binary location
```bash
which injectived
```

### Check binary version
```bash
injectived version --long
```

### Check service status
```bash
sudo systemctl status injectived
```

## Support

For support and questions, please visit:
- [WinScan Explorer](https://winsnip.xyz)
- [WinScan Telegram](https://t.me/winsnip)
- [Official Injective Documentation](https://github.com/InjectiveLabs/injective-chain-releases)

---

*Generated by WinScan - Multi-chain Blockchain Explorer*
