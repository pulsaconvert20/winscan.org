# Warden Protocol Cheat Sheet

## Service Management

### Check Logs
```bash
sudo journalctl -u wardend -f -o cat
```

### Start Service
```bash
sudo systemctl start wardend
```

### Stop Service
```bash
sudo systemctl stop wardend
```

### Restart Service
```bash
sudo systemctl restart wardend
```

### Check Service Status
```bash
sudo systemctl status wardend
```

## Node Information

### Sync Info
```bash
wardend status 2>&1 | jq .SyncInfo
```

### Node Info
```bash
wardend status 2>&1 | jq .NodeInfo
```

### Show Node ID
```bash
wardend tendermint show-node-id
```

### Show Validator Info
```bash
wardend status 2>&1 | jq .ValidatorInfo
```

## Key Management

### Add New Key
```bash
wardend keys add wallet
```

### Recover Existing Key
```bash
wardend keys add wallet --recover
```

### List All Keys
```bash
wardend keys list
```

### Delete Key
```bash
wardend keys delete wallet
```

### Export Key to File
```bash
wardend keys export wallet
```

### Import Key from File
```bash
wardend keys import wallet wallet.backup
```

### Query Wallet Balance
```bash
wardend query bank balances $(echo $WALLET)
```

## Token Management

### Withdraw Rewards from All Validators
```bash
wardend tx distribution withdraw-all-rewards --from wallet --chain-id warden_8765-1 --gas-adjustment 1.5 --gas auto --gas-prices 200000000000award -y
```

### Withdraw Commission and Rewards from Your Validator
```bash
wardend tx distribution withdraw-rewards $(echo $VALOPER) --commission --from wallet --chain-id warden_8765-1 --gas-adjustment 1.5 --gas auto --gas-prices 200000000000award -y
```

### Delegate Tokens to Yourself
```bash
wardend tx staking delegate $(echo $VALOPER) 1000000award --from wallet --chain-id warden_8765-1 --gas-adjustment 1.5 --gas auto --gas-prices 200000000000award -y
```

### Delegate Tokens to Validator
```bash
wardend tx staking delegate <TO_VALOPER_ADDRESS> 1000000award --from wallet --chain-id warden_8765-1 --gas-adjustment 1.5 --gas auto --gas-prices 200000000000award -y
```

### Redelegate Tokens to Another Validator
```bash
wardend tx staking redelegate $(echo $VALOPER) <TO_VALOPER_ADDRESS> 1000000award --from wallet --chain-id warden_8765-1 --gas-adjustment 1.5 --gas auto --gas-prices 200000000000award -y
```

### Unbond Tokens from Your Validator
```bash
wardend tx staking unbond $(echo $VALOPER) 1000000award --from wallet --chain-id warden_8765-1 --gas-adjustment 1.5 --gas auto --gas-prices 200000000000award -y
```

### Send Tokens to Wallet
```bash
wardend tx bank send wallet <TO_WALLET_ADDRESS> 1000000award --from wallet --chain-id warden_8765-1 --gas-adjustment 1.5 --gas auto --gas-prices 200000000000award -y
```

## Validator Management

### Create New Validator
```bash
wardend tx staking create-validator \
--amount 1000000award \
--pubkey $(wardend tendermint show-validator) \
--moniker "YOUR_MONIKER_NAME" \
--identity "YOUR_KEYBASE_ID" \
--details "YOUR_DETAILS" \
--website "YOUR_WEBSITE_URL" \
--chain-id warden_8765-1 \
--commission-rate 0.05 \
--commission-max-rate 0.20 \
--commission-max-change-rate 0.01 \
--min-self-delegation 1 \
--from wallet \
--gas-adjustment 1.5 \
--gas auto \
--gas-prices 200000000000award \
-y
```

### Edit Existing Validator
```bash
wardend tx staking edit-validator \
--new-moniker "YOUR_MONIKER_NAME" \
--identity "YOUR_KEYBASE_ID" \
--details "YOUR_DETAILS" \
--website "YOUR_WEBSITE_URL" \
--chain-id warden_8765-1 \
--commission-rate 0.05 \
--from wallet \
--gas-adjustment 1.5 \
--gas auto \
--gas-prices 200000000000award \
-y
```

### Unjail Validator
```bash
wardend tx slashing unjail --from wallet --chain-id warden_8765-1 --gas-adjustment 1.5 --gas auto --gas-prices 200000000000award -y
```

### Jail Reason
```bash
wardend query slashing signing-info $(wardend tendermint show-validator)
```

### List All Active Validators
```bash
wardend q staking validators -oj --limit=3000 | jq '.validators[] | select(.status=="BOND_STATUS_BONDED")' | jq -r '(.tokens|tonumber/pow(10; 6)|floor|tostring) + " \t " + .description.moniker' | sort -gr | nl
```

### List All Inactive Validators
```bash
wardend q staking validators -oj --limit=3000 | jq '.validators[] | select(.status=="BOND_STATUS_UNBONDED")' | jq -r '(.tokens|tonumber/pow(10; 6)|floor|tostring) + " \t " + .description.moniker' | sort -gr | nl
```

### View Validator Details
```bash
wardend q staking validator $(echo $VALOPER)
```

## Governance

### List All Proposals
```bash
wardend query gov proposals
```

### View Proposal by ID
```bash
wardend query gov proposal 1
```

### Vote Yes
```bash
wardend tx gov vote 1 yes --from wallet --chain-id warden_8765-1 --gas-adjustment 1.5 --gas auto --gas-prices 200000000000award -y
```

### Vote No
```bash
wardend tx gov vote 1 no --from wallet --chain-id warden_8765-1 --gas-adjustment 1.5 --gas auto --gas-prices 200000000000award -y
```

### Vote Abstain
```bash
wardend tx gov vote 1 abstain --from wallet --chain-id warden_8765-1 --gas-adjustment 1.5 --gas auto --gas-prices 200000000000award -y
```

### Vote NoWithVeto
```bash
wardend tx gov vote 1 NoWithVeto --from wallet --chain-id warden_8765-1 --gas-adjustment 1.5 --gas auto --gas-prices 200000000000award -y
```

## Maintenance

### Get Validator Info
```bash
wardend status 2>&1 | jq .ValidatorInfo
```

### Get Sync Info
```bash
wardend status 2>&1 | jq .SyncInfo
```

### Get Node Peer
```bash
echo $(echo $(wardend tendermint show-node-id)'@'$(curl -s ifconfig.me)':'$(cat $HOME/.warden/config/config.toml | sed -n '/Address to listen for incoming connection/{n;p;}' | sed 's/.*://; s/".*//')
```

### Check If Validator Key Is Correct
```bash
[[ $(wardend q staking validator $(echo $VALOPER) -oj | jq -r .consensus_pubkey.key) = $(wardend status | jq -r .ValidatorInfo.PubKey.value) ]] && echo -e "\n\e[1m\e[32mTrue\e[0m\n" || echo -e "\n\e[1m\e[31mFalse\e[0m\n"
```

### Get Live Peers
```bash
curl -sS http://localhost:26657/net_info | jq -r '.result.peers[] | "\(.node_info.id)@\(.remote_ip):\(.node_info.listen_addr)"' | awk -F ':' '{print $1":"$(NF)}'
```

### Set Minimum Gas Price
```bash
sed -i -e "s/^minimum-gas-prices *=.*/minimum-gas-prices = \"200000000000award\"/" $HOME/.warden/config/app.toml
```

### Enable Prometheus
```bash
sed -i -e "s/prometheus = false/prometheus = true/" $HOME/.warden/config/config.toml
```

### Reset Chain Data
```bash
wardend tendermint unsafe-reset-all --keep-addr-book --home $HOME/.warden --keep-addr-book
```

### Remove Node
⚠️ **Warning**: Make sure you have backed up your priv_validator_key.json!

```bash
cd $HOME
sudo systemctl stop wardend
sudo systemctl disable wardend
sudo rm /etc/systemd/system/wardend.service
sudo systemctl daemon-reload
rm -f $(which wardend)
rm -rf $HOME/.warden
rm -rf $HOME/wardenprotocol
```

## Useful Commands

### Check Blocks Remaining
```bash
local_height=$(curl -s localhost:26657/status | jq -r .result.sync_info.latest_block_height); network_height=$(curl -s https://warden-rpc.polkachu.com/status | jq -r .result.sync_info.latest_block_height); blocks_left=$((network_height - local_height)); echo "Your node height: $local_height"; echo "Network height: $network_height"; echo "Blocks left: $blocks_left"
```

### Check Your Validator
```bash
wardend query staking validator $(echo $VALOPER)
```

### Check Your Wallet Balance
```bash
wardend query bank balances $(echo $WALLET)
```

### Check Service Logs
```bash
sudo journalctl -u wardend -f --no-hostname -o cat
```

---

*Generated by WinScan - Multi-chain Blockchain Explorer*
