import { Registry } from '@cosmjs/proto-signing';

// Osmosis PoolManager message types
export const osmosisTypes = [
  [
    '/osmosis.poolmanager.v1beta1.MsgSwapExactAmountIn',
    {
      encode: (message: any) => {
        // Encode logic for MsgSwapExactAmountIn
        return new Uint8Array();
      },
      decode: (input: Uint8Array) => {
        // Decode logic
        return {};
      },
    },
  ],
  [
    '/osmosis.poolmanager.v1beta1.MsgSwapExactAmountOut',
    {
      encode: (message: any) => {
        return new Uint8Array();
      },
      decode: (input: Uint8Array) => {
        // Decode logic
        return {};
      },
    },
  ],
];

export async function createOsmosisRegistry(): Promise<Registry> {
  const { defaultRegistryTypes } = await import('@cosmjs/stargate');
  return new Registry([...defaultRegistryTypes, ...osmosisTypes as any]);
}
