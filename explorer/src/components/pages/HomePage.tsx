import { Link } from "react-router-dom";
import { PageLayout } from "@/components/layout/PageLayout";

export default function HomePage() {
    return (
        <PageLayout>
            <h1 className="text-4xl font-bold mb-8">Blockchain Explorer</h1>
            <nav className="space-y-4">
                <Link
                    to="/mempool"
                    className="block p-4 rounded-lg bg-card hover:bg-muted transition-colors"
                >
                    <h2 className="text-xl font-semibold mb-2">
                        Mempool Transactions
                    </h2>
                    <p className="text-muted-foreground">
                        View pending transactions waiting to be mined
                    </p>
                </Link>
                <Link
                    to="/transactions"
                    className="block p-4 rounded-lg bg-card hover:bg-muted transition-colors"
                >
                    <h2 className="text-xl font-semibold mb-2">
                        Mined Transactions
                    </h2>
                    <p className="text-muted-foreground">
                        View transactions that have been included in blocks
                    </p>
                </Link>
            </nav>
        </PageLayout>
    );
}
