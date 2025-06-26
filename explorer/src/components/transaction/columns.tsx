import { TransactionDTO } from "@bitcoinbrisbane/block52";
import { ColumnDef } from "@tanstack/react-table";

// Helper component for responsive address display
const AddressCell = ({ address, label }: { address: string; label: string }) => {
    if (!address) return <span className="text-gray-500">-</span>;
    
    // Fix double 0x prefix issue
    const cleanAddress = address.startsWith("0x") ? address : `0x${address}`;
    
    return (
        <div className="font-mono">
            {/* Mobile: Show truncated with label */}
            <div className="sm:hidden">
                <div className="text-xs text-gray-500 mb-1">{label}</div>
                <div className="text-sm break-all">
                    {cleanAddress.substring(0, 10)}...{cleanAddress.substring(cleanAddress.length - 8)}
                </div>
            </div>
            {/* Desktop: Show full address */}
            <div className="hidden sm:block text-sm break-all">
                {cleanAddress}
            </div>
        </div>
    );
};

// Helper component for responsive hash display
const HashCell = ({ hash }: { hash: string }) => {
    if (!hash) return <span className="text-gray-500">-</span>;
    
    const cleanHash = hash.startsWith("0x") ? hash : `0x${hash}`;
    
    return (
        <div className="font-mono">
            {/* Mobile: Show more of the hash */}
            <div className="sm:hidden text-sm break-all">
                {cleanHash.substring(0, 16)}...{cleanHash.substring(cleanHash.length - 6)}
            </div>
            {/* Desktop: Show full hash */}
            <div className="hidden sm:block text-sm break-all">
                {cleanHash}
            </div>
        </div>
    );
};

export const columns: ColumnDef<TransactionDTO>[] = [
    {
        accessorKey: "hash",
        header: "Hash",
        cell: ({ row }) => {
            return <HashCell hash={row.original.hash} />;
        }
    },
    {
        accessorKey: "method",
        header: "Method",
        cell: ({ row }) => {
            const hasData = row.original.data && row.original.data.trim() !== "";
            const hasFrom = row.original.from && row.original.from.trim() !== "";
            
            if (hasData && row.original.data) {
                // Try to extract action from data field (e.g., "call,7" -> "Call")
                const action = row.original.data.split(",")[0];
                return (
                    <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        {action.charAt(0).toUpperCase() + action.slice(1)}
                    </span>
                );
            }
            
            return (
                <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                    {hasFrom ? "Transfer" : "Mint"}
                </span>
            );
        }
    },
    {
        accessorKey: "to",
        header: "To",
        cell: ({ row }) => {
            return <AddressCell address={row.original.to} label="To" />;
        }
    },
    {
        accessorKey: "from",
        header: "From", 
        cell: ({ row }) => {
            return <AddressCell address={row.original.from} label="From" />;
        }
    },
    {
        accessorKey: "value",
        header: "Value",
        cell: ({ row }) => {
            const value = row.original.value || "0";
            const ethValue = parseFloat(value) / Math.pow(10, 18);
            
            return (
                <div>
                    {/* Mobile: Show compact value */}
                    <div className="sm:hidden text-sm">
                        {ethValue === 0 ? "0" : ethValue < 0.0001 ? "<0.0001" : ethValue.toFixed(4)} ETH
                    </div>
                    {/* Desktop: Show full value */}
                    <div className="hidden sm:block">
                        <div className="text-sm font-medium">
                            {ethValue === 0 ? "0" : ethValue < 0.0001 ? "<0.0001" : ethValue.toFixed(6)} ETH
                        </div>
                        <div className="text-xs text-gray-500 font-mono">
                            {value} wei
                        </div>
                    </div>
                </div>
            );
        }
    },
    {
        accessorKey: "data",
        header: "Data",
        cell: ({ row }) => {
            const data = row.original.data;
            if (!data || data.trim() === "") {
                return <span className="text-gray-500 text-sm">-</span>;
            }
            
            return (
                <div className="font-mono">
                    {/* Mobile: Show truncated data */}
                    <div className="sm:hidden text-xs break-all">
                        {data.length > 20 ? `${data.substring(0, 20)}...` : data}
                    </div>
                    {/* Desktop: Show full data */}
                    <div className="hidden sm:block text-sm break-all">
                        {data}
                    </div>
                </div>
            );
        }
    },
    {
        accessorKey: "timestamp",
        header: "Timestamp",
        cell: ({ row }) => {
            const date = new Date(Number(row.original.timestamp));
            
            return (
                <div>
                    {/* Mobile: Show compact time */}
                    <div className="sm:hidden text-sm">
                        {date.toLocaleTimeString()}
                    </div>
                    {/* Desktop: Show full timestamp */}
                    <div className="hidden sm:block text-sm">
                        {date.toLocaleString()}
                    </div>
                </div>
            );
        }
    }
];
