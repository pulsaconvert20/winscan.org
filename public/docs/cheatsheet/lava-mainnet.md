# Lava Network Cheat Sheet

## Service Management

### Check Logs
```bash
sudo journalctl -u lavad -f -o cat
```

### Start Service
```bash
sudo systemctl start lavad
```

### Stop Service
```bash
sudo systemctl stop lavad
```

### Restart Service
```bash
sudo systemctl restart lavad
```

### Check Service Status
```bash
sudo systemctl status lavad
```

## Node Information

### Sync Info
```bash
lavad status 2>&1 | jq .SyncInfo
```

### Node Info
```bash
lavad status 2>&1 | jq .NodeInfo
```

### Show Node ID
```bash
lavad tendermint show-node-id
```

### Show Validator Info
```bash
lavad status 2>&1 | jq .ValidatorInfo
```

## Key Management

### Add New Key
```bash
lavad keys add wallet
```

### Recover Existing Key
```bash
lavad keys add wallet --recover
```

### List All Keys
```bash
lavad keys list
```

### Delete Key
```bash
lavad keys delete wallet
```

### Export Key to File
```bash
lavad keys export wallet
```

### Import Key from File
```bash
lavad keys import wallet wallet.backup
```

### Query Wallet Balance
```bash
lavad query bank balances $(echo $WALLET)
```

## Token Management

### Withdraw Rewards from All Validators
```bash
lavad tx distribution withdraw-all-rewards --from wallet --chain-id lava-mainnet-1 --gas-adjustment 1.5 --gas auto --gas-prices 0.025ulava -y
```

### Withdraw Commission and Rewards from Your Validator
```bash
lavad tx distribution withdraw-rewards $(echo $VALOPER) --commission --from wallet --chain-id lava-mainnet-1 --gas-adjustment 1.5 --gas auto --gas-prices 0.025ulava -y
```

### Delegate Tokens to Yourself
```bash
lavad tx staking delegate $(echo $VALOPER) 1000000ulava --from wallet --chain-id lava-mainnet-1 --gas-adjustment 1.5 --gas auto --gas-prices 0.025ulava -y
```

### Delegate Tokens to Validator
```bash
lavad tx staking delegate <TO_VALOPER_ADDRESS> 1000000ulava --from wallet --chain-id lava-mainnet-1 --gas-adjustment 1.5 --gas auto --gas-prices 0.025ulava -y
```

### Redelegate Tokens to Another Validator
```bash
lavad tx staking redelegate $(echo $VALOPER) <TO_VALOPER_ADDRESS> 1000000ulava --from wallet --chain-id lava-mainnet-1 --gas-adjustment 1.5 --gas auto --gas-prices 0.025ulava -y
```

### Unbond Tokens from Your Validator
```bash
lavad tx staking unbond $(echo $VALOPER) 1000000ulava --from wallet --chain-id lava-mainnet-1 --gas-adjustment 1.5 --gas auto --gas-prices 0.025ulava -y
```

### Send Tokens to Wallet
```bash
lavad tx bank send wallet <TO_WALLET_ADDRESS> 1000000ulava --from wallet --chain-id lava-mainnet-1 --gas-adjustment 1.5 --gas auto --gas-prices 0.025ulava -y
```

## Validator Management

### Create New Validator
```bash
lavad tx staking create-validator \
--amount 1000000ulava \
--pubkey $(lavad tendermint show-validator) \
--moniker "YOUR_MONIKER_NAME" \
--identity "YOUR_KEYBASE_ID" \
--details "YOUR_DETAILS" \
--website "YOUR_WEBSITE_URL" \
--chain-id lava-mainnet-1 \
--commission-rate 0.05 \
--commission-max-rate 0.20 \
--commission-max-change-rate 0.01 \
--min-self-delegation 1 \
--from wallet \
--gas-adjustment 1.5 \
--gas auto \
--gas-prices 0.025ulava \
-y
```

### Edit Existing Validator
```bash
lavad tx staking edit-validator \
--new-moniker "YOUR_MONIKER_NAME" \
--identity "YOUR_KEYBASE_ID" \
--details "YOUR_DETAILS" \
--website "YOUR_WEBSITE_URL" \
--chain-id lava-mainnet-1 \
--commission-rate 0.05 \
--from wallet \
--gas-adjustment 1.5 \
--gas auto \
--gas-prices 0.025ulava \
-y
```

### Unjail Validator
```bash
lavad tx slashing unjail --from wallet --chain-id lava-mainnet-1 --gas-adjustment 1.5 --gas auto --gas-prices 0.025ulava -y
```

### Jail Reason
```bash
lavad query slashing signing-info $(lavad tendermint show-validator)
```

### List All Active Validators
```bash
lavad q staking validators -oj --limit=3000 | jq '.validators[] | select(.status=="BOND_STATUS_BONDED")' | jq -r '(.tokens|tonumber/pow(10; 6)|floor|tostring) + " \t " + .description.moniker' | sort -gr | nl
```

### List All Inactive Validators
```bash
lavad q staking validators -oj --limit=3000 | jq '.validators[] | select(.status=="BOND_STATUS_UNBONDED")' | jq -r '(.tokens|tonumber/pow(10; 6)|floor|tostring) + " \t " + .description.moniker' | sort -gr | nl
```

### View Validator Details
```bash
lavad q staking validator $(echo $VALOPER)
```

## Governance

### List All Proposals
```bash
lavad query gov proposals
```

### View Proposal by ID
```bash
lavad query gov proposal 1
```

### Vote Yes
```bash
lavad tx gov vote 1 yes --from wallet --chain-id lava-mainnet-1 --gas-adjustment 1.5 --gas auto --gas-prices 0.025ulava -y
```

### Vote No
```bash
lavad tx gov vote 1 no --from wallet --chain-id lava-mainnet-1 --gas-adjustment 1.5 --gas auto --gas-prices 0.025ulava -y
```

### Vote Abstain
```bash
lavad tx gov vote 1 abstain --from wallet --chain-id lava-mainnet-1 --gas-adjustment 1.5 --gas auto --gas-prices 0.025ulava -y
```

### Vote NoWithVeto
```bash
lavad tx gov vote 1 NoWithVeto --from wallet --chain-id lava-mainnet-1 --gas-adjustment 1.5 --gas auto --gas-prices 0.025ulava -y
```

## Maintenance

### Get Validator Info
```bash
lavad status 2>&1 | jq .ValidatorInfo
```

### Get Sync Info
```bash
lavad status 2>&1 | jq .SyncInfo
```

### Get Node Peer
```bash
echo $(echo $(lavad tendermint show-node-id)'@'$(curl -s ifconfig.me)':'$(cat $HOME/.lava/config/config.toml | sed -n '/Address to listen for incoming connection/{n;p;}' | sed 's/.*://; s/".*//')
```

### Check If Validator Key Is Correct
```bash
[[ $(lavad q staking validator $(echo $VALOPER) -oj | jq -r .consensus_pubkey.key) = $(lavad status | jq -r .ValidatorInfo.PubKey.value) ]] && echo -e "\n\e[1m\e[32mTrue\e[0m\n" || echo -e "\n\e[1m\e[31mFalse\e[0m\n"
```

### Get Live Peers
```bash
curl -sS http://localhost:26657/net_info | jq -r '.result.peers[] | "\(.node_info.id)@\(.remote_ip):\(.node_info.listen_addr)"' | awk -F ':' '{print $1":"$(NF)}'
```

### Set Minimum Gas Price
```bash
sed -i -e "s/^minimum-gas-prices *=.*/minimum-gas-prices = \"0.025ulava\"/" $HOME/.lava/config/app.toml
```

### Enable Prometheus
```bash
sed -i -e "s/prometheus = false/prometheus = true/" $HOME/.lava/config/config.toml
```

### Reset Chain Data
```bash
lavad tendermint unsafe-reset-all --keep-addr-book --home $HOME/.lava --keep-addr-book
```

### Remove Node
⚠️ **Warning**: Make sure you have backed up your priv_validator_key.json!

```bash
cd $HOME
sudo systemctl stop lavad
sudo systemctl disable lavad
sudo rm /etc/systemd/system/lavad.service
sudo systemctl daemon-reload
rm -f $(which lavad)
rm -rf $HOME/.lava
rm -rf $HOME/lava
```

## Useful Commands

### Check Blocks Remaining
```bash
local_height=$(curl -s localhost:26657/status | jq -r .result.sync_info.latest_block_height); network_height=$(curl -s https://lava.tendermintrpc.lava.build/status | jq -r .result.sync_info.latest_block_height); blocks_left=$((network_height - local_height)); echo "Your node height: $local_height"; echo "Network height: $network_height"; echo "Blocks left: $blocks_left"
```

### Check Your Validator
```bash
lavad query staking validator $(echo $VALOPER)
```

### Check Your Wallet Balance
```bash
lavad query bank balances $(echo $WALLET)
```

### Check Service Logs
```bash
sudo journalctl -u lavad -f --no-hostname -o cat
```

---

*Generated by WinScan - Multi-chain Blockchain Explorer*
