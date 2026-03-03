# Lumen Cheat Sheet

## Service Management

### Check Logs
```bash
sudo journalctl -u lumend -f -o cat
```

### Start Service
```bash
sudo systemctl start lumend
```

### Stop Service
```bash
sudo systemctl stop lumend
```

### Restart Service
```bash
sudo systemctl restart lumend
```

### Check Service Status
```bash
sudo systemctl status lumend
```

## Node Information

### Sync Info
```bash
lumend status 2>&1 | jq .SyncInfo
```

### Node Info
```bash
lumend status 2>&1 | jq .NodeInfo
```

### Show Node ID
```bash
lumend tendermint show-node-id
```

### Show Validator Info
```bash
lumend status 2>&1 | jq .ValidatorInfo
```

## Key Management

### Add New Key
```bash
lumend keys add wallet
```

### Recover Existing Key
```bash
lumend keys add wallet --recover
```

### List All Keys
```bash
lumend keys list
```

### Delete Key
```bash
lumend keys delete wallet
```

### Export Key to File
```bash
lumend keys export wallet
```

### Import Key from File
```bash
lumend keys import wallet wallet.backup
```

### Query Wallet Balance
```bash
lumend query bank balances $(echo $WALLET)
```

## Token Management

### Withdraw Rewards from All Validators
```bash
lumend tx distribution withdraw-all-rewards --from wallet --chain-id lumen --gas-adjustment 1.5 --gas auto --gas-prices 0.01ulmn -y
```

### Withdraw Commission and Rewards from Your Validator
```bash
lumend tx distribution withdraw-rewards $(echo $VALOPER) --commission --from wallet --chain-id lumen --gas-adjustment 1.5 --gas auto --gas-prices 0.01ulmn -y
```

### Delegate Tokens to Yourself
```bash
lumend tx staking delegate $(echo $VALOPER) 1000000ulmn --from wallet --chain-id lumen --gas-adjustment 1.5 --gas auto --gas-prices 0.01ulmn -y
```

### Delegate Tokens to Validator
```bash
lumend tx staking delegate <TO_VALOPER_ADDRESS> 1000000ulmn --from wallet --chain-id lumen --gas-adjustment 1.5 --gas auto --gas-prices 0.01ulmn -y
```

### Redelegate Tokens to Another Validator
```bash
lumend tx staking redelegate $(echo $VALOPER) <TO_VALOPER_ADDRESS> 1000000ulmn --from wallet --chain-id lumen --gas-adjustment 1.5 --gas auto --gas-prices 0.01ulmn -y
```

### Unbond Tokens from Your Validator
```bash
lumend tx staking unbond $(echo $VALOPER) 1000000ulmn --from wallet --chain-id lumen --gas-adjustment 1.5 --gas auto --gas-prices 0.01ulmn -y
```

### Send Tokens to Wallet
```bash
lumend tx bank send wallet <TO_WALLET_ADDRESS> 1000000ulmn --from wallet --chain-id lumen --gas-adjustment 1.5 --gas auto --gas-prices 0.01ulmn -y
```

## Validator Management

### Create New Validator
```bash
lumend tx staking create-validator \
--amount 1000000ulmn \
--pubkey $(lumend tendermint show-validator) \
--moniker "YOUR_MONIKER_NAME" \
--identity "YOUR_KEYBASE_ID" \
--details "YOUR_DETAILS" \
--website "YOUR_WEBSITE_URL" \
--chain-id lumen \
--commission-rate 0.05 \
--commission-max-rate 0.20 \
--commission-max-change-rate 0.01 \
--min-self-delegation 1 \
--from wallet \
--gas-adjustment 1.5 \
--gas auto \
--gas-prices 0.01ulmn \
-y
```

### Edit Existing Validator
```bash
lumend tx staking edit-validator \
--new-moniker "YOUR_MONIKER_NAME" \
--identity "YOUR_KEYBASE_ID" \
--details "YOUR_DETAILS" \
--website "YOUR_WEBSITE_URL" \
--chain-id lumen \
--commission-rate 0.05 \
--from wallet \
--gas-adjustment 1.5 \
--gas auto \
--gas-prices 0.01ulmn \
-y
```

### Unjail Validator
```bash
lumend tx slashing unjail --from wallet --chain-id lumen --gas-adjustment 1.5 --gas auto --gas-prices 0.01ulmn -y
```

### Jail Reason
```bash
lumend query slashing signing-info $(lumend tendermint show-validator)
```

### List All Active Validators
```bash
lumend q staking validators -oj --limit=3000 | jq '.validators[] | select(.status=="BOND_STATUS_BONDED")' | jq -r '(.tokens|tonumber/pow(10; 6)|floor|tostring) + " \t " + .description.moniker' | sort -gr | nl
```

### List All Inactive Validators
```bash
lumend q staking validators -oj --limit=3000 | jq '.validators[] | select(.status=="BOND_STATUS_UNBONDED")' | jq -r '(.tokens|tonumber/pow(10; 6)|floor|tostring) + " \t " + .description.moniker' | sort -gr | nl
```

### View Validator Details
```bash
lumend q staking validator $(echo $VALOPER)
```

## Governance

### List All Proposals
```bash
lumend query gov proposals
```

### View Proposal by ID
```bash
lumend query gov proposal 1
```

### Vote Yes
```bash
lumend tx gov vote 1 yes --from wallet --chain-id lumen --gas-adjustment 1.5 --gas auto --gas-prices 0.01ulmn -y
```

### Vote No
```bash
lumend tx gov vote 1 no --from wallet --chain-id lumen --gas-adjustment 1.5 --gas auto --gas-prices 0.01ulmn -y
```

### Vote Abstain
```bash
lumend tx gov vote 1 abstain --from wallet --chain-id lumen --gas-adjustment 1.5 --gas auto --gas-prices 0.01ulmn -y
```

### Vote NoWithVeto
```bash
lumend tx gov vote 1 NoWithVeto --from wallet --chain-id lumen --gas-adjustment 1.5 --gas auto --gas-prices 0.01ulmn -y
```

## Maintenance

### Get Validator Info
```bash
lumend status 2>&1 | jq .ValidatorInfo
```

### Get Sync Info
```bash
lumend status 2>&1 | jq .SyncInfo
```

### Get Node Peer
```bash
echo $(echo $(lumend tendermint show-node-id)'@'$(curl -s ifconfig.me)':'$(cat $HOME/.lumen/config/config.toml | sed -n '/Address to listen for incoming connection/{n;p;}' | sed 's/.*://; s/".*//')
```

### Check If Validator Key Is Correct
```bash
[[ $(lumend q staking validator $(echo $VALOPER) -oj | jq -r .consensus_pubkey.key) = $(lumend status | jq -r .ValidatorInfo.PubKey.value) ]] && echo -e "\n\e[1m\e[32mTrue\e[0m\n" || echo -e "\n\e[1m\e[31mFalse\e[0m\n"
```

### Get Live Peers
```bash
curl -sS http://localhost:26657/net_info | jq -r '.result.peers[] | "\(.node_info.id)@\(.remote_ip):\(.node_info.listen_addr)"' | awk -F ':' '{print $1":"$(NF)}'
```

### Set Minimum Gas Price
```bash
sed -i -e "s/^minimum-gas-prices *=.*/minimum-gas-prices = \"0.01ulmn\"/" $HOME/.lumen/config/app.toml
```

### Enable Prometheus
```bash
sed -i -e "s/prometheus = false/prometheus = true/" $HOME/.lumen/config/config.toml
```

### Reset Chain Data
```bash
lumend tendermint unsafe-reset-all --keep-addr-book --home $HOME/.lumen --keep-addr-book
```

### Remove Node
⚠️ **Warning**: Make sure you have backed up your priv_validator_key.json!

```bash
cd $HOME
sudo systemctl stop lumend
sudo systemctl disable lumend
sudo rm /etc/systemd/system/lumend.service
sudo systemctl daemon-reload
rm -f $(which lumend)
rm -rf $HOME/.lumen
rm -rf $HOME/lumen-mainnet
```

## Useful Commands

### Check Blocks Remaining
```bash
local_height=$(curl -s localhost:26657/status | jq -r .result.sync_info.latest_block_height); network_height=$(curl -s https://rpc-lumen.winnode.xyz/status | jq -r .result.sync_info.latest_block_height); blocks_left=$((network_height - local_height)); echo "Your node height: $local_height"; echo "Network height: $network_height"; echo "Blocks left: $blocks_left"
```

### Check Your Validator
```bash
lumend query staking validator $(echo $VALOPER)
```

### Check Your Wallet Balance
```bash
lumend query bank balances $(echo $WALLET)
```

### Check Service Logs
```bash
sudo journalctl -u lumend -f --no-hostname -o cat
```

---

*Generated by WinScan - Multi-chain Blockchain Explorer*
