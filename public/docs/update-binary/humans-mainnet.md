# Humans.ai Binary Update Guide

This guide will help you update your Humans.ai node to the latest version.

## Prerequisites

- Existing Humans.ai node installation
- Root or sudo access
- Basic knowledge of Linux commands

## Update Steps

### 1. Check Current Version

```bash
humansd version
```

### 2. Stop the Service

```bash
sudo systemctl stop humansd
```

### 3. Backup Important Files

⚠️ **Important**: Always backup your validator key and node configuration before updating!

```bash
# Backup validator key
cp $HOME/.humans/config/priv_validator_key.json $HOME/priv_validator_key.json.backup

# Backup node key
cp $HOME/.humans/config/node_key.json $HOME/node_key.json.backup
```

### 4. Download and Install New Binary

#### Option A: Download Pre-built Binary (Recommended)

```bash
cd $HOME
wget -O humansd.tar.gz "$(curl -s https://api.github.com/repos/humansdotai/humans/releases/latest | jq -r '.assets[] | select(.name | contains("linux") and (contains("amd64") or contains("x86_64"))) | .browser_download_url' | head -1)"
tar -xzf humansd.tar.gz
rm -f install.sh humansd.tar.gz
chmod +x humansd
sudo mv humansd /usr/local/bin/
[ -f "libwasmvm.x86_64.so" ] && sudo mv libwasmvm.x86_64.so /usr/lib/
[ -f "libwasmvm.so" ] && sudo mv libwasmvm.so /usr/lib/
```

#### Option B: Build from Source

```bash
# Clone repository
cd $HOME
git clone https://github.com/humansdotai/humans
cd $(basename https://github.com/humansdotai/humans .git)

# Checkout recommended version
git checkout v1.0.0

# Build binary
make install

# Verify installation
$(basename https://github.com/humansdotai/humans .git)d version
```

### 5. Verify New Version

```bash
humansd version
```

The output should show the new version number.

### 6. Start the Service

```bash
sudo systemctl start humansd
```

### 7. Check Logs

```bash
sudo journalctl -u humansd -f -o cat
```

### 8. Verify Node is Running

```bash
humansd status 2>&1 | jq .SyncInfo
```

## Rollback (If Needed)

If you encounter issues with the new version, you can rollback to the previous version:

### 1. Stop the Service

```bash
sudo systemctl stop humansd
```

### 2. Restore Previous Binary

If you kept a backup of the old binary:

```bash
sudo cp /usr/local/bin/humansd.backup /usr/local/bin/humansd
```

Or reinstall the previous version:

```bash
cd $HOME/humans
git checkout v1.0.0
make install
```

### 3. Start the Service

```bash
sudo systemctl start humansd
```

## Upgrade with Cosmovisor (Automated)

If you're using Cosmovisor for automated upgrades:

### 1. Create Upgrade Directory

```bash
mkdir -p $HOME/.humans/cosmovisor/upgrades/upgrade-1.0.0/bin
```

### 2. Download New Binary

```bash
cd $HOME
wget -O humansd.tar.gz "$(curl -s https://api.github.com/repos/humansdotai/humans/releases/latest | jq -r '.assets[] | select(.name | contains("linux") and (contains("amd64") or contains("x86_64"))) | .browser_download_url' | head -1)"
tar -xzf humansd.tar.gz
chmod +x humansd
mv humansd $HOME/.humans/cosmovisor/upgrades/upgrade-1.0.0/bin/
```

### 3. Verify Binary

```bash
$HOME/.humans/cosmovisor/upgrades/upgrade-1.0.0/bin/humansd version
```

Cosmovisor will automatically switch to the new binary at the specified upgrade height.

## Common Issues

### Issue: Binary not found after update

**Solution**: Make sure the binary is in your PATH:

```bash
which humansd
```

If not found, check if it's in `/usr/local/bin/` or `$HOME/go/bin/`

### Issue: Version mismatch

**Solution**: Clear the old binary and reinstall:

```bash
sudo rm $(which humansd)
# Then reinstall using one of the methods above
```

### Issue: Node won't start after update

**Solution**: Check the logs for errors:

```bash
sudo journalctl -u humansd -n 100 --no-pager
```

Common fixes:
- Reset the node data (if not a validator): `humansd tendermint unsafe-reset-all --home $HOME/.humans`
- Check if the genesis file is correct
- Verify peer connections

### Issue: Sync issues after update

**Solution**: Try state sync or snapshot:

```bash
# Stop service
sudo systemctl stop humansd

# Reset data
humansd tendermint unsafe-reset-all --home $HOME/.humans --keep-addr-book

# Use state sync (see State Sync guide)
# Or download snapshot (see Snapshot guide)

# Start service
sudo systemctl start humansd
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
ps aux | grep humansd
```

### Check binary location
```bash
which humansd
```

### Check binary version
```bash
humansd version --long
```

### Check service status
```bash
sudo systemctl status humansd
```

## Support

For support and questions, please visit:
- [WinScan Explorer](https://winsnip.xyz)
- [WinScan Telegram](https://t.me/winsnip)
- [Official Humans.ai Documentation](https://github.com/humansdotai/humans)

---

*Generated by WinScan - Multi-chain Blockchain Explorer*
