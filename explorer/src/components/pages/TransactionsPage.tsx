import { PageLayout } from "../layout/PageLayout";

export default function TransactionsPage() {
    return (
        <PageLayout>
            <div className="max-w-6xl mx-auto p-8 w-full">
                <div className="flex items-center mb-8">
                    <h1 className="text-3xl font-bold" style={{ 
                        background: "linear-gradient(90deg, #AA01A3, #B405AD, #4D9CF8)", 
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundSize: "200% auto",
                    }}>
                        Transactions
                    </h1>
                    <div className="ml-4 h-px flex-grow" style={{ background: "linear-gradient(90deg, #4D9CF8, transparent)" }}></div>
                </div>
                
                <div className="flex flex-col items-center justify-center py-20">
                    <div className="inline-block p-3 mb-8 rounded-full" style={{ background: "linear-gradient(90deg, #AA01A3, #B405AD, #4D9CF8)" }}>
                        <div className="w-16 h-16 flex items-center justify-center bg-[#0C1246] rounded-full">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-[#4D9CF8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </div>
                    </div>
                    <h2 className="text-3xl font-bold text-[#F8F5F5] mb-4">Coming Soon</h2>
                    <p className="text-xl text-[#D9D9D9] text-center max-w-lg">
                        The Transactions page is currently under development. Check back soon for a comprehensive list of all transactions on the network.
                    </p>
                </div>
            </div>
        </PageLayout>
    );
}

