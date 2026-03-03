# Empeiria Cheat Sheet

## Service Management

### Check Logs
```bash
sudo journalctl -u empeiriad -f -o cat
```

### Start Service
```bash
sudo systemctl start empeiriad
```

### Stop Service
```bash
sudo systemctl stop empeiriad
```

### Restart Service
```bash
sudo systemctl restart empeiriad
```

### Check Service Status
```bash
sudo systemctl status empeiriad
```

## Node Information

### Sync Info
```bash
empeiriad status 2>&1 | jq .SyncInfo
```

### Node Info
```bash
empeiriad status 2>&1 | jq .NodeInfo
```

### Show Node ID
```bash
empeiriad tendermint show-node-id
```

### Show Validator Info
```bash
empeiriad status 2>&1 | jq .ValidatorInfo
```

## Key Management

### Add New Key
```bash
empeiriad keys add wallet
```

### Recover Existing Key
```bash
empeiriad keys add wallet --recover
```

### List All Keys
```bash
empeiriad keys list
```

### Delete Key
```bash
empeiriad keys delete wallet
```

### Export Key to File
```bash
empeiriad keys export wallet
```

### Import Key from File
```bash
empeiriad keys import wallet wallet.backup
```

### Query Wallet Balance
```bash
empeiriad query bank balances $(echo $WALLET)
```

## Token Management

### Withdraw Rewards from All Validators
```bash
empeiriad tx distribution withdraw-all-rewards --from wallet --chain-id empe-testnet-2 --gas-adjustment 1.5 --gas auto --gas-prices 800uempe -y
```

### Withdraw Commission and Rewards from Your Validator
```bash
empeiriad tx distribution withdraw-rewards $(echo $VALOPER) --commission --from wallet --chain-id empe-testnet-2 --gas-adjustment 1.5 --gas auto --gas-prices 800uempe -y
```

### Delegate Tokens to Yourself
```bash
empeiriad tx staking delegate $(echo $VALOPER) 1000000uempe --from wallet --chain-id empe-testnet-2 --gas-adjustment 1.5 --gas auto --gas-prices 800uempe -y
```

### Delegate Tokens to Validator
```bash
empeiriad tx staking delegate <TO_VALOPER_ADDRESS> 1000000uempe --from wallet --chain-id empe-testnet-2 --gas-adjustment 1.5 --gas auto --gas-prices 800uempe -y
```

### Redelegate Tokens to Another Validator
```bash
empeiriad tx staking redelegate $(echo $VALOPER) <TO_VALOPER_ADDRESS> 1000000uempe --from wallet --chain-id empe-testnet-2 --gas-adjustment 1.5 --gas auto --gas-prices 800uempe -y
```

### Unbond Tokens from Your Validator
```bash
empeiriad tx staking unbond $(echo $VALOPER) 1000000uempe --from wallet --chain-id empe-testnet-2 --gas-adjustment 1.5 --gas auto --gas-prices 800uempe -y
```

### Send Tokens to Wallet
```bash
empeiriad tx bank send wallet <TO_WALLET_ADDRESS> 1000000uempe --from wallet --chain-id empe-testnet-2 --gas-adjustment 1.5 --gas auto --gas-prices 800uempe -y
```

## Validator Management

### Create New Validator
```bash
empeiriad tx staking create-validator \
--amount 1000000uempe \
--pubkey $(empeiriad tendermint show-validator) \
--moniker "YOUR_MONIKER_NAME" \
--identity "YOUR_KEYBASE_ID" \
--details "YOUR_DETAILS" \
--website "YOUR_WEBSITE_URL" \
--chain-id empe-testnet-2 \
--commission-rate 0.05 \
--commission-max-rate 0.20 \
--commission-max-change-rate 0.01 \
--min-self-delegation 1 \
--from wallet \
--gas-adjustment 1.5 \
--gas auto \
--gas-prices 800uempe \
-y
```

### Edit Existing Validator
```bash
empeiriad tx staking edit-validator \
--new-moniker "YOUR_MONIKER_NAME" \
--identity "YOUR_KEYBASE_ID" \
--details "YOUR_DETAILS" \
--website "YOUR_WEBSITE_URL" \
--chain-id empe-testnet-2 \
--commission-rate 0.05 \
--from wallet \
--gas-adjustment 1.5 \
--gas auto \
--gas-prices 800uempe \
-y
```

### Unjail Validator
```bash
empeiriad tx slashing unjail --from wallet --chain-id empe-testnet-2 --gas-adjustment 1.5 --gas auto --gas-prices 800uempe -y
```

### Jail Reason
```bash
empeiriad query slashing signing-info $(empeiriad tendermint show-validator)
```

### List All Active Validators
```bash
empeiriad q staking validators -oj --limit=3000 | jq '.validators[] | select(.status=="BOND_STATUS_BONDED")' | jq -r '(.tokens|tonumber/pow(10; 6)|floor|tostring) + " \t " + .description.moniker' | sort -gr | nl
```

### List All Inactive Validators
```bash
empeiriad q staking validators -oj --limit=3000 | jq '.validators[] | select(.status=="BOND_STATUS_UNBONDED")' | jq -r '(.tokens|tonumber/pow(10; 6)|floor|tostring) + " \t " + .description.moniker' | sort -gr | nl
```

### View Validator Details
```bash
empeiriad q staking validator $(echo $VALOPER)
```

## Governance

### List All Proposals
```bash
empeiriad query gov proposals
```

### View Proposal by ID
```bash
empeiriad query gov proposal 1
```

### Vote Yes
```bash
empeiriad tx gov vote 1 yes --from wallet --chain-id empe-testnet-2 --gas-adjustment 1.5 --gas auto --gas-prices 800uempe -y
```

### Vote No
```bash
empeiriad tx gov vote 1 no --from wallet --chain-id empe-testnet-2 --gas-adjustment 1.5 --gas auto --gas-prices 800uempe -y
```

### Vote Abstain
```bash
empeiriad tx gov vote 1 abstain --from wallet --chain-id empe-testnet-2 --gas-adjustment 1.5 --gas auto --gas-prices 800uempe -y
```

### Vote NoWithVeto
```bash
empeiriad tx gov vote 1 NoWithVeto --from wallet --chain-id empe-testnet-2 --gas-adjustment 1.5 --gas auto --gas-prices 800uempe -y
```

## Maintenance

### Get Validator Info
```bash
empeiriad status 2>&1 | jq .ValidatorInfo
```

### Get Sync Info
```bash
empeiriad status 2>&1 | jq .SyncInfo
```

### Get Node Peer
```bash
echo $(echo $(empeiriad tendermint show-node-id)'@'$(curl -s ifconfig.me)':'$(cat $HOME/.empeiria/config/config.toml | sed -n '/Address to listen for incoming connection/{n;p;}' | sed 's/.*://; s/".*//')
```

### Check If Validator Key Is Correct
```bash
[[ $(empeiriad q staking validator $(echo $VALOPER) -oj | jq -r .consensus_pubkey.key) = $(empeiriad status | jq -r .ValidatorInfo.PubKey.value) ]] && echo -e "\n\e[1m\e[32mTrue\e[0m\n" || echo -e "\n\e[1m\e[31mFalse\e[0m\n"
```

### Get Live Peers
```bash
curl -sS http://localhost:26657/net_info | jq -r '.result.peers[] | "\(.node_info.id)@\(.remote_ip):\(.node_info.listen_addr)"' | awk -F ':' '{print $1":"$(NF)}'
```

### Set Minimum Gas Price
```bash
sed -i -e "s/^minimum-gas-prices *=.*/minimum-gas-prices = \"800uempe\"/" $HOME/.empeiria/config/app.toml
```

### Enable Prometheus
```bash
sed -i -e "s/prometheus = false/prometheus = true/" $HOME/.empeiria/config/config.toml
```

### Reset Chain Data
```bash
empeiriad tendermint unsafe-reset-all --keep-addr-book --home $HOME/.empeiria --keep-addr-book
```

### Remove Node
⚠️ **Warning**: Make sure you have backed up your priv_validator_key.json!

```bash
cd $HOME
sudo systemctl stop empeiriad
sudo systemctl disable empeiriad
sudo rm /etc/systemd/system/empeiriad.service
sudo systemctl daemon-reload
rm -f $(which empeiriad)
rm -rf $HOME/.empeiria
rm -rf $HOME/empeiria-test
```

## Useful Commands

### Check Blocks Remaining
```bash
local_height=$(curl -s localhost:26657/status | jq -r .result.sync_info.latest_block_height); network_height=$(curl -s https://empeiria-testnet-rpc.itrocket.net/status | jq -r .result.sync_info.latest_block_height); blocks_left=$((network_height - local_height)); echo "Your node height: $local_height"; echo "Network height: $network_height"; echo "Blocks left: $blocks_left"
```

### Check Your Validator
```bash
empeiriad query staking validator $(echo $VALOPER)
```

### Check Your Wallet Balance
```bash
empeiriad query bank balances $(echo $WALLET)
```

### Check Service Logs
```bash
sudo journalctl -u empeiriad -f --no-hostname -o cat
```

---

*Generated by WinScan - Multi-chain Blockchain Explorer*
