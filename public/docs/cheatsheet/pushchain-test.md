# Push Chain Cheat Sheet

## Service Management

### Check Logs
```bash
sudo journalctl -u pushchaind -f -o cat
```

### Start Service
```bash
sudo systemctl start pushchaind
```

### Stop Service
```bash
sudo systemctl stop pushchaind
```

### Restart Service
```bash
sudo systemctl restart pushchaind
```

### Check Service Status
```bash
sudo systemctl status pushchaind
```

## Node Information

### Sync Info
```bash
pushchaind status 2>&1 | jq .SyncInfo
```

### Node Info
```bash
pushchaind status 2>&1 | jq .NodeInfo
```

### Show Node ID
```bash
pushchaind tendermint show-node-id
```

### Show Validator Info
```bash
pushchaind status 2>&1 | jq .ValidatorInfo
```

## Key Management

### Add New Key
```bash
pushchaind keys add wallet
```

### Recover Existing Key
```bash
pushchaind keys add wallet --recover
```

### List All Keys
```bash
pushchaind keys list
```

### Delete Key
```bash
pushchaind keys delete wallet
```

### Export Key to File
```bash
pushchaind keys export wallet
```

### Import Key from File
```bash
pushchaind keys import wallet wallet.backup
```

### Query Wallet Balance
```bash
pushchaind query bank balances $(echo $WALLET)
```

## Token Management

### Withdraw Rewards from All Validators
```bash
pushchaind tx distribution withdraw-all-rewards --from wallet --chain-id push_42101-1 --gas-adjustment 1.5 --gas auto --gas-prices 1000000000upc -y
```

### Withdraw Commission and Rewards from Your Validator
```bash
pushchaind tx distribution withdraw-rewards $(echo $VALOPER) --commission --from wallet --chain-id push_42101-1 --gas-adjustment 1.5 --gas auto --gas-prices 1000000000upc -y
```

### Delegate Tokens to Yourself
```bash
pushchaind tx staking delegate $(echo $VALOPER) 1000000upc --from wallet --chain-id push_42101-1 --gas-adjustment 1.5 --gas auto --gas-prices 1000000000upc -y
```

### Delegate Tokens to Validator
```bash
pushchaind tx staking delegate <TO_VALOPER_ADDRESS> 1000000upc --from wallet --chain-id push_42101-1 --gas-adjustment 1.5 --gas auto --gas-prices 1000000000upc -y
```

### Redelegate Tokens to Another Validator
```bash
pushchaind tx staking redelegate $(echo $VALOPER) <TO_VALOPER_ADDRESS> 1000000upc --from wallet --chain-id push_42101-1 --gas-adjustment 1.5 --gas auto --gas-prices 1000000000upc -y
```

### Unbond Tokens from Your Validator
```bash
pushchaind tx staking unbond $(echo $VALOPER) 1000000upc --from wallet --chain-id push_42101-1 --gas-adjustment 1.5 --gas auto --gas-prices 1000000000upc -y
```

### Send Tokens to Wallet
```bash
pushchaind tx bank send wallet <TO_WALLET_ADDRESS> 1000000upc --from wallet --chain-id push_42101-1 --gas-adjustment 1.5 --gas auto --gas-prices 1000000000upc -y
```

## Validator Management

### Create New Validator
```bash
pushchaind tx staking create-validator \
--amount 1000000upc \
--pubkey $(pushchaind tendermint show-validator) \
--moniker "YOUR_MONIKER_NAME" \
--identity "YOUR_KEYBASE_ID" \
--details "YOUR_DETAILS" \
--website "YOUR_WEBSITE_URL" \
--chain-id push_42101-1 \
--commission-rate 0.05 \
--commission-max-rate 0.20 \
--commission-max-change-rate 0.01 \
--min-self-delegation 1 \
--from wallet \
--gas-adjustment 1.5 \
--gas auto \
--gas-prices 1000000000upc \
-y
```

### Edit Existing Validator
```bash
pushchaind tx staking edit-validator \
--new-moniker "YOUR_MONIKER_NAME" \
--identity "YOUR_KEYBASE_ID" \
--details "YOUR_DETAILS" \
--website "YOUR_WEBSITE_URL" \
--chain-id push_42101-1 \
--commission-rate 0.05 \
--from wallet \
--gas-adjustment 1.5 \
--gas auto \
--gas-prices 1000000000upc \
-y
```

### Unjail Validator
```bash
pushchaind tx slashing unjail --from wallet --chain-id push_42101-1 --gas-adjustment 1.5 --gas auto --gas-prices 1000000000upc -y
```

### Jail Reason
```bash
pushchaind query slashing signing-info $(pushchaind tendermint show-validator)
```

### List All Active Validators
```bash
pushchaind q staking validators -oj --limit=3000 | jq '.validators[] | select(.status=="BOND_STATUS_BONDED")' | jq -r '(.tokens|tonumber/pow(10; 6)|floor|tostring) + " \t " + .description.moniker' | sort -gr | nl
```

### List All Inactive Validators
```bash
pushchaind q staking validators -oj --limit=3000 | jq '.validators[] | select(.status=="BOND_STATUS_UNBONDED")' | jq -r '(.tokens|tonumber/pow(10; 6)|floor|tostring) + " \t " + .description.moniker' | sort -gr | nl
```

### View Validator Details
```bash
pushchaind q staking validator $(echo $VALOPER)
```

## Governance

### List All Proposals
```bash
pushchaind query gov proposals
```

### View Proposal by ID
```bash
pushchaind query gov proposal 1
```

### Vote Yes
```bash
pushchaind tx gov vote 1 yes --from wallet --chain-id push_42101-1 --gas-adjustment 1.5 --gas auto --gas-prices 1000000000upc -y
```

### Vote No
```bash
pushchaind tx gov vote 1 no --from wallet --chain-id push_42101-1 --gas-adjustment 1.5 --gas auto --gas-prices 1000000000upc -y
```

### Vote Abstain
```bash
pushchaind tx gov vote 1 abstain --from wallet --chain-id push_42101-1 --gas-adjustment 1.5 --gas auto --gas-prices 1000000000upc -y
```

### Vote NoWithVeto
```bash
pushchaind tx gov vote 1 NoWithVeto --from wallet --chain-id push_42101-1 --gas-adjustment 1.5 --gas auto --gas-prices 1000000000upc -y
```

## Maintenance

### Get Validator Info
```bash
pushchaind status 2>&1 | jq .ValidatorInfo
```

### Get Sync Info
```bash
pushchaind status 2>&1 | jq .SyncInfo
```

### Get Node Peer
```bash
echo $(echo $(pushchaind tendermint show-node-id)'@'$(curl -s ifconfig.me)':'$(cat $HOME/.pushchain/config/config.toml | sed -n '/Address to listen for incoming connection/{n;p;}' | sed 's/.*://; s/".*//')
```

### Check If Validator Key Is Correct
```bash
[[ $(pushchaind q staking validator $(echo $VALOPER) -oj | jq -r .consensus_pubkey.key) = $(pushchaind status | jq -r .ValidatorInfo.PubKey.value) ]] && echo -e "\n\e[1m\e[32mTrue\e[0m\n" || echo -e "\n\e[1m\e[31mFalse\e[0m\n"
```

### Get Live Peers
```bash
curl -sS http://localhost:26657/net_info | jq -r '.result.peers[] | "\(.node_info.id)@\(.remote_ip):\(.node_info.listen_addr)"' | awk -F ':' '{print $1":"$(NF)}'
```

### Set Minimum Gas Price
```bash
sed -i -e "s/^minimum-gas-prices *=.*/minimum-gas-prices = \"1000000000upc\"/" $HOME/.pushchain/config/app.toml
```

### Enable Prometheus
```bash
sed -i -e "s/prometheus = false/prometheus = true/" $HOME/.pushchain/config/config.toml
```

### Reset Chain Data
```bash
pushchaind tendermint unsafe-reset-all --keep-addr-book --home $HOME/.pushchain --keep-addr-book
```

### Remove Node
⚠️ **Warning**: Make sure you have backed up your priv_validator_key.json!

```bash
cd $HOME
sudo systemctl stop pushchaind
sudo systemctl disable pushchaind
sudo rm /etc/systemd/system/pushchaind.service
sudo systemctl daemon-reload
rm -f $(which pushchaind)
rm -rf $HOME/.pushchain
rm -rf $HOME/push-chain-node
```

## Useful Commands

### Check Blocks Remaining
```bash
local_height=$(curl -s localhost:26657/status | jq -r .result.sync_info.latest_block_height); network_height=$(curl -s https://rpc-t.pushchain.nodestake.org/status | jq -r .result.sync_info.latest_block_height); blocks_left=$((network_height - local_height)); echo "Your node height: $local_height"; echo "Network height: $network_height"; echo "Blocks left: $blocks_left"
```

### Check Your Validator
```bash
pushchaind query staking validator $(echo $VALOPER)
```

### Check Your Wallet Balance
```bash
pushchaind query bank balances $(echo $WALLET)
```

### Check Service Logs
```bash
sudo journalctl -u pushchaind -f --no-hostname -o cat
```

---

*Generated by WinScan - Multi-chain Blockchain Explorer*
