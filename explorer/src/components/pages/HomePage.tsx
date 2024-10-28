import { Link } from "react-router-dom";

export default function HomePage() {
    return (
        <div className="max-w-4xl mx-auto p-8">
            <h1 className="text-4xl font-bold mb-8">Blockchain Explorer</h1>
            <nav className="space-y-4">
                <Link 
                    to="/mempool" 
                    className="block p-4 rounded-lg bg-card hover:bg-muted transition-colors"
                >
                    <h2 className="text-xl font-semibold mb-2">Mempool Transactions</h2>
                    <p className="text-muted-foreground">
                        View pending transactions waiting to be included in blocks
                    </p>
                </Link>
                {/* Add more navigation links here as needed */}
            </nav>
        </div>
    );
}
