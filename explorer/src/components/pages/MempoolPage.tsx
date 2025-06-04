import { useEffect } from "react";
import { PageLayout } from "../layout/PageLayout";
import { useMempoolContext } from "../../contexts/MempoolContext";
import { columns } from "../transaction/columns";
import { DataTable } from "../ui/data-table";
import { TransactionDTO } from "@bitcoinbrisbane/block52";

export default function MempoolPage() {
    const { 
        transactions, 
        isLoading, 
        error, 
        subscribeToMempool, 
        unsubscribeFromMempool, 
        isConnected 
    } = useMempoolContext();

    // Subscribe to mempool when component mounts
    useEffect(() => {
        subscribeToMempool();

        // Cleanup: unsubscribe when component unmounts
        return () => {
            unsubscribeFromMempool();
        };
    }, [subscribeToMempool, unsubscribeFromMempool]);

    const formatBytes = (bytes: number): string => {
        if (bytes === 0) return "0 B";
        const k = 1024;
        const sizes = ["B", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    const estimateTransactionSize = (tx: TransactionDTO): number => {
        // Rough estimation of transaction size in bytes
        const baseSize = 100; // Base transaction overhead
        const signatureSize = 65; // ECDSA signature
        const addressSize = 20; // Ethereum address
        const dataSize = tx.data ? tx.data.length / 2 : 0; // Convert hex to bytes
        
        return baseSize + signatureSize + (addressSize * 2) + dataSize;
    };

    const totalMempoolSize = transactions.reduce((total, tx) => {
        return total + estimateTransactionSize(tx);
    }, 0);

    return (
        <PageLayout>
            <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 w-full">
                <div className="flex items-center mb-6 sm:mb-8">
                    <h1 className="text-2xl sm:text-3xl font-bold" style={{ 
                        background: "linear-gradient(90deg, #AA01A3, #B405AD, #4D9CF8)", 
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundSize: "200% auto",
                    }}>
                        Mempool
                    </h1>
                    <div className="ml-4 h-px flex-grow" style={{ background: "linear-gradient(90deg, #4D9CF8, transparent)" }}></div>
                </div>

                {/* Connection Status */}
                <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                    <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${
                            isConnected ? 'bg-green-500' : 
                            isLoading ? 'bg-yellow-500' : 'bg-red-500'
                        }`}></div>
                        <span className="text-sm text-gray-400">
                            {isConnected ? 'Connected' : 
                             isLoading ? 'Connecting...' : 'Disconnected'}
                        </span>
                    </div>
                    
                    {error && (
                        <div className="text-red-400 text-sm break-words">
                            Error: {error.message}
                        </div>
                    )}
                </div>

                {/* Mempool Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                    <div className="bg-card border border-border rounded-lg p-4 sm:p-6">
                        <div className="text-xl sm:text-2xl font-bold text-foreground mb-2">
                            {transactions.length}
                        </div>
                        <div className="text-xs sm:text-sm text-muted-foreground">
                            Pending Transactions
                        </div>
                    </div>
                    
                    <div className="bg-card border border-border rounded-lg p-4 sm:p-6">
                        <div className="text-xl sm:text-2xl font-bold text-foreground mb-2">
                            {formatBytes(totalMempoolSize)}
                        </div>
                        <div className="text-xs sm:text-sm text-muted-foreground">
                            Estimated Size
                        </div>
                    </div>
                    
                    <div className="bg-card border border-border rounded-lg p-4 sm:p-6 sm:col-span-2 lg:col-span-1">
                        <div className="text-xl sm:text-2xl font-bold text-foreground mb-2">
                            {transactions.length > 0 ? 
                                Math.round((Date.now() - Number(transactions[0]?.timestamp || 0)) / 1000) : 0}s
                        </div>
                        <div className="text-xs sm:text-sm text-muted-foreground">
                            Oldest Transaction
                        </div>
                    </div>
                </div>

                {/* Loading State */}
                {isLoading && (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="inline-block p-3 mb-8 rounded-full" style={{ background: "linear-gradient(90deg, #AA01A3, #B405AD, #4D9CF8)" }}>
                            <div className="w-16 h-16 flex items-center justify-center bg-[#0C1246] rounded-full">
                                <svg className="animate-spin w-8 h-8 text-[#4D9CF8]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            </div>
                        </div>
                        <h2 className="text-2xl font-bold text-[#F8F5F5] mb-4">Connecting to Mempool...</h2>
                        <p className="text-lg text-[#D9D9D9] text-center max-w-lg">
                            Establishing WebSocket connection to receive real-time mempool updates.
                        </p>
                    </div>
                )}

                {/* Error State */}
                {error && !isLoading && (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="inline-block p-3 mb-8 rounded-full bg-red-500/20">
                            <div className="w-16 h-16 flex items-center justify-center bg-red-500/20 rounded-full">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.08 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                            </div>
                        </div>
                        <h2 className="text-2xl font-bold text-[#F8F5F5] mb-4">Connection Error</h2>
                        <p className="text-lg text-[#D9D9D9] text-center max-w-lg mb-4">
                            Unable to connect to the mempool WebSocket. Please check your connection and try again.
                        </p>
                        <button 
                            onClick={subscribeToMempool}
                            className="px-4 py-2 bg-[#4D9CF8] text-white rounded hover:bg-[#4D9CF8]/80 transition-colors"
                        >
                            Retry Connection
                        </button>
                    </div>
                )}

                {/* Empty State */}
                {!isLoading && !error && isConnected && transactions.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="inline-block p-3 mb-8 rounded-full" style={{ background: "linear-gradient(90deg, #AA01A3, #B405AD, #4D9CF8)" }}>
                            <div className="w-16 h-16 flex items-center justify-center bg-[#0C1246] rounded-full">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-[#4D9CF8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                        </div>
                        <h2 className="text-2xl font-bold text-[#F8F5F5] mb-4">Mempool is Empty</h2>
                        <p className="text-lg text-[#D9D9D9] text-center max-w-lg">
                            No pending transactions in the mempool. New transactions will appear here automatically.
                        </p>
                    </div>
                )}

                {/* Transactions Table */}
                {!isLoading && !error && isConnected && transactions.length > 0 && (
                    <div className="space-y-4">
                        <div className="text-sm text-muted-foreground px-1">
                            Showing {transactions.length} pending transaction{transactions.length !== 1 ? 's' : ''} (real-time updates)
                        </div>
                        <div className="overflow-x-auto border border-border rounded-lg">
                            <DataTable columns={columns} data={transactions} />
                        </div>
                    </div>
                )}
            </div>
        </PageLayout>
    );
}
