# Paxi Network Cheat Sheet

## Service Management

### Check Logs
```bash
sudo journalctl -u paxid -f -o cat
```

### Start Service
```bash
sudo systemctl start paxid
```

### Stop Service
```bash
sudo systemctl stop paxid
```

### Restart Service
```bash
sudo systemctl restart paxid
```

### Check Service Status
```bash
sudo systemctl status paxid
```

## Node Information

### Sync Info
```bash
paxid status 2>&1 | jq .SyncInfo
```

### Node Info
```bash
paxid status 2>&1 | jq .NodeInfo
```

### Show Node ID
```bash
paxid tendermint show-node-id
```

### Show Validator Info
```bash
paxid status 2>&1 | jq .ValidatorInfo
```

## Key Management

### Add New Key
```bash
paxid keys add wallet
```

### Recover Existing Key
```bash
paxid keys add wallet --recover
```

### List All Keys
```bash
paxid keys list
```

### Delete Key
```bash
paxid keys delete wallet
```

### Export Key to File
```bash
paxid keys export wallet
```

### Import Key from File
```bash
paxid keys import wallet wallet.backup
```

### Query Wallet Balance
```bash
paxid query bank balances $(echo $WALLET)
```

## Token Management

### Withdraw Rewards from All Validators
```bash
paxid tx distribution withdraw-all-rewards --from wallet --chain-id paxi-mainnet --gas-adjustment 1.5 --gas auto --gas-prices 0.1upaxi -y
```

### Withdraw Commission and Rewards from Your Validator
```bash
paxid tx distribution withdraw-rewards $(echo $VALOPER) --commission --from wallet --chain-id paxi-mainnet --gas-adjustment 1.5 --gas auto --gas-prices 0.1upaxi -y
```

### Delegate Tokens to Yourself
```bash
paxid tx staking delegate $(echo $VALOPER) 1000000upaxi --from wallet --chain-id paxi-mainnet --gas-adjustment 1.5 --gas auto --gas-prices 0.1upaxi -y
```

### Delegate Tokens to Validator
```bash
paxid tx staking delegate <TO_VALOPER_ADDRESS> 1000000upaxi --from wallet --chain-id paxi-mainnet --gas-adjustment 1.5 --gas auto --gas-prices 0.1upaxi -y
```

### Redelegate Tokens to Another Validator
```bash
paxid tx staking redelegate $(echo $VALOPER) <TO_VALOPER_ADDRESS> 1000000upaxi --from wallet --chain-id paxi-mainnet --gas-adjustment 1.5 --gas auto --gas-prices 0.1upaxi -y
```

### Unbond Tokens from Your Validator
```bash
paxid tx staking unbond $(echo $VALOPER) 1000000upaxi --from wallet --chain-id paxi-mainnet --gas-adjustment 1.5 --gas auto --gas-prices 0.1upaxi -y
```

### Send Tokens to Wallet
```bash
paxid tx bank send wallet <TO_WALLET_ADDRESS> 1000000upaxi --from wallet --chain-id paxi-mainnet --gas-adjustment 1.5 --gas auto --gas-prices 0.1upaxi -y
```

## Validator Management

### Create New Validator
```bash
paxid tx staking create-validator \
--amount 1000000upaxi \
--pubkey $(paxid tendermint show-validator) \
--moniker "YOUR_MONIKER_NAME" \
--identity "YOUR_KEYBASE_ID" \
--details "YOUR_DETAILS" \
--website "YOUR_WEBSITE_URL" \
--chain-id paxi-mainnet \
--commission-rate 0.05 \
--commission-max-rate 0.20 \
--commission-max-change-rate 0.01 \
--min-self-delegation 1 \
--from wallet \
--gas-adjustment 1.5 \
--gas auto \
--gas-prices 0.1upaxi \
-y
```

### Edit Existing Validator
```bash
paxid tx staking edit-validator \
--new-moniker "YOUR_MONIKER_NAME" \
--identity "YOUR_KEYBASE_ID" \
--details "YOUR_DETAILS" \
--website "YOUR_WEBSITE_URL" \
--chain-id paxi-mainnet \
--commission-rate 0.05 \
--from wallet \
--gas-adjustment 1.5 \
--gas auto \
--gas-prices 0.1upaxi \
-y
```

### Unjail Validator
```bash
paxid tx slashing unjail --from wallet --chain-id paxi-mainnet --gas-adjustment 1.5 --gas auto --gas-prices 0.1upaxi -y
```

### Jail Reason
```bash
paxid query slashing signing-info $(paxid tendermint show-validator)
```

### List All Active Validators
```bash
paxid q staking validators -oj --limit=3000 | jq '.validators[] | select(.status=="BOND_STATUS_BONDED")' | jq -r '(.tokens|tonumber/pow(10; 6)|floor|tostring) + " \t " + .description.moniker' | sort -gr | nl
```

### List All Inactive Validators
```bash
paxid q staking validators -oj --limit=3000 | jq '.validators[] | select(.status=="BOND_STATUS_UNBONDED")' | jq -r '(.tokens|tonumber/pow(10; 6)|floor|tostring) + " \t " + .description.moniker' | sort -gr | nl
```

### View Validator Details
```bash
paxid q staking validator $(echo $VALOPER)
```

## Governance

### List All Proposals
```bash
paxid query gov proposals
```

### View Proposal by ID
```bash
paxid query gov proposal 1
```

### Vote Yes
```bash
paxid tx gov vote 1 yes --from wallet --chain-id paxi-mainnet --gas-adjustment 1.5 --gas auto --gas-prices 0.1upaxi -y
```

### Vote No
```bash
paxid tx gov vote 1 no --from wallet --chain-id paxi-mainnet --gas-adjustment 1.5 --gas auto --gas-prices 0.1upaxi -y
```

### Vote Abstain
```bash
paxid tx gov vote 1 abstain --from wallet --chain-id paxi-mainnet --gas-adjustment 1.5 --gas auto --gas-prices 0.1upaxi -y
```

### Vote NoWithVeto
```bash
paxid tx gov vote 1 NoWithVeto --from wallet --chain-id paxi-mainnet --gas-adjustment 1.5 --gas auto --gas-prices 0.1upaxi -y
```

## Maintenance

### Get Validator Info
```bash
paxid status 2>&1 | jq .ValidatorInfo
```

### Get Sync Info
```bash
paxid status 2>&1 | jq .SyncInfo
```

### Get Node Peer
```bash
echo $(echo $(paxid tendermint show-node-id)'@'$(curl -s ifconfig.me)':'$(cat $HOME/.paxi/config/config.toml | sed -n '/Address to listen for incoming connection/{n;p;}' | sed 's/.*://; s/".*//')
```

### Check If Validator Key Is Correct
```bash
[[ $(paxid q staking validator $(echo $VALOPER) -oj | jq -r .consensus_pubkey.key) = $(paxid status | jq -r .ValidatorInfo.PubKey.value) ]] && echo -e "\n\e[1m\e[32mTrue\e[0m\n" || echo -e "\n\e[1m\e[31mFalse\e[0m\n"
```

### Get Live Peers
```bash
curl -sS http://localhost:26657/net_info | jq -r '.result.peers[] | "\(.node_info.id)@\(.remote_ip):\(.node_info.listen_addr)"' | awk -F ':' '{print $1":"$(NF)}'
```

### Set Minimum Gas Price
```bash
sed -i -e "s/^minimum-gas-prices *=.*/minimum-gas-prices = \"0.1upaxi\"/" $HOME/.paxi/config/app.toml
```

### Enable Prometheus
```bash
sed -i -e "s/prometheus = false/prometheus = true/" $HOME/.paxi/config/config.toml
```

### Reset Chain Data
```bash
paxid tendermint unsafe-reset-all --keep-addr-book --home $HOME/.paxi --keep-addr-book
```

### Remove Node
⚠️ **Warning**: Make sure you have backed up your priv_validator_key.json!

```bash
cd $HOME
sudo systemctl stop paxid
sudo systemctl disable paxid
sudo rm /etc/systemd/system/paxid.service
sudo systemctl daemon-reload
rm -f $(which paxid)
rm -rf $HOME/.paxi
rm -rf $HOME/paxi
```

## Useful Commands

### Check Blocks Remaining
```bash
local_height=$(curl -s localhost:26657/status | jq -r .result.sync_info.latest_block_height); network_height=$(curl -s https://mainnet-rpc.paxinet.io/status | jq -r .result.sync_info.latest_block_height); blocks_left=$((network_height - local_height)); echo "Your node height: $local_height"; echo "Network height: $network_height"; echo "Blocks left: $blocks_left"
```

### Check Your Validator
```bash
paxid query staking validator $(echo $VALOPER)
```

### Check Your Wallet Balance
```bash
paxid query bank balances $(echo $WALLET)
```

### Check Service Logs
```bash
sudo journalctl -u paxid -f --no-hostname -o cat
```

---

*Generated by WinScan - Multi-chain Blockchain Explorer*
