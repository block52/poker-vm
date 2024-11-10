import { useState } from "react"
import { Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

const data = [
  {
    type: "No Limit Texas Hold'em",
    stakes: "1/2",
    address: "0x1234...5678",
  },
  {
    type: "No Limit Texas Hold'em",
    stakes: "2/5",
    address: "0xabcd...efgh",
  },
]

export default function TableDemo() {
  const [address, setAddress] = useState("")
  const [amount, setAmount] = useState("")

  const handleTransfer = () => {
    console.log(`Transferring ${amount} ETH to ${address}`)
    // Here you would typically handle the transfer logic
    setAddress("")
    setAmount("")
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
      <div className="w-full max-w-7xl flex flex-col lg:flex-row gap-6">
        <div className="w-full lg:w-[60%] bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden">
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-200">Games</h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Type</TableHead>
                  <TableHead>Stakes</TableHead>
                  <TableHead>Address</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{item.type}</TableCell>
                    <TableCell>{item.stakes}</TableCell>
                    <TableCell>{item.address}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={2}>Total In Play</TableCell>
                  <TableCell>400,000 USD</TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        </div>

        <Card className="w-full lg:w-[40%]">
          <CardHeader>
            <CardTitle>Transfer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                placeholder="Enter address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (ETH)</Label>
              <Input
                id="amount"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <Button onClick={handleTransfer} className="w-full">Transfer</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}