# AtomOne Cheat Sheet

## Service Management

### Check Logs
```bash
sudo journalctl -u atomoned -f -o cat
```

### Start Service
```bash
sudo systemctl start atomoned
```

### Stop Service
```bash
sudo systemctl stop atomoned
```

### Restart Service
```bash
sudo systemctl restart atomoned
```

### Check Service Status
```bash
sudo systemctl status atomoned
```

## Node Information

### Sync Info
```bash
atomoned status 2>&1 | jq .SyncInfo
```

### Node Info
```bash
atomoned status 2>&1 | jq .NodeInfo
```

### Show Node ID
```bash
atomoned tendermint show-node-id
```

### Show Validator Info
```bash
atomoned status 2>&1 | jq .ValidatorInfo
```

## Key Management

### Add New Key
```bash
atomoned keys add wallet
```

### Recover Existing Key
```bash
atomoned keys add wallet --recover
```

### List All Keys
```bash
atomoned keys list
```

### Delete Key
```bash
atomoned keys delete wallet
```

### Export Key to File
```bash
atomoned keys export wallet
```

### Import Key from File
```bash
atomoned keys import wallet wallet.backup
```

### Query Wallet Balance
```bash
atomoned query bank balances $(echo $WALLET)
```

## Token Management

### Withdraw Rewards from All Validators
```bash
atomoned tx distribution withdraw-all-rewards --from wallet --chain-id atomone-testnet-1 --gas-adjustment 1.5 --gas auto --gas-prices 0.0225uphoton -y
```

### Withdraw Commission and Rewards from Your Validator
```bash
atomoned tx distribution withdraw-rewards $(echo $VALOPER) --commission --from wallet --chain-id atomone-testnet-1 --gas-adjustment 1.5 --gas auto --gas-prices 0.0225uphoton -y
```

### Delegate Tokens to Yourself
```bash
atomoned tx staking delegate $(echo $VALOPER) 1000000uphoton --from wallet --chain-id atomone-testnet-1 --gas-adjustment 1.5 --gas auto --gas-prices 0.0225uphoton -y
```

### Delegate Tokens to Validator
```bash
atomoned tx staking delegate <TO_VALOPER_ADDRESS> 1000000uphoton --from wallet --chain-id atomone-testnet-1 --gas-adjustment 1.5 --gas auto --gas-prices 0.0225uphoton -y
```

### Redelegate Tokens to Another Validator
```bash
atomoned tx staking redelegate $(echo $VALOPER) <TO_VALOPER_ADDRESS> 1000000uphoton --from wallet --chain-id atomone-testnet-1 --gas-adjustment 1.5 --gas auto --gas-prices 0.0225uphoton -y
```

### Unbond Tokens from Your Validator
```bash
atomoned tx staking unbond $(echo $VALOPER) 1000000uphoton --from wallet --chain-id atomone-testnet-1 --gas-adjustment 1.5 --gas auto --gas-prices 0.0225uphoton -y
```

### Send Tokens to Wallet
```bash
atomoned tx bank send wallet <TO_WALLET_ADDRESS> 1000000uphoton --from wallet --chain-id atomone-testnet-1 --gas-adjustment 1.5 --gas auto --gas-prices 0.0225uphoton -y
```

## Validator Management

### Create New Validator
```bash
atomoned tx staking create-validator \
--amount 1000000uphoton \
--pubkey $(atomoned tendermint show-validator) \
--moniker "YOUR_MONIKER_NAME" \
--identity "YOUR_KEYBASE_ID" \
--details "YOUR_DETAILS" \
--website "YOUR_WEBSITE_URL" \
--chain-id atomone-testnet-1 \
--commission-rate 0.05 \
--commission-max-rate 0.20 \
--commission-max-change-rate 0.01 \
--min-self-delegation 1 \
--from wallet \
--gas-adjustment 1.5 \
--gas auto \
--gas-prices 0.0225uphoton \
-y
```

### Edit Existing Validator
```bash
atomoned tx staking edit-validator \
--new-moniker "YOUR_MONIKER_NAME" \
--identity "YOUR_KEYBASE_ID" \
--details "YOUR_DETAILS" \
--website "YOUR_WEBSITE_URL" \
--chain-id atomone-testnet-1 \
--commission-rate 0.05 \
--from wallet \
--gas-adjustment 1.5 \
--gas auto \
--gas-prices 0.0225uphoton \
-y
```

### Unjail Validator
```bash
atomoned tx slashing unjail --from wallet --chain-id atomone-testnet-1 --gas-adjustment 1.5 --gas auto --gas-prices 0.0225uphoton -y
```

### Jail Reason
```bash
atomoned query slashing signing-info $(atomoned tendermint show-validator)
```

### List All Active Validators
```bash
atomoned q staking validators -oj --limit=3000 | jq '.validators[] | select(.status=="BOND_STATUS_BONDED")' | jq -r '(.tokens|tonumber/pow(10; 6)|floor|tostring) + " \t " + .description.moniker' | sort -gr | nl
```

### List All Inactive Validators
```bash
atomoned q staking validators -oj --limit=3000 | jq '.validators[] | select(.status=="BOND_STATUS_UNBONDED")' | jq -r '(.tokens|tonumber/pow(10; 6)|floor|tostring) + " \t " + .description.moniker' | sort -gr | nl
```

### View Validator Details
```bash
atomoned q staking validator $(echo $VALOPER)
```

## Governance

### List All Proposals
```bash
atomoned query gov proposals
```

### View Proposal by ID
```bash
atomoned query gov proposal 1
```

### Vote Yes
```bash
atomoned tx gov vote 1 yes --from wallet --chain-id atomone-testnet-1 --gas-adjustment 1.5 --gas auto --gas-prices 0.0225uphoton -y
```

### Vote No
```bash
atomoned tx gov vote 1 no --from wallet --chain-id atomone-testnet-1 --gas-adjustment 1.5 --gas auto --gas-prices 0.0225uphoton -y
```

### Vote Abstain
```bash
atomoned tx gov vote 1 abstain --from wallet --chain-id atomone-testnet-1 --gas-adjustment 1.5 --gas auto --gas-prices 0.0225uphoton -y
```

### Vote NoWithVeto
```bash
atomoned tx gov vote 1 NoWithVeto --from wallet --chain-id atomone-testnet-1 --gas-adjustment 1.5 --gas auto --gas-prices 0.0225uphoton -y
```

## Maintenance

### Get Validator Info
```bash
atomoned status 2>&1 | jq .ValidatorInfo
```

### Get Sync Info
```bash
atomoned status 2>&1 | jq .SyncInfo
```

### Get Node Peer
```bash
echo $(echo $(atomoned tendermint show-node-id)'@'$(curl -s ifconfig.me)':'$(cat $HOME/.atomone/config/config.toml | sed -n '/Address to listen for incoming connection/{n;p;}' | sed 's/.*://; s/".*//')
```

### Check If Validator Key Is Correct
```bash
[[ $(atomoned q staking validator $(echo $VALOPER) -oj | jq -r .consensus_pubkey.key) = $(atomoned status | jq -r .ValidatorInfo.PubKey.value) ]] && echo -e "\n\e[1m\e[32mTrue\e[0m\n" || echo -e "\n\e[1m\e[31mFalse\e[0m\n"
```

### Get Live Peers
```bash
curl -sS http://localhost:26657/net_info | jq -r '.result.peers[] | "\(.node_info.id)@\(.remote_ip):\(.node_info.listen_addr)"' | awk -F ':' '{print $1":"$(NF)}'
```

### Set Minimum Gas Price
```bash
sed -i -e "s/^minimum-gas-prices *=.*/minimum-gas-prices = \"0.0225uphoton\"/" $HOME/.atomone/config/app.toml
```

### Enable Prometheus
```bash
sed -i -e "s/prometheus = false/prometheus = true/" $HOME/.atomone/config/config.toml
```

### Reset Chain Data
```bash
atomoned tendermint unsafe-reset-all --keep-addr-book --home $HOME/.atomone --keep-addr-book
```

### Remove Node
⚠️ **Warning**: Make sure you have backed up your priv_validator_key.json!

```bash
cd $HOME
sudo systemctl stop atomoned
sudo systemctl disable atomoned
sudo rm /etc/systemd/system/atomoned.service
sudo systemctl daemon-reload
rm -f $(which atomoned)
rm -rf $HOME/.atomone
rm -rf $HOME/atomone
```

## Useful Commands

### Check Blocks Remaining
```bash
local_height=$(curl -s localhost:26657/status | jq -r .result.sync_info.latest_block_height); network_height=$(curl -s https://rpc.example.com/status | jq -r .result.sync_info.latest_block_height); blocks_left=$((network_height - local_height)); echo "Your node height: $local_height"; echo "Network height: $network_height"; echo "Blocks left: $blocks_left"
```

### Check Your Validator
```bash
atomoned query staking validator $(echo $VALOPER)
```

### Check Your Wallet Balance
```bash
atomoned query bank balances $(echo $WALLET)
```

### Check Service Logs
```bash
sudo journalctl -u atomoned -f --no-hostname -o cat
```

---

*Generated by WinScan - Multi-chain Blockchain Explorer*
