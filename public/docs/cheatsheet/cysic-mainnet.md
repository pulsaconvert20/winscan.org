# Cysic Network Cheat Sheet

## Service Management

### Check Logs
```bash
sudo journalctl -u cysicd -f -o cat
```

### Start Service
```bash
sudo systemctl start cysicd
```

### Stop Service
```bash
sudo systemctl stop cysicd
```

### Restart Service
```bash
sudo systemctl restart cysicd
```

### Check Service Status
```bash
sudo systemctl status cysicd
```

## Node Information

### Sync Info
```bash
cysicd status 2>&1 | jq .SyncInfo
```

### Node Info
```bash
cysicd status 2>&1 | jq .NodeInfo
```

### Show Node ID
```bash
cysicd tendermint show-node-id
```

### Show Validator Info
```bash
cysicd status 2>&1 | jq .ValidatorInfo
```

## Key Management

### Add New Key
```bash
cysicd keys add wallet
```

### Recover Existing Key
```bash
cysicd keys add wallet --recover
```

### List All Keys
```bash
cysicd keys list
```

### Delete Key
```bash
cysicd keys delete wallet
```

### Export Key to File
```bash
cysicd keys export wallet
```

### Import Key from File
```bash
cysicd keys import wallet wallet.backup
```

### Query Wallet Balance
```bash
cysicd query bank balances $(echo $WALLET)
```

## Token Management

### Withdraw Rewards from All Validators
```bash
cysicd tx distribution withdraw-all-rewards --from wallet --chain-id cysicmint_4399-1 --gas-adjustment 1.5 --gas auto --gas-prices 25000000000CYS -y
```

### Withdraw Commission and Rewards from Your Validator
```bash
cysicd tx distribution withdraw-rewards $(echo $VALOPER) --commission --from wallet --chain-id cysicmint_4399-1 --gas-adjustment 1.5 --gas auto --gas-prices 25000000000CYS -y
```

### Delegate Tokens to Yourself
```bash
cysicd tx staking delegate $(echo $VALOPER) 1000000CYS --from wallet --chain-id cysicmint_4399-1 --gas-adjustment 1.5 --gas auto --gas-prices 25000000000CYS -y
```

### Delegate Tokens to Validator
```bash
cysicd tx staking delegate <TO_VALOPER_ADDRESS> 1000000CYS --from wallet --chain-id cysicmint_4399-1 --gas-adjustment 1.5 --gas auto --gas-prices 25000000000CYS -y
```

### Redelegate Tokens to Another Validator
```bash
cysicd tx staking redelegate $(echo $VALOPER) <TO_VALOPER_ADDRESS> 1000000CYS --from wallet --chain-id cysicmint_4399-1 --gas-adjustment 1.5 --gas auto --gas-prices 25000000000CYS -y
```

### Unbond Tokens from Your Validator
```bash
cysicd tx staking unbond $(echo $VALOPER) 1000000CYS --from wallet --chain-id cysicmint_4399-1 --gas-adjustment 1.5 --gas auto --gas-prices 25000000000CYS -y
```

### Send Tokens to Wallet
```bash
cysicd tx bank send wallet <TO_WALLET_ADDRESS> 1000000CYS --from wallet --chain-id cysicmint_4399-1 --gas-adjustment 1.5 --gas auto --gas-prices 25000000000CYS -y
```

## Validator Management

### Create New Validator
```bash
cysicd tx staking create-validator \
--amount 1000000CYS \
--pubkey $(cysicd tendermint show-validator) \
--moniker "YOUR_MONIKER_NAME" \
--identity "YOUR_KEYBASE_ID" \
--details "YOUR_DETAILS" \
--website "YOUR_WEBSITE_URL" \
--chain-id cysicmint_4399-1 \
--commission-rate 0.05 \
--commission-max-rate 0.20 \
--commission-max-change-rate 0.01 \
--min-self-delegation 1 \
--from wallet \
--gas-adjustment 1.5 \
--gas auto \
--gas-prices 25000000000CYS \
-y
```

### Edit Existing Validator
```bash
cysicd tx staking edit-validator \
--new-moniker "YOUR_MONIKER_NAME" \
--identity "YOUR_KEYBASE_ID" \
--details "YOUR_DETAILS" \
--website "YOUR_WEBSITE_URL" \
--chain-id cysicmint_4399-1 \
--commission-rate 0.05 \
--from wallet \
--gas-adjustment 1.5 \
--gas auto \
--gas-prices 25000000000CYS \
-y
```

### Unjail Validator
```bash
cysicd tx slashing unjail --from wallet --chain-id cysicmint_4399-1 --gas-adjustment 1.5 --gas auto --gas-prices 25000000000CYS -y
```

### Jail Reason
```bash
cysicd query slashing signing-info $(cysicd tendermint show-validator)
```

### List All Active Validators
```bash
cysicd q staking validators -oj --limit=3000 | jq '.validators[] | select(.status=="BOND_STATUS_BONDED")' | jq -r '(.tokens|tonumber/pow(10; 6)|floor|tostring) + " \t " + .description.moniker' | sort -gr | nl
```

### List All Inactive Validators
```bash
cysicd q staking validators -oj --limit=3000 | jq '.validators[] | select(.status=="BOND_STATUS_UNBONDED")' | jq -r '(.tokens|tonumber/pow(10; 6)|floor|tostring) + " \t " + .description.moniker' | sort -gr | nl
```

### View Validator Details
```bash
cysicd q staking validator $(echo $VALOPER)
```

## Governance

### List All Proposals
```bash
cysicd query gov proposals
```

### View Proposal by ID
```bash
cysicd query gov proposal 1
```

### Vote Yes
```bash
cysicd tx gov vote 1 yes --from wallet --chain-id cysicmint_4399-1 --gas-adjustment 1.5 --gas auto --gas-prices 25000000000CYS -y
```

### Vote No
```bash
cysicd tx gov vote 1 no --from wallet --chain-id cysicmint_4399-1 --gas-adjustment 1.5 --gas auto --gas-prices 25000000000CYS -y
```

### Vote Abstain
```bash
cysicd tx gov vote 1 abstain --from wallet --chain-id cysicmint_4399-1 --gas-adjustment 1.5 --gas auto --gas-prices 25000000000CYS -y
```

### Vote NoWithVeto
```bash
cysicd tx gov vote 1 NoWithVeto --from wallet --chain-id cysicmint_4399-1 --gas-adjustment 1.5 --gas auto --gas-prices 25000000000CYS -y
```

## Maintenance

### Get Validator Info
```bash
cysicd status 2>&1 | jq .ValidatorInfo
```

### Get Sync Info
```bash
cysicd status 2>&1 | jq .SyncInfo
```

### Get Node Peer
```bash
echo $(echo $(cysicd tendermint show-node-id)'@'$(curl -s ifconfig.me)':'$(cat $HOME/.cysic/config/config.toml | sed -n '/Address to listen for incoming connection/{n;p;}' | sed 's/.*://; s/".*//')
```

### Check If Validator Key Is Correct
```bash
[[ $(cysicd q staking validator $(echo $VALOPER) -oj | jq -r .consensus_pubkey.key) = $(cysicd status | jq -r .ValidatorInfo.PubKey.value) ]] && echo -e "\n\e[1m\e[32mTrue\e[0m\n" || echo -e "\n\e[1m\e[31mFalse\e[0m\n"
```

### Get Live Peers
```bash
curl -sS http://localhost:26657/net_info | jq -r '.result.peers[] | "\(.node_info.id)@\(.remote_ip):\(.node_info.listen_addr)"' | awk -F ':' '{print $1":"$(NF)}'
```

### Set Minimum Gas Price
```bash
sed -i -e "s/^minimum-gas-prices *=.*/minimum-gas-prices = \"25000000000CYS\"/" $HOME/.cysic/config/app.toml
```

### Enable Prometheus
```bash
sed -i -e "s/prometheus = false/prometheus = true/" $HOME/.cysic/config/config.toml
```

### Reset Chain Data
```bash
cysicd tendermint unsafe-reset-all --keep-addr-book --home $HOME/.cysic --keep-addr-book
```

### Remove Node
⚠️ **Warning**: Make sure you have backed up your priv_validator_key.json!

```bash
cd $HOME
sudo systemctl stop cysicd
sudo systemctl disable cysicd
sudo rm /etc/systemd/system/cysicd.service
sudo systemctl daemon-reload
rm -f $(which cysicd)
rm -rf $HOME/.cysic
rm -rf $HOME/cysic-mainnet
```

## Useful Commands

### Check Blocks Remaining
```bash
local_height=$(curl -s localhost:26657/status | jq -r .result.sync_info.latest_block_height); network_height=$(curl -s https://rpc.cysic.xyz/status | jq -r .result.sync_info.latest_block_height); blocks_left=$((network_height - local_height)); echo "Your node height: $local_height"; echo "Network height: $network_height"; echo "Blocks left: $blocks_left"
```

### Check Your Validator
```bash
cysicd query staking validator $(echo $VALOPER)
```

### Check Your Wallet Balance
```bash
cysicd query bank balances $(echo $WALLET)
```

### Check Service Logs
```bash
sudo journalctl -u cysicd -f --no-hostname -o cat
```

---

*Generated by WinScan - Multi-chain Blockchain Explorer*
