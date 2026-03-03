# CNHO Stables Cheat Sheet

## Service Management

### Check Logs
```bash
sudo journalctl -u cnho-stablesd -f -o cat
```

### Start Service
```bash
sudo systemctl start cnho-stablesd
```

### Stop Service
```bash
sudo systemctl stop cnho-stablesd
```

### Restart Service
```bash
sudo systemctl restart cnho-stablesd
```

### Check Service Status
```bash
sudo systemctl status cnho-stablesd
```

## Node Information

### Sync Info
```bash
cnho-stablesd status 2>&1 | jq .SyncInfo
```

### Node Info
```bash
cnho-stablesd status 2>&1 | jq .NodeInfo
```

### Show Node ID
```bash
cnho-stablesd tendermint show-node-id
```

### Show Validator Info
```bash
cnho-stablesd status 2>&1 | jq .ValidatorInfo
```

## Key Management

### Add New Key
```bash
cnho-stablesd keys add wallet
```

### Recover Existing Key
```bash
cnho-stablesd keys add wallet --recover
```

### List All Keys
```bash
cnho-stablesd keys list
```

### Delete Key
```bash
cnho-stablesd keys delete wallet
```

### Export Key to File
```bash
cnho-stablesd keys export wallet
```

### Import Key from File
```bash
cnho-stablesd keys import wallet wallet.backup
```

### Query Wallet Balance
```bash
cnho-stablesd query bank balances $(echo $WALLET)
```

## Token Management

### Withdraw Rewards from All Validators
```bash
cnho-stablesd tx distribution withdraw-all-rewards --from wallet --chain-id cnho-stables-1 --gas-adjustment 1.5 --gas auto --gas-prices 0.03ucnho -y
```

### Withdraw Commission and Rewards from Your Validator
```bash
cnho-stablesd tx distribution withdraw-rewards $(echo $VALOPER) --commission --from wallet --chain-id cnho-stables-1 --gas-adjustment 1.5 --gas auto --gas-prices 0.03ucnho -y
```

### Delegate Tokens to Yourself
```bash
cnho-stablesd tx staking delegate $(echo $VALOPER) 1000000ucnho --from wallet --chain-id cnho-stables-1 --gas-adjustment 1.5 --gas auto --gas-prices 0.03ucnho -y
```

### Delegate Tokens to Validator
```bash
cnho-stablesd tx staking delegate <TO_VALOPER_ADDRESS> 1000000ucnho --from wallet --chain-id cnho-stables-1 --gas-adjustment 1.5 --gas auto --gas-prices 0.03ucnho -y
```

### Redelegate Tokens to Another Validator
```bash
cnho-stablesd tx staking redelegate $(echo $VALOPER) <TO_VALOPER_ADDRESS> 1000000ucnho --from wallet --chain-id cnho-stables-1 --gas-adjustment 1.5 --gas auto --gas-prices 0.03ucnho -y
```

### Unbond Tokens from Your Validator
```bash
cnho-stablesd tx staking unbond $(echo $VALOPER) 1000000ucnho --from wallet --chain-id cnho-stables-1 --gas-adjustment 1.5 --gas auto --gas-prices 0.03ucnho -y
```

### Send Tokens to Wallet
```bash
cnho-stablesd tx bank send wallet <TO_WALLET_ADDRESS> 1000000ucnho --from wallet --chain-id cnho-stables-1 --gas-adjustment 1.5 --gas auto --gas-prices 0.03ucnho -y
```

## Validator Management

### Create New Validator
```bash
cnho-stablesd tx staking create-validator \
--amount 1000000ucnho \
--pubkey $(cnho-stablesd tendermint show-validator) \
--moniker "YOUR_MONIKER_NAME" \
--identity "YOUR_KEYBASE_ID" \
--details "YOUR_DETAILS" \
--website "YOUR_WEBSITE_URL" \
--chain-id cnho-stables-1 \
--commission-rate 0.05 \
--commission-max-rate 0.20 \
--commission-max-change-rate 0.01 \
--min-self-delegation 1 \
--from wallet \
--gas-adjustment 1.5 \
--gas auto \
--gas-prices 0.03ucnho \
-y
```

### Edit Existing Validator
```bash
cnho-stablesd tx staking edit-validator \
--new-moniker "YOUR_MONIKER_NAME" \
--identity "YOUR_KEYBASE_ID" \
--details "YOUR_DETAILS" \
--website "YOUR_WEBSITE_URL" \
--chain-id cnho-stables-1 \
--commission-rate 0.05 \
--from wallet \
--gas-adjustment 1.5 \
--gas auto \
--gas-prices 0.03ucnho \
-y
```

### Unjail Validator
```bash
cnho-stablesd tx slashing unjail --from wallet --chain-id cnho-stables-1 --gas-adjustment 1.5 --gas auto --gas-prices 0.03ucnho -y
```

### Jail Reason
```bash
cnho-stablesd query slashing signing-info $(cnho-stablesd tendermint show-validator)
```

### List All Active Validators
```bash
cnho-stablesd q staking validators -oj --limit=3000 | jq '.validators[] | select(.status=="BOND_STATUS_BONDED")' | jq -r '(.tokens|tonumber/pow(10; 6)|floor|tostring) + " \t " + .description.moniker' | sort -gr | nl
```

### List All Inactive Validators
```bash
cnho-stablesd q staking validators -oj --limit=3000 | jq '.validators[] | select(.status=="BOND_STATUS_UNBONDED")' | jq -r '(.tokens|tonumber/pow(10; 6)|floor|tostring) + " \t " + .description.moniker' | sort -gr | nl
```

### View Validator Details
```bash
cnho-stablesd q staking validator $(echo $VALOPER)
```

## Governance

### List All Proposals
```bash
cnho-stablesd query gov proposals
```

### View Proposal by ID
```bash
cnho-stablesd query gov proposal 1
```

### Vote Yes
```bash
cnho-stablesd tx gov vote 1 yes --from wallet --chain-id cnho-stables-1 --gas-adjustment 1.5 --gas auto --gas-prices 0.03ucnho -y
```

### Vote No
```bash
cnho-stablesd tx gov vote 1 no --from wallet --chain-id cnho-stables-1 --gas-adjustment 1.5 --gas auto --gas-prices 0.03ucnho -y
```

### Vote Abstain
```bash
cnho-stablesd tx gov vote 1 abstain --from wallet --chain-id cnho-stables-1 --gas-adjustment 1.5 --gas auto --gas-prices 0.03ucnho -y
```

### Vote NoWithVeto
```bash
cnho-stablesd tx gov vote 1 NoWithVeto --from wallet --chain-id cnho-stables-1 --gas-adjustment 1.5 --gas auto --gas-prices 0.03ucnho -y
```

## Maintenance

### Get Validator Info
```bash
cnho-stablesd status 2>&1 | jq .ValidatorInfo
```

### Get Sync Info
```bash
cnho-stablesd status 2>&1 | jq .SyncInfo
```

### Get Node Peer
```bash
echo $(echo $(cnho-stablesd tendermint show-node-id)'@'$(curl -s ifconfig.me)':'$(cat $HOME/.cnho-stables/config/config.toml | sed -n '/Address to listen for incoming connection/{n;p;}' | sed 's/.*://; s/".*//')
```

### Check If Validator Key Is Correct
```bash
[[ $(cnho-stablesd q staking validator $(echo $VALOPER) -oj | jq -r .consensus_pubkey.key) = $(cnho-stablesd status | jq -r .ValidatorInfo.PubKey.value) ]] && echo -e "\n\e[1m\e[32mTrue\e[0m\n" || echo -e "\n\e[1m\e[31mFalse\e[0m\n"
```

### Get Live Peers
```bash
curl -sS http://localhost:26657/net_info | jq -r '.result.peers[] | "\(.node_info.id)@\(.remote_ip):\(.node_info.listen_addr)"' | awk -F ':' '{print $1":"$(NF)}'
```

### Set Minimum Gas Price
```bash
sed -i -e "s/^minimum-gas-prices *=.*/minimum-gas-prices = \"0.03ucnho\"/" $HOME/.cnho-stables/config/app.toml
```

### Enable Prometheus
```bash
sed -i -e "s/prometheus = false/prometheus = true/" $HOME/.cnho-stables/config/config.toml
```

### Reset Chain Data
```bash
cnho-stablesd tendermint unsafe-reset-all --keep-addr-book --home $HOME/.cnho-stables --keep-addr-book
```

### Remove Node
⚠️ **Warning**: Make sure you have backed up your priv_validator_key.json!

```bash
cd $HOME
sudo systemctl stop cnho-stablesd
sudo systemctl disable cnho-stablesd
sudo rm /etc/systemd/system/cnho-stablesd.service
sudo systemctl daemon-reload
rm -f $(which cnho-stablesd)
rm -rf $HOME/.cnho-stables
rm -rf $HOME/cnho-stables
```

## Useful Commands

### Check Blocks Remaining
```bash
local_height=$(curl -s localhost:26657/status | jq -r .result.sync_info.latest_block_height); network_height=$(curl -s https://rpc.cnho.io/status | jq -r .result.sync_info.latest_block_height); blocks_left=$((network_height - local_height)); echo "Your node height: $local_height"; echo "Network height: $network_height"; echo "Blocks left: $blocks_left"
```

### Check Your Validator
```bash
cnho-stablesd query staking validator $(echo $VALOPER)
```

### Check Your Wallet Balance
```bash
cnho-stablesd query bank balances $(echo $WALLET)
```

### Check Service Logs
```bash
sudo journalctl -u cnho-stablesd -f --no-hostname -o cat
```

---

*Generated by WinScan - Multi-chain Blockchain Explorer*
