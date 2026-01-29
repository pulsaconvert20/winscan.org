import { NextRequest, NextResponse } from 'next/server';

interface ChainConfig {
  rest: string;
  denom: string;
}

const CHAIN_CONFIGS: Record<string, ChainConfig> = {
  'lumera-mainnet': {
    rest: 'https://api.lumera.zone',
    denom: 'ulume'
  },
  'osmosis-mainnet': {
    rest: 'https://rest.osmosis.zone',
    denom: 'uosmo'
  },
  'paxi-mainnet': {
    rest: 'https://api.paxi.zone',
    denom: 'upaxi'
  }
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const chain = searchParams.get('chain');
    const address = searchParams.get('address');
    const denom = searchParams.get('denom');

    if (!chain || !address) {
      return NextResponse.json(
        { error: 'Chain and address are required' },
        { status: 400 }
      );
    }

    const chainConfig = CHAIN_CONFIGS[chain];
    if (!chainConfig) {
      return NextResponse.json(
        { error: 'Unsupported chain' },
        { status: 400 }
      );
    }

    const targetDenom = denom || chainConfig.denom;
    
    // Fetch balance from chain REST API
    const balanceUrl = `${chainConfig.rest}/cosmos/bank/v1beta1/balances/${address}/by_denom?denom=${targetDenom}`;
    
    const response = await fetch(balanceUrl, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      // If balance endpoint fails, try the all balances endpoint
      const allBalancesUrl = `${chainConfig.rest}/cosmos/bank/v1beta1/balances/${address}`;
      const allBalancesResponse = await fetch(allBalancesUrl);
      
      if (!allBalancesResponse.ok) {
        return NextResponse.json(
          { balance: '0', denom: targetDenom },
          { status: 200 }
        );
      }

      const allBalancesData = await allBalancesResponse.json();
      const balances = allBalancesData.balances || [];
      const targetBalance = balances.find((b: any) => b.denom === targetDenom);
      
      return NextResponse.json({
        balance: targetBalance?.amount || '0',
        denom: targetDenom,
        chain
      });
    }

    const data = await response.json();
    
    return NextResponse.json({
      balance: data.balance?.amount || '0',
      denom: targetDenom,
      chain
    });

  } catch (error) {
    console.error('Balance fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch balance' },
      { status: 500 }
    );
  }
}