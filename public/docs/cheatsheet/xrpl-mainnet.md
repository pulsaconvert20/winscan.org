# XRPL EVM Cheat Sheet

## Service Management

### Check Logs
```bash
sudo journalctl -u xrpld -f -o cat
```

### Start Service
```bash
sudo systemctl start xrpld
```

### Stop Service
```bash
sudo systemctl stop xrpld
```

### Restart Service
```bash
sudo systemctl restart xrpld
```

### Check Service Status
```bash
sudo systemctl status xrpld
```

## Node Information

### Sync Info
```bash
xrpld status 2>&1 | jq .SyncInfo
```

### Node Info
```bash
xrpld status 2>&1 | jq .NodeInfo
```

### Show Node ID
```bash
xrpld tendermint show-node-id
```

### Show Validator Info
```bash
xrpld status 2>&1 | jq .ValidatorInfo
```

## Key Management

### Add New Key
```bash
xrpld keys add wallet
```

### Recover Existing Key
```bash
xrpld keys add wallet --recover
```

### List All Keys
```bash
xrpld keys list
```

### Delete Key
```bash
xrpld keys delete wallet
```

### Export Key to File
```bash
xrpld keys export wallet
```

### Import Key from File
```bash
xrpld keys import wallet wallet.backup
```

### Query Wallet Balance
```bash
xrpld query bank balances $(echo $WALLET)
```

## Token Management

### Withdraw Rewards from All Validators
```bash
xrpld tx distribution withdraw-all-rewards --from wallet --chain-id xrplevm_1440000-1 --gas-adjustment 1.5 --gas auto --gas-prices 200000000000axrp -y
```

### Withdraw Commission and Rewards from Your Validator
```bash
xrpld tx distribution withdraw-rewards $(echo $VALOPER) --commission --from wallet --chain-id xrplevm_1440000-1 --gas-adjustment 1.5 --gas auto --gas-prices 200000000000axrp -y
```

### Delegate Tokens to Yourself
```bash
xrpld tx staking delegate $(echo $VALOPER) 1000000axrp --from wallet --chain-id xrplevm_1440000-1 --gas-adjustment 1.5 --gas auto --gas-prices 200000000000axrp -y
```

### Delegate Tokens to Validator
```bash
xrpld tx staking delegate <TO_VALOPER_ADDRESS> 1000000axrp --from wallet --chain-id xrplevm_1440000-1 --gas-adjustment 1.5 --gas auto --gas-prices 200000000000axrp -y
```

### Redelegate Tokens to Another Validator
```bash
xrpld tx staking redelegate $(echo $VALOPER) <TO_VALOPER_ADDRESS> 1000000axrp --from wallet --chain-id xrplevm_1440000-1 --gas-adjustment 1.5 --gas auto --gas-prices 200000000000axrp -y
```

### Unbond Tokens from Your Validator
```bash
xrpld tx staking unbond $(echo $VALOPER) 1000000axrp --from wallet --chain-id xrplevm_1440000-1 --gas-adjustment 1.5 --gas auto --gas-prices 200000000000axrp -y
```

### Send Tokens to Wallet
```bash
xrpld tx bank send wallet <TO_WALLET_ADDRESS> 1000000axrp --from wallet --chain-id xrplevm_1440000-1 --gas-adjustment 1.5 --gas auto --gas-prices 200000000000axrp -y
```

## Validator Management

### Create New Validator
```bash
xrpld tx staking create-validator \
--amount 1000000axrp \
--pubkey $(xrpld tendermint show-validator) \
--moniker "YOUR_MONIKER_NAME" \
--identity "YOUR_KEYBASE_ID" \
--details "YOUR_DETAILS" \
--website "YOUR_WEBSITE_URL" \
--chain-id xrplevm_1440000-1 \
--commission-rate 0.05 \
--commission-max-rate 0.20 \
--commission-max-change-rate 0.01 \
--min-self-delegation 1 \
--from wallet \
--gas-adjustment 1.5 \
--gas auto \
--gas-prices 200000000000axrp \
-y
```

### Edit Existing Validator
```bash
xrpld tx staking edit-validator \
--new-moniker "YOUR_MONIKER_NAME" \
--identity "YOUR_KEYBASE_ID" \
--details "YOUR_DETAILS" \
--website "YOUR_WEBSITE_URL" \
--chain-id xrplevm_1440000-1 \
--commission-rate 0.05 \
--from wallet \
--gas-adjustment 1.5 \
--gas auto \
--gas-prices 200000000000axrp \
-y
```

### Unjail Validator
```bash
xrpld tx slashing unjail --from wallet --chain-id xrplevm_1440000-1 --gas-adjustment 1.5 --gas auto --gas-prices 200000000000axrp -y
```

### Jail Reason
```bash
xrpld query slashing signing-info $(xrpld tendermint show-validator)
```

### List All Active Validators
```bash
xrpld q staking validators -oj --limit=3000 | jq '.validators[] | select(.status=="BOND_STATUS_BONDED")' | jq -r '(.tokens|tonumber/pow(10; 6)|floor|tostring) + " \t " + .description.moniker' | sort -gr | nl
```

### List All Inactive Validators
```bash
xrpld q staking validators -oj --limit=3000 | jq '.validators[] | select(.status=="BOND_STATUS_UNBONDED")' | jq -r '(.tokens|tonumber/pow(10; 6)|floor|tostring) + " \t " + .description.moniker' | sort -gr | nl
```

### View Validator Details
```bash
xrpld q staking validator $(echo $VALOPER)
```

## Governance

### List All Proposals
```bash
xrpld query gov proposals
```

### View Proposal by ID
```bash
xrpld query gov proposal 1
```

### Vote Yes
```bash
xrpld tx gov vote 1 yes --from wallet --chain-id xrplevm_1440000-1 --gas-adjustment 1.5 --gas auto --gas-prices 200000000000axrp -y
```

### Vote No
```bash
xrpld tx gov vote 1 no --from wallet --chain-id xrplevm_1440000-1 --gas-adjustment 1.5 --gas auto --gas-prices 200000000000axrp -y
```

### Vote Abstain
```bash
xrpld tx gov vote 1 abstain --from wallet --chain-id xrplevm_1440000-1 --gas-adjustment 1.5 --gas auto --gas-prices 200000000000axrp -y
```

### Vote NoWithVeto
```bash
xrpld tx gov vote 1 NoWithVeto --from wallet --chain-id xrplevm_1440000-1 --gas-adjustment 1.5 --gas auto --gas-prices 200000000000axrp -y
```

## Maintenance

### Get Validator Info
```bash
xrpld status 2>&1 | jq .ValidatorInfo
```

### Get Sync Info
```bash
xrpld status 2>&1 | jq .SyncInfo
```

### Get Node Peer
```bash
echo $(echo $(xrpld tendermint show-node-id)'@'$(curl -s ifconfig.me)':'$(cat $HOME/.xrpl/config/config.toml | sed -n '/Address to listen for incoming connection/{n;p;}' | sed 's/.*://; s/".*//')
```

### Check If Validator Key Is Correct
```bash
[[ $(xrpld q staking validator $(echo $VALOPER) -oj | jq -r .consensus_pubkey.key) = $(xrpld status | jq -r .ValidatorInfo.PubKey.value) ]] && echo -e "\n\e[1m\e[32mTrue\e[0m\n" || echo -e "\n\e[1m\e[31mFalse\e[0m\n"
```

### Get Live Peers
```bash
curl -sS http://localhost:26657/net_info | jq -r '.result.peers[] | "\(.node_info.id)@\(.remote_ip):\(.node_info.listen_addr)"' | awk -F ':' '{print $1":"$(NF)}'
```

### Set Minimum Gas Price
```bash
sed -i -e "s/^minimum-gas-prices *=.*/minimum-gas-prices = \"200000000000axrp\"/" $HOME/.xrpl/config/app.toml
```

### Enable Prometheus
```bash
sed -i -e "s/prometheus = false/prometheus = true/" $HOME/.xrpl/config/config.toml
```

### Reset Chain Data
```bash
xrpld tendermint unsafe-reset-all --keep-addr-book --home $HOME/.xrpl --keep-addr-book
```

### Remove Node
⚠️ **Warning**: Make sure you have backed up your priv_validator_key.json!

```bash
cd $HOME
sudo systemctl stop xrpld
sudo systemctl disable xrpld
sudo rm /etc/systemd/system/xrpld.service
sudo systemctl daemon-reload
rm -f $(which xrpld)
rm -rf $HOME/.xrpl
rm -rf $HOME/node
```

## Useful Commands

### Check Blocks Remaining
```bash
local_height=$(curl -s localhost:26657/status | jq -r .result.sync_info.latest_block_height); network_height=$(curl -s https://cosmos-rpc.xrplevm.org/status | jq -r .result.sync_info.latest_block_height); blocks_left=$((network_height - local_height)); echo "Your node height: $local_height"; echo "Network height: $network_height"; echo "Blocks left: $blocks_left"
```

### Check Your Validator
```bash
xrpld query staking validator $(echo $VALOPER)
```

### Check Your Wallet Balance
```bash
xrpld query bank balances $(echo $WALLET)
```

### Check Service Logs
```bash
sudo journalctl -u xrpld -f --no-hostname -o cat
```

---

*Generated by WinScan - Multi-chain Blockchain Explorer*
