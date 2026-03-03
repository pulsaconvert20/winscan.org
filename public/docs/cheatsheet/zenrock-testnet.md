# Zenrock Cheat Sheet

## Service Management

### Check Logs
```bash
sudo journalctl -u zenrockd -f -o cat
```

### Start Service
```bash
sudo systemctl start zenrockd
```

### Stop Service
```bash
sudo systemctl stop zenrockd
```

### Restart Service
```bash
sudo systemctl restart zenrockd
```

### Check Service Status
```bash
sudo systemctl status zenrockd
```

## Node Information

### Sync Info
```bash
zenrockd status 2>&1 | jq .SyncInfo
```

### Node Info
```bash
zenrockd status 2>&1 | jq .NodeInfo
```

### Show Node ID
```bash
zenrockd tendermint show-node-id
```

### Show Validator Info
```bash
zenrockd status 2>&1 | jq .ValidatorInfo
```

## Key Management

### Add New Key
```bash
zenrockd keys add wallet
```

### Recover Existing Key
```bash
zenrockd keys add wallet --recover
```

### List All Keys
```bash
zenrockd keys list
```

### Delete Key
```bash
zenrockd keys delete wallet
```

### Export Key to File
```bash
zenrockd keys export wallet
```

### Import Key from File
```bash
zenrockd keys import wallet wallet.backup
```

### Query Wallet Balance
```bash
zenrockd query bank balances $(echo $WALLET)
```

## Token Management

### Withdraw Rewards from All Validators
```bash
zenrockd tx distribution withdraw-all-rewards --from wallet --chain-id gardia-9 --gas-adjustment 1.5 --gas auto --gas-prices 0.001urock -y
```

### Withdraw Commission and Rewards from Your Validator
```bash
zenrockd tx distribution withdraw-rewards $(echo $VALOPER) --commission --from wallet --chain-id gardia-9 --gas-adjustment 1.5 --gas auto --gas-prices 0.001urock -y
```

### Delegate Tokens to Yourself
```bash
zenrockd tx staking delegate $(echo $VALOPER) 1000000urock --from wallet --chain-id gardia-9 --gas-adjustment 1.5 --gas auto --gas-prices 0.001urock -y
```

### Delegate Tokens to Validator
```bash
zenrockd tx staking delegate <TO_VALOPER_ADDRESS> 1000000urock --from wallet --chain-id gardia-9 --gas-adjustment 1.5 --gas auto --gas-prices 0.001urock -y
```

### Redelegate Tokens to Another Validator
```bash
zenrockd tx staking redelegate $(echo $VALOPER) <TO_VALOPER_ADDRESS> 1000000urock --from wallet --chain-id gardia-9 --gas-adjustment 1.5 --gas auto --gas-prices 0.001urock -y
```

### Unbond Tokens from Your Validator
```bash
zenrockd tx staking unbond $(echo $VALOPER) 1000000urock --from wallet --chain-id gardia-9 --gas-adjustment 1.5 --gas auto --gas-prices 0.001urock -y
```

### Send Tokens to Wallet
```bash
zenrockd tx bank send wallet <TO_WALLET_ADDRESS> 1000000urock --from wallet --chain-id gardia-9 --gas-adjustment 1.5 --gas auto --gas-prices 0.001urock -y
```

## Validator Management

### Create New Validator
```bash
zenrockd tx staking create-validator \
--amount 1000000urock \
--pubkey $(zenrockd tendermint show-validator) \
--moniker "YOUR_MONIKER_NAME" \
--identity "YOUR_KEYBASE_ID" \
--details "YOUR_DETAILS" \
--website "YOUR_WEBSITE_URL" \
--chain-id gardia-9 \
--commission-rate 0.05 \
--commission-max-rate 0.20 \
--commission-max-change-rate 0.01 \
--min-self-delegation 1 \
--from wallet \
--gas-adjustment 1.5 \
--gas auto \
--gas-prices 0.001urock \
-y
```

### Edit Existing Validator
```bash
zenrockd tx staking edit-validator \
--new-moniker "YOUR_MONIKER_NAME" \
--identity "YOUR_KEYBASE_ID" \
--details "YOUR_DETAILS" \
--website "YOUR_WEBSITE_URL" \
--chain-id gardia-9 \
--commission-rate 0.05 \
--from wallet \
--gas-adjustment 1.5 \
--gas auto \
--gas-prices 0.001urock \
-y
```

### Unjail Validator
```bash
zenrockd tx slashing unjail --from wallet --chain-id gardia-9 --gas-adjustment 1.5 --gas auto --gas-prices 0.001urock -y
```

### Jail Reason
```bash
zenrockd query slashing signing-info $(zenrockd tendermint show-validator)
```

### List All Active Validators
```bash
zenrockd q staking validators -oj --limit=3000 | jq '.validators[] | select(.status=="BOND_STATUS_BONDED")' | jq -r '(.tokens|tonumber/pow(10; 6)|floor|tostring) + " \t " + .description.moniker' | sort -gr | nl
```

### List All Inactive Validators
```bash
zenrockd q staking validators -oj --limit=3000 | jq '.validators[] | select(.status=="BOND_STATUS_UNBONDED")' | jq -r '(.tokens|tonumber/pow(10; 6)|floor|tostring) + " \t " + .description.moniker' | sort -gr | nl
```

### View Validator Details
```bash
zenrockd q staking validator $(echo $VALOPER)
```

## Governance

### List All Proposals
```bash
zenrockd query gov proposals
```

### View Proposal by ID
```bash
zenrockd query gov proposal 1
```

### Vote Yes
```bash
zenrockd tx gov vote 1 yes --from wallet --chain-id gardia-9 --gas-adjustment 1.5 --gas auto --gas-prices 0.001urock -y
```

### Vote No
```bash
zenrockd tx gov vote 1 no --from wallet --chain-id gardia-9 --gas-adjustment 1.5 --gas auto --gas-prices 0.001urock -y
```

### Vote Abstain
```bash
zenrockd tx gov vote 1 abstain --from wallet --chain-id gardia-9 --gas-adjustment 1.5 --gas auto --gas-prices 0.001urock -y
```

### Vote NoWithVeto
```bash
zenrockd tx gov vote 1 NoWithVeto --from wallet --chain-id gardia-9 --gas-adjustment 1.5 --gas auto --gas-prices 0.001urock -y
```

## Maintenance

### Get Validator Info
```bash
zenrockd status 2>&1 | jq .ValidatorInfo
```

### Get Sync Info
```bash
zenrockd status 2>&1 | jq .SyncInfo
```

### Get Node Peer
```bash
echo $(echo $(zenrockd tendermint show-node-id)'@'$(curl -s ifconfig.me)':'$(cat $HOME/.zenrock/config/config.toml | sed -n '/Address to listen for incoming connection/{n;p;}' | sed 's/.*://; s/".*//')
```

### Check If Validator Key Is Correct
```bash
[[ $(zenrockd q staking validator $(echo $VALOPER) -oj | jq -r .consensus_pubkey.key) = $(zenrockd status | jq -r .ValidatorInfo.PubKey.value) ]] && echo -e "\n\e[1m\e[32mTrue\e[0m\n" || echo -e "\n\e[1m\e[31mFalse\e[0m\n"
```

### Get Live Peers
```bash
curl -sS http://localhost:26657/net_info | jq -r '.result.peers[] | "\(.node_info.id)@\(.remote_ip):\(.node_info.listen_addr)"' | awk -F ':' '{print $1":"$(NF)}'
```

### Set Minimum Gas Price
```bash
sed -i -e "s/^minimum-gas-prices *=.*/minimum-gas-prices = \"0.001urock\"/" $HOME/.zenrock/config/app.toml
```

### Enable Prometheus
```bash
sed -i -e "s/prometheus = false/prometheus = true/" $HOME/.zenrock/config/config.toml
```

### Reset Chain Data
```bash
zenrockd tendermint unsafe-reset-all --keep-addr-book --home $HOME/.zenrock --keep-addr-book
```

### Remove Node
⚠️ **Warning**: Make sure you have backed up your priv_validator_key.json!

```bash
cd $HOME
sudo systemctl stop zenrockd
sudo systemctl disable zenrockd
sudo rm /etc/systemd/system/zenrockd.service
sudo systemctl daemon-reload
rm -f $(which zenrockd)
rm -rf $HOME/.zenrock
rm -rf $HOME/zrchain
```

## Useful Commands

### Check Blocks Remaining
```bash
local_height=$(curl -s localhost:26657/status | jq -r .result.sync_info.latest_block_height); network_height=$(curl -s https://rpc.gardia.zenrocklabs.io/status | jq -r .result.sync_info.latest_block_height); blocks_left=$((network_height - local_height)); echo "Your node height: $local_height"; echo "Network height: $network_height"; echo "Blocks left: $blocks_left"
```

### Check Your Validator
```bash
zenrockd query staking validator $(echo $VALOPER)
```

### Check Your Wallet Balance
```bash
zenrockd query bank balances $(echo $WALLET)
```

### Check Service Logs
```bash
sudo journalctl -u zenrockd -f --no-hostname -o cat
```

---

*Generated by WinScan - Multi-chain Blockchain Explorer*
