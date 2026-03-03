# Injective Cheat Sheet

## Service Management

### Check Logs
```bash
sudo journalctl -u injectived -f -o cat
```

### Start Service
```bash
sudo systemctl start injectived
```

### Stop Service
```bash
sudo systemctl stop injectived
```

### Restart Service
```bash
sudo systemctl restart injectived
```

### Check Service Status
```bash
sudo systemctl status injectived
```

## Node Information

### Sync Info
```bash
injectived status 2>&1 | jq .SyncInfo
```

### Node Info
```bash
injectived status 2>&1 | jq .NodeInfo
```

### Show Node ID
```bash
injectived tendermint show-node-id
```

### Show Validator Info
```bash
injectived status 2>&1 | jq .ValidatorInfo
```

## Key Management

### Add New Key
```bash
injectived keys add wallet
```

### Recover Existing Key
```bash
injectived keys add wallet --recover
```

### List All Keys
```bash
injectived keys list
```

### Delete Key
```bash
injectived keys delete wallet
```

### Export Key to File
```bash
injectived keys export wallet
```

### Import Key from File
```bash
injectived keys import wallet wallet.backup
```

### Query Wallet Balance
```bash
injectived query bank balances $(echo $WALLET)
```

## Token Management

### Withdraw Rewards from All Validators
```bash
injectived tx distribution withdraw-all-rewards --from wallet --chain-id injective-1 --gas-adjustment 1.5 --gas auto --gas-prices 500000000inj -y
```

### Withdraw Commission and Rewards from Your Validator
```bash
injectived tx distribution withdraw-rewards $(echo $VALOPER) --commission --from wallet --chain-id injective-1 --gas-adjustment 1.5 --gas auto --gas-prices 500000000inj -y
```

### Delegate Tokens to Yourself
```bash
injectived tx staking delegate $(echo $VALOPER) 1000000inj --from wallet --chain-id injective-1 --gas-adjustment 1.5 --gas auto --gas-prices 500000000inj -y
```

### Delegate Tokens to Validator
```bash
injectived tx staking delegate <TO_VALOPER_ADDRESS> 1000000inj --from wallet --chain-id injective-1 --gas-adjustment 1.5 --gas auto --gas-prices 500000000inj -y
```

### Redelegate Tokens to Another Validator
```bash
injectived tx staking redelegate $(echo $VALOPER) <TO_VALOPER_ADDRESS> 1000000inj --from wallet --chain-id injective-1 --gas-adjustment 1.5 --gas auto --gas-prices 500000000inj -y
```

### Unbond Tokens from Your Validator
```bash
injectived tx staking unbond $(echo $VALOPER) 1000000inj --from wallet --chain-id injective-1 --gas-adjustment 1.5 --gas auto --gas-prices 500000000inj -y
```

### Send Tokens to Wallet
```bash
injectived tx bank send wallet <TO_WALLET_ADDRESS> 1000000inj --from wallet --chain-id injective-1 --gas-adjustment 1.5 --gas auto --gas-prices 500000000inj -y
```

## Validator Management

### Create New Validator
```bash
injectived tx staking create-validator \
--amount 1000000inj \
--pubkey $(injectived tendermint show-validator) \
--moniker "YOUR_MONIKER_NAME" \
--identity "YOUR_KEYBASE_ID" \
--details "YOUR_DETAILS" \
--website "YOUR_WEBSITE_URL" \
--chain-id injective-1 \
--commission-rate 0.05 \
--commission-max-rate 0.20 \
--commission-max-change-rate 0.01 \
--min-self-delegation 1 \
--from wallet \
--gas-adjustment 1.5 \
--gas auto \
--gas-prices 500000000inj \
-y
```

### Edit Existing Validator
```bash
injectived tx staking edit-validator \
--new-moniker "YOUR_MONIKER_NAME" \
--identity "YOUR_KEYBASE_ID" \
--details "YOUR_DETAILS" \
--website "YOUR_WEBSITE_URL" \
--chain-id injective-1 \
--commission-rate 0.05 \
--from wallet \
--gas-adjustment 1.5 \
--gas auto \
--gas-prices 500000000inj \
-y
```

### Unjail Validator
```bash
injectived tx slashing unjail --from wallet --chain-id injective-1 --gas-adjustment 1.5 --gas auto --gas-prices 500000000inj -y
```

### Jail Reason
```bash
injectived query slashing signing-info $(injectived tendermint show-validator)
```

### List All Active Validators
```bash
injectived q staking validators -oj --limit=3000 | jq '.validators[] | select(.status=="BOND_STATUS_BONDED")' | jq -r '(.tokens|tonumber/pow(10; 6)|floor|tostring) + " \t " + .description.moniker' | sort -gr | nl
```

### List All Inactive Validators
```bash
injectived q staking validators -oj --limit=3000 | jq '.validators[] | select(.status=="BOND_STATUS_UNBONDED")' | jq -r '(.tokens|tonumber/pow(10; 6)|floor|tostring) + " \t " + .description.moniker' | sort -gr | nl
```

### View Validator Details
```bash
injectived q staking validator $(echo $VALOPER)
```

## Governance

### List All Proposals
```bash
injectived query gov proposals
```

### View Proposal by ID
```bash
injectived query gov proposal 1
```

### Vote Yes
```bash
injectived tx gov vote 1 yes --from wallet --chain-id injective-1 --gas-adjustment 1.5 --gas auto --gas-prices 500000000inj -y
```

### Vote No
```bash
injectived tx gov vote 1 no --from wallet --chain-id injective-1 --gas-adjustment 1.5 --gas auto --gas-prices 500000000inj -y
```

### Vote Abstain
```bash
injectived tx gov vote 1 abstain --from wallet --chain-id injective-1 --gas-adjustment 1.5 --gas auto --gas-prices 500000000inj -y
```

### Vote NoWithVeto
```bash
injectived tx gov vote 1 NoWithVeto --from wallet --chain-id injective-1 --gas-adjustment 1.5 --gas auto --gas-prices 500000000inj -y
```

## Maintenance

### Get Validator Info
```bash
injectived status 2>&1 | jq .ValidatorInfo
```

### Get Sync Info
```bash
injectived status 2>&1 | jq .SyncInfo
```

### Get Node Peer
```bash
echo $(echo $(injectived tendermint show-node-id)'@'$(curl -s ifconfig.me)':'$(cat $HOME/.injective/config/config.toml | sed -n '/Address to listen for incoming connection/{n;p;}' | sed 's/.*://; s/".*//')
```

### Check If Validator Key Is Correct
```bash
[[ $(injectived q staking validator $(echo $VALOPER) -oj | jq -r .consensus_pubkey.key) = $(injectived status | jq -r .ValidatorInfo.PubKey.value) ]] && echo -e "\n\e[1m\e[32mTrue\e[0m\n" || echo -e "\n\e[1m\e[31mFalse\e[0m\n"
```

### Get Live Peers
```bash
curl -sS http://localhost:26657/net_info | jq -r '.result.peers[] | "\(.node_info.id)@\(.remote_ip):\(.node_info.listen_addr)"' | awk -F ':' '{print $1":"$(NF)}'
```

### Set Minimum Gas Price
```bash
sed -i -e "s/^minimum-gas-prices *=.*/minimum-gas-prices = \"500000000inj\"/" $HOME/.injective/config/app.toml
```

### Enable Prometheus
```bash
sed -i -e "s/prometheus = false/prometheus = true/" $HOME/.injective/config/config.toml
```

### Reset Chain Data
```bash
injectived tendermint unsafe-reset-all --keep-addr-book --home $HOME/.injective --keep-addr-book
```

### Remove Node
⚠️ **Warning**: Make sure you have backed up your priv_validator_key.json!

```bash
cd $HOME
sudo systemctl stop injectived
sudo systemctl disable injectived
sudo rm /etc/systemd/system/injectived.service
sudo systemctl daemon-reload
rm -f $(which injectived)
rm -rf $HOME/.injective
rm -rf $HOME/injective-chain-releases
```

## Useful Commands

### Check Blocks Remaining
```bash
local_height=$(curl -s localhost:26657/status | jq -r .result.sync_info.latest_block_height); network_height=$(curl -s https://injective-rpc.polkachu.com/status | jq -r .result.sync_info.latest_block_height); blocks_left=$((network_height - local_height)); echo "Your node height: $local_height"; echo "Network height: $network_height"; echo "Blocks left: $blocks_left"
```

### Check Your Validator
```bash
injectived query staking validator $(echo $VALOPER)
```

### Check Your Wallet Balance
```bash
injectived query bank balances $(echo $WALLET)
```

### Check Service Logs
```bash
sudo journalctl -u injectived -f --no-hostname -o cat
```

---

*Generated by WinScan - Multi-chain Blockchain Explorer*
