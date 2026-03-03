# Gitopia Cheat Sheet

## Service Management

### Check Logs
```bash
sudo journalctl -u gitopiad -f -o cat
```

### Start Service
```bash
sudo systemctl start gitopiad
```

### Stop Service
```bash
sudo systemctl stop gitopiad
```

### Restart Service
```bash
sudo systemctl restart gitopiad
```

### Check Service Status
```bash
sudo systemctl status gitopiad
```

## Node Information

### Sync Info
```bash
gitopiad status 2>&1 | jq .SyncInfo
```

### Node Info
```bash
gitopiad status 2>&1 | jq .NodeInfo
```

### Show Node ID
```bash
gitopiad tendermint show-node-id
```

### Show Validator Info
```bash
gitopiad status 2>&1 | jq .ValidatorInfo
```

## Key Management

### Add New Key
```bash
gitopiad keys add wallet
```

### Recover Existing Key
```bash
gitopiad keys add wallet --recover
```

### List All Keys
```bash
gitopiad keys list
```

### Delete Key
```bash
gitopiad keys delete wallet
```

### Export Key to File
```bash
gitopiad keys export wallet
```

### Import Key from File
```bash
gitopiad keys import wallet wallet.backup
```

### Query Wallet Balance
```bash
gitopiad query bank balances $(echo $WALLET)
```

## Token Management

### Withdraw Rewards from All Validators
```bash
gitopiad tx distribution withdraw-all-rewards --from wallet --chain-id gitopia --gas-adjustment 1.5 --gas auto --gas-prices 0.001ulore -y
```

### Withdraw Commission and Rewards from Your Validator
```bash
gitopiad tx distribution withdraw-rewards $(echo $VALOPER) --commission --from wallet --chain-id gitopia --gas-adjustment 1.5 --gas auto --gas-prices 0.001ulore -y
```

### Delegate Tokens to Yourself
```bash
gitopiad tx staking delegate $(echo $VALOPER) 1000000ulore --from wallet --chain-id gitopia --gas-adjustment 1.5 --gas auto --gas-prices 0.001ulore -y
```

### Delegate Tokens to Validator
```bash
gitopiad tx staking delegate <TO_VALOPER_ADDRESS> 1000000ulore --from wallet --chain-id gitopia --gas-adjustment 1.5 --gas auto --gas-prices 0.001ulore -y
```

### Redelegate Tokens to Another Validator
```bash
gitopiad tx staking redelegate $(echo $VALOPER) <TO_VALOPER_ADDRESS> 1000000ulore --from wallet --chain-id gitopia --gas-adjustment 1.5 --gas auto --gas-prices 0.001ulore -y
```

### Unbond Tokens from Your Validator
```bash
gitopiad tx staking unbond $(echo $VALOPER) 1000000ulore --from wallet --chain-id gitopia --gas-adjustment 1.5 --gas auto --gas-prices 0.001ulore -y
```

### Send Tokens to Wallet
```bash
gitopiad tx bank send wallet <TO_WALLET_ADDRESS> 1000000ulore --from wallet --chain-id gitopia --gas-adjustment 1.5 --gas auto --gas-prices 0.001ulore -y
```

## Validator Management

### Create New Validator
```bash
gitopiad tx staking create-validator \
--amount 1000000ulore \
--pubkey $(gitopiad tendermint show-validator) \
--moniker "YOUR_MONIKER_NAME" \
--identity "YOUR_KEYBASE_ID" \
--details "YOUR_DETAILS" \
--website "YOUR_WEBSITE_URL" \
--chain-id gitopia \
--commission-rate 0.05 \
--commission-max-rate 0.20 \
--commission-max-change-rate 0.01 \
--min-self-delegation 1 \
--from wallet \
--gas-adjustment 1.5 \
--gas auto \
--gas-prices 0.001ulore \
-y
```

### Edit Existing Validator
```bash
gitopiad tx staking edit-validator \
--new-moniker "YOUR_MONIKER_NAME" \
--identity "YOUR_KEYBASE_ID" \
--details "YOUR_DETAILS" \
--website "YOUR_WEBSITE_URL" \
--chain-id gitopia \
--commission-rate 0.05 \
--from wallet \
--gas-adjustment 1.5 \
--gas auto \
--gas-prices 0.001ulore \
-y
```

### Unjail Validator
```bash
gitopiad tx slashing unjail --from wallet --chain-id gitopia --gas-adjustment 1.5 --gas auto --gas-prices 0.001ulore -y
```

### Jail Reason
```bash
gitopiad query slashing signing-info $(gitopiad tendermint show-validator)
```

### List All Active Validators
```bash
gitopiad q staking validators -oj --limit=3000 | jq '.validators[] | select(.status=="BOND_STATUS_BONDED")' | jq -r '(.tokens|tonumber/pow(10; 6)|floor|tostring) + " \t " + .description.moniker' | sort -gr | nl
```

### List All Inactive Validators
```bash
gitopiad q staking validators -oj --limit=3000 | jq '.validators[] | select(.status=="BOND_STATUS_UNBONDED")' | jq -r '(.tokens|tonumber/pow(10; 6)|floor|tostring) + " \t " + .description.moniker' | sort -gr | nl
```

### View Validator Details
```bash
gitopiad q staking validator $(echo $VALOPER)
```

## Governance

### List All Proposals
```bash
gitopiad query gov proposals
```

### View Proposal by ID
```bash
gitopiad query gov proposal 1
```

### Vote Yes
```bash
gitopiad tx gov vote 1 yes --from wallet --chain-id gitopia --gas-adjustment 1.5 --gas auto --gas-prices 0.001ulore -y
```

### Vote No
```bash
gitopiad tx gov vote 1 no --from wallet --chain-id gitopia --gas-adjustment 1.5 --gas auto --gas-prices 0.001ulore -y
```

### Vote Abstain
```bash
gitopiad tx gov vote 1 abstain --from wallet --chain-id gitopia --gas-adjustment 1.5 --gas auto --gas-prices 0.001ulore -y
```

### Vote NoWithVeto
```bash
gitopiad tx gov vote 1 NoWithVeto --from wallet --chain-id gitopia --gas-adjustment 1.5 --gas auto --gas-prices 0.001ulore -y
```

## Maintenance

### Get Validator Info
```bash
gitopiad status 2>&1 | jq .ValidatorInfo
```

### Get Sync Info
```bash
gitopiad status 2>&1 | jq .SyncInfo
```

### Get Node Peer
```bash
echo $(echo $(gitopiad tendermint show-node-id)'@'$(curl -s ifconfig.me)':'$(cat $HOME/.gitopia/config/config.toml | sed -n '/Address to listen for incoming connection/{n;p;}' | sed 's/.*://; s/".*//')
```

### Check If Validator Key Is Correct
```bash
[[ $(gitopiad q staking validator $(echo $VALOPER) -oj | jq -r .consensus_pubkey.key) = $(gitopiad status | jq -r .ValidatorInfo.PubKey.value) ]] && echo -e "\n\e[1m\e[32mTrue\e[0m\n" || echo -e "\n\e[1m\e[31mFalse\e[0m\n"
```

### Get Live Peers
```bash
curl -sS http://localhost:26657/net_info | jq -r '.result.peers[] | "\(.node_info.id)@\(.remote_ip):\(.node_info.listen_addr)"' | awk -F ':' '{print $1":"$(NF)}'
```

### Set Minimum Gas Price
```bash
sed -i -e "s/^minimum-gas-prices *=.*/minimum-gas-prices = \"0.001ulore\"/" $HOME/.gitopia/config/app.toml
```

### Enable Prometheus
```bash
sed -i -e "s/prometheus = false/prometheus = true/" $HOME/.gitopia/config/config.toml
```

### Reset Chain Data
```bash
gitopiad tendermint unsafe-reset-all --keep-addr-book --home $HOME/.gitopia --keep-addr-book
```

### Remove Node
⚠️ **Warning**: Make sure you have backed up your priv_validator_key.json!

```bash
cd $HOME
sudo systemctl stop gitopiad
sudo systemctl disable gitopiad
sudo rm /etc/systemd/system/gitopiad.service
sudo systemctl daemon-reload
rm -f $(which gitopiad)
rm -rf $HOME/.gitopia
rm -rf $HOME/gitopia
```

## Useful Commands

### Check Blocks Remaining
```bash
local_height=$(curl -s localhost:26657/status | jq -r .result.sync_info.latest_block_height); network_height=$(curl -s https://gitopia-rpc.polkachu.com/status | jq -r .result.sync_info.latest_block_height); blocks_left=$((network_height - local_height)); echo "Your node height: $local_height"; echo "Network height: $network_height"; echo "Blocks left: $blocks_left"
```

### Check Your Validator
```bash
gitopiad query staking validator $(echo $VALOPER)
```

### Check Your Wallet Balance
```bash
gitopiad query bank balances $(echo $WALLET)
```

### Check Service Logs
```bash
sudo journalctl -u gitopiad -f --no-hostname -o cat
```

---

*Generated by WinScan - Multi-chain Blockchain Explorer*
