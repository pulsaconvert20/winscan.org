# Noble Cheat Sheet

## Service Management

### Check Logs
```bash
sudo journalctl -u nobled -f -o cat
```

### Start Service
```bash
sudo systemctl start nobled
```

### Stop Service
```bash
sudo systemctl stop nobled
```

### Restart Service
```bash
sudo systemctl restart nobled
```

### Check Service Status
```bash
sudo systemctl status nobled
```

## Node Information

### Sync Info
```bash
nobled status 2>&1 | jq .SyncInfo
```

### Node Info
```bash
nobled status 2>&1 | jq .NodeInfo
```

### Show Node ID
```bash
nobled tendermint show-node-id
```

### Show Validator Info
```bash
nobled status 2>&1 | jq .ValidatorInfo
```

## Key Management

### Add New Key
```bash
nobled keys add wallet
```

### Recover Existing Key
```bash
nobled keys add wallet --recover
```

### List All Keys
```bash
nobled keys list
```

### Delete Key
```bash
nobled keys delete wallet
```

### Export Key to File
```bash
nobled keys export wallet
```

### Import Key from File
```bash
nobled keys import wallet wallet.backup
```

### Query Wallet Balance
```bash
nobled query bank balances $(echo $WALLET)
```

## Token Management

### Withdraw Rewards from All Validators
```bash
nobled tx distribution withdraw-all-rewards --from wallet --chain-id noble-1 --gas-adjustment 1.5 --gas auto --gas-prices 0.1uusdc -y
```

### Withdraw Commission and Rewards from Your Validator
```bash
nobled tx distribution withdraw-rewards $(echo $VALOPER) --commission --from wallet --chain-id noble-1 --gas-adjustment 1.5 --gas auto --gas-prices 0.1uusdc -y
```

### Delegate Tokens to Yourself
```bash
nobled tx staking delegate $(echo $VALOPER) 1000000uusdc --from wallet --chain-id noble-1 --gas-adjustment 1.5 --gas auto --gas-prices 0.1uusdc -y
```

### Delegate Tokens to Validator
```bash
nobled tx staking delegate <TO_VALOPER_ADDRESS> 1000000uusdc --from wallet --chain-id noble-1 --gas-adjustment 1.5 --gas auto --gas-prices 0.1uusdc -y
```

### Redelegate Tokens to Another Validator
```bash
nobled tx staking redelegate $(echo $VALOPER) <TO_VALOPER_ADDRESS> 1000000uusdc --from wallet --chain-id noble-1 --gas-adjustment 1.5 --gas auto --gas-prices 0.1uusdc -y
```

### Unbond Tokens from Your Validator
```bash
nobled tx staking unbond $(echo $VALOPER) 1000000uusdc --from wallet --chain-id noble-1 --gas-adjustment 1.5 --gas auto --gas-prices 0.1uusdc -y
```

### Send Tokens to Wallet
```bash
nobled tx bank send wallet <TO_WALLET_ADDRESS> 1000000uusdc --from wallet --chain-id noble-1 --gas-adjustment 1.5 --gas auto --gas-prices 0.1uusdc -y
```

## Validator Management

### Create New Validator
```bash
nobled tx staking create-validator \
--amount 1000000uusdc \
--pubkey $(nobled tendermint show-validator) \
--moniker "YOUR_MONIKER_NAME" \
--identity "YOUR_KEYBASE_ID" \
--details "YOUR_DETAILS" \
--website "YOUR_WEBSITE_URL" \
--chain-id noble-1 \
--commission-rate 0.05 \
--commission-max-rate 0.20 \
--commission-max-change-rate 0.01 \
--min-self-delegation 1 \
--from wallet \
--gas-adjustment 1.5 \
--gas auto \
--gas-prices 0.1uusdc \
-y
```

### Edit Existing Validator
```bash
nobled tx staking edit-validator \
--new-moniker "YOUR_MONIKER_NAME" \
--identity "YOUR_KEYBASE_ID" \
--details "YOUR_DETAILS" \
--website "YOUR_WEBSITE_URL" \
--chain-id noble-1 \
--commission-rate 0.05 \
--from wallet \
--gas-adjustment 1.5 \
--gas auto \
--gas-prices 0.1uusdc \
-y
```

### Unjail Validator
```bash
nobled tx slashing unjail --from wallet --chain-id noble-1 --gas-adjustment 1.5 --gas auto --gas-prices 0.1uusdc -y
```

### Jail Reason
```bash
nobled query slashing signing-info $(nobled tendermint show-validator)
```

### List All Active Validators
```bash
nobled q staking validators -oj --limit=3000 | jq '.validators[] | select(.status=="BOND_STATUS_BONDED")' | jq -r '(.tokens|tonumber/pow(10; 6)|floor|tostring) + " \t " + .description.moniker' | sort -gr | nl
```

### List All Inactive Validators
```bash
nobled q staking validators -oj --limit=3000 | jq '.validators[] | select(.status=="BOND_STATUS_UNBONDED")' | jq -r '(.tokens|tonumber/pow(10; 6)|floor|tostring) + " \t " + .description.moniker' | sort -gr | nl
```

### View Validator Details
```bash
nobled q staking validator $(echo $VALOPER)
```

## Governance

### List All Proposals
```bash
nobled query gov proposals
```

### View Proposal by ID
```bash
nobled query gov proposal 1
```

### Vote Yes
```bash
nobled tx gov vote 1 yes --from wallet --chain-id noble-1 --gas-adjustment 1.5 --gas auto --gas-prices 0.1uusdc -y
```

### Vote No
```bash
nobled tx gov vote 1 no --from wallet --chain-id noble-1 --gas-adjustment 1.5 --gas auto --gas-prices 0.1uusdc -y
```

### Vote Abstain
```bash
nobled tx gov vote 1 abstain --from wallet --chain-id noble-1 --gas-adjustment 1.5 --gas auto --gas-prices 0.1uusdc -y
```

### Vote NoWithVeto
```bash
nobled tx gov vote 1 NoWithVeto --from wallet --chain-id noble-1 --gas-adjustment 1.5 --gas auto --gas-prices 0.1uusdc -y
```

## Maintenance

### Get Validator Info
```bash
nobled status 2>&1 | jq .ValidatorInfo
```

### Get Sync Info
```bash
nobled status 2>&1 | jq .SyncInfo
```

### Get Node Peer
```bash
echo $(echo $(nobled tendermint show-node-id)'@'$(curl -s ifconfig.me)':'$(cat $HOME/.noble/config/config.toml | sed -n '/Address to listen for incoming connection/{n;p;}' | sed 's/.*://; s/".*//')
```

### Check If Validator Key Is Correct
```bash
[[ $(nobled q staking validator $(echo $VALOPER) -oj | jq -r .consensus_pubkey.key) = $(nobled status | jq -r .ValidatorInfo.PubKey.value) ]] && echo -e "\n\e[1m\e[32mTrue\e[0m\n" || echo -e "\n\e[1m\e[31mFalse\e[0m\n"
```

### Get Live Peers
```bash
curl -sS http://localhost:26657/net_info | jq -r '.result.peers[] | "\(.node_info.id)@\(.remote_ip):\(.node_info.listen_addr)"' | awk -F ':' '{print $1":"$(NF)}'
```

### Set Minimum Gas Price
```bash
sed -i -e "s/^minimum-gas-prices *=.*/minimum-gas-prices = \"0.1uusdc\"/" $HOME/.noble/config/app.toml
```

### Enable Prometheus
```bash
sed -i -e "s/prometheus = false/prometheus = true/" $HOME/.noble/config/config.toml
```

### Reset Chain Data
```bash
nobled tendermint unsafe-reset-all --keep-addr-book --home $HOME/.noble --keep-addr-book
```

### Remove Node
⚠️ **Warning**: Make sure you have backed up your priv_validator_key.json!

```bash
cd $HOME
sudo systemctl stop nobled
sudo systemctl disable nobled
sudo rm /etc/systemd/system/nobled.service
sudo systemctl daemon-reload
rm -f $(which nobled)
rm -rf $HOME/.noble
rm -rf $HOME/noble
```

## Useful Commands

### Check Blocks Remaining
```bash
local_height=$(curl -s localhost:26657/status | jq -r .result.sync_info.latest_block_height); network_height=$(curl -s https://noble-rpc.polkachu.com/status | jq -r .result.sync_info.latest_block_height); blocks_left=$((network_height - local_height)); echo "Your node height: $local_height"; echo "Network height: $network_height"; echo "Blocks left: $blocks_left"
```

### Check Your Validator
```bash
nobled query staking validator $(echo $VALOPER)
```

### Check Your Wallet Balance
```bash
nobled query bank balances $(echo $WALLET)
```

### Check Service Logs
```bash
sudo journalctl -u nobled -f --no-hostname -o cat
```

---

*Generated by WinScan - Multi-chain Blockchain Explorer*
