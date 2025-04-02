import { Link } from "react-router-dom";

export function Footer() {
    return (
        <footer className="border-t" style={{ 
            background: "linear-gradient(to right, #0C1246, #000000)",
            borderTopColor: "#4D9CF8" 
        }}>
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between">
                    <div className="flex items-center">
                        <img src="/images/b52-logo.png" alt="B52 Logo" className="h-6" />
                    </div>
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
                    <div className="text-[#D9D9D9] text-sm">
                        &copy; {new Date().getFullYear()} B52 Explorer
                    </div>
                </div>
            </div>
        </footer>
    );
} 