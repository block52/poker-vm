import React from "react";

interface TransactionProps {
  to: string;
  from: string | null;
  value: string;
  signature: string;
  timestamp: string;
  index?: string;
  hash: string;
}

const Transaction: React.FC<TransactionProps> = ({
  to,
  from,
  value,
  signature,
  timestamp,
  index,
  hash,
}) => {
  return (
    <div className="text-left">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">Transaction: {hash}</h3>
      <div className="space-y-2">
        <p className="text-gray-700">
          <span className="font-medium">From:</span> {from || "N/A"}
        </p>
        <p className="text-gray-700">
          <span className="font-medium">To:</span> {to}
        </p>
        <p className="text-gray-700">
          <span className="font-medium">Value:</span> {value}
        </p>
        <p className="text-gray-700">
          <span className="font-medium">Signature:</span> 
          <span className="font-mono text-sm break-all">{signature}</span>
        </p>
        <p className="text-gray-700">
          <span className="font-medium">Timestamp:</span> {new Date(timestamp).toLocaleString()}
        </p>
        {index && (
          <p className="text-gray-700">
            <span className="font-medium">Index:</span> {index}
          </p>
        )}
      </div>
    </div>
  );
};

export default Transaction;
