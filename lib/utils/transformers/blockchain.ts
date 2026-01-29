/**
 * Blockchain Data Transformers
 */

/**
 * Transform validator data from API response
 */
export function transformValidator(data: any): any {
  return {
    address: data.operator_address || data.address,
    moniker: data.description?.moniker || 'Unknown',
    votingPower: data.tokens || data.votingPower || '0',
    commission: {
      rate: data.commission?.commission_rates?.rate || '0',
      maxRate: data.commission?.commission_rates?.max_rate || '0',
      maxChangeRate: data.commission?.commission_rates?.max_change_rate || '0'
    },
    status: data.status || 'unknown',
    jailed: data.jailed || false,
    identity: data.description?.identity,
    uptime: data.uptime
  };
}

/**
 * Transform block data from API response
 */
export function transformBlock(data: any): any {
  return {
    height: parseInt(data.block?.header?.height || data.height || '0'),
    hash: data.block_id?.hash || data.hash || '',
    time: data.block?.header?.time || data.time || new Date().toISOString(),
    txs: data.block?.data?.txs?.length || data.txs || 0,
    proposer: data.block?.header?.proposer_address || data.proposer || ''
  };
}

/**
 * Transform transaction data from API response
 */
export function transformTransaction(data: any): any {
  return {
    hash: data.txhash || data.hash || '',
    type: data.tx?.body?.messages?.[0]?.['@type']?.split('.').pop() || 'Transaction',
    result: data.code === 0 ? 'Success' : 'Failed',
    fee: data.tx?.auth_info?.fee?.amount?.[0]?.amount || '0',
    height: parseInt(data.height || '0'),
    time: data.timestamp || new Date().toISOString()
  };
}
