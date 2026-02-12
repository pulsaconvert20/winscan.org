/**
 * Blockchain Type Definitions
 */

export interface Chain {
  chainName: string;
  chainId: string;
  endpoints: ChainEndpoints;
  assets: Asset[];
  config: ChainConfig;
}

export interface ChainEndpoints {
  api: Endpoint[];
  rpc: Endpoint[];
  evmRpc?: Endpoint[];
  evmWss?: Endpoint[];
}

export interface Endpoint {
  address: string;
  provider: string;
  txIndex?: boolean;
}

export interface Asset {
  base: string;
  symbol: string;
  display: string;
  exponent: number;
  coingeckoId?: string;
  logo: string;
}

export interface ChainConfig {
  sdkVersion: string;
  coinType: string;
  minTxFee: string;
  gasPrice?: string;
  addrPrefix: string;
  bech32Prefix?: string;
  themeColor: string;
  logo: string;
  website?: string;
  github?: string;
  description?: string;
  twitter?: string;
  discord?: string;
  telegram?: string;
}

export interface Block {
  height: number;
  hash: string;
  time: string;
  txs: number;
  proposer: string;
  validator?: ValidatorInfo | null;
}

export interface ValidatorInfo {
  moniker: string;
  identity?: string;
  address: string;
}

export interface Transaction {
  hash: string;
  type: string;
  result: string;
  fee: string;
  height: number;
  time: string;
}
