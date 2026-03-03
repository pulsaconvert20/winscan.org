# Sunrise Cheat Sheet

## Service Management

### Check Logs
```bash
sudo journalctl -u sunrised -f -o cat
```

### Start Service
```bash
sudo systemctl start sunrised
```

### Stop Service
```bash
sudo systemctl stop sunrised
```

### Restart Service
```bash
sudo systemctl restart sunrised
```

### Check Service Status
```bash
sudo systemctl status sunrised
```

## Node Information

### Sync Info
```bash
sunrised status 2>&1 | jq .SyncInfo
```

### Node Info
```bash
sunrised status 2>&1 | jq .NodeInfo
```

### Show Node ID
```bash
sunrised tendermint show-node-id
```

### Show Validator Info
```bash
sunrised status 2>&1 | jq .ValidatorInfo
```

## Key Management

### Add New Key
```bash
sunrised keys add wallet
```

### Recover Existing Key
```bash
sunrised keys add wallet --recover
```

### List All Keys
```bash
sunrised keys list
```

### Delete Key
```bash
sunrised keys delete wallet
```

### Export Key to File
```bash
sunrised keys export wallet
```

### Import Key from File
```bash
sunrised keys import wallet wallet.backup
```

### Query Wallet Balance
```bash
sunrised query bank balances $(echo $WALLET)
```

## Token Management

### Withdraw Rewards from All Validators
```bash
sunrised tx distribution withdraw-all-rewards --from wallet --chain-id sunrise-1 --gas-adjustment 1.5 --gas auto --gas-prices 0.002uvrise -y
```

### Withdraw Commission and Rewards from Your Validator
```bash
sunrised tx distribution withdraw-rewards $(echo $VALOPER) --commission --from wallet --chain-id sunrise-1 --gas-adjustment 1.5 --gas auto --gas-prices 0.002uvrise -y
```

### Delegate Tokens to Yourself
```bash
sunrised tx staking delegate $(echo $VALOPER) 1000000uvrise --from wallet --chain-id sunrise-1 --gas-adjustment 1.5 --gas auto --gas-prices 0.002uvrise -y
```

### Delegate Tokens to Validator
```bash
sunrised tx staking delegate <TO_VALOPER_ADDRESS> 1000000uvrise --from wallet --chain-id sunrise-1 --gas-adjustment 1.5 --gas auto --gas-prices 0.002uvrise -y
```

### Redelegate Tokens to Another Validator
```bash
sunrised tx staking redelegate $(echo $VALOPER) <TO_VALOPER_ADDRESS> 1000000uvrise --from wallet --chain-id sunrise-1 --gas-adjustment 1.5 --gas auto --gas-prices 0.002uvrise -y
```

### Unbond Tokens from Your Validator
```bash
sunrised tx staking unbond $(echo $VALOPER) 1000000uvrise --from wallet --chain-id sunrise-1 --gas-adjustment 1.5 --gas auto --gas-prices 0.002uvrise -y
```

### Send Tokens to Wallet
```bash
sunrised tx bank send wallet <TO_WALLET_ADDRESS> 1000000uvrise --from wallet --chain-id sunrise-1 --gas-adjustment 1.5 --gas auto --gas-prices 0.002uvrise -y
```

## Validator Management

### Create New Validator
```bash
sunrised tx staking create-validator \
--amount 1000000uvrise \
--pubkey $(sunrised tendermint show-validator) \
--moniker "YOUR_MONIKER_NAME" \
--identity "YOUR_KEYBASE_ID" \
--details "YOUR_DETAILS" \
--website "YOUR_WEBSITE_URL" \
--chain-id sunrise-1 \
--commission-rate 0.05 \
--commission-max-rate 0.20 \
--commission-max-change-rate 0.01 \
--min-self-delegation 1 \
--from wallet \
--gas-adjustment 1.5 \
--gas auto \
--gas-prices 0.002uvrise \
-y
```

### Edit Existing Validator
```bash
sunrised tx staking edit-validator \
--new-moniker "YOUR_MONIKER_NAME" \
--identity "YOUR_KEYBASE_ID" \
--details "YOUR_DETAILS" \
--website "YOUR_WEBSITE_URL" \
--chain-id sunrise-1 \
--commission-rate 0.05 \
--from wallet \
--gas-adjustment 1.5 \
--gas auto \
--gas-prices 0.002uvrise \
-y
```

### Unjail Validator
```bash
sunrised tx slashing unjail --from wallet --chain-id sunrise-1 --gas-adjustment 1.5 --gas auto --gas-prices 0.002uvrise -y
```

### Jail Reason
```bash
sunrised query slashing signing-info $(sunrised tendermint show-validator)
```

### List All Active Validators
```bash
sunrised q staking validators -oj --limit=3000 | jq '.validators[] | select(.status=="BOND_STATUS_BONDED")' | jq -r '(.tokens|tonumber/pow(10; 6)|floor|tostring) + " \t " + .description.moniker' | sort -gr | nl
```

### List All Inactive Validators
```bash
sunrised q staking validators -oj --limit=3000 | jq '.validators[] | select(.status=="BOND_STATUS_UNBONDED")' | jq -r '(.tokens|tonumber/pow(10; 6)|floor|tostring) + " \t " + .description.moniker' | sort -gr | nl
```

### View Validator Details
```bash
sunrised q staking validator $(echo $VALOPER)
```

## Governance

### List All Proposals
```bash
sunrised query gov proposals
```

### View Proposal by ID
```bash
sunrised query gov proposal 1
```

### Vote Yes
```bash
sunrised tx gov vote 1 yes --from wallet --chain-id sunrise-1 --gas-adjustment 1.5 --gas auto --gas-prices 0.002uvrise -y
```

### Vote No
```bash
sunrised tx gov vote 1 no --from wallet --chain-id sunrise-1 --gas-adjustment 1.5 --gas auto --gas-prices 0.002uvrise -y
```

### Vote Abstain
```bash
sunrised tx gov vote 1 abstain --from wallet --chain-id sunrise-1 --gas-adjustment 1.5 --gas auto --gas-prices 0.002uvrise -y
```

### Vote NoWithVeto
```bash
sunrised tx gov vote 1 NoWithVeto --from wallet --chain-id sunrise-1 --gas-adjustment 1.5 --gas auto --gas-prices 0.002uvrise -y
```

## Maintenance

### Get Validator Info
```bash
sunrised status 2>&1 | jq .ValidatorInfo
```

### Get Sync Info
```bash
sunrised status 2>&1 | jq .SyncInfo
```

### Get Node Peer
```bash
echo $(echo $(sunrised tendermint show-node-id)'@'$(curl -s ifconfig.me)':'$(cat $HOME/.sunrise/config/config.toml | sed -n '/Address to listen for incoming connection/{n;p;}' | sed 's/.*://; s/".*//')
```

### Check If Validator Key Is Correct
```bash
[[ $(sunrised q staking validator $(echo $VALOPER) -oj | jq -r .consensus_pubkey.key) = $(sunrised status | jq -r .ValidatorInfo.PubKey.value) ]] && echo -e "\n\e[1m\e[32mTrue\e[0m\n" || echo -e "\n\e[1m\e[31mFalse\e[0m\n"
```

### Get Live Peers
```bash
curl -sS http://localhost:26657/net_info | jq -r '.result.peers[] | "\(.node_info.id)@\(.remote_ip):\(.node_info.listen_addr)"' | awk -F ':' '{print $1":"$(NF)}'
```

### Set Minimum Gas Price
```bash
sed -i -e "s/^minimum-gas-prices *=.*/minimum-gas-prices = \"0.002uvrise\"/" $HOME/.sunrise/config/app.toml
```

### Enable Prometheus
```bash
sed -i -e "s/prometheus = false/prometheus = true/" $HOME/.sunrise/config/config.toml
```

### Reset Chain Data
```bash
sunrised tendermint unsafe-reset-all --keep-addr-book --home $HOME/.sunrise --keep-addr-book
```

### Remove Node
⚠️ **Warning**: Make sure you have backed up your priv_validator_key.json!

```bash
cd $HOME
sudo systemctl stop sunrised
sudo systemctl disable sunrised
sudo rm /etc/systemd/system/sunrised.service
sudo systemctl daemon-reload
rm -f $(which sunrised)
rm -rf $HOME/.sunrise
rm -rf $HOME/sunrise
```

## Useful Commands

### Check Blocks Remaining
```bash
local_height=$(curl -s localhost:26657/status | jq -r .result.sync_info.latest_block_height); network_height=$(curl -s https://a.consensus.sunrise-1.sunriselayer.io/status | jq -r .result.sync_info.latest_block_height); blocks_left=$((network_height - local_height)); echo "Your node height: $local_height"; echo "Network height: $network_height"; echo "Blocks left: $blocks_left"
```

### Check Your Validator
```bash
sunrised query staking validator $(echo $VALOPER)
```

### Check Your Wallet Balance
```bash
sunrised query bank balances $(echo $WALLET)
```

### Check Service Logs
```bash
sudo journalctl -u sunrised -f --no-hostname -o cat
```

---

*Generated by WinScan - Multi-chain Blockchain Explorer*
