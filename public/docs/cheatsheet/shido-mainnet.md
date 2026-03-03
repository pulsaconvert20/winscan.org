# Shido Network Cheat Sheet

## Service Management

### Check Logs
```bash
sudo journalctl -u shidod -f -o cat
```

### Start Service
```bash
sudo systemctl start shidod
```

### Stop Service
```bash
sudo systemctl stop shidod
```

### Restart Service
```bash
sudo systemctl restart shidod
```

### Check Service Status
```bash
sudo systemctl status shidod
```

## Node Information

### Sync Info
```bash
shidod status 2>&1 | jq .SyncInfo
```

### Node Info
```bash
shidod status 2>&1 | jq .NodeInfo
```

### Show Node ID
```bash
shidod tendermint show-node-id
```

### Show Validator Info
```bash
shidod status 2>&1 | jq .ValidatorInfo
```

## Key Management

### Add New Key
```bash
shidod keys add wallet
```

### Recover Existing Key
```bash
shidod keys add wallet --recover
```

### List All Keys
```bash
shidod keys list
```

### Delete Key
```bash
shidod keys delete wallet
```

### Export Key to File
```bash
shidod keys export wallet
```

### Import Key from File
```bash
shidod keys import wallet wallet.backup
```

### Query Wallet Balance
```bash
shidod query bank balances $(echo $WALLET)
```

## Token Management

### Withdraw Rewards from All Validators
```bash
shidod tx distribution withdraw-all-rewards --from wallet --chain-id shido_9008-1 --gas-adjustment 1.5 --gas auto --gas-prices 0.001shido -y
```

### Withdraw Commission and Rewards from Your Validator
```bash
shidod tx distribution withdraw-rewards $(echo $VALOPER) --commission --from wallet --chain-id shido_9008-1 --gas-adjustment 1.5 --gas auto --gas-prices 0.001shido -y
```

### Delegate Tokens to Yourself
```bash
shidod tx staking delegate $(echo $VALOPER) 1000000shido --from wallet --chain-id shido_9008-1 --gas-adjustment 1.5 --gas auto --gas-prices 0.001shido -y
```

### Delegate Tokens to Validator
```bash
shidod tx staking delegate <TO_VALOPER_ADDRESS> 1000000shido --from wallet --chain-id shido_9008-1 --gas-adjustment 1.5 --gas auto --gas-prices 0.001shido -y
```

### Redelegate Tokens to Another Validator
```bash
shidod tx staking redelegate $(echo $VALOPER) <TO_VALOPER_ADDRESS> 1000000shido --from wallet --chain-id shido_9008-1 --gas-adjustment 1.5 --gas auto --gas-prices 0.001shido -y
```

### Unbond Tokens from Your Validator
```bash
shidod tx staking unbond $(echo $VALOPER) 1000000shido --from wallet --chain-id shido_9008-1 --gas-adjustment 1.5 --gas auto --gas-prices 0.001shido -y
```

### Send Tokens to Wallet
```bash
shidod tx bank send wallet <TO_WALLET_ADDRESS> 1000000shido --from wallet --chain-id shido_9008-1 --gas-adjustment 1.5 --gas auto --gas-prices 0.001shido -y
```

## Validator Management

### Create New Validator
```bash
shidod tx staking create-validator \
--amount 1000000shido \
--pubkey $(shidod tendermint show-validator) \
--moniker "YOUR_MONIKER_NAME" \
--identity "YOUR_KEYBASE_ID" \
--details "YOUR_DETAILS" \
--website "YOUR_WEBSITE_URL" \
--chain-id shido_9008-1 \
--commission-rate 0.05 \
--commission-max-rate 0.20 \
--commission-max-change-rate 0.01 \
--min-self-delegation 1 \
--from wallet \
--gas-adjustment 1.5 \
--gas auto \
--gas-prices 0.001shido \
-y
```

### Edit Existing Validator
```bash
shidod tx staking edit-validator \
--new-moniker "YOUR_MONIKER_NAME" \
--identity "YOUR_KEYBASE_ID" \
--details "YOUR_DETAILS" \
--website "YOUR_WEBSITE_URL" \
--chain-id shido_9008-1 \
--commission-rate 0.05 \
--from wallet \
--gas-adjustment 1.5 \
--gas auto \
--gas-prices 0.001shido \
-y
```

### Unjail Validator
```bash
shidod tx slashing unjail --from wallet --chain-id shido_9008-1 --gas-adjustment 1.5 --gas auto --gas-prices 0.001shido -y
```

### Jail Reason
```bash
shidod query slashing signing-info $(shidod tendermint show-validator)
```

### List All Active Validators
```bash
shidod q staking validators -oj --limit=3000 | jq '.validators[] | select(.status=="BOND_STATUS_BONDED")' | jq -r '(.tokens|tonumber/pow(10; 6)|floor|tostring) + " \t " + .description.moniker' | sort -gr | nl
```

### List All Inactive Validators
```bash
shidod q staking validators -oj --limit=3000 | jq '.validators[] | select(.status=="BOND_STATUS_UNBONDED")' | jq -r '(.tokens|tonumber/pow(10; 6)|floor|tostring) + " \t " + .description.moniker' | sort -gr | nl
```

### View Validator Details
```bash
shidod q staking validator $(echo $VALOPER)
```

## Governance

### List All Proposals
```bash
shidod query gov proposals
```

### View Proposal by ID
```bash
shidod query gov proposal 1
```

### Vote Yes
```bash
shidod tx gov vote 1 yes --from wallet --chain-id shido_9008-1 --gas-adjustment 1.5 --gas auto --gas-prices 0.001shido -y
```

### Vote No
```bash
shidod tx gov vote 1 no --from wallet --chain-id shido_9008-1 --gas-adjustment 1.5 --gas auto --gas-prices 0.001shido -y
```

### Vote Abstain
```bash
shidod tx gov vote 1 abstain --from wallet --chain-id shido_9008-1 --gas-adjustment 1.5 --gas auto --gas-prices 0.001shido -y
```

### Vote NoWithVeto
```bash
shidod tx gov vote 1 NoWithVeto --from wallet --chain-id shido_9008-1 --gas-adjustment 1.5 --gas auto --gas-prices 0.001shido -y
```

## Maintenance

### Get Validator Info
```bash
shidod status 2>&1 | jq .ValidatorInfo
```

### Get Sync Info
```bash
shidod status 2>&1 | jq .SyncInfo
```

### Get Node Peer
```bash
echo $(echo $(shidod tendermint show-node-id)'@'$(curl -s ifconfig.me)':'$(cat $HOME/.shido/config/config.toml | sed -n '/Address to listen for incoming connection/{n;p;}' | sed 's/.*://; s/".*//')
```

### Check If Validator Key Is Correct
```bash
[[ $(shidod q staking validator $(echo $VALOPER) -oj | jq -r .consensus_pubkey.key) = $(shidod status | jq -r .ValidatorInfo.PubKey.value) ]] && echo -e "\n\e[1m\e[32mTrue\e[0m\n" || echo -e "\n\e[1m\e[31mFalse\e[0m\n"
```

### Get Live Peers
```bash
curl -sS http://localhost:26657/net_info | jq -r '.result.peers[] | "\(.node_info.id)@\(.remote_ip):\(.node_info.listen_addr)"' | awk -F ':' '{print $1":"$(NF)}'
```

### Set Minimum Gas Price
```bash
sed -i -e "s/^minimum-gas-prices *=.*/minimum-gas-prices = \"0.001shido\"/" $HOME/.shido/config/app.toml
```

### Enable Prometheus
```bash
sed -i -e "s/prometheus = false/prometheus = true/" $HOME/.shido/config/config.toml
```

### Reset Chain Data
```bash
shidod tendermint unsafe-reset-all --keep-addr-book --home $HOME/.shido --keep-addr-book
```

### Remove Node
⚠️ **Warning**: Make sure you have backed up your priv_validator_key.json!

```bash
cd $HOME
sudo systemctl stop shidod
sudo systemctl disable shidod
sudo rm /etc/systemd/system/shidod.service
sudo systemctl daemon-reload
rm -f $(which shidod)
rm -rf $HOME/.shido
rm -rf $HOME/shido-upgrade-v3.3.1
```

## Useful Commands

### Check Blocks Remaining
```bash
local_height=$(curl -s localhost:26657/status | jq -r .result.sync_info.latest_block_height); network_height=$(curl -s https://tendermint.shidoscan.com/status | jq -r .result.sync_info.latest_block_height); blocks_left=$((network_height - local_height)); echo "Your node height: $local_height"; echo "Network height: $network_height"; echo "Blocks left: $blocks_left"
```

### Check Your Validator
```bash
shidod query staking validator $(echo $VALOPER)
```

### Check Your Wallet Balance
```bash
shidod query bank balances $(echo $WALLET)
```

### Check Service Logs
```bash
sudo journalctl -u shidod -f --no-hostname -o cat
```

---

*Generated by WinScan - Multi-chain Blockchain Explorer*
