// CosmosBlock type for explorer UI
export interface CosmosBlock {
    block_id: {
        hash: string;
    };
    block: {
        header: {
            height: string;
            time: string;
            chain_id: string;
            proposer_address: string;
        };
        data: {
            txs: string[]; // Base64 encoded transactions
        };
    };
}
