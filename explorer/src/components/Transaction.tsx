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
    <div className="transaction">
      <h3>Transaction: {hash}</h3>
      <p>
        <strong>From:</strong> {from || "N/A"}
      </p>
      <p>
        <strong>To:</strong> {to}
      </p>
      <p>
        <strong>Value:</strong> {value}
      </p>
      <p>
        <strong>Signature:</strong> {signature}
      </p>
      <p>
        <strong>Timestamp:</strong> {new Date(timestamp).toLocaleString()}
      </p>
      {index && (
        <p>
          <strong>Index:</strong> {index}
        </p>
      )}
    </div>
  );
};

export default Transaction;
