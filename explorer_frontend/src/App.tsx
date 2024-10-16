import React from "react";
import { ChakraProvider, extendTheme } from "@chakra-ui/react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";






// Define the Bitcoin color
const bitcoinColor = "#f69018";

// Extend the Chakra UI theme to use the Bitcoin color
const theme = extendTheme({
  colors: {
    bitcoin: {
      500: bitcoinColor,
    },
  },
});




const AppContent = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
    </Routes>
  );
};
export const App = () => (
  <Router>
    <ChakraProvider theme={theme}>
      <AppContent />
    </ChakraProvider>
  </Router>
);