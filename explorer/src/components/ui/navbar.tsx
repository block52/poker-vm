import { Link } from "react-router-dom";

export function Navbar() {
    return (
        <nav className="border-b" style={{ 
            background: "linear-gradient(to right, #0C1246, #000000)",
            borderBottomColor: "#4D9CF8" 
        }}>
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between">
                    <Link to="/" className="flex items-center gap-2">
                        <img src="/images/b52-logo.png" alt="B52 Logo" className="h-8" />
                        <span className="text-xl font-semibold text-[#F8F5F5]">Explorer</span>
                    </Link>
                    <div className="flex gap-4">
                        <Link to="/blocks" className="text-[#F8F5F5] hover:text-[#4D9CF8] transition-colors font-medium">
                            Blocks
                        </Link>
                        <Link to="/mempool" className="text-[#F8F5F5] hover:text-[#4D9CF8] transition-colors font-medium">
                            Mempool
                        </Link>
                        <Link to="/transactions" className="text-[#F8F5F5] hover:text-[#4D9CF8] transition-colors font-medium">
                            Transactions
                        </Link>
                    </div>
                </div>
            </div>
        </nav>
    );
}
