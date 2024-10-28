"use client"

import { Transaction } from "@/types/types"
import { ColumnDef } from "@tanstack/react-table"

export const columns: ColumnDef<Transaction>[] = [
  {
    accessorKey: "hash",
    header: "Hash",
  },
  {
    accessorKey: "to",
    header: "To",
  },
  {
    accessorKey: "from",
    header: "From",
  },
  {
    accessorKey: "value",
    header: "Value",
  },
  {
    accessorKey: "timestamp",
    header: "Timestamp",
  },
]
