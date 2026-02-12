/**
 * Create an authz MsgGrant for auto-compound using proper protobuf encoding
 * This uses `cosmjs-types` to encode a `StakeAuthorization` and packs it into
 * the Any.value as bytes. This replaces the fragile manual buffer approach.
 */
import { StakeAuthorization as StakeAuthorizationType } from 'cosmjs-types/cosmos/staking/v1beta1/authz';
import { GenericAuthorization } from 'cosmjs-types/cosmos/authz/v1beta1/authz';
import { MsgGrant } from 'cosmjs-types/cosmos/authz/v1beta1/tx';

export function createSimpleAutoCompoundGrant(
  delegatorAddress: string,
  grantee: string,
  validatorAddress: string,
  durationSeconds: number
) {
  const expirationTimestamp = {
    seconds: BigInt(Math.floor(Date.now() / 1000) + durationSeconds),
    nanos: 0,
  };

  const grants: any[] = [];
  const stakeAuthPayload: any = {
    allowList: {
      address: [validatorAddress],
    },
    authorizationType: 1, // 1 = DELEGATE
  };
  const stakeEncoded = StakeAuthorizationType.encode(StakeAuthorizationType.fromPartial(stakeAuthPayload)).finish();

  const grantMsg1 = MsgGrant.fromPartial({
    granter: delegatorAddress,
    grantee: grantee,
    grant: {
      authorization: {
        typeUrl: '/cosmos.staking.v1beta1.StakeAuthorization',
        value: stakeEncoded,
      },
      expiration: expirationTimestamp,
    },
  });

  grants.push({
    typeUrl: '/cosmos.authz.v1beta1.MsgGrant',
    value: grantMsg1,
  });
  const withdrawRewardAuthPayload = {
    msg: '/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward',
  };
  const withdrawRewardEncoded = GenericAuthorization.encode(GenericAuthorization.fromPartial(withdrawRewardAuthPayload)).finish();

  const grantMsg2 = MsgGrant.fromPartial({
    granter: delegatorAddress,
    grantee: grantee,
    grant: {
      authorization: {
        typeUrl: '/cosmos.authz.v1beta1.GenericAuthorization',
        value: withdrawRewardEncoded,
      },
      expiration: expirationTimestamp,
    },
  });

  grants.push({
    typeUrl: '/cosmos.authz.v1beta1.MsgGrant',
    value: grantMsg2,
  });

  return grants;
}

/**
 * Create multiple grants for auto-compound with optional vote and commission permissions
 * Used when granter is a validator
 */
export function createAutoCompoundGrantsWithPermissions(
  delegatorAddress: string,
  grantee: string,
  validatorAddress: string,
  durationSeconds: number,
  options: {
    includeVote?: boolean;
    includeCommission?: boolean;
  } = {}
) {
  const expirationTimestamp = {
    seconds: BigInt(Math.floor(Date.now() / 1000) + durationSeconds),
    nanos: 0,
  };

  const grants: any[] = [];
  const stakeAuthPayload: any = {
    allowList: {
      address: [validatorAddress],
    },
    authorizationType: 1, // 1 = DELEGATE
  };
  const stakeEncoded = StakeAuthorizationType.encode(StakeAuthorizationType.fromPartial(stakeAuthPayload)).finish();
  
  const grantMsg1 = MsgGrant.fromPartial({
    granter: delegatorAddress,
    grantee: grantee,
    grant: {
      authorization: {
        typeUrl: '/cosmos.staking.v1beta1.StakeAuthorization',
        value: stakeEncoded,
      },
      expiration: expirationTimestamp,
    },
  });

  grants.push({
    typeUrl: '/cosmos.authz.v1beta1.MsgGrant',
    value: grantMsg1,
  });
  const withdrawRewardAuthPayload = {
    msg: '/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward',
  };
  const withdrawRewardEncoded = GenericAuthorization.encode(GenericAuthorization.fromPartial(withdrawRewardAuthPayload)).finish();
  
  const grantMsg2 = MsgGrant.fromPartial({
    granter: delegatorAddress,
    grantee: grantee,
    grant: {
      authorization: {
        typeUrl: '/cosmos.authz.v1beta1.GenericAuthorization',
        value: withdrawRewardEncoded,
      },
      expiration: expirationTimestamp,
    },
  });

  grants.push({
    typeUrl: '/cosmos.authz.v1beta1.MsgGrant',
    value: grantMsg2,
  });
  if (options.includeVote) {
    const voteAuthPayload = {
      msg: '/cosmos.gov.v1beta1.MsgVote',
    };
    const voteEncoded = GenericAuthorization.encode(GenericAuthorization.fromPartial(voteAuthPayload)).finish();
    
    const grantMsg3 = MsgGrant.fromPartial({
      granter: delegatorAddress,
      grantee: grantee,
      grant: {
        authorization: {
          typeUrl: '/cosmos.authz.v1beta1.GenericAuthorization',
          value: voteEncoded,
        },
        expiration: expirationTimestamp,
      },
    });

    grants.push({
      typeUrl: '/cosmos.authz.v1beta1.MsgGrant',
      value: grantMsg3,
    });
  }
  if (options.includeCommission) {
    const commissionAuthPayload = {
      msg: '/cosmos.distribution.v1beta1.MsgWithdrawValidatorCommission',
    };
    const commissionEncoded = GenericAuthorization.encode(GenericAuthorization.fromPartial(commissionAuthPayload)).finish();
    
    const grantMsg4 = MsgGrant.fromPartial({
      granter: delegatorAddress,
      grantee: grantee,
      grant: {
        authorization: {
          typeUrl: '/cosmos.authz.v1beta1.GenericAuthorization',
          value: commissionEncoded,
        },
        expiration: expirationTimestamp,
      },
    });

    grants.push({
      typeUrl: '/cosmos.authz.v1beta1.MsgGrant',
      value: grantMsg4,
    });
  }

  return grants;
}
