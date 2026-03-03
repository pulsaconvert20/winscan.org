# AtomOne Binary Update Guide

This guide will help you update your AtomOne node to the latest version.

## Prerequisites

- Existing AtomOne node installation
- Root or sudo access
- Basic knowledge of Linux commands

## Update Steps

### 1. Check Current Version

```bash
atomoned version
```

### 2. Stop the Service

```bash
sudo systemctl stop atomoned
```

### 3. Backup Important Files

⚠️ **Important**: Always backup your validator key and node configuration before updating!

```bash
# Backup validator key
cp $HOME/.atomone/config/priv_validator_key.json $HOME/priv_validator_key.json.backup

# Backup node key
cp $HOME/.atomone/config/node_key.json $HOME/node_key.json.backup
```

### 4. Download and Install New Binary

#### Option A: Download Pre-built Binary (Recommended)

```bash
cd $HOME
wget -O atomoned.tar.gz "$(curl -s https://api.github.com/repos/atomone-hub/atomone/releases/latest | jq -r '.assets[] | select(.name | contains("linux") and (contains("amd64") or contains("x86_64"))) | .browser_download_url' | head -1)"
tar -xzf atomoned.tar.gz
rm -f install.sh atomoned.tar.gz
chmod +x atomoned
sudo mv atomoned /usr/local/bin/
[ -f "libwasmvm.x86_64.so" ] && sudo mv libwasmvm.x86_64.so /usr/lib/
[ -f "libwasmvm.so" ] && sudo mv libwasmvm.so /usr/lib/
```

#### Option B: Build from Source

```bash
# Clone repository
cd $HOME
git clone https://github.com/atomone-hub/atomone
cd $(basename https://github.com/atomone-hub/atomone .git)

# Checkout recommended version
git checkout latest

# Build binary
make install

# Verify installation
$(basename https://github.com/atomone-hub/atomone .git)d version
```

### 5. Verify New Version

```bash
atomoned version
```

The output should show the new version number.

### 6. Start the Service

```bash
sudo systemctl start atomoned
```

### 7. Check Logs

```bash
sudo journalctl -u atomoned -f -o cat
```

### 8. Verify Node is Running

```bash
atomoned status 2>&1 | jq .SyncInfo
```

## Rollback (If Needed)

If you encounter issues with the new version, you can rollback to the previous version:

### 1. Stop the Service

```bash
sudo systemctl stop atomoned
```

### 2. Restore Previous Binary

If you kept a backup of the old binary:

```bash
sudo cp /usr/local/bin/atomoned.backup /usr/local/bin/atomoned
```

Or reinstall the previous version:

```bash
cd $HOME/atomone
git checkout v1.0.0
make install
```

### 3. Start the Service

```bash
sudo systemctl start atomoned
```

## Upgrade with Cosmovisor (Automated)

If you're using Cosmovisor for automated upgrades:

### 1. Create Upgrade Directory

```bash
mkdir -p $HOME/.atomone/cosmovisor/upgrades/upgrade-latest/bin
```

### 2. Download New Binary

```bash
cd $HOME
wget -O atomoned.tar.gz "$(curl -s https://api.github.com/repos/atomone-hub/atomone/releases/latest | jq -r '.assets[] | select(.name | contains("linux") and (contains("amd64") or contains("x86_64"))) | .browser_download_url' | head -1)"
tar -xzf atomoned.tar.gz
chmod +x atomoned
mv atomoned $HOME/.atomone/cosmovisor/upgrades/upgrade-latest/bin/
```

### 3. Verify Binary

```bash
$HOME/.atomone/cosmovisor/upgrades/upgrade-latest/bin/atomoned version
```

Cosmovisor will automatically switch to the new binary at the specified upgrade height.

## Common Issues

### Issue: Binary not found after update

**Solution**: Make sure the binary is in your PATH:

```bash
which atomoned
```

If not found, check if it's in `/usr/local/bin/` or `$HOME/go/bin/`

### Issue: Version mismatch

**Solution**: Clear the old binary and reinstall:

```bash
sudo rm $(which atomoned)
# Then reinstall using one of the methods above
```

### Issue: Node won't start after update

**Solution**: Check the logs for errors:

```bash
sudo journalctl -u atomoned -n 100 --no-pager
```

Common fixes:
- Reset the node data (if not a validator): `atomoned tendermint unsafe-reset-all --home $HOME/.atomone`
- Check if the genesis file is correct
- Verify peer connections

### Issue: Sync issues after update

**Solution**: Try state sync or snapshot:

```bash
# Stop service
sudo systemctl stop atomoned

# Reset data
atomoned tendermint unsafe-reset-all --home $HOME/.atomone --keep-addr-book

# Use state sync (see State Sync guide)
# Or download snapshot (see Snapshot guide)

# Start service
sudo systemctl start atomoned
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
ps aux | grep atomoned
```

### Check binary location
```bash
which atomoned
```

### Check binary version
```bash
atomoned version --long
```

### Check service status
```bash
sudo systemctl status atomoned
```

## Support

For support and questions, please visit:
- [WinScan Explorer](https://winsnip.xyz)
- [WinScan Telegram](https://t.me/winsnip)
- [Official AtomOne Documentation](https://github.com/atomone-hub/atomone)

---

*Generated by WinScan - Multi-chain Blockchain Explorer*
