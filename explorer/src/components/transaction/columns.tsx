import { TransactionDTO } from "@bitcoinbrisbane/block52"
import { ColumnDef } from "@tanstack/react-table"

export const columns: ColumnDef<TransactionDTO>[] = [
  {
    accessorKey: "hash",
    header: "Hash",
    cell: ({ row }) => {
        // Only show the first 10 characters of the hash
        return `0x${row.original.hash.substring(0, 10)}...`;
    }
  },
  {
    accessorKey: "method",
    header: "Method",
    cell: ({ row }) => {
      return row.original.from ? "Transfer" : "Mint";
    }
  },
  {
    accessorKey: "to",
    header: "To",
    cell: ({ row }) => {
        // Only show the first 10 characters of the hash
        return `0x${row.original.to.substring(0, 10)}...`;
    }
  },
  {
    accessorKey: "from",
    header: "From",
    cell: ({ row }) => {
        // Only show the first 10 characters of the hash
        return row.original.from ? `0x${row.original.from.substring(0, 10)}...` : "";
    }
  },
  {
    accessorKey: "value",
    header: "Value",
  },
  {
    accessorKey: "timestamp",
    header: "Timestamp",
    cell: ({ row }) => {
        return new Date(Number(row.original.timestamp)).toLocaleString();
    }
  },
]
