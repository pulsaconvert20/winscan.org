# BitBadges Binary Update Guide

This guide will help you update your BitBadges node to the latest version.

## Prerequisites

- Existing BitBadges node installation
- Root or sudo access
- Basic knowledge of Linux commands

## Update Steps

### 1. Check Current Version

```bash
bitbadges-1d version
```

### 2. Stop the Service

```bash
sudo systemctl stop bitbadges-1d
```

### 3. Backup Important Files

⚠️ **Important**: Always backup your validator key and node configuration before updating!

```bash
# Backup validator key
cp $HOME/.bitbadges-1/config/priv_validator_key.json $HOME/priv_validator_key.json.backup

# Backup node key
cp $HOME/.bitbadges-1/config/node_key.json $HOME/node_key.json.backup
```

### 4. Download and Install New Binary

#### Option A: Download Pre-built Binary (Recommended)

```bash
cd $HOME
wget -O bitbadges-1d.tar.gz "$(curl -s https://api.github.com/repos//releases/latest | jq -r '.assets[] | select(.name | contains("linux") and (contains("amd64") or contains("x86_64"))) | .browser_download_url' | head -1)"
tar -xzf bitbadges-1d.tar.gz
rm -f install.sh bitbadges-1d.tar.gz
chmod +x bitbadges-1d
sudo mv bitbadges-1d /usr/local/bin/
[ -f "libwasmvm.x86_64.so" ] && sudo mv libwasmvm.x86_64.so /usr/lib/
[ -f "libwasmvm.so" ] && sudo mv libwasmvm.so /usr/lib/
```

#### Option B: Build from Source

```bash
# Clone repository
cd $HOME
git clone https://github.com/bitbadges/bitbadgeschain
cd $(basename https://github.com/bitbadges/bitbadgeschain .git)

# Checkout recommended version
git checkout v1.0.0

# Build binary
make install

# Verify installation
$(basename https://github.com/bitbadges/bitbadgeschain .git)d version
```

### 5. Verify New Version

```bash
bitbadges-1d version
```

The output should show the new version number.

### 6. Start the Service

```bash
sudo systemctl start bitbadges-1d
```

### 7. Check Logs

```bash
sudo journalctl -u bitbadges-1d -f -o cat
```

### 8. Verify Node is Running

```bash
bitbadges-1d status 2>&1 | jq .SyncInfo
```

## Rollback (If Needed)

If you encounter issues with the new version, you can rollback to the previous version:

### 1. Stop the Service

```bash
sudo systemctl stop bitbadges-1d
```

### 2. Restore Previous Binary

If you kept a backup of the old binary:

```bash
sudo cp /usr/local/bin/bitbadges-1d.backup /usr/local/bin/bitbadges-1d
```

Or reinstall the previous version:

```bash
cd $HOME/bitbadges-1
git checkout v1.0.0
make install
```

### 3. Start the Service

```bash
sudo systemctl start bitbadges-1d
```

## Upgrade with Cosmovisor (Automated)

If you're using Cosmovisor for automated upgrades:

### 1. Create Upgrade Directory

```bash
mkdir -p $HOME/.bitbadges-1/cosmovisor/upgrades/upgrade-1.0.0/bin
```

### 2. Download New Binary

```bash
cd $HOME
wget -O bitbadges-1d.tar.gz "$(curl -s https://api.github.com/repos//releases/latest | jq -r '.assets[] | select(.name | contains("linux") and (contains("amd64") or contains("x86_64"))) | .browser_download_url' | head -1)"
tar -xzf bitbadges-1d.tar.gz
chmod +x bitbadges-1d
mv bitbadges-1d $HOME/.bitbadges-1/cosmovisor/upgrades/upgrade-1.0.0/bin/
```

### 3. Verify Binary

```bash
$HOME/.bitbadges-1/cosmovisor/upgrades/upgrade-1.0.0/bin/bitbadges-1d version
```

Cosmovisor will automatically switch to the new binary at the specified upgrade height.

## Common Issues

### Issue: Binary not found after update

**Solution**: Make sure the binary is in your PATH:

```bash
which bitbadges-1d
```

If not found, check if it's in `/usr/local/bin/` or `$HOME/go/bin/`

### Issue: Version mismatch

**Solution**: Clear the old binary and reinstall:

```bash
sudo rm $(which bitbadges-1d)
# Then reinstall using one of the methods above
```

### Issue: Node won't start after update

**Solution**: Check the logs for errors:

```bash
sudo journalctl -u bitbadges-1d -n 100 --no-pager
```

Common fixes:
- Reset the node data (if not a validator): `bitbadges-1d tendermint unsafe-reset-all --home $HOME/.bitbadges-1`
- Check if the genesis file is correct
- Verify peer connections

### Issue: Sync issues after update

**Solution**: Try state sync or snapshot:

```bash
# Stop service
sudo systemctl stop bitbadges-1d

# Reset data
bitbadges-1d tendermint unsafe-reset-all --home $HOME/.bitbadges-1 --keep-addr-book

# Use state sync (see State Sync guide)
# Or download snapshot (see Snapshot guide)

# Start service
sudo systemctl start bitbadges-1d
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
ps aux | grep bitbadges-1d
```

### Check binary location
```bash
which bitbadges-1d
```

### Check binary version
```bash
bitbadges-1d version --long
```

### Check service status
```bash
sudo systemctl status bitbadges-1d
```

## Support

For support and questions, please visit:
- [WinScan Explorer](https://winsnip.xyz)
- [WinScan Telegram](https://t.me/winsnip)
- [Official BitBadges Documentation]()

---

*Generated by WinScan - Multi-chain Blockchain Explorer*
