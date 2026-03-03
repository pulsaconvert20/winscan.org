# Lumera Binary Update Guide

This guide will help you update your Lumera node to the latest version.

## Prerequisites

- Existing Lumera node installation
- Root or sudo access
- Basic knowledge of Linux commands

## Update Steps

### 1. Check Current Version

```bash
lumerad version
```

### 2. Stop the Service

```bash
sudo systemctl stop lumerad
```

### 3. Backup Important Files

⚠️ **Important**: Always backup your validator key and node configuration before updating!

```bash
# Backup validator key
cp $HOME/.lumera/config/priv_validator_key.json $HOME/priv_validator_key.json.backup

# Backup node key
cp $HOME/.lumera/config/node_key.json $HOME/node_key.json.backup
```

### 4. Download and Install New Binary

#### Option A: Download Pre-built Binary (Recommended)

```bash
cd $HOME
wget -O lumerad.tar.gz "$(curl -s https://api.github.com/repos/LumeraProtocol/lumera/releases/latest | jq -r '.assets[] | select(.name | contains("linux") and (contains("amd64") or contains("x86_64"))) | .browser_download_url' | head -1)"
tar -xzf lumerad.tar.gz
rm -f install.sh lumerad.tar.gz
chmod +x lumerad
sudo mv lumerad /usr/local/bin/
[ -f "libwasmvm.x86_64.so" ] && sudo mv libwasmvm.x86_64.so /usr/lib/
[ -f "libwasmvm.so" ] && sudo mv libwasmvm.so /usr/lib/
```

#### Option B: Build from Source

```bash
# Clone repository
cd $HOME
git clone https://github.com/LumeraProtocol/lumera-networks
cd $(basename https://github.com/LumeraProtocol/lumera-networks .git)

# Checkout recommended version
git checkout v1.0.0

# Build binary
make install

# Verify installation
$(basename https://github.com/LumeraProtocol/lumera-networks .git)d version
```

### 5. Verify New Version

```bash
lumerad version
```

The output should show the new version number.

### 6. Start the Service

```bash
sudo systemctl start lumerad
```

### 7. Check Logs

```bash
sudo journalctl -u lumerad -f -o cat
```

### 8. Verify Node is Running

```bash
lumerad status 2>&1 | jq .SyncInfo
```

## Rollback (If Needed)

If you encounter issues with the new version, you can rollback to the previous version:

### 1. Stop the Service

```bash
sudo systemctl stop lumerad
```

### 2. Restore Previous Binary

If you kept a backup of the old binary:

```bash
sudo cp /usr/local/bin/lumerad.backup /usr/local/bin/lumerad
```

Or reinstall the previous version:

```bash
cd $HOME/lumera
git checkout v1.0.0
make install
```

### 3. Start the Service

```bash
sudo systemctl start lumerad
```

## Upgrade with Cosmovisor (Automated)

If you're using Cosmovisor for automated upgrades:

### 1. Create Upgrade Directory

```bash
mkdir -p $HOME/.lumera/cosmovisor/upgrades/upgrade-1.0.0/bin
```

### 2. Download New Binary

```bash
cd $HOME
wget -O lumerad.tar.gz "$(curl -s https://api.github.com/repos/LumeraProtocol/lumera/releases/latest | jq -r '.assets[] | select(.name | contains("linux") and (contains("amd64") or contains("x86_64"))) | .browser_download_url' | head -1)"
tar -xzf lumerad.tar.gz
chmod +x lumerad
mv lumerad $HOME/.lumera/cosmovisor/upgrades/upgrade-1.0.0/bin/
```

### 3. Verify Binary

```bash
$HOME/.lumera/cosmovisor/upgrades/upgrade-1.0.0/bin/lumerad version
```

Cosmovisor will automatically switch to the new binary at the specified upgrade height.

## Common Issues

### Issue: Binary not found after update

**Solution**: Make sure the binary is in your PATH:

```bash
which lumerad
```

If not found, check if it's in `/usr/local/bin/` or `$HOME/go/bin/`

### Issue: Version mismatch

**Solution**: Clear the old binary and reinstall:

```bash
sudo rm $(which lumerad)
# Then reinstall using one of the methods above
```

### Issue: Node won't start after update

**Solution**: Check the logs for errors:

```bash
sudo journalctl -u lumerad -n 100 --no-pager
```

Common fixes:
- Reset the node data (if not a validator): `lumerad tendermint unsafe-reset-all --home $HOME/.lumera`
- Check if the genesis file is correct
- Verify peer connections

### Issue: Sync issues after update

**Solution**: Try state sync or snapshot:

```bash
# Stop service
sudo systemctl stop lumerad

# Reset data
lumerad tendermint unsafe-reset-all --home $HOME/.lumera --keep-addr-book

# Use state sync (see State Sync guide)
# Or download snapshot (see Snapshot guide)

# Start service
sudo systemctl start lumerad
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
ps aux | grep lumerad
```

### Check binary location
```bash
which lumerad
```

### Check binary version
```bash
lumerad version --long
```

### Check service status
```bash
sudo systemctl status lumerad
```

## Support

For support and questions, please visit:
- [WinScan Explorer](https://winsnip.xyz)
- [WinScan Telegram](https://t.me/winsnip)
- [Official Lumera Documentation](https://github.com/LumeraProtocol/lumera)

---

*Generated by WinScan - Multi-chain Blockchain Explorer*
