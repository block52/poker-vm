import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { Wallet } from "./components/wallet/Wallet";
import GamePage from "./components/pages/GamePage";
import HomePage from "./components/pages/HomePage";

import { Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "./components/ui/table";

// import { Input } from "@/components/ui/input"
// import { Button } from "@/components/ui/button"
// import { Label } from "@/components/ui/label"

import "./App.css";
// import { ThemeProvider } from "./components/theme/ThemeProvider";
import TableDemo from "./components/layout/Table";
 
// const data = [
//     {
//         type: "NL Texas Hold'em",
//         stakes: "$1/$2",
//         address: "0x1234...5678"
//     },
//     {
//         type: "NL Texas Hold'em",
//         stakes: "$2/$5",
//         address: "0xabcd...efgh"
//     }
// ];

function App() {
    return (
        // <ThemeProvider defaultTheme="dark" storageKey="b52-ui-theme">
            <Router>
                <TableDemo />
                {/* <div className="App">
                    <div className="banner">
                        <Wallet />
                    </div>
                    <div>
                        <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
                            <div className="w-full max-w-4xl bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden">
                                <div className="p-6">
                                    <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-200">Block 52 Games</h2>
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
                                    </Table>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="content">
                        <Routes>
                            <Route path="/" element={<HomePage />} />
                            <Route path="/game/:gameId" element={<GamePage />} />
                        </Routes>
                    </div>
                </div> */}
            </Router>
        // </ThemeProvider>
    );
}

export default App;
