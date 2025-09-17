import { useState, useEffect } from "react";
import type { Bot, ApiError } from "../types";
import { BotService } from "../services/botService";

const BotTable = () => {
    const [bots, setBots] = useState<Bot[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<ApiError | null>(null);

    useEffect(() => {
        const fetchBots = async () => {
            try {
                setLoading(true);
                setError(null);
                const botsData = await BotService.getBots();
                setBots(botsData);
            } catch (err) {
                setError(err as ApiError);
            } finally {
                setLoading(false);
            }
        };

        fetchBots();
    }, []);

    if (loading)
        return (
            <div className="d-flex justify-content-center">
                <div className="spinner-border" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );

    if (error)
        return (
            <div className="alert alert-danger" role="alert">
                Error loading bots: {error.message}
            </div>
        );

    if (!bots || bots.length === 0)
        return (
            <div className="alert alert-info" role="alert">
                No bots found.
            </div>
        );

    return (
        <div className="container mt-4">
            <h2 className="mb-4">Bots Dashboard</h2>
            <div className="table-responsive">
                <table className="table table-striped table-hover">
                    <thead className="table-dark">
                        <tr>
                            <th scope="col">Address</th>
                            <th scope="col">Status</th>
                            <th scope="col">Type</th>
                            <th scope="col">Table Address</th>
                            <th scope="col">Private Key</th>
                        </tr>
                    </thead>
                    <tbody>
                        {bots.map((bot: Bot) => (
                            <tr key={bot.address}>
                                <td>
                                    <code className="text-primary">{bot.address}</code>
                                </td>
                                <td>
                                    <span className={`badge ${bot.enabled ? "bg-success" : "bg-secondary"}`}>{bot.enabled ? "Enabled" : "Disabled"}</span>
                                </td>
                                <td>
                                    <span className="badge bg-info">{bot.type}</span>
                                </td>
                                <td>
                                    <code className="text-muted">{bot.tableAddress}</code>
                                </td>
                                <td>
                                    <code className="text-warning small">{bot.privateKey.substring(0, 10)}...</code>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="mt-3">
                <small className="text-muted">Total bots: {bots.length}</small>
            </div>
        </div>
    );
};

export default BotTable;
