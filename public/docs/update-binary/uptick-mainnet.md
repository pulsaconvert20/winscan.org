# Uptick Network Binary Update Guide

This guide will help you update your Uptick Network node to the latest version.

## Prerequisites

- Existing Uptick Network node installation
- Root or sudo access
- Basic knowledge of Linux commands

## Update Steps

### 1. Check Current Version

```bash
uptickd version
```

### 2. Stop the Service

```bash
sudo systemctl stop uptickd
```

### 3. Backup Important Files

⚠️ **Important**: Always backup your validator key and node configuration before updating!

```bash
# Backup validator key
cp $HOME/.uptick/config/priv_validator_key.json $HOME/priv_validator_key.json.backup

# Backup node key
cp $HOME/.uptick/config/node_key.json $HOME/node_key.json.backup
```

### 4. Download and Install New Binary

#### Option A: Download Pre-built Binary (Recommended)

```bash
cd $HOME
wget -O uptickd.tar.gz "$(curl -s https://api.github.com/repos//releases/latest | jq -r '.assets[] | select(.name | contains("linux") and (contains("amd64") or contains("x86_64"))) | .browser_download_url' | head -1)"
tar -xzf uptickd.tar.gz
rm -f install.sh uptickd.tar.gz
chmod +x uptickd
sudo mv uptickd /usr/local/bin/
[ -f "libwasmvm.x86_64.so" ] && sudo mv libwasmvm.x86_64.so /usr/lib/
[ -f "libwasmvm.so" ] && sudo mv libwasmvm.so /usr/lib/
```

#### Option B: Build from Source

```bash
# Clone repository
cd $HOME
git clone https://github.com/UptickNetwork/uptick
cd $(basename https://github.com/UptickNetwork/uptick .git)

# Checkout recommended version
git checkout v0.2.14

# Build binary
make install

# Verify installation
$(basename https://github.com/UptickNetwork/uptick .git)d version
```

### 5. Verify New Version

```bash
uptickd version
```

The output should show the new version number.

### 6. Start the Service

```bash
sudo systemctl start uptickd
```

### 7. Check Logs

```bash
sudo journalctl -u uptickd -f -o cat
```

### 8. Verify Node is Running

```bash
uptickd status 2>&1 | jq .SyncInfo
```

## Rollback (If Needed)

If you encounter issues with the new version, you can rollback to the previous version:

### 1. Stop the Service

```bash
sudo systemctl stop uptickd
```

### 2. Restore Previous Binary

If you kept a backup of the old binary:

```bash
sudo cp /usr/local/bin/uptickd.backup /usr/local/bin/uptickd
```

Or reinstall the previous version:

```bash
cd $HOME/uptick-mainnet
git checkout v1.0.0
make install
```

### 3. Start the Service

```bash
sudo systemctl start uptickd
```

## Upgrade with Cosmovisor (Automated)

If you're using Cosmovisor for automated upgrades:

### 1. Create Upgrade Directory

```bash
mkdir -p $HOME/.uptick/cosmovisor/upgrades/upgrade-0.2.14/bin
```

### 2. Download New Binary

```bash
cd $HOME
wget -O uptickd.tar.gz "$(curl -s https://api.github.com/repos//releases/latest | jq -r '.assets[] | select(.name | contains("linux") and (contains("amd64") or contains("x86_64"))) | .browser_download_url' | head -1)"
tar -xzf uptickd.tar.gz
chmod +x uptickd
mv uptickd $HOME/.uptick/cosmovisor/upgrades/upgrade-0.2.14/bin/
```

### 3. Verify Binary

```bash
$HOME/.uptick/cosmovisor/upgrades/upgrade-0.2.14/bin/uptickd version
```

Cosmovisor will automatically switch to the new binary at the specified upgrade height.

## Common Issues

### Issue: Binary not found after update

**Solution**: Make sure the binary is in your PATH:

```bash
which uptickd
```

If not found, check if it's in `/usr/local/bin/` or `$HOME/go/bin/`

### Issue: Version mismatch

**Solution**: Clear the old binary and reinstall:

```bash
sudo rm $(which uptickd)
# Then reinstall using one of the methods above
```

### Issue: Node won't start after update

**Solution**: Check the logs for errors:

```bash
sudo journalctl -u uptickd -n 100 --no-pager
```

Common fixes:
- Reset the node data (if not a validator): `uptickd tendermint unsafe-reset-all --home $HOME/.uptick`
- Check if the genesis file is correct
- Verify peer connections

### Issue: Sync issues after update

**Solution**: Try state sync or snapshot:

```bash
# Stop service
sudo systemctl stop uptickd

# Reset data
uptickd tendermint unsafe-reset-all --home $HOME/.uptick --keep-addr-book

# Use state sync (see State Sync guide)
# Or download snapshot (see Snapshot guide)

# Start service
sudo systemctl start uptickd
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
ps aux | grep uptickd
```

### Check binary location
```bash
which uptickd
```

### Check binary version
```bash
uptickd version --long
```

### Check service status
```bash
sudo systemctl status uptickd
```

## Support

For support and questions, please visit:
- [WinScan Explorer](https://winsnip.xyz)
- [WinScan Telegram](https://t.me/winsnip)
- [Official Uptick Network Documentation]()

---

*Generated by WinScan - Multi-chain Blockchain Explorer*
