import { Block, Transaction } from "../models";
import { BlockchainManagement, getBlockchainInstance } from "../state/blockchainManagement";
import { getTransactionInstance, TransactionManagement } from "../state/transactionManagement";
import { signResult } from "./abstractSignedCommand";
import { ISignedCommand, ISignedResponse } from "./interfaces";

export type BlockCommandParams = {
  index?: BigInt;
  hash?: string;
};

export class BlockCommand implements ISignedCommand<Block> {
  private readonly blockchainManagement: BlockchainManagement;
  private readonly transactionManagement: TransactionManagement;
  private readonly params: BlockCommandParams;

  constructor(params: BlockCommandParams, private readonly privateKey: string) {
    this.blockchainManagement = getBlockchainInstance();
    this.transactionManagement = getTransactionInstance();
    this.params = params;
  }

  public async execute(): Promise<ISignedResponse<Block>> {
    // TODO: REGEX to validate hash
    if (this.params.hash) {
      const block: Block = await this.blockchainManagement.getBlockByHash(this.params.hash);

      const transactions = await this.getTransactions(block.hash);
      block.transactions.push(...transactions);

      return signResult(block, this.privateKey);
    }

    if (!this.params.index) {
      return signResult(await this.blockchainManagement.getLastBlock(), this.privateKey);
    }

    if (this.params.index === BigInt(0)) {
      return signResult(await this.blockchainManagement.getGenesisBlock(), this.privateKey);
    }

    if (this.params.index) {
      const block: Block = await this.blockchainManagement.getBlock(Number(this.params.index));

      const transactions = await this.getTransactions(block.hash);
      block.transactions.push(...transactions);
      
      return signResult(block, this.privateKey);
    }

    return signResult(await this.blockchainManagement.getLastBlock(), this.privateKey);
  }

  private async getTransactions(hash: string): Promise<Transaction[]> {
    return await this.transactionManagement.getTransactions(hash);
  }
}
