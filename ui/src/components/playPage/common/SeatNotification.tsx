import React, { useEffect } from "react";

interface SeatNotificationProps {
    seatNumber: number | null;
    playerColor?: string;
    onClose: () => void;
}

/**
 * Seat notification component that appears when a player sits at the table
 * Shows the seat position in a colored box that drops down
 * Auto-closes after 2 seconds
 */
const SeatNotification: React.FC<SeatNotificationProps> = ({ 
    seatNumber, 
    playerColor = "#3b82f6",
    onClose 
}) => {
    // Auto-close after 2 seconds
    useEffect(() => {
        if (seatNumber !== null) {
            const timer = setTimeout(() => {
                onClose();
            }, 2000);

            return () => clearTimeout(timer);
        }
    }, [seatNumber, onClose]);

    // Don't render if no seat number
    if (seatNumber === null) return null;

    return (
        <div className="seat-notification-container">
            <div
                className="seat-notification-box"
                style={{
                    backgroundColor: `${playerColor}dd`,
                    borderColor: playerColor,
                    boxShadow: `0 4px 12px ${playerColor}40, 0 2px 4px rgba(0,0,0,0.3)`
                }}
            >
                <div className="seat-notification-content">
                    <span className="seat-notification-label">Your seat</span>
                    <div className="seat-notification-number-wrapper">
                        <div 
                            className="seat-notification-number"
                            style={{ backgroundColor: playerColor }}
                        >
                            {seatNumber}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SeatNotification;
