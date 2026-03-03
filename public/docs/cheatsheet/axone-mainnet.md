# Axone Cheat Sheet

## Service Management

### Check Logs
```bash
sudo journalctl -u axoned -f -o cat
```

### Start Service
```bash
sudo systemctl start axoned
```

### Stop Service
```bash
sudo systemctl stop axoned
```

### Restart Service
```bash
sudo systemctl restart axoned
```

### Check Service Status
```bash
sudo systemctl status axoned
```

## Node Information

### Sync Info
```bash
axoned status 2>&1 | jq .SyncInfo
```

### Node Info
```bash
axoned status 2>&1 | jq .NodeInfo
```

### Show Node ID
```bash
axoned tendermint show-node-id
```

### Show Validator Info
```bash
axoned status 2>&1 | jq .ValidatorInfo
```

## Key Management

### Add New Key
```bash
axoned keys add wallet
```

### Recover Existing Key
```bash
axoned keys add wallet --recover
```

### List All Keys
```bash
axoned keys list
```

### Delete Key
```bash
axoned keys delete wallet
```

### Export Key to File
```bash
axoned keys export wallet
```

### Import Key from File
```bash
axoned keys import wallet wallet.backup
```

### Query Wallet Balance
```bash
axoned query bank balances $(echo $WALLET)
```

## Token Management

### Withdraw Rewards from All Validators
```bash
axoned tx distribution withdraw-all-rewards --from wallet --chain-id axone-1 --gas-adjustment 1.5 --gas auto --gas-prices 0.001uaxone -y
```

### Withdraw Commission and Rewards from Your Validator
```bash
axoned tx distribution withdraw-rewards $(echo $VALOPER) --commission --from wallet --chain-id axone-1 --gas-adjustment 1.5 --gas auto --gas-prices 0.001uaxone -y
```

### Delegate Tokens to Yourself
```bash
axoned tx staking delegate $(echo $VALOPER) 1000000uaxone --from wallet --chain-id axone-1 --gas-adjustment 1.5 --gas auto --gas-prices 0.001uaxone -y
```

### Delegate Tokens to Validator
```bash
axoned tx staking delegate <TO_VALOPER_ADDRESS> 1000000uaxone --from wallet --chain-id axone-1 --gas-adjustment 1.5 --gas auto --gas-prices 0.001uaxone -y
```

### Redelegate Tokens to Another Validator
```bash
axoned tx staking redelegate $(echo $VALOPER) <TO_VALOPER_ADDRESS> 1000000uaxone --from wallet --chain-id axone-1 --gas-adjustment 1.5 --gas auto --gas-prices 0.001uaxone -y
```

### Unbond Tokens from Your Validator
```bash
axoned tx staking unbond $(echo $VALOPER) 1000000uaxone --from wallet --chain-id axone-1 --gas-adjustment 1.5 --gas auto --gas-prices 0.001uaxone -y
```

### Send Tokens to Wallet
```bash
axoned tx bank send wallet <TO_WALLET_ADDRESS> 1000000uaxone --from wallet --chain-id axone-1 --gas-adjustment 1.5 --gas auto --gas-prices 0.001uaxone -y
```

## Validator Management

### Create New Validator
```bash
axoned tx staking create-validator \
--amount 1000000uaxone \
--pubkey $(axoned tendermint show-validator) \
--moniker "YOUR_MONIKER_NAME" \
--identity "YOUR_KEYBASE_ID" \
--details "YOUR_DETAILS" \
--website "YOUR_WEBSITE_URL" \
--chain-id axone-1 \
--commission-rate 0.05 \
--commission-max-rate 0.20 \
--commission-max-change-rate 0.01 \
--min-self-delegation 1 \
--from wallet \
--gas-adjustment 1.5 \
--gas auto \
--gas-prices 0.001uaxone \
-y
```

### Edit Existing Validator
```bash
axoned tx staking edit-validator \
--new-moniker "YOUR_MONIKER_NAME" \
--identity "YOUR_KEYBASE_ID" \
--details "YOUR_DETAILS" \
--website "YOUR_WEBSITE_URL" \
--chain-id axone-1 \
--commission-rate 0.05 \
--from wallet \
--gas-adjustment 1.5 \
--gas auto \
--gas-prices 0.001uaxone \
-y
```

### Unjail Validator
```bash
axoned tx slashing unjail --from wallet --chain-id axone-1 --gas-adjustment 1.5 --gas auto --gas-prices 0.001uaxone -y
```

### Jail Reason
```bash
axoned query slashing signing-info $(axoned tendermint show-validator)
```

### List All Active Validators
```bash
axoned q staking validators -oj --limit=3000 | jq '.validators[] | select(.status=="BOND_STATUS_BONDED")' | jq -r '(.tokens|tonumber/pow(10; 6)|floor|tostring) + " \t " + .description.moniker' | sort -gr | nl
```

### List All Inactive Validators
```bash
axoned q staking validators -oj --limit=3000 | jq '.validators[] | select(.status=="BOND_STATUS_UNBONDED")' | jq -r '(.tokens|tonumber/pow(10; 6)|floor|tostring) + " \t " + .description.moniker' | sort -gr | nl
```

### View Validator Details
```bash
axoned q staking validator $(echo $VALOPER)
```

## Governance

### List All Proposals
```bash
axoned query gov proposals
```

### View Proposal by ID
```bash
axoned query gov proposal 1
```

### Vote Yes
```bash
axoned tx gov vote 1 yes --from wallet --chain-id axone-1 --gas-adjustment 1.5 --gas auto --gas-prices 0.001uaxone -y
```

### Vote No
```bash
axoned tx gov vote 1 no --from wallet --chain-id axone-1 --gas-adjustment 1.5 --gas auto --gas-prices 0.001uaxone -y
```

### Vote Abstain
```bash
axoned tx gov vote 1 abstain --from wallet --chain-id axone-1 --gas-adjustment 1.5 --gas auto --gas-prices 0.001uaxone -y
```

### Vote NoWithVeto
```bash
axoned tx gov vote 1 NoWithVeto --from wallet --chain-id axone-1 --gas-adjustment 1.5 --gas auto --gas-prices 0.001uaxone -y
```

## Maintenance

### Get Validator Info
```bash
axoned status 2>&1 | jq .ValidatorInfo
```

### Get Sync Info
```bash
axoned status 2>&1 | jq .SyncInfo
```

### Get Node Peer
```bash
echo $(echo $(axoned tendermint show-node-id)'@'$(curl -s ifconfig.me)':'$(cat $HOME/.axone/config/config.toml | sed -n '/Address to listen for incoming connection/{n;p;}' | sed 's/.*://; s/".*//')
```

### Check If Validator Key Is Correct
```bash
[[ $(axoned q staking validator $(echo $VALOPER) -oj | jq -r .consensus_pubkey.key) = $(axoned status | jq -r .ValidatorInfo.PubKey.value) ]] && echo -e "\n\e[1m\e[32mTrue\e[0m\n" || echo -e "\n\e[1m\e[31mFalse\e[0m\n"
```

### Get Live Peers
```bash
curl -sS http://localhost:26657/net_info | jq -r '.result.peers[] | "\(.node_info.id)@\(.remote_ip):\(.node_info.listen_addr)"' | awk -F ':' '{print $1":"$(NF)}'
```

### Set Minimum Gas Price
```bash
sed -i -e "s/^minimum-gas-prices *=.*/minimum-gas-prices = \"0.001uaxone\"/" $HOME/.axone/config/app.toml
```

### Enable Prometheus
```bash
sed -i -e "s/prometheus = false/prometheus = true/" $HOME/.axone/config/config.toml
```

### Reset Chain Data
```bash
axoned tendermint unsafe-reset-all --keep-addr-book --home $HOME/.axone --keep-addr-book
```

### Remove Node
⚠️ **Warning**: Make sure you have backed up your priv_validator_key.json!

```bash
cd $HOME
sudo systemctl stop axoned
sudo systemctl disable axoned
sudo rm /etc/systemd/system/axoned.service
sudo systemctl daemon-reload
rm -f $(which axoned)
rm -rf $HOME/.axone
rm -rf $HOME/axoned
```

## Useful Commands

### Check Blocks Remaining
```bash
local_height=$(curl -s localhost:26657/status | jq -r .result.sync_info.latest_block_height); network_height=$(curl -s https://rpc-axone.winnode.xyz/status | jq -r .result.sync_info.latest_block_height); blocks_left=$((network_height - local_height)); echo "Your node height: $local_height"; echo "Network height: $network_height"; echo "Blocks left: $blocks_left"
```

### Check Your Validator
```bash
axoned query staking validator $(echo $VALOPER)
```

### Check Your Wallet Balance
```bash
axoned query bank balances $(echo $WALLET)
```

### Check Service Logs
```bash
sudo journalctl -u axoned -f --no-hostname -o cat
```

---

*Generated by WinScan - Multi-chain Blockchain Explorer*
