import { useMinedTransactions } from "@/hooks/useMinedTransactions";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "@/components/transaction/columns";
import { PageLayout } from "../layout/PageLayout";

export default function TransactionsPage() {
    const { transactions, loading, error } = useMinedTransactions();

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                Loading transactions...
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
        <PageLayout>
            <h1 className="text-3xl font-light mb-8">
                Mined Transactions
            </h1>
            {transactions.length === 0 ? (
                <p className="text-muted-foreground">
                    No mined transactions found.
                </p>
            ) : (
                <div className="space-y-6">
                    <DataTable columns={columns} data={transactions} />
                </div>
            )}
        </PageLayout>
    );
}

