# Osmosis Cheat Sheet

## Service Management

### Check Logs
```bash
sudo journalctl -u osmosisd -f -o cat
```

### Start Service
```bash
sudo systemctl start osmosisd
```

### Stop Service
```bash
sudo systemctl stop osmosisd
```

### Restart Service
```bash
sudo systemctl restart osmosisd
```

### Check Service Status
```bash
sudo systemctl status osmosisd
```

## Node Information

### Sync Info
```bash
osmosisd status 2>&1 | jq .SyncInfo
```

### Node Info
```bash
osmosisd status 2>&1 | jq .NodeInfo
```

### Show Node ID
```bash
osmosisd tendermint show-node-id
```

### Show Validator Info
```bash
osmosisd status 2>&1 | jq .ValidatorInfo
```

## Key Management

### Add New Key
```bash
osmosisd keys add wallet
```

### Recover Existing Key
```bash
osmosisd keys add wallet --recover
```

### List All Keys
```bash
osmosisd keys list
```

### Delete Key
```bash
osmosisd keys delete wallet
```

### Export Key to File
```bash
osmosisd keys export wallet
```

### Import Key from File
```bash
osmosisd keys import wallet wallet.backup
```

### Query Wallet Balance
```bash
osmosisd query bank balances $(echo $WALLET)
```

## Token Management

### Withdraw Rewards from All Validators
```bash
osmosisd tx distribution withdraw-all-rewards --from wallet --chain-id osmo-test-5 --gas-adjustment 1.5 --gas auto --gas-prices 0.0025uosmo -y
```

### Withdraw Commission and Rewards from Your Validator
```bash
osmosisd tx distribution withdraw-rewards $(echo $VALOPER) --commission --from wallet --chain-id osmo-test-5 --gas-adjustment 1.5 --gas auto --gas-prices 0.0025uosmo -y
```

### Delegate Tokens to Yourself
```bash
osmosisd tx staking delegate $(echo $VALOPER) 1000000uosmo --from wallet --chain-id osmo-test-5 --gas-adjustment 1.5 --gas auto --gas-prices 0.0025uosmo -y
```

### Delegate Tokens to Validator
```bash
osmosisd tx staking delegate <TO_VALOPER_ADDRESS> 1000000uosmo --from wallet --chain-id osmo-test-5 --gas-adjustment 1.5 --gas auto --gas-prices 0.0025uosmo -y
```

### Redelegate Tokens to Another Validator
```bash
osmosisd tx staking redelegate $(echo $VALOPER) <TO_VALOPER_ADDRESS> 1000000uosmo --from wallet --chain-id osmo-test-5 --gas-adjustment 1.5 --gas auto --gas-prices 0.0025uosmo -y
```

### Unbond Tokens from Your Validator
```bash
osmosisd tx staking unbond $(echo $VALOPER) 1000000uosmo --from wallet --chain-id osmo-test-5 --gas-adjustment 1.5 --gas auto --gas-prices 0.0025uosmo -y
```

### Send Tokens to Wallet
```bash
osmosisd tx bank send wallet <TO_WALLET_ADDRESS> 1000000uosmo --from wallet --chain-id osmo-test-5 --gas-adjustment 1.5 --gas auto --gas-prices 0.0025uosmo -y
```

## Validator Management

### Create New Validator
```bash
osmosisd tx staking create-validator \
--amount 1000000uosmo \
--pubkey $(osmosisd tendermint show-validator) \
--moniker "YOUR_MONIKER_NAME" \
--identity "YOUR_KEYBASE_ID" \
--details "YOUR_DETAILS" \
--website "YOUR_WEBSITE_URL" \
--chain-id osmo-test-5 \
--commission-rate 0.05 \
--commission-max-rate 0.20 \
--commission-max-change-rate 0.01 \
--min-self-delegation 1 \
--from wallet \
--gas-adjustment 1.5 \
--gas auto \
--gas-prices 0.0025uosmo \
-y
```

### Edit Existing Validator
```bash
osmosisd tx staking edit-validator \
--new-moniker "YOUR_MONIKER_NAME" \
--identity "YOUR_KEYBASE_ID" \
--details "YOUR_DETAILS" \
--website "YOUR_WEBSITE_URL" \
--chain-id osmo-test-5 \
--commission-rate 0.05 \
--from wallet \
--gas-adjustment 1.5 \
--gas auto \
--gas-prices 0.0025uosmo \
-y
```

### Unjail Validator
```bash
osmosisd tx slashing unjail --from wallet --chain-id osmo-test-5 --gas-adjustment 1.5 --gas auto --gas-prices 0.0025uosmo -y
```

### Jail Reason
```bash
osmosisd query slashing signing-info $(osmosisd tendermint show-validator)
```

### List All Active Validators
```bash
osmosisd q staking validators -oj --limit=3000 | jq '.validators[] | select(.status=="BOND_STATUS_BONDED")' | jq -r '(.tokens|tonumber/pow(10; 6)|floor|tostring) + " \t " + .description.moniker' | sort -gr | nl
```

### List All Inactive Validators
```bash
osmosisd q staking validators -oj --limit=3000 | jq '.validators[] | select(.status=="BOND_STATUS_UNBONDED")' | jq -r '(.tokens|tonumber/pow(10; 6)|floor|tostring) + " \t " + .description.moniker' | sort -gr | nl
```

### View Validator Details
```bash
osmosisd q staking validator $(echo $VALOPER)
```

## Governance

### List All Proposals
```bash
osmosisd query gov proposals
```

### View Proposal by ID
```bash
osmosisd query gov proposal 1
```

### Vote Yes
```bash
osmosisd tx gov vote 1 yes --from wallet --chain-id osmo-test-5 --gas-adjustment 1.5 --gas auto --gas-prices 0.0025uosmo -y
```

### Vote No
```bash
osmosisd tx gov vote 1 no --from wallet --chain-id osmo-test-5 --gas-adjustment 1.5 --gas auto --gas-prices 0.0025uosmo -y
```

### Vote Abstain
```bash
osmosisd tx gov vote 1 abstain --from wallet --chain-id osmo-test-5 --gas-adjustment 1.5 --gas auto --gas-prices 0.0025uosmo -y
```

### Vote NoWithVeto
```bash
osmosisd tx gov vote 1 NoWithVeto --from wallet --chain-id osmo-test-5 --gas-adjustment 1.5 --gas auto --gas-prices 0.0025uosmo -y
```

## Maintenance

### Get Validator Info
```bash
osmosisd status 2>&1 | jq .ValidatorInfo
```

### Get Sync Info
```bash
osmosisd status 2>&1 | jq .SyncInfo
```

### Get Node Peer
```bash
echo $(echo $(osmosisd tendermint show-node-id)'@'$(curl -s ifconfig.me)':'$(cat $HOME/.osmosis/config/config.toml | sed -n '/Address to listen for incoming connection/{n;p;}' | sed 's/.*://; s/".*//')
```

### Check If Validator Key Is Correct
```bash
[[ $(osmosisd q staking validator $(echo $VALOPER) -oj | jq -r .consensus_pubkey.key) = $(osmosisd status | jq -r .ValidatorInfo.PubKey.value) ]] && echo -e "\n\e[1m\e[32mTrue\e[0m\n" || echo -e "\n\e[1m\e[31mFalse\e[0m\n"
```

### Get Live Peers
```bash
curl -sS http://localhost:26657/net_info | jq -r '.result.peers[] | "\(.node_info.id)@\(.remote_ip):\(.node_info.listen_addr)"' | awk -F ':' '{print $1":"$(NF)}'
```

### Set Minimum Gas Price
```bash
sed -i -e "s/^minimum-gas-prices *=.*/minimum-gas-prices = \"0.0025uosmo\"/" $HOME/.osmosis/config/app.toml
```

### Enable Prometheus
```bash
sed -i -e "s/prometheus = false/prometheus = true/" $HOME/.osmosis/config/config.toml
```

### Reset Chain Data
```bash
osmosisd tendermint unsafe-reset-all --keep-addr-book --home $HOME/.osmosis --keep-addr-book
```

### Remove Node
⚠️ **Warning**: Make sure you have backed up your priv_validator_key.json!

```bash
cd $HOME
sudo systemctl stop osmosisd
sudo systemctl disable osmosisd
sudo rm /etc/systemd/system/osmosisd.service
sudo systemctl daemon-reload
rm -f $(which osmosisd)
rm -rf $HOME/.osmosis
rm -rf $HOME/osmosis
```

## Useful Commands

### Check Blocks Remaining
```bash
local_height=$(curl -s localhost:26657/status | jq -r .result.sync_info.latest_block_height); network_height=$(curl -s https://rpc.osmotest5.osmosis.zone/status | jq -r .result.sync_info.latest_block_height); blocks_left=$((network_height - local_height)); echo "Your node height: $local_height"; echo "Network height: $network_height"; echo "Blocks left: $blocks_left"
```

### Check Your Validator
```bash
osmosisd query staking validator $(echo $VALOPER)
```

### Check Your Wallet Balance
```bash
osmosisd query bank balances $(echo $WALLET)
```

### Check Service Logs
```bash
sudo journalctl -u osmosisd -f --no-hostname -o cat
```

---

*Generated by WinScan - Multi-chain Blockchain Explorer*
