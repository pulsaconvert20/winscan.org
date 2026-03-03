# Cosmos Hub Cheat Sheet

## Service Management

### Check Logs
```bash
sudo journalctl -u cosmoshubd -f -o cat
```

### Start Service
```bash
sudo systemctl start cosmoshubd
```

### Stop Service
```bash
sudo systemctl stop cosmoshubd
```

### Restart Service
```bash
sudo systemctl restart cosmoshubd
```

### Check Service Status
```bash
sudo systemctl status cosmoshubd
```

## Node Information

### Sync Info
```bash
cosmoshubd status 2>&1 | jq .SyncInfo
```

### Node Info
```bash
cosmoshubd status 2>&1 | jq .NodeInfo
```

### Show Node ID
```bash
cosmoshubd tendermint show-node-id
```

### Show Validator Info
```bash
cosmoshubd status 2>&1 | jq .ValidatorInfo
```

## Key Management

### Add New Key
```bash
cosmoshubd keys add wallet
```

### Recover Existing Key
```bash
cosmoshubd keys add wallet --recover
```

### List All Keys
```bash
cosmoshubd keys list
```

### Delete Key
```bash
cosmoshubd keys delete wallet
```

### Export Key to File
```bash
cosmoshubd keys export wallet
```

### Import Key from File
```bash
cosmoshubd keys import wallet wallet.backup
```

### Query Wallet Balance
```bash
cosmoshubd query bank balances $(echo $WALLET)
```

## Token Management

### Withdraw Rewards from All Validators
```bash
cosmoshubd tx distribution withdraw-all-rewards --from wallet --chain-id cosmoshub-4 --gas-adjustment 1.5 --gas auto --gas-prices 0.01uatom -y
```

### Withdraw Commission and Rewards from Your Validator
```bash
cosmoshubd tx distribution withdraw-rewards $(echo $VALOPER) --commission --from wallet --chain-id cosmoshub-4 --gas-adjustment 1.5 --gas auto --gas-prices 0.01uatom -y
```

### Delegate Tokens to Yourself
```bash
cosmoshubd tx staking delegate $(echo $VALOPER) 1000000uatom --from wallet --chain-id cosmoshub-4 --gas-adjustment 1.5 --gas auto --gas-prices 0.01uatom -y
```

### Delegate Tokens to Validator
```bash
cosmoshubd tx staking delegate <TO_VALOPER_ADDRESS> 1000000uatom --from wallet --chain-id cosmoshub-4 --gas-adjustment 1.5 --gas auto --gas-prices 0.01uatom -y
```

### Redelegate Tokens to Another Validator
```bash
cosmoshubd tx staking redelegate $(echo $VALOPER) <TO_VALOPER_ADDRESS> 1000000uatom --from wallet --chain-id cosmoshub-4 --gas-adjustment 1.5 --gas auto --gas-prices 0.01uatom -y
```

### Unbond Tokens from Your Validator
```bash
cosmoshubd tx staking unbond $(echo $VALOPER) 1000000uatom --from wallet --chain-id cosmoshub-4 --gas-adjustment 1.5 --gas auto --gas-prices 0.01uatom -y
```

### Send Tokens to Wallet
```bash
cosmoshubd tx bank send wallet <TO_WALLET_ADDRESS> 1000000uatom --from wallet --chain-id cosmoshub-4 --gas-adjustment 1.5 --gas auto --gas-prices 0.01uatom -y
```

## Validator Management

### Create New Validator
```bash
cosmoshubd tx staking create-validator \
--amount 1000000uatom \
--pubkey $(cosmoshubd tendermint show-validator) \
--moniker "YOUR_MONIKER_NAME" \
--identity "YOUR_KEYBASE_ID" \
--details "YOUR_DETAILS" \
--website "YOUR_WEBSITE_URL" \
--chain-id cosmoshub-4 \
--commission-rate 0.05 \
--commission-max-rate 0.20 \
--commission-max-change-rate 0.01 \
--min-self-delegation 1 \
--from wallet \
--gas-adjustment 1.5 \
--gas auto \
--gas-prices 0.01uatom \
-y
```

### Edit Existing Validator
```bash
cosmoshubd tx staking edit-validator \
--new-moniker "YOUR_MONIKER_NAME" \
--identity "YOUR_KEYBASE_ID" \
--details "YOUR_DETAILS" \
--website "YOUR_WEBSITE_URL" \
--chain-id cosmoshub-4 \
--commission-rate 0.05 \
--from wallet \
--gas-adjustment 1.5 \
--gas auto \
--gas-prices 0.01uatom \
-y
```

### Unjail Validator
```bash
cosmoshubd tx slashing unjail --from wallet --chain-id cosmoshub-4 --gas-adjustment 1.5 --gas auto --gas-prices 0.01uatom -y
```

### Jail Reason
```bash
cosmoshubd query slashing signing-info $(cosmoshubd tendermint show-validator)
```

### List All Active Validators
```bash
cosmoshubd q staking validators -oj --limit=3000 | jq '.validators[] | select(.status=="BOND_STATUS_BONDED")' | jq -r '(.tokens|tonumber/pow(10; 6)|floor|tostring) + " \t " + .description.moniker' | sort -gr | nl
```

### List All Inactive Validators
```bash
cosmoshubd q staking validators -oj --limit=3000 | jq '.validators[] | select(.status=="BOND_STATUS_UNBONDED")' | jq -r '(.tokens|tonumber/pow(10; 6)|floor|tostring) + " \t " + .description.moniker' | sort -gr | nl
```

### View Validator Details
```bash
cosmoshubd q staking validator $(echo $VALOPER)
```

## Governance

### List All Proposals
```bash
cosmoshubd query gov proposals
```

### View Proposal by ID
```bash
cosmoshubd query gov proposal 1
```

### Vote Yes
```bash
cosmoshubd tx gov vote 1 yes --from wallet --chain-id cosmoshub-4 --gas-adjustment 1.5 --gas auto --gas-prices 0.01uatom -y
```

### Vote No
```bash
cosmoshubd tx gov vote 1 no --from wallet --chain-id cosmoshub-4 --gas-adjustment 1.5 --gas auto --gas-prices 0.01uatom -y
```

### Vote Abstain
```bash
cosmoshubd tx gov vote 1 abstain --from wallet --chain-id cosmoshub-4 --gas-adjustment 1.5 --gas auto --gas-prices 0.01uatom -y
```

### Vote NoWithVeto
```bash
cosmoshubd tx gov vote 1 NoWithVeto --from wallet --chain-id cosmoshub-4 --gas-adjustment 1.5 --gas auto --gas-prices 0.01uatom -y
```

## Maintenance

### Get Validator Info
```bash
cosmoshubd status 2>&1 | jq .ValidatorInfo
```

### Get Sync Info
```bash
cosmoshubd status 2>&1 | jq .SyncInfo
```

### Get Node Peer
```bash
echo $(echo $(cosmoshubd tendermint show-node-id)'@'$(curl -s ifconfig.me)':'$(cat $HOME/.cosmoshub/config/config.toml | sed -n '/Address to listen for incoming connection/{n;p;}' | sed 's/.*://; s/".*//')
```

### Check If Validator Key Is Correct
```bash
[[ $(cosmoshubd q staking validator $(echo $VALOPER) -oj | jq -r .consensus_pubkey.key) = $(cosmoshubd status | jq -r .ValidatorInfo.PubKey.value) ]] && echo -e "\n\e[1m\e[32mTrue\e[0m\n" || echo -e "\n\e[1m\e[31mFalse\e[0m\n"
```

### Get Live Peers
```bash
curl -sS http://localhost:26657/net_info | jq -r '.result.peers[] | "\(.node_info.id)@\(.remote_ip):\(.node_info.listen_addr)"' | awk -F ':' '{print $1":"$(NF)}'
```

### Set Minimum Gas Price
```bash
sed -i -e "s/^minimum-gas-prices *=.*/minimum-gas-prices = \"0.01uatom\"/" $HOME/.cosmoshub/config/app.toml
```

### Enable Prometheus
```bash
sed -i -e "s/prometheus = false/prometheus = true/" $HOME/.cosmoshub/config/config.toml
```

### Reset Chain Data
```bash
cosmoshubd tendermint unsafe-reset-all --keep-addr-book --home $HOME/.cosmoshub --keep-addr-book
```

### Remove Node
⚠️ **Warning**: Make sure you have backed up your priv_validator_key.json!

```bash
cd $HOME
sudo systemctl stop cosmoshubd
sudo systemctl disable cosmoshubd
sudo rm /etc/systemd/system/cosmoshubd.service
sudo systemctl daemon-reload
rm -f $(which cosmoshubd)
rm -rf $HOME/.cosmoshub
rm -rf $HOME/gaia
```

## Useful Commands

### Check Blocks Remaining
```bash
local_height=$(curl -s localhost:26657/status | jq -r .result.sync_info.latest_block_height); network_height=$(curl -s https://cosmoshub.tendermintrpc.lava.build:443/status | jq -r .result.sync_info.latest_block_height); blocks_left=$((network_height - local_height)); echo "Your node height: $local_height"; echo "Network height: $network_height"; echo "Blocks left: $blocks_left"
```

### Check Your Validator
```bash
cosmoshubd query staking validator $(echo $VALOPER)
```

### Check Your Wallet Balance
```bash
cosmoshubd query bank balances $(echo $WALLET)
```

### Check Service Logs
```bash
sudo journalctl -u cosmoshubd -f --no-hostname -o cat
```

---

*Generated by WinScan - Multi-chain Blockchain Explorer*
