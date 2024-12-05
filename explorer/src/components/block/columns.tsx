import { BlockDTO } from "@bitcoinbrisbane/block52";
import { ColumnDef } from "@tanstack/react-table";

export const columns: ColumnDef<BlockDTO>[] = [
    {
        accessorKey: "index",
        header: "Index"
    },
    {
        accessorKey: "hash",
        header: "Hash"
    },
    {
        header: "Transactions",
        cell: ({ row }) => {
            return row.original.transactions.length;
        }
    },
    {
        accessorKey: "validator",
        header: "Validator"
    },
    {
        header: "Timestamp",
        cell: ({ row }) => {
            // return row.original.timestamp;
            return new Date(Number(row.original.timestamp)).toLocaleString();
        }
    }
];
