

import { useMempoolTransactions } from "@/hooks/useMempoolTransactions";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "@/components/transaction/columns";

export default function MempoolPage() {
    const { transactions, loading, error } = useMempoolTransactions();

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                Loading mempool transactions...
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex justify-center items-center min-h-screen text-red-600">
                Error: {error.message}
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-8">
            <h1 className="text-3xl font-light mb-8">
                Mempool Transactions
            </h1>
            {transactions.length === 0 ? (
                <p className="text-muted-foreground">
                    No transactions in the mempool.
                </p>
            ) : (
                <div className="space-y-6">
                    <DataTable columns={columns} data={transactions} />
                </div>
            )}
        </div>
    );
}
