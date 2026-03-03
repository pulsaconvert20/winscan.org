# Tellor Layer Cheat Sheet

## Service Management

### Check Logs
```bash
sudo journalctl -u tellord -f -o cat
```

### Start Service
```bash
sudo systemctl start tellord
```

### Stop Service
```bash
sudo systemctl stop tellord
```

### Restart Service
```bash
sudo systemctl restart tellord
```

### Check Service Status
```bash
sudo systemctl status tellord
```

## Node Information

### Sync Info
```bash
tellord status 2>&1 | jq .SyncInfo
```

### Node Info
```bash
tellord status 2>&1 | jq .NodeInfo
```

### Show Node ID
```bash
tellord tendermint show-node-id
```

### Show Validator Info
```bash
tellord status 2>&1 | jq .ValidatorInfo
```

## Key Management

### Add New Key
```bash
tellord keys add wallet
```

### Recover Existing Key
```bash
tellord keys add wallet --recover
```

### List All Keys
```bash
tellord keys list
```

### Delete Key
```bash
tellord keys delete wallet
```

### Export Key to File
```bash
tellord keys export wallet
```

### Import Key from File
```bash
tellord keys import wallet wallet.backup
```

### Query Wallet Balance
```bash
tellord query bank balances $(echo $WALLET)
```

## Token Management

### Withdraw Rewards from All Validators
```bash
tellord tx distribution withdraw-all-rewards --from wallet --chain-id tellor-1 --gas-adjustment 1.5 --gas auto --gas-prices 0.001loya -y
```

### Withdraw Commission and Rewards from Your Validator
```bash
tellord tx distribution withdraw-rewards $(echo $VALOPER) --commission --from wallet --chain-id tellor-1 --gas-adjustment 1.5 --gas auto --gas-prices 0.001loya -y
```

### Delegate Tokens to Yourself
```bash
tellord tx staking delegate $(echo $VALOPER) 1000000loya --from wallet --chain-id tellor-1 --gas-adjustment 1.5 --gas auto --gas-prices 0.001loya -y
```

### Delegate Tokens to Validator
```bash
tellord tx staking delegate <TO_VALOPER_ADDRESS> 1000000loya --from wallet --chain-id tellor-1 --gas-adjustment 1.5 --gas auto --gas-prices 0.001loya -y
```

### Redelegate Tokens to Another Validator
```bash
tellord tx staking redelegate $(echo $VALOPER) <TO_VALOPER_ADDRESS> 1000000loya --from wallet --chain-id tellor-1 --gas-adjustment 1.5 --gas auto --gas-prices 0.001loya -y
```

### Unbond Tokens from Your Validator
```bash
tellord tx staking unbond $(echo $VALOPER) 1000000loya --from wallet --chain-id tellor-1 --gas-adjustment 1.5 --gas auto --gas-prices 0.001loya -y
```

### Send Tokens to Wallet
```bash
tellord tx bank send wallet <TO_WALLET_ADDRESS> 1000000loya --from wallet --chain-id tellor-1 --gas-adjustment 1.5 --gas auto --gas-prices 0.001loya -y
```

## Validator Management

### Create New Validator
```bash
tellord tx staking create-validator \
--amount 1000000loya \
--pubkey $(tellord tendermint show-validator) \
--moniker "YOUR_MONIKER_NAME" \
--identity "YOUR_KEYBASE_ID" \
--details "YOUR_DETAILS" \
--website "YOUR_WEBSITE_URL" \
--chain-id tellor-1 \
--commission-rate 0.05 \
--commission-max-rate 0.20 \
--commission-max-change-rate 0.01 \
--min-self-delegation 1 \
--from wallet \
--gas-adjustment 1.5 \
--gas auto \
--gas-prices 0.001loya \
-y
```

### Edit Existing Validator
```bash
tellord tx staking edit-validator \
--new-moniker "YOUR_MONIKER_NAME" \
--identity "YOUR_KEYBASE_ID" \
--details "YOUR_DETAILS" \
--website "YOUR_WEBSITE_URL" \
--chain-id tellor-1 \
--commission-rate 0.05 \
--from wallet \
--gas-adjustment 1.5 \
--gas auto \
--gas-prices 0.001loya \
-y
```

### Unjail Validator
```bash
tellord tx slashing unjail --from wallet --chain-id tellor-1 --gas-adjustment 1.5 --gas auto --gas-prices 0.001loya -y
```

### Jail Reason
```bash
tellord query slashing signing-info $(tellord tendermint show-validator)
```

### List All Active Validators
```bash
tellord q staking validators -oj --limit=3000 | jq '.validators[] | select(.status=="BOND_STATUS_BONDED")' | jq -r '(.tokens|tonumber/pow(10; 6)|floor|tostring) + " \t " + .description.moniker' | sort -gr | nl
```

### List All Inactive Validators
```bash
tellord q staking validators -oj --limit=3000 | jq '.validators[] | select(.status=="BOND_STATUS_UNBONDED")' | jq -r '(.tokens|tonumber/pow(10; 6)|floor|tostring) + " \t " + .description.moniker' | sort -gr | nl
```

### View Validator Details
```bash
tellord q staking validator $(echo $VALOPER)
```

## Governance

### List All Proposals
```bash
tellord query gov proposals
```

### View Proposal by ID
```bash
tellord query gov proposal 1
```

### Vote Yes
```bash
tellord tx gov vote 1 yes --from wallet --chain-id tellor-1 --gas-adjustment 1.5 --gas auto --gas-prices 0.001loya -y
```

### Vote No
```bash
tellord tx gov vote 1 no --from wallet --chain-id tellor-1 --gas-adjustment 1.5 --gas auto --gas-prices 0.001loya -y
```

### Vote Abstain
```bash
tellord tx gov vote 1 abstain --from wallet --chain-id tellor-1 --gas-adjustment 1.5 --gas auto --gas-prices 0.001loya -y
```

### Vote NoWithVeto
```bash
tellord tx gov vote 1 NoWithVeto --from wallet --chain-id tellor-1 --gas-adjustment 1.5 --gas auto --gas-prices 0.001loya -y
```

## Maintenance

### Get Validator Info
```bash
tellord status 2>&1 | jq .ValidatorInfo
```

### Get Sync Info
```bash
tellord status 2>&1 | jq .SyncInfo
```

### Get Node Peer
```bash
echo $(echo $(tellord tendermint show-node-id)'@'$(curl -s ifconfig.me)':'$(cat $HOME/.tellor/config/config.toml | sed -n '/Address to listen for incoming connection/{n;p;}' | sed 's/.*://; s/".*//')
```

### Check If Validator Key Is Correct
```bash
[[ $(tellord q staking validator $(echo $VALOPER) -oj | jq -r .consensus_pubkey.key) = $(tellord status | jq -r .ValidatorInfo.PubKey.value) ]] && echo -e "\n\e[1m\e[32mTrue\e[0m\n" || echo -e "\n\e[1m\e[31mFalse\e[0m\n"
```

### Get Live Peers
```bash
curl -sS http://localhost:26657/net_info | jq -r '.result.peers[] | "\(.node_info.id)@\(.remote_ip):\(.node_info.listen_addr)"' | awk -F ':' '{print $1":"$(NF)}'
```

### Set Minimum Gas Price
```bash
sed -i -e "s/^minimum-gas-prices *=.*/minimum-gas-prices = \"0.001loya\"/" $HOME/.tellor/config/app.toml
```

### Enable Prometheus
```bash
sed -i -e "s/prometheus = false/prometheus = true/" $HOME/.tellor/config/config.toml
```

### Reset Chain Data
```bash
tellord tendermint unsafe-reset-all --keep-addr-book --home $HOME/.tellor --keep-addr-book
```

### Remove Node
⚠️ **Warning**: Make sure you have backed up your priv_validator_key.json!

```bash
cd $HOME
sudo systemctl stop tellord
sudo systemctl disable tellord
sudo rm /etc/systemd/system/tellord.service
sudo systemctl daemon-reload
rm -f $(which tellord)
rm -rf $HOME/.tellor
rm -rf $HOME/layer
```

## Useful Commands

### Check Blocks Remaining
```bash
local_height=$(curl -s localhost:26657/status | jq -r .result.sync_info.latest_block_height); network_height=$(curl -s https://rpc-layer.winnode.xyz/status | jq -r .result.sync_info.latest_block_height); blocks_left=$((network_height - local_height)); echo "Your node height: $local_height"; echo "Network height: $network_height"; echo "Blocks left: $blocks_left"
```

### Check Your Validator
```bash
tellord query staking validator $(echo $VALOPER)
```

### Check Your Wallet Balance
```bash
tellord query bank balances $(echo $WALLET)
```

### Check Service Logs
```bash
sudo journalctl -u tellord -f --no-hostname -o cat
```

---

*Generated by WinScan - Multi-chain Blockchain Explorer*
