import { useState, useEffect } from "react";
import type { Bot, ApiError } from "../types";
import { BotService } from "../services/botService";

const BotTable = () => {
    const [bots, setBots] = useState<Bot[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<ApiError | null>(null);
    const [updatingBots, setUpdatingBots] = useState<Set<string>>(new Set());
    const [showModal, setShowModal] = useState<boolean>(false);
    const [selectedBot, setSelectedBot] = useState<Bot | null>(null);
    const [formData, setFormData] = useState({ tableAddress: "", type: "", enabled: false });
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [createForm, setCreateForm] = useState({ address: "", privateKey: "", tableAddress: "", type: "random", enabled: false });
    const [creating, setCreating] = useState(false);
    const [createError, setCreateError] = useState<ApiError | null>(null);
    const openCreateModal = () => {
        setCreateForm({ address: "", privateKey: "", tableAddress: "", type: "random", enabled: false });
        setCreateError(null);
        setShowCreateModal(true);
    };

    const closeCreateModal = () => {
        setShowCreateModal(false);
        setCreateError(null);
    };

    const handleCreateFormChange = (field: string, value: string | boolean) => {
        setCreateForm(prev => ({ ...prev, [field]: value }));
    };

    const saveNewBot = async () => {
        setCreating(true);
        setCreateError(null);
        try {
            // POST to API
            await BotService.createBot(createForm);
            // Refresh bots
            const botsData = await BotService.getBots();
            setBots(botsData);
            closeCreateModal();
        } catch (err) {
            setCreateError(err as ApiError);
        } finally {
            setCreating(false);
        }
    };

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

    const toggleBotStatus = async (address: string, currentStatus: boolean) => {
        try {
            setUpdatingBots(prev => new Set(prev).add(address));
            setError(null);

            await BotService.updateBotStatus(address, !currentStatus);

            // Update the local state
            setBots(prevBots => prevBots.map(bot => (bot.address === address ? { ...bot, enabled: !currentStatus } : bot)));
        } catch (err) {
            setError(err as ApiError);
        } finally {
            setUpdatingBots(prev => {
                const newSet = new Set(prev);
                newSet.delete(address);
                return newSet;
            });
        }
    };

    const openModal = (bot: Bot) => {
        setSelectedBot(bot);
        setFormData({
            tableAddress: bot.tableAddress,
            type: bot.type,
            enabled: bot.enabled
        });
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setSelectedBot(null);
        setFormData({ tableAddress: "", type: "", enabled: false });
    };

    const handleFormChange = (field: string, value: string | boolean) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const saveChanges = async () => {
        if (!selectedBot) return;

        try {
            setUpdatingBots(prev => new Set(prev).add(selectedBot.address));
            setError(null);

            // Update table address if changed
            if (formData.tableAddress !== selectedBot.tableAddress) {
                await BotService.updateTableAddress(selectedBot.address, formData.tableAddress);
            }

            // Update type if changed (you'll need to add this method to BotService)
            if (formData.type !== selectedBot.type) {
                await BotService.updateBotType(selectedBot.address, formData.type);
            }

            // Update enabled status if changed
            if (formData.enabled !== selectedBot.enabled) {
                await BotService.updateBotStatus(selectedBot.address, formData.enabled);
            }

            // Update local state
            setBots(prevBots =>
                prevBots.map(bot =>
                    bot.address === selectedBot.address ? { ...bot, tableAddress: formData.tableAddress, type: formData.type, enabled: formData.enabled } : bot
                )
            );

            closeModal();
        } catch (err) {
            setError(err as ApiError);
        } finally {
            setUpdatingBots(prev => {
                const newSet = new Set(prev);
                newSet.delete(selectedBot.address);
                return newSet;
            });
        }
    };

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

    return (
        <div className="container mt-4">
            {(!bots || bots.length === 0) && (
                <div className="alert alert-info" role="alert">
                    No bots found.
                </div>
            )}
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h2>Bots Dashboard</h2>
                <button className="btn btn-success" onClick={openCreateModal}>
                    + Create Bot
                </button>
            </div>
            <div className="table-responsive">
                {/* Modal for creating a new bot */}
                {showCreateModal && (
                    <div className="modal fade show" style={{ display: "block" }} aria-labelledby="createBotModal" aria-hidden="true">
                        <div className="modal-dialog">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h5 className="modal-title" id="createBotModal">
                                        Create New Bot
                                    </h5>
                                    <button type="button" className="btn-close" onClick={closeCreateModal} aria-label="Close"></button>
                                </div>
                                <div className="modal-body">
                                    {createError && <div className="alert alert-danger">{createError.message}</div>}
                                    <form>
                                        <div className="mb-3">
                                            <label htmlFor="address" className="form-label">
                                                Address
                                            </label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                id="address"
                                                value={createForm.address}
                                                onChange={e => handleCreateFormChange("address", e.target.value)}
                                            />
                                        </div>
                                        <div className="mb-3">
                                            <label htmlFor="privateKey" className="form-label">
                                                Private Key
                                            </label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                id="privateKey"
                                                value={createForm.privateKey}
                                                onChange={e => handleCreateFormChange("privateKey", e.target.value)}
                                            />
                                        </div>
                                        <div className="mb-3">
                                            <label htmlFor="tableAddress" className="form-label">
                                                Table Address
                                            </label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                id="tableAddress"
                                                value={createForm.tableAddress}
                                                onChange={e => handleCreateFormChange("tableAddress", e.target.value)}
                                            />
                                        </div>
                                        <div className="mb-3">
                                            <label htmlFor="type" className="form-label">
                                                Type
                                            </label>
                                            <select
                                                className="form-select"
                                                id="type"
                                                value={createForm.type}
                                                onChange={e => handleCreateFormChange("type", e.target.value)}
                                            >
                                                <option value="random">Random</option>
                                                <option value="raiseOrCall">Raise or Call</option>
                                                <option value="aggressive">Aggressive</option>
                                                <option value="conservative">Conservative</option>
                                            </select>
                                        </div>
                                        <div className="mb-3">
                                            <div className="form-check form-switch">
                                                <input
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    id="enabledCreate"
                                                    checked={createForm.enabled}
                                                    onChange={e => handleCreateFormChange("enabled", e.target.checked)}
                                                />
                                                <label className="form-check-label" htmlFor="enabledCreate">
                                                    {createForm.enabled ? "Enabled" : "Disabled"}
                                                </label>
                                            </div>
                                        </div>
                                    </form>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={closeCreateModal} disabled={creating}>
                                        Cancel
                                    </button>
                                    <button type="button" className="btn btn-primary" onClick={saveNewBot} disabled={creating}>
                                        {creating ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>Saving...
                                            </>
                                        ) : (
                                            "Save"
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                {showCreateModal && <div className="modal-backdrop fade show"></div>}
                <table className="table table-striped table-hover">
                    <thead className="table-dark">
                        <tr>
                            <th scope="col">Address</th>
                            <th scope="col">Status</th>
                            <th scope="col">Type</th>
                            <th scope="col">Table Address</th>
                            <th scope="col">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {bots && bots.map((bot: Bot) => (
                            <tr key={bot.address}>
                                <td>
                                    <code className="text-primary">{bot.address}</code>
                                </td>
                                <td>
                                    <button
                                        className={`btn btn-sm ${bot.enabled ? "btn-success" : "btn-secondary"}`}
                                        onClick={() => toggleBotStatus(bot.address, bot.enabled)}
                                        disabled={updatingBots.has(bot.address)}
                                    >
                                        {updatingBots.has(bot.address) ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                                Updating...
                                            </>
                                        ) : bot.enabled ? (
                                            "Enabled"
                                        ) : (
                                            "Disabled"
                                        )}
                                    </button>
                                </td>
                                <td>
                                    <span className="badge bg-info">{bot.type}</span>
                                </td>
                                <td>
                                    <code className="text-muted">{bot.tableAddress}</code>
                                </td>
                                <td>
                                    <button className="btn btn-sm btn-outline-primary" onClick={() => openModal(bot)} disabled={updatingBots.has(bot.address)}>
                                        Modify
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="mt-3">
                <small className="text-muted">Total bots: {bots.length}</small>
            </div>

            {/* Modal for editing bot */}
            {showModal && (
                <div className="modal fade show" style={{ display: "block" }} aria-labelledby="editBotModal" aria-hidden="true">
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title" id="editBotModal">
                                    Edit Bot: {selectedBot?.address}
                                </h5>
                                <button type="button" className="btn-close" onClick={closeModal} aria-label="Close"></button>
                            </div>
                            <div className="modal-body">
                                <form>
                                    <div className="mb-3">
                                        <label htmlFor="tableAddress" className="form-label">
                                            Table Address
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="tableAddress"
                                            value={formData.tableAddress}
                                            onChange={e => handleFormChange("tableAddress", e.target.value)}
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label htmlFor="type" className="form-label">
                                            Type
                                        </label>
                                        <select
                                            className="form-select"
                                            id="type"
                                            value={formData.type}
                                            onChange={e => handleFormChange("type", e.target.value)}
                                        >
                                            <option value="random">Random</option>
                                            <option value="raiseOrCall">Raise or Call</option>
                                            <option value="aggressive">Aggressive</option>
                                            <option value="conservative">Conservative</option>
                                        </select>
                                        <select
                                            className="form-select"
                                            id="type"
                                            value={formData.type}
                                            onChange={e => handleFormChange("type", e.target.value)}
                                        >
                                            <option value="check">Check</option>
                                            <option value="raiseOrCall">Raise or Call</option>
                                            <option value="random">Random</option>
                                        </select>
                                        <select
                                            className="form-select"
                                            id="type"
                                            value={createForm.type}
                                            onChange={e => handleCreateFormChange("type", e.target.value)}
                                        >
                                            <option value="check">Check</option>
                                            <option value="raiseOrCall">Raise or Call</option>
                                            <option value="random">Random</option>
                                        </select>
                                    </div>
                                    <div className="mb-3">
                                        <div className="form-check form-switch">
                                            <input
                                                className="form-check-input"
                                                type="checkbox"
                                                id="enabled"
                                                checked={formData.enabled}
                                                onChange={e => handleFormChange("enabled", e.target.checked)}
                                            />
                                            <label className="form-check-label" htmlFor="enabled">
                                                {formData.enabled ? "Enabled" : "Disabled"}
                                            </label>
                                        </div>
                                    </div>
                                </form>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={saveChanges}
                                    disabled={selectedBot ? updatingBots.has(selectedBot.address) : false}
                                >
                                    {selectedBot && updatingBots.has(selectedBot.address) ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                            Saving...
                                        </>
                                    ) : (
                                        "Save Changes"
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {showModal && <div className="modal-backdrop fade show"></div>}
        </div>
    );
};

export default BotTable;
