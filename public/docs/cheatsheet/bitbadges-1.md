# BitBadges Cheat Sheet

## Service Management

### Check Logs
```bash
sudo journalctl -u bitbadges-1d -f -o cat
```

### Start Service
```bash
sudo systemctl start bitbadges-1d
```

### Stop Service
```bash
sudo systemctl stop bitbadges-1d
```

### Restart Service
```bash
sudo systemctl restart bitbadges-1d
```

### Check Service Status
```bash
sudo systemctl status bitbadges-1d
```

## Node Information

### Sync Info
```bash
bitbadges-1d status 2>&1 | jq .SyncInfo
```

### Node Info
```bash
bitbadges-1d status 2>&1 | jq .NodeInfo
```

### Show Node ID
```bash
bitbadges-1d tendermint show-node-id
```

### Show Validator Info
```bash
bitbadges-1d status 2>&1 | jq .ValidatorInfo
```

## Key Management

### Add New Key
```bash
bitbadges-1d keys add wallet
```

### Recover Existing Key
```bash
bitbadges-1d keys add wallet --recover
```

### List All Keys
```bash
bitbadges-1d keys list
```

### Delete Key
```bash
bitbadges-1d keys delete wallet
```

### Export Key to File
```bash
bitbadges-1d keys export wallet
```

### Import Key from File
```bash
bitbadges-1d keys import wallet wallet.backup
```

### Query Wallet Balance
```bash
bitbadges-1d query bank balances $(echo $WALLET)
```

## Token Management

### Withdraw Rewards from All Validators
```bash
bitbadges-1d tx distribution withdraw-all-rewards --from wallet --chain-id bitbadges-1 --gas-adjustment 1.5 --gas auto --gas-prices 0.00025ubadge -y
```

### Withdraw Commission and Rewards from Your Validator
```bash
bitbadges-1d tx distribution withdraw-rewards $(echo $VALOPER) --commission --from wallet --chain-id bitbadges-1 --gas-adjustment 1.5 --gas auto --gas-prices 0.00025ubadge -y
```

### Delegate Tokens to Yourself
```bash
bitbadges-1d tx staking delegate $(echo $VALOPER) 1000000ubadge --from wallet --chain-id bitbadges-1 --gas-adjustment 1.5 --gas auto --gas-prices 0.00025ubadge -y
```

### Delegate Tokens to Validator
```bash
bitbadges-1d tx staking delegate <TO_VALOPER_ADDRESS> 1000000ubadge --from wallet --chain-id bitbadges-1 --gas-adjustment 1.5 --gas auto --gas-prices 0.00025ubadge -y
```

### Redelegate Tokens to Another Validator
```bash
bitbadges-1d tx staking redelegate $(echo $VALOPER) <TO_VALOPER_ADDRESS> 1000000ubadge --from wallet --chain-id bitbadges-1 --gas-adjustment 1.5 --gas auto --gas-prices 0.00025ubadge -y
```

### Unbond Tokens from Your Validator
```bash
bitbadges-1d tx staking unbond $(echo $VALOPER) 1000000ubadge --from wallet --chain-id bitbadges-1 --gas-adjustment 1.5 --gas auto --gas-prices 0.00025ubadge -y
```

### Send Tokens to Wallet
```bash
bitbadges-1d tx bank send wallet <TO_WALLET_ADDRESS> 1000000ubadge --from wallet --chain-id bitbadges-1 --gas-adjustment 1.5 --gas auto --gas-prices 0.00025ubadge -y
```

## Validator Management

### Create New Validator
```bash
bitbadges-1d tx staking create-validator \
--amount 1000000ubadge \
--pubkey $(bitbadges-1d tendermint show-validator) \
--moniker "YOUR_MONIKER_NAME" \
--identity "YOUR_KEYBASE_ID" \
--details "YOUR_DETAILS" \
--website "YOUR_WEBSITE_URL" \
--chain-id bitbadges-1 \
--commission-rate 0.05 \
--commission-max-rate 0.20 \
--commission-max-change-rate 0.01 \
--min-self-delegation 1 \
--from wallet \
--gas-adjustment 1.5 \
--gas auto \
--gas-prices 0.00025ubadge \
-y
```

### Edit Existing Validator
```bash
bitbadges-1d tx staking edit-validator \
--new-moniker "YOUR_MONIKER_NAME" \
--identity "YOUR_KEYBASE_ID" \
--details "YOUR_DETAILS" \
--website "YOUR_WEBSITE_URL" \
--chain-id bitbadges-1 \
--commission-rate 0.05 \
--from wallet \
--gas-adjustment 1.5 \
--gas auto \
--gas-prices 0.00025ubadge \
-y
```

### Unjail Validator
```bash
bitbadges-1d tx slashing unjail --from wallet --chain-id bitbadges-1 --gas-adjustment 1.5 --gas auto --gas-prices 0.00025ubadge -y
```

### Jail Reason
```bash
bitbadges-1d query slashing signing-info $(bitbadges-1d tendermint show-validator)
```

### List All Active Validators
```bash
bitbadges-1d q staking validators -oj --limit=3000 | jq '.validators[] | select(.status=="BOND_STATUS_BONDED")' | jq -r '(.tokens|tonumber/pow(10; 6)|floor|tostring) + " \t " + .description.moniker' | sort -gr | nl
```

### List All Inactive Validators
```bash
bitbadges-1d q staking validators -oj --limit=3000 | jq '.validators[] | select(.status=="BOND_STATUS_UNBONDED")' | jq -r '(.tokens|tonumber/pow(10; 6)|floor|tostring) + " \t " + .description.moniker' | sort -gr | nl
```

### View Validator Details
```bash
bitbadges-1d q staking validator $(echo $VALOPER)
```

## Governance

### List All Proposals
```bash
bitbadges-1d query gov proposals
```

### View Proposal by ID
```bash
bitbadges-1d query gov proposal 1
```

### Vote Yes
```bash
bitbadges-1d tx gov vote 1 yes --from wallet --chain-id bitbadges-1 --gas-adjustment 1.5 --gas auto --gas-prices 0.00025ubadge -y
```

### Vote No
```bash
bitbadges-1d tx gov vote 1 no --from wallet --chain-id bitbadges-1 --gas-adjustment 1.5 --gas auto --gas-prices 0.00025ubadge -y
```

### Vote Abstain
```bash
bitbadges-1d tx gov vote 1 abstain --from wallet --chain-id bitbadges-1 --gas-adjustment 1.5 --gas auto --gas-prices 0.00025ubadge -y
```

### Vote NoWithVeto
```bash
bitbadges-1d tx gov vote 1 NoWithVeto --from wallet --chain-id bitbadges-1 --gas-adjustment 1.5 --gas auto --gas-prices 0.00025ubadge -y
```

## Maintenance

### Get Validator Info
```bash
bitbadges-1d status 2>&1 | jq .ValidatorInfo
```

### Get Sync Info
```bash
bitbadges-1d status 2>&1 | jq .SyncInfo
```

### Get Node Peer
```bash
echo $(echo $(bitbadges-1d tendermint show-node-id)'@'$(curl -s ifconfig.me)':'$(cat $HOME/.bitbadges-1/config/config.toml | sed -n '/Address to listen for incoming connection/{n;p;}' | sed 's/.*://; s/".*//')
```

### Check If Validator Key Is Correct
```bash
[[ $(bitbadges-1d q staking validator $(echo $VALOPER) -oj | jq -r .consensus_pubkey.key) = $(bitbadges-1d status | jq -r .ValidatorInfo.PubKey.value) ]] && echo -e "\n\e[1m\e[32mTrue\e[0m\n" || echo -e "\n\e[1m\e[31mFalse\e[0m\n"
```

### Get Live Peers
```bash
curl -sS http://localhost:26657/net_info | jq -r '.result.peers[] | "\(.node_info.id)@\(.remote_ip):\(.node_info.listen_addr)"' | awk -F ':' '{print $1":"$(NF)}'
```

### Set Minimum Gas Price
```bash
sed -i -e "s/^minimum-gas-prices *=.*/minimum-gas-prices = \"0.00025ubadge\"/" $HOME/.bitbadges-1/config/app.toml
```

### Enable Prometheus
```bash
sed -i -e "s/prometheus = false/prometheus = true/" $HOME/.bitbadges-1/config/config.toml
```

### Reset Chain Data
```bash
bitbadges-1d tendermint unsafe-reset-all --keep-addr-book --home $HOME/.bitbadges-1 --keep-addr-book
```

### Remove Node
⚠️ **Warning**: Make sure you have backed up your priv_validator_key.json!

```bash
cd $HOME
sudo systemctl stop bitbadges-1d
sudo systemctl disable bitbadges-1d
sudo rm /etc/systemd/system/bitbadges-1d.service
sudo systemctl daemon-reload
rm -f $(which bitbadges-1d)
rm -rf $HOME/.bitbadges-1
rm -rf $HOME/bitbadges-1
```

## Useful Commands

### Check Blocks Remaining
```bash
local_height=$(curl -s localhost:26657/status | jq -r .result.sync_info.latest_block_height); network_height=$(curl -s https://rpc.bitbadges.io/status | jq -r .result.sync_info.latest_block_height); blocks_left=$((network_height - local_height)); echo "Your node height: $local_height"; echo "Network height: $network_height"; echo "Blocks left: $blocks_left"
```

### Check Your Validator
```bash
bitbadges-1d query staking validator $(echo $VALOPER)
```

### Check Your Wallet Balance
```bash
bitbadges-1d query bank balances $(echo $WALLET)
```

### Check Service Logs
```bash
sudo journalctl -u bitbadges-1d -f --no-hostname -o cat
```

---

*Generated by WinScan - Multi-chain Blockchain Explorer*
