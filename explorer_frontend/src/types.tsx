//src/types.ts

export interface User {
  __typename?: string;
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  issuer: string;
  publicAddress: string;
  isMfaEnabled: boolean;
  addressETH: string;
  permissions: string[];
  membershipLevel: string;
  invitedBy?: string;
  inviteCode?: string;
}

export interface RecoveryFactor {
  id: string;
  type: string;
  createdAt: number;
}

export interface BuyBitcoinPurchaseSchema {
  id: string;
  amountAUD: number;
  amountBTC: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  walletAddress: string;
  userEmail: string;
  bsb: string;
  accountNumber: string;
  paymentReference: string;
}
