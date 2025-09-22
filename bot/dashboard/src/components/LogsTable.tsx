import React, { useState, useEffect } from "react";
import { BotService } from "../services/botService";
import { ApiError, LogEntry, LogsResponse } from "../types";

const LogsTable: React.FC = () => {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<ApiError | null>(null);
    const [limit, setLimit] = useState<number>(50);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            setError(null);
            const response: LogsResponse = await BotService.getLogs(limit);
            setLogs(response.logs);
        } catch (err) {
            setError(err as ApiError);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [limit]);

    const formatTimestamp = (timestamp: string) => {
        return new Date(timestamp).toLocaleString();
    };

    const getLevelBadgeClass = (level: string) => {
        switch (level.toLowerCase()) {
            case "error":
                return "badge bg-danger";
            case "warn":
                return "badge bg-warning";
            case "info":
                return "badge bg-info";
            case "debug":
                return "badge bg-secondary";
            default:
                return "badge bg-light text-dark";
        }
    };

    const truncateMessage = (message: string, maxLength: number = 100) => {
        return message.length > maxLength ? message.substring(0, maxLength) + "..." : message;
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center p-4">
                <div className="spinner-border" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="alert alert-danger" role="alert">
                <h4 className="alert-heading">Error loading logs</h4>
                <p>{error.message}</p>
                <button className="btn btn-outline-danger" onClick={fetchLogs}>
                    Try Again
                </button>
            </div>
        );
    }

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h2>System Logs</h2>
                <div className="d-flex gap-2">
                    <select className="form-select" style={{ width: "auto" }} value={limit} onChange={e => setLimit(parseInt(e.target.value))}>
                        <option value={25}>25 logs</option>
                        <option value={50}>50 logs</option>
                        <option value={100}>100 logs</option>
                        <option value={200}>200 logs</option>
                    </select>
                    <button className="btn btn-outline-primary" onClick={fetchLogs}>
                        Refresh
                    </button>
                </div>
            </div>

            {logs.length === 0 ? (
                <div className="alert alert-info">No logs found.</div>
            ) : (
                <div className="table-responsive">
                    <table className="table table-striped table-hover">
                        <thead className="table-dark">
                            <tr>
                                <th>Timestamp</th>
                                <th>Level</th>
                                <th>Component</th>
                                <th>Message</th>
                                <th>Game ID</th>
                                <th>User ID</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map((log, index) => (
                                <tr key={index}>
                                    <td>
                                        <small>{formatTimestamp(log.timestamp)}</small>
                                    </td>
                                    <td>
                                        <span className={getLevelBadgeClass(log.level)}>{log.level.toUpperCase()}</span>
                                    </td>
                                    <td>
                                        <span className="badge bg-light text-dark">{log.component || "N/A"}</span>
                                    </td>
                                    <td>
                                        <span title={log.message}>{truncateMessage(log.message)}</span>
                                        {log.data && (
                                            <details className="mt-1">
                                                <summary className="text-muted small" style={{ cursor: "pointer" }}>
                                                    View Data
                                                </summary>
                                                <pre className="small mt-1 p-2 bg-light rounded">{JSON.stringify(log.data, null, 2)}</pre>
                                            </details>
                                        )}
                                    </td>
                                    <td>
                                        <small className="text-muted">{log.gameId || "-"}</small>
                                    </td>
                                    <td>
                                        <small className="text-muted">{log.userId || "-"}</small>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default LogsTable;
