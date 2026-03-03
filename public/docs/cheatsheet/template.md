# {CHAIN_NAME} Cheat Sheet

## Service Management

### Check Logs
```bash
sudo journalctl -u {BINARY}d -f -o cat
```

### Start Service
```bash
sudo systemctl start {BINARY}d
```

### Stop Service
```bash
sudo systemctl stop {BINARY}d
```

### Restart Service
```bash
sudo systemctl restart {BINARY}d
```

### Check Service Status
```bash
sudo systemctl status {BINARY}d
```

## Node Information

### Sync Info
```bash
{BINARY}d status 2>&1 | jq .SyncInfo
```

### Node Info
```bash
{BINARY}d status 2>&1 | jq .NodeInfo
```

### Show Node ID
```bash
{BINARY}d tendermint show-node-id
```

### Show Validator Info
```bash
{BINARY}d status 2>&1 | jq .ValidatorInfo
```

## Key Management

### Add New Key
```bash
{BINARY}d keys add wallet
```

### Recover Existing Key
```bash
{BINARY}d keys add wallet --recover
```

### List All Keys
```bash
{BINARY}d keys list
```

### Delete Key
```bash
{BINARY}d keys delete wallet
```

### Export Key to File
```bash
{BINARY}d keys export wallet
```

### Import Key from File
```bash
{BINARY}d keys import wallet wallet.backup
```

### Query Wallet Balance
```bash
{BINARY}d query bank balances $(echo $WALLET)
```

## Token Management

### Withdraw Rewards from All Validators
```bash
{BINARY}d tx distribution withdraw-all-rewards --from wallet --chain-id {CHAIN_ID} --gas-adjustment 1.5 --gas auto --gas-prices {GAS_PRICE}{DENOM} -y
```

### Withdraw Commission and Rewards from Your Validator
```bash
{BINARY}d tx distribution withdraw-rewards $(echo $VALOPER) --commission --from wallet --chain-id {CHAIN_ID} --gas-adjustment 1.5 --gas auto --gas-prices {GAS_PRICE}{DENOM} -y
```

### Delegate Tokens to Yourself
```bash
{BINARY}d tx staking delegate $(echo $VALOPER) 1000000{DENOM} --from wallet --chain-id {CHAIN_ID} --gas-adjustment 1.5 --gas auto --gas-prices {GAS_PRICE}{DENOM} -y
```

### Delegate Tokens to Validator
```bash
{BINARY}d tx staking delegate <TO_VALOPER_ADDRESS> 1000000{DENOM} --from wallet --chain-id {CHAIN_ID} --gas-adjustment 1.5 --gas auto --gas-prices {GAS_PRICE}{DENOM} -y
```

### Redelegate Tokens to Another Validator
```bash
{BINARY}d tx staking redelegate $(echo $VALOPER) <TO_VALOPER_ADDRESS> 1000000{DENOM} --from wallet --chain-id {CHAIN_ID} --gas-adjustment 1.5 --gas auto --gas-prices {GAS_PRICE}{DENOM} -y
```

### Unbond Tokens from Your Validator
```bash
{BINARY}d tx staking unbond $(echo $VALOPER) 1000000{DENOM} --from wallet --chain-id {CHAIN_ID} --gas-adjustment 1.5 --gas auto --gas-prices {GAS_PRICE}{DENOM} -y
```

### Send Tokens to Wallet
```bash
{BINARY}d tx bank send wallet <TO_WALLET_ADDRESS> 1000000{DENOM} --from wallet --chain-id {CHAIN_ID} --gas-adjustment 1.5 --gas auto --gas-prices {GAS_PRICE}{DENOM} -y
```

## Validator Management

### Create New Validator
```bash
{BINARY}d tx staking create-validator \
--amount 1000000{DENOM} \
--pubkey $({BINARY}d tendermint show-validator) \
--moniker "YOUR_MONIKER_NAME" \
--identity "YOUR_KEYBASE_ID" \
--details "YOUR_DETAILS" \
--website "YOUR_WEBSITE_URL" \
--chain-id {CHAIN_ID} \
--commission-rate 0.05 \
--commission-max-rate 0.20 \
--commission-max-change-rate 0.01 \
--min-self-delegation 1 \
--from wallet \
--gas-adjustment 1.5 \
--gas auto \
--gas-prices {GAS_PRICE}{DENOM} \
-y
```

### Edit Existing Validator
```bash
{BINARY}d tx staking edit-validator \
--new-moniker "YOUR_MONIKER_NAME" \
--identity "YOUR_KEYBASE_ID" \
--details "YOUR_DETAILS" \
--website "YOUR_WEBSITE_URL" \
--chain-id {CHAIN_ID} \
--commission-rate 0.05 \
--from wallet \
--gas-adjustment 1.5 \
--gas auto \
--gas-prices {GAS_PRICE}{DENOM} \
-y
```

### Unjail Validator
```bash
{BINARY}d tx slashing unjail --from wallet --chain-id {CHAIN_ID} --gas-adjustment 1.5 --gas auto --gas-prices {GAS_PRICE}{DENOM} -y
```

### Jail Reason
```bash
{BINARY}d query slashing signing-info $({BINARY}d tendermint show-validator)
```

### List All Active Validators
```bash
{BINARY}d q staking validators -oj --limit=3000 | jq '.validators[] | select(.status=="BOND_STATUS_BONDED")' | jq -r '(.tokens|tonumber/pow(10; 6)|floor|tostring) + " \t " + .description.moniker' | sort -gr | nl
```

### List All Inactive Validators
```bash
{BINARY}d q staking validators -oj --limit=3000 | jq '.validators[] | select(.status=="BOND_STATUS_UNBONDED")' | jq -r '(.tokens|tonumber/pow(10; 6)|floor|tostring) + " \t " + .description.moniker' | sort -gr | nl
```

### View Validator Details
```bash
{BINARY}d q staking validator $(echo $VALOPER)
```

## Governance

### List All Proposals
```bash
{BINARY}d query gov proposals
```

### View Proposal by ID
```bash
{BINARY}d query gov proposal 1
```

### Vote Yes
```bash
{BINARY}d tx gov vote 1 yes --from wallet --chain-id {CHAIN_ID} --gas-adjustment 1.5 --gas auto --gas-prices {GAS_PRICE}{DENOM} -y
```

### Vote No
```bash
{BINARY}d tx gov vote 1 no --from wallet --chain-id {CHAIN_ID} --gas-adjustment 1.5 --gas auto --gas-prices {GAS_PRICE}{DENOM} -y
```

### Vote Abstain
```bash
{BINARY}d tx gov vote 1 abstain --from wallet --chain-id {CHAIN_ID} --gas-adjustment 1.5 --gas auto --gas-prices {GAS_PRICE}{DENOM} -y
```

### Vote NoWithVeto
```bash
{BINARY}d tx gov vote 1 NoWithVeto --from wallet --chain-id {CHAIN_ID} --gas-adjustment 1.5 --gas auto --gas-prices {GAS_PRICE}{DENOM} -y
```

## Maintenance

### Get Validator Info
```bash
{BINARY}d status 2>&1 | jq .ValidatorInfo
```

### Get Sync Info
```bash
{BINARY}d status 2>&1 | jq .SyncInfo
```

### Get Node Peer
```bash
echo $(echo $({BINARY}d tendermint show-node-id)'@'$(curl -s ifconfig.me)':'$(cat $HOME/.{CHAIN_DIR}/config/config.toml | sed -n '/Address to listen for incoming connection/{n;p;}' | sed 's/.*://; s/".*//')
```

### Check If Validator Key Is Correct
```bash
[[ $({BINARY}d q staking validator $(echo $VALOPER) -oj | jq -r .consensus_pubkey.key) = $({BINARY}d status | jq -r .ValidatorInfo.PubKey.value) ]] && echo -e "\n\e[1m\e[32mTrue\e[0m\n" || echo -e "\n\e[1m\e[31mFalse\e[0m\n"
```

### Get Live Peers
```bash
curl -sS http://localhost:{PORT}657/net_info | jq -r '.result.peers[] | "\(.node_info.id)@\(.remote_ip):\(.node_info.listen_addr)"' | awk -F ':' '{print $1":"$(NF)}'
```

### Set Minimum Gas Price
```bash
sed -i -e "s/^minimum-gas-prices *=.*/minimum-gas-prices = \"{GAS_PRICE}{DENOM}\"/" $HOME/.{CHAIN_DIR}/config/app.toml
```

### Enable Prometheus
```bash
sed -i -e "s/prometheus = false/prometheus = true/" $HOME/.{CHAIN_DIR}/config/config.toml
```

### Reset Chain Data
```bash
{BINARY}d tendermint unsafe-reset-all --keep-addr-book --home $HOME/.{CHAIN_DIR} --keep-addr-book
```

### Remove Node
⚠️ **Warning**: Make sure you have backed up your priv_validator_key.json!

```bash
cd $HOME
sudo systemctl stop {BINARY}d
sudo systemctl disable {BINARY}d
sudo rm /etc/systemd/system/{BINARY}d.service
sudo systemctl daemon-reload
rm -f $(which {BINARY}d)
rm -rf $HOME/.{CHAIN_DIR}
rm -rf $HOME/{REPO_NAME}
```

## Useful Commands

### Check Blocks Remaining
```bash
local_height=$(curl -s localhost:{PORT}657/status | jq -r .result.sync_info.latest_block_height); network_height=$(curl -s https://{RPC_URL}/status | jq -r .result.sync_info.latest_block_height); blocks_left=$((network_height - local_height)); echo "Your node height: $local_height"; echo "Network height: $network_height"; echo "Blocks left: $blocks_left"
```

### Check Your Validator
```bash
{BINARY}d query staking validator $(echo $VALOPER)
```

### Check Your Wallet Balance
```bash
{BINARY}d query bank balances $(echo $WALLET)
```

### Check Service Logs
```bash
sudo journalctl -u {BINARY}d -f --no-hostname -o cat
```

---

*Generated by WinScan - Multi-chain Blockchain Explorer*
