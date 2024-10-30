import { useBlocks } from "@/hooks/useBlocks";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "@/components/block/columns";
import { PageLayout } from "../layout/PageLayout";

export default function BlocksPage() {
    const { blocks, loading, error } = useBlocks();

    if (loading) {
        return <div className="flex justify-center items-center min-h-screen">Loading blocks...</div>;
    }

    if (error) {
        return <div className="flex justify-center items-center min-h-screen text-red-600">Error: {error.message}</div>;
    }

    return (
        <PageLayout>
            <h1 className="text-3xl font-light mb-8">Blocks</h1>
            {blocks.length === 0 ? (
                <p className="text-muted-foreground">No blocks found.</p>
            ) : (
                <div className="space-y-6">
                    <DataTable columns={columns} data={blocks} />
                </div>
            )}
        </PageLayout>
    );
}
