/**
 * Validator Type Definitions
 */

export interface Validator {
  address: string;
  moniker: string;
  votingPower: string;
  commission: Commission;
  status: ValidatorStatus;
  jailed: boolean;
  uptime?: number;
  identity?: string;
  delegatorsCount?: number;
  consensusPubkey?: any;
  votingPowerChange24h?: string;
}

export interface Commission {
  rate: string;
  maxRate: string;
  maxChangeRate: string;
}

export type ValidatorStatus = 'bonded' | 'unbonded' | 'unbonding';

export interface ChainStats {
  marketCap: string;
  inflation: string;
  apr: string;
  supply: string;
  communityPool: string;
  avgBlockTime: string;
  activeValidators: number;
  totalValidators: number;
  latestBlock: number;
  bondedTokens: string;
  unbondedTokens: string;
}
