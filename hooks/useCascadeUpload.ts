import { useState } from 'react';

export interface CascadeUploadResult {
  success: boolean;
  actionId?: string;
  txHash?: string;
  error?: string;
}

export interface CascadeFile {
  id: string;
  name: string;
  size: number;
  type: string;
  public: boolean;
  status: 'pending' | 'uploading' | 'completed' | 'failed';
  tx_id: string;
  action_id: string;
  price: number;
  fee: number;
  last_modified: string;
}

export function useCascadeUpload(chainId: string, rpcUrl: string) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const uploadFile = async (
    file: File,
    isPublic: boolean = false
  ): Promise<CascadeUploadResult> => {
    setUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      setUploadProgress(10);
      if (!window.keplr) {
        throw new Error('Please install Keplr extension');
      }

      await window.keplr.enable(chainId);
      setUploadProgress(20);
      const key = await window.keplr.getKey(chainId);
      const address = key.bech32Address;
      setUploadProgress(30);
      const fileBuffer = await file.arrayBuffer();
      const fileBytes = new Uint8Array(fileBuffer);
      const base64Data = btoa(String.fromCharCode(...fileBytes));
      setUploadProgress(40);
      const expirationTime = Math.floor(Date.now() / 1000 + 86400 * 1.5); // 1.5 days
      
      const metadata = {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        isPublic,
        expirationTime,
      };
      const msg = {
        type: 'lumera/MsgRequestAction',
        value: {
          creator: address,
          action_type: 'ACTION_TYPE_CASCADE',
          data: base64Data,
          metadata: JSON.stringify(metadata),
        },
      };
      setUploadProgress(50);
      const storageFee = Math.ceil(file.size / 1024) * 100;
      const baseFee = 7519;
      const totalFee = storageFee + baseFee;
      
      const fee = {
        amount: [{ denom: 'ulume', amount: String(totalFee) }],
        gas: '300000',
      };
      setUploadProgress(60);
      const apiUrl = rpcUrl.replace(':26657', ':1317').replace('/rpc', '');
      
      let accountNumber = '0';
      let sequence = '0';
      
      try {
        const accountResponse = await fetch(`${apiUrl}/auth/accounts/${address}`);
        if (accountResponse.ok) {
          const accountData = await accountResponse.json();
          // Handle both Amino and gRPC-gateway formats
          const account = accountData.result?.value || accountData.account?.value || accountData.account;
          accountNumber = account?.account_number || '0';
          sequence = account?.sequence || '0';
        }
      } catch (e) {
        }
      const signDoc = {
        chain_id: chainId,
        account_number: String(accountNumber),
        sequence: String(sequence),
        fee: fee,
        msgs: [msg],
        memo: JSON.stringify(metadata), // Store metadata in memo for retrieval
      };
      setUploadProgress(70);
      const signedTx = await window.keplr.signAmino(chainId, address, signDoc, {});
      setUploadProgress(80);
      
      // Use Amino JSON format for broadcast (Cosmos SDK v0.45+)
      const txBody = {
        tx: signedTx.signed,
        signatures: [signedTx.signature],
        mode: 'sync',
      };
      
      const broadcastResponse = await fetch(`${apiUrl}/txs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(txBody),
      });

      if (!broadcastResponse.ok) {
        const errorText = await broadcastResponse.text();
        console.error('Broadcast error:', errorText);
        throw new Error(`Broadcast failed: ${errorText}`);
      }

      const broadcastResult = await broadcastResponse.json();
      
      // Check for errors in response (Amino format)
      if (broadcastResult.code !== undefined && broadcastResult.code !== 0) {
        throw new Error(broadcastResult.raw_log || broadcastResult.log || 'Transaction failed');
      }

      const txHash = broadcastResult.txhash || broadcastResult.hash;

      if (!txHash) {
        throw new Error('No transaction hash returned');
      }
      setUploadProgress(90);
      
      // Wait for transaction to be indexed
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      let actionId: string | undefined;
      
      try {
        const txResult = await fetch(`${apiUrl}/txs/${txHash}`);
        if (txResult.ok) {
          const txData = await txResult.json();
          
          // Parse action_id from events (Amino format)
          if (txData.events || txData.logs) {
            const events = txData.events || txData.logs?.[0]?.events || [];
            const actionEvent = events.find(
              (e: any) => e.type === 'action_registered' || e.type === 'cascade_action'
            );
            
            if (actionEvent) {
              const actionIdAttr = actionEvent.attributes?.find(
                (attr: any) => attr.key === 'action_id' || attr.key === 'id'
              );
              actionId = actionIdAttr?.value;
            }
          }
        }
      } catch (e) {
        }

      setUploadProgress(100);
      setUploading(false);

      return {
        success: true,
        actionId: actionId || txHash, // Fallback to txHash if no action_id
        txHash,
      };
    } catch (err: any) {
      console.error('Upload error:', err);
      const errorMessage = err.message || 'Upload failed';
      setError(errorMessage);
      setUploading(false);

      return {
        success: false,
        error: errorMessage,
      };
    }
  };

  return {
    uploading,
    uploadProgress,
    error,
    uploadFile,
  };
}
