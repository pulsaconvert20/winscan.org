# Republic AI Cheat Sheet

## Service Management

### Check Logs
```bash
sudo journalctl -u republicaid -f -o cat
```

### Start Service
```bash
sudo systemctl start republicaid
```

### Stop Service
```bash
sudo systemctl stop republicaid
```

### Restart Service
```bash
sudo systemctl restart republicaid
```

### Check Service Status
```bash
sudo systemctl status republicaid
```

## Node Information

### Sync Info
```bash
republicaid status 2>&1 | jq .SyncInfo
```

### Node Info
```bash
republicaid status 2>&1 | jq .NodeInfo
```

### Show Node ID
```bash
republicaid tendermint show-node-id
```

### Show Validator Info
```bash
republicaid status 2>&1 | jq .ValidatorInfo
```

## Key Management

### Add New Key
```bash
republicaid keys add wallet
```

### Recover Existing Key
```bash
republicaid keys add wallet --recover
```

### List All Keys
```bash
republicaid keys list
```

### Delete Key
```bash
republicaid keys delete wallet
```

### Export Key to File
```bash
republicaid keys export wallet
```

### Import Key from File
```bash
republicaid keys import wallet wallet.backup
```

### Query Wallet Balance
```bash
republicaid query bank balances $(echo $WALLET)
```

## Token Management

### Withdraw Rewards from All Validators
```bash
republicaid tx distribution withdraw-all-rewards --from wallet --chain-id raitestnet_77701-1 --gas-adjustment 1.5 --gas auto --gas-prices 250000000arai -y
```

### Withdraw Commission and Rewards from Your Validator
```bash
republicaid tx distribution withdraw-rewards $(echo $VALOPER) --commission --from wallet --chain-id raitestnet_77701-1 --gas-adjustment 1.5 --gas auto --gas-prices 250000000arai -y
```

### Delegate Tokens to Yourself
```bash
republicaid tx staking delegate $(echo $VALOPER) 1000000arai --from wallet --chain-id raitestnet_77701-1 --gas-adjustment 1.5 --gas auto --gas-prices 250000000arai -y
```

### Delegate Tokens to Validator
```bash
republicaid tx staking delegate <TO_VALOPER_ADDRESS> 1000000arai --from wallet --chain-id raitestnet_77701-1 --gas-adjustment 1.5 --gas auto --gas-prices 250000000arai -y
```

### Redelegate Tokens to Another Validator
```bash
republicaid tx staking redelegate $(echo $VALOPER) <TO_VALOPER_ADDRESS> 1000000arai --from wallet --chain-id raitestnet_77701-1 --gas-adjustment 1.5 --gas auto --gas-prices 250000000arai -y
```

### Unbond Tokens from Your Validator
```bash
republicaid tx staking unbond $(echo $VALOPER) 1000000arai --from wallet --chain-id raitestnet_77701-1 --gas-adjustment 1.5 --gas auto --gas-prices 250000000arai -y
```

### Send Tokens to Wallet
```bash
republicaid tx bank send wallet <TO_WALLET_ADDRESS> 1000000arai --from wallet --chain-id raitestnet_77701-1 --gas-adjustment 1.5 --gas auto --gas-prices 250000000arai -y
```

## Validator Management

### Create New Validator
```bash
republicaid tx staking create-validator \
--amount 1000000arai \
--pubkey $(republicaid tendermint show-validator) \
--moniker "YOUR_MONIKER_NAME" \
--identity "YOUR_KEYBASE_ID" \
--details "YOUR_DETAILS" \
--website "YOUR_WEBSITE_URL" \
--chain-id raitestnet_77701-1 \
--commission-rate 0.05 \
--commission-max-rate 0.20 \
--commission-max-change-rate 0.01 \
--min-self-delegation 1 \
--from wallet \
--gas-adjustment 1.5 \
--gas auto \
--gas-prices 250000000arai \
-y
```

### Edit Existing Validator
```bash
republicaid tx staking edit-validator \
--new-moniker "YOUR_MONIKER_NAME" \
--identity "YOUR_KEYBASE_ID" \
--details "YOUR_DETAILS" \
--website "YOUR_WEBSITE_URL" \
--chain-id raitestnet_77701-1 \
--commission-rate 0.05 \
--from wallet \
--gas-adjustment 1.5 \
--gas auto \
--gas-prices 250000000arai \
-y
```

### Unjail Validator
```bash
republicaid tx slashing unjail --from wallet --chain-id raitestnet_77701-1 --gas-adjustment 1.5 --gas auto --gas-prices 250000000arai -y
```

### Jail Reason
```bash
republicaid query slashing signing-info $(republicaid tendermint show-validator)
```

### List All Active Validators
```bash
republicaid q staking validators -oj --limit=3000 | jq '.validators[] | select(.status=="BOND_STATUS_BONDED")' | jq -r '(.tokens|tonumber/pow(10; 6)|floor|tostring) + " \t " + .description.moniker' | sort -gr | nl
```

### List All Inactive Validators
```bash
republicaid q staking validators -oj --limit=3000 | jq '.validators[] | select(.status=="BOND_STATUS_UNBONDED")' | jq -r '(.tokens|tonumber/pow(10; 6)|floor|tostring) + " \t " + .description.moniker' | sort -gr | nl
```

### View Validator Details
```bash
republicaid q staking validator $(echo $VALOPER)
```

## Governance

### List All Proposals
```bash
republicaid query gov proposals
```

### View Proposal by ID
```bash
republicaid query gov proposal 1
```

### Vote Yes
```bash
republicaid tx gov vote 1 yes --from wallet --chain-id raitestnet_77701-1 --gas-adjustment 1.5 --gas auto --gas-prices 250000000arai -y
```

### Vote No
```bash
republicaid tx gov vote 1 no --from wallet --chain-id raitestnet_77701-1 --gas-adjustment 1.5 --gas auto --gas-prices 250000000arai -y
```

### Vote Abstain
```bash
republicaid tx gov vote 1 abstain --from wallet --chain-id raitestnet_77701-1 --gas-adjustment 1.5 --gas auto --gas-prices 250000000arai -y
```

### Vote NoWithVeto
```bash
republicaid tx gov vote 1 NoWithVeto --from wallet --chain-id raitestnet_77701-1 --gas-adjustment 1.5 --gas auto --gas-prices 250000000arai -y
```

## Maintenance

### Get Validator Info
```bash
republicaid status 2>&1 | jq .ValidatorInfo
```

### Get Sync Info
```bash
republicaid status 2>&1 | jq .SyncInfo
```

### Get Node Peer
```bash
echo $(echo $(republicaid tendermint show-node-id)'@'$(curl -s ifconfig.me)':'$(cat $HOME/.republicai/config/config.toml | sed -n '/Address to listen for incoming connection/{n;p;}' | sed 's/.*://; s/".*//')
```

### Check If Validator Key Is Correct
```bash
[[ $(republicaid q staking validator $(echo $VALOPER) -oj | jq -r .consensus_pubkey.key) = $(republicaid status | jq -r .ValidatorInfo.PubKey.value) ]] && echo -e "\n\e[1m\e[32mTrue\e[0m\n" || echo -e "\n\e[1m\e[31mFalse\e[0m\n"
```

### Get Live Peers
```bash
curl -sS http://localhost:26657/net_info | jq -r '.result.peers[] | "\(.node_info.id)@\(.remote_ip):\(.node_info.listen_addr)"' | awk -F ':' '{print $1":"$(NF)}'
```

### Set Minimum Gas Price
```bash
sed -i -e "s/^minimum-gas-prices *=.*/minimum-gas-prices = \"250000000arai\"/" $HOME/.republicai/config/app.toml
```

### Enable Prometheus
```bash
sed -i -e "s/prometheus = false/prometheus = true/" $HOME/.republicai/config/config.toml
```

### Reset Chain Data
```bash
republicaid tendermint unsafe-reset-all --keep-addr-book --home $HOME/.republicai --keep-addr-book
```

### Remove Node
⚠️ **Warning**: Make sure you have backed up your priv_validator_key.json!

```bash
cd $HOME
sudo systemctl stop republicaid
sudo systemctl disable republicaid
sudo rm /etc/systemd/system/republicaid.service
sudo systemctl daemon-reload
rm -f $(which republicaid)
rm -rf $HOME/.republicai
rm -rf $HOME/republicai-test
```

## Useful Commands

### Check Blocks Remaining
```bash
local_height=$(curl -s localhost:26657/status | jq -r .result.sync_info.latest_block_height); network_height=$(curl -s https://rpc.republicai.io/status | jq -r .result.sync_info.latest_block_height); blocks_left=$((network_height - local_height)); echo "Your node height: $local_height"; echo "Network height: $network_height"; echo "Blocks left: $blocks_left"
```

### Check Your Validator
```bash
republicaid query staking validator $(echo $VALOPER)
```

### Check Your Wallet Balance
```bash
republicaid query bank balances $(echo $WALLET)
```

### Check Service Logs
```bash
sudo journalctl -u republicaid -f --no-hostname -o cat
```

---

*Generated by WinScan - Multi-chain Blockchain Explorer*
