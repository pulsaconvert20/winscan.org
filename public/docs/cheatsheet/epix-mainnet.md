# Epix Cheat Sheet

## Service Management

### Check Logs
```bash
sudo journalctl -u epixd -f -o cat
```

### Start Service
```bash
sudo systemctl start epixd
```

### Stop Service
```bash
sudo systemctl stop epixd
```

### Restart Service
```bash
sudo systemctl restart epixd
```

### Check Service Status
```bash
sudo systemctl status epixd
```

## Node Information

### Sync Info
```bash
epixd status 2>&1 | jq .SyncInfo
```

### Node Info
```bash
epixd status 2>&1 | jq .NodeInfo
```

### Show Node ID
```bash
epixd tendermint show-node-id
```

### Show Validator Info
```bash
epixd status 2>&1 | jq .ValidatorInfo
```

## Key Management

### Add New Key
```bash
epixd keys add wallet
```

### Recover Existing Key
```bash
epixd keys add wallet --recover
```

### List All Keys
```bash
epixd keys list
```

### Delete Key
```bash
epixd keys delete wallet
```

### Export Key to File
```bash
epixd keys export wallet
```

### Import Key from File
```bash
epixd keys import wallet wallet.backup
```

### Query Wallet Balance
```bash
epixd query bank balances $(echo $WALLET)
```

## Token Management

### Withdraw Rewards from All Validators
```bash
epixd tx distribution withdraw-all-rewards --from wallet --chain-id epix_1916-1 --gas-adjustment 1.5 --gas auto --gas-prices 1000000000000aepix -y
```

### Withdraw Commission and Rewards from Your Validator
```bash
epixd tx distribution withdraw-rewards $(echo $VALOPER) --commission --from wallet --chain-id epix_1916-1 --gas-adjustment 1.5 --gas auto --gas-prices 1000000000000aepix -y
```

### Delegate Tokens to Yourself
```bash
epixd tx staking delegate $(echo $VALOPER) 1000000aepix --from wallet --chain-id epix_1916-1 --gas-adjustment 1.5 --gas auto --gas-prices 1000000000000aepix -y
```

### Delegate Tokens to Validator
```bash
epixd tx staking delegate <TO_VALOPER_ADDRESS> 1000000aepix --from wallet --chain-id epix_1916-1 --gas-adjustment 1.5 --gas auto --gas-prices 1000000000000aepix -y
```

### Redelegate Tokens to Another Validator
```bash
epixd tx staking redelegate $(echo $VALOPER) <TO_VALOPER_ADDRESS> 1000000aepix --from wallet --chain-id epix_1916-1 --gas-adjustment 1.5 --gas auto --gas-prices 1000000000000aepix -y
```

### Unbond Tokens from Your Validator
```bash
epixd tx staking unbond $(echo $VALOPER) 1000000aepix --from wallet --chain-id epix_1916-1 --gas-adjustment 1.5 --gas auto --gas-prices 1000000000000aepix -y
```

### Send Tokens to Wallet
```bash
epixd tx bank send wallet <TO_WALLET_ADDRESS> 1000000aepix --from wallet --chain-id epix_1916-1 --gas-adjustment 1.5 --gas auto --gas-prices 1000000000000aepix -y
```

## Validator Management

### Create New Validator
```bash
epixd tx staking create-validator \
--amount 1000000aepix \
--pubkey $(epixd tendermint show-validator) \
--moniker "YOUR_MONIKER_NAME" \
--identity "YOUR_KEYBASE_ID" \
--details "YOUR_DETAILS" \
--website "YOUR_WEBSITE_URL" \
--chain-id epix_1916-1 \
--commission-rate 0.05 \
--commission-max-rate 0.20 \
--commission-max-change-rate 0.01 \
--min-self-delegation 1 \
--from wallet \
--gas-adjustment 1.5 \
--gas auto \
--gas-prices 1000000000000aepix \
-y
```

### Edit Existing Validator
```bash
epixd tx staking edit-validator \
--new-moniker "YOUR_MONIKER_NAME" \
--identity "YOUR_KEYBASE_ID" \
--details "YOUR_DETAILS" \
--website "YOUR_WEBSITE_URL" \
--chain-id epix_1916-1 \
--commission-rate 0.05 \
--from wallet \
--gas-adjustment 1.5 \
--gas auto \
--gas-prices 1000000000000aepix \
-y
```

### Unjail Validator
```bash
epixd tx slashing unjail --from wallet --chain-id epix_1916-1 --gas-adjustment 1.5 --gas auto --gas-prices 1000000000000aepix -y
```

### Jail Reason
```bash
epixd query slashing signing-info $(epixd tendermint show-validator)
```

### List All Active Validators
```bash
epixd q staking validators -oj --limit=3000 | jq '.validators[] | select(.status=="BOND_STATUS_BONDED")' | jq -r '(.tokens|tonumber/pow(10; 6)|floor|tostring) + " \t " + .description.moniker' | sort -gr | nl
```

### List All Inactive Validators
```bash
epixd q staking validators -oj --limit=3000 | jq '.validators[] | select(.status=="BOND_STATUS_UNBONDED")' | jq -r '(.tokens|tonumber/pow(10; 6)|floor|tostring) + " \t " + .description.moniker' | sort -gr | nl
```

### View Validator Details
```bash
epixd q staking validator $(echo $VALOPER)
```

## Governance

### List All Proposals
```bash
epixd query gov proposals
```

### View Proposal by ID
```bash
epixd query gov proposal 1
```

### Vote Yes
```bash
epixd tx gov vote 1 yes --from wallet --chain-id epix_1916-1 --gas-adjustment 1.5 --gas auto --gas-prices 1000000000000aepix -y
```

### Vote No
```bash
epixd tx gov vote 1 no --from wallet --chain-id epix_1916-1 --gas-adjustment 1.5 --gas auto --gas-prices 1000000000000aepix -y
```

### Vote Abstain
```bash
epixd tx gov vote 1 abstain --from wallet --chain-id epix_1916-1 --gas-adjustment 1.5 --gas auto --gas-prices 1000000000000aepix -y
```

### Vote NoWithVeto
```bash
epixd tx gov vote 1 NoWithVeto --from wallet --chain-id epix_1916-1 --gas-adjustment 1.5 --gas auto --gas-prices 1000000000000aepix -y
```

## Maintenance

### Get Validator Info
```bash
epixd status 2>&1 | jq .ValidatorInfo
```

### Get Sync Info
```bash
epixd status 2>&1 | jq .SyncInfo
```

### Get Node Peer
```bash
echo $(echo $(epixd tendermint show-node-id)'@'$(curl -s ifconfig.me)':'$(cat $HOME/.epix/config/config.toml | sed -n '/Address to listen for incoming connection/{n;p;}' | sed 's/.*://; s/".*//')
```

### Check If Validator Key Is Correct
```bash
[[ $(epixd q staking validator $(echo $VALOPER) -oj | jq -r .consensus_pubkey.key) = $(epixd status | jq -r .ValidatorInfo.PubKey.value) ]] && echo -e "\n\e[1m\e[32mTrue\e[0m\n" || echo -e "\n\e[1m\e[31mFalse\e[0m\n"
```

### Get Live Peers
```bash
curl -sS http://localhost:26657/net_info | jq -r '.result.peers[] | "\(.node_info.id)@\(.remote_ip):\(.node_info.listen_addr)"' | awk -F ':' '{print $1":"$(NF)}'
```

### Set Minimum Gas Price
```bash
sed -i -e "s/^minimum-gas-prices *=.*/minimum-gas-prices = \"1000000000000aepix\"/" $HOME/.epix/config/app.toml
```

### Enable Prometheus
```bash
sed -i -e "s/prometheus = false/prometheus = true/" $HOME/.epix/config/config.toml
```

### Reset Chain Data
```bash
epixd tendermint unsafe-reset-all --keep-addr-book --home $HOME/.epix --keep-addr-book
```

### Remove Node
⚠️ **Warning**: Make sure you have backed up your priv_validator_key.json!

```bash
cd $HOME
sudo systemctl stop epixd
sudo systemctl disable epixd
sudo rm /etc/systemd/system/epixd.service
sudo systemctl daemon-reload
rm -f $(which epixd)
rm -rf $HOME/.epix
rm -rf $HOME/EpixChain
```

## Useful Commands

### Check Blocks Remaining
```bash
local_height=$(curl -s localhost:26657/status | jq -r .result.sync_info.latest_block_height); network_height=$(curl -s https://rpc.epix.zone/status | jq -r .result.sync_info.latest_block_height); blocks_left=$((network_height - local_height)); echo "Your node height: $local_height"; echo "Network height: $network_height"; echo "Blocks left: $blocks_left"
```

### Check Your Validator
```bash
epixd query staking validator $(echo $VALOPER)
```

### Check Your Wallet Balance
```bash
epixd query bank balances $(echo $WALLET)
```

### Check Service Logs
```bash
sudo journalctl -u epixd -f --no-hostname -o cat
```

---

*Generated by WinScan - Multi-chain Blockchain Explorer*
