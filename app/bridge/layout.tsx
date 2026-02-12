import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'LUME ↔ OSMO Bridge | WinScan',
  description: 'Bridge tokens between Lumera and Osmosis networks using IBC transfers',
  keywords: 'bridge, IBC, LUME, OSMO, Lumera, Osmosis, cross-chain, transfer',
  openGraph: {
    title: 'LUME ↔ OSMO Bridge | WinScan',
    description: 'Bridge tokens between Lumera and Osmosis networks using IBC transfers',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LUME ↔ OSMO Bridge | WinScan',
    description: 'Bridge tokens between Lumera and Osmosis networks using IBC transfers',
  },
};

interface Props {
  children: React.ReactNode;
}

export default function BridgeLayout({ children }: Props) {
  return <>{children}</>;
}