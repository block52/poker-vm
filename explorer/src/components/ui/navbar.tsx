import { Link } from "react-router-dom";

export function Navbar() {
    return (
        <nav className="border-b">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between">
                    <Link to="/" className="text-xl font-semibold">
                        Explorer
                    </Link>
                    <div className="flex gap-4">
                        <Link 
                            to="/mempool" 
                            className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                            Mempool
                        </Link>
                    </div>
                </div>
            </div>
        </nav>
    );
}