# Humans.ai Cheat Sheet

## Service Management

### Check Logs
```bash
sudo journalctl -u humansd -f -o cat
```

### Start Service
```bash
sudo systemctl start humansd
```

### Stop Service
```bash
sudo systemctl stop humansd
```

### Restart Service
```bash
sudo systemctl restart humansd
```

### Check Service Status
```bash
sudo systemctl status humansd
```

## Node Information

### Sync Info
```bash
humansd status 2>&1 | jq .SyncInfo
```

### Node Info
```bash
humansd status 2>&1 | jq .NodeInfo
```

### Show Node ID
```bash
humansd tendermint show-node-id
```

### Show Validator Info
```bash
humansd status 2>&1 | jq .ValidatorInfo
```

## Key Management

### Add New Key
```bash
humansd keys add wallet
```

### Recover Existing Key
```bash
humansd keys add wallet --recover
```

### List All Keys
```bash
humansd keys list
```

### Delete Key
```bash
humansd keys delete wallet
```

### Export Key to File
```bash
humansd keys export wallet
```

### Import Key from File
```bash
humansd keys import wallet wallet.backup
```

### Query Wallet Balance
```bash
humansd query bank balances $(echo $WALLET)
```

## Token Management

### Withdraw Rewards from All Validators
```bash
humansd tx distribution withdraw-all-rewards --from wallet --chain-id humans_1089-1 --gas-adjustment 1.5 --gas auto --gas-prices 250000000aheart -y
```

### Withdraw Commission and Rewards from Your Validator
```bash
humansd tx distribution withdraw-rewards $(echo $VALOPER) --commission --from wallet --chain-id humans_1089-1 --gas-adjustment 1.5 --gas auto --gas-prices 250000000aheart -y
```

### Delegate Tokens to Yourself
```bash
humansd tx staking delegate $(echo $VALOPER) 1000000aheart --from wallet --chain-id humans_1089-1 --gas-adjustment 1.5 --gas auto --gas-prices 250000000aheart -y
```

### Delegate Tokens to Validator
```bash
humansd tx staking delegate <TO_VALOPER_ADDRESS> 1000000aheart --from wallet --chain-id humans_1089-1 --gas-adjustment 1.5 --gas auto --gas-prices 250000000aheart -y
```

### Redelegate Tokens to Another Validator
```bash
humansd tx staking redelegate $(echo $VALOPER) <TO_VALOPER_ADDRESS> 1000000aheart --from wallet --chain-id humans_1089-1 --gas-adjustment 1.5 --gas auto --gas-prices 250000000aheart -y
```

### Unbond Tokens from Your Validator
```bash
humansd tx staking unbond $(echo $VALOPER) 1000000aheart --from wallet --chain-id humans_1089-1 --gas-adjustment 1.5 --gas auto --gas-prices 250000000aheart -y
```

### Send Tokens to Wallet
```bash
humansd tx bank send wallet <TO_WALLET_ADDRESS> 1000000aheart --from wallet --chain-id humans_1089-1 --gas-adjustment 1.5 --gas auto --gas-prices 250000000aheart -y
```

## Validator Management

### Create New Validator
```bash
humansd tx staking create-validator \
--amount 1000000aheart \
--pubkey $(humansd tendermint show-validator) \
--moniker "YOUR_MONIKER_NAME" \
--identity "YOUR_KEYBASE_ID" \
--details "YOUR_DETAILS" \
--website "YOUR_WEBSITE_URL" \
--chain-id humans_1089-1 \
--commission-rate 0.05 \
--commission-max-rate 0.20 \
--commission-max-change-rate 0.01 \
--min-self-delegation 1 \
--from wallet \
--gas-adjustment 1.5 \
--gas auto \
--gas-prices 250000000aheart \
-y
```

### Edit Existing Validator
```bash
humansd tx staking edit-validator \
--new-moniker "YOUR_MONIKER_NAME" \
--identity "YOUR_KEYBASE_ID" \
--details "YOUR_DETAILS" \
--website "YOUR_WEBSITE_URL" \
--chain-id humans_1089-1 \
--commission-rate 0.05 \
--from wallet \
--gas-adjustment 1.5 \
--gas auto \
--gas-prices 250000000aheart \
-y
```

### Unjail Validator
```bash
humansd tx slashing unjail --from wallet --chain-id humans_1089-1 --gas-adjustment 1.5 --gas auto --gas-prices 250000000aheart -y
```

### Jail Reason
```bash
humansd query slashing signing-info $(humansd tendermint show-validator)
```

### List All Active Validators
```bash
humansd q staking validators -oj --limit=3000 | jq '.validators[] | select(.status=="BOND_STATUS_BONDED")' | jq -r '(.tokens|tonumber/pow(10; 6)|floor|tostring) + " \t " + .description.moniker' | sort -gr | nl
```

### List All Inactive Validators
```bash
humansd q staking validators -oj --limit=3000 | jq '.validators[] | select(.status=="BOND_STATUS_UNBONDED")' | jq -r '(.tokens|tonumber/pow(10; 6)|floor|tostring) + " \t " + .description.moniker' | sort -gr | nl
```

### View Validator Details
```bash
humansd q staking validator $(echo $VALOPER)
```

## Governance

### List All Proposals
```bash
humansd query gov proposals
```

### View Proposal by ID
```bash
humansd query gov proposal 1
```

### Vote Yes
```bash
humansd tx gov vote 1 yes --from wallet --chain-id humans_1089-1 --gas-adjustment 1.5 --gas auto --gas-prices 250000000aheart -y
```

### Vote No
```bash
humansd tx gov vote 1 no --from wallet --chain-id humans_1089-1 --gas-adjustment 1.5 --gas auto --gas-prices 250000000aheart -y
```

### Vote Abstain
```bash
humansd tx gov vote 1 abstain --from wallet --chain-id humans_1089-1 --gas-adjustment 1.5 --gas auto --gas-prices 250000000aheart -y
```

### Vote NoWithVeto
```bash
humansd tx gov vote 1 NoWithVeto --from wallet --chain-id humans_1089-1 --gas-adjustment 1.5 --gas auto --gas-prices 250000000aheart -y
```

## Maintenance

### Get Validator Info
```bash
humansd status 2>&1 | jq .ValidatorInfo
```

### Get Sync Info
```bash
humansd status 2>&1 | jq .SyncInfo
```

### Get Node Peer
```bash
echo $(echo $(humansd tendermint show-node-id)'@'$(curl -s ifconfig.me)':'$(cat $HOME/.humans/config/config.toml | sed -n '/Address to listen for incoming connection/{n;p;}' | sed 's/.*://; s/".*//')
```

### Check If Validator Key Is Correct
```bash
[[ $(humansd q staking validator $(echo $VALOPER) -oj | jq -r .consensus_pubkey.key) = $(humansd status | jq -r .ValidatorInfo.PubKey.value) ]] && echo -e "\n\e[1m\e[32mTrue\e[0m\n" || echo -e "\n\e[1m\e[31mFalse\e[0m\n"
```

### Get Live Peers
```bash
curl -sS http://localhost:26657/net_info | jq -r '.result.peers[] | "\(.node_info.id)@\(.remote_ip):\(.node_info.listen_addr)"' | awk -F ':' '{print $1":"$(NF)}'
```

### Set Minimum Gas Price
```bash
sed -i -e "s/^minimum-gas-prices *=.*/minimum-gas-prices = \"250000000aheart\"/" $HOME/.humans/config/app.toml
```

### Enable Prometheus
```bash
sed -i -e "s/prometheus = false/prometheus = true/" $HOME/.humans/config/config.toml
```

### Reset Chain Data
```bash
humansd tendermint unsafe-reset-all --keep-addr-book --home $HOME/.humans --keep-addr-book
```

### Remove Node
⚠️ **Warning**: Make sure you have backed up your priv_validator_key.json!

```bash
cd $HOME
sudo systemctl stop humansd
sudo systemctl disable humansd
sudo rm /etc/systemd/system/humansd.service
sudo systemctl daemon-reload
rm -f $(which humansd)
rm -rf $HOME/.humans
rm -rf $HOME/humans
```

## Useful Commands

### Check Blocks Remaining
```bash
local_height=$(curl -s localhost:26657/status | jq -r .result.sync_info.latest_block_height); network_height=$(curl -s https://rpc.humans.nodestake.org/status | jq -r .result.sync_info.latest_block_height); blocks_left=$((network_height - local_height)); echo "Your node height: $local_height"; echo "Network height: $network_height"; echo "Blocks left: $blocks_left"
```

### Check Your Validator
```bash
humansd query staking validator $(echo $VALOPER)
```

### Check Your Wallet Balance
```bash
humansd query bank balances $(echo $WALLET)
```

### Check Service Logs
```bash
sudo journalctl -u humansd -f --no-hostname -o cat
```

---

*Generated by WinScan - Multi-chain Blockchain Explorer*
