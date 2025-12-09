import { useEffect, useRef, useCallback } from "react";
import { colors } from "../utils/colorConfig";

/**
 * Default favicon path - can be overridden via environment variable if needed
 */
const DEFAULT_FAVICON_PATH = "/b52favicon.svg";

/**
 * Custom hook to provide turn-to-act notifications
 * - Flashes browser tab title when it's the user's turn
 * - Optional audible notification tone
 * - Automatically stops when user returns to tab or turn ends
 */
export const useTurnNotification = (
    isUserTurn: boolean,
    options: {
        enableSound?: boolean;
        soundVolume?: number; // 0 to 1
        flashInterval?: number; // milliseconds between title changes
    } = {}
) => {
    const {
        enableSound = true,
        soundVolume = 0.3,
        flashInterval = 1000
    } = options;

    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const originalTitleRef = useRef<string>(document.title);
    const isFlashingRef = useRef<boolean>(false);
    const hasSoundedRef = useRef<boolean>(false);
    const audioContextRef = useRef<AudioContext | null>(null);

    // Initialize original title
    useEffect(() => {
        originalTitleRef.current = document.title;
    }, []);

    // Play notification sound using Web Audio API
    const playNotificationSound = useCallback(() => {
        try {
            // Create audio context if it doesn't exist
            if (!audioContextRef.current) {
                const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
                if (!AudioContextClass) {
                    console.warn("AudioContext is not supported in this browser");
                    return;
                }
                audioContextRef.current = new AudioContextClass();
            }

            const audioContext = audioContextRef.current;
            
            // Create oscillator for a pleasant notification tone
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            // Configure tone - a pleasant two-note chime
            oscillator.type = "sine";
            oscillator.frequency.setValueAtTime(880, audioContext.currentTime); // A5
            oscillator.frequency.setValueAtTime(1046.5, audioContext.currentTime + 0.1); // C6

            // Configure volume envelope
            gainNode.gain.setValueAtTime(0, audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(soundVolume, audioContext.currentTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

            // Play the sound
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
        } catch (error) {
            console.warn("Failed to play notification sound:", error);
        }
    }, [soundVolume]);

    // Start flashing the tab title
    const startFlashing = useCallback(() => {
        if (isFlashingRef.current) return;
        isFlashingRef.current = true;

        let isAlternate = false;
        intervalRef.current = setInterval(() => {
            document.title = isAlternate ? originalTitleRef.current : "🃏 Your Turn! 🃏";
            isAlternate = !isAlternate;
        }, flashInterval);
    }, [flashInterval]);

    // Stop flashing and restore original title
    const stopFlashing = useCallback(() => {
        if (!isFlashingRef.current) return;
        isFlashingRef.current = false;

        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        document.title = originalTitleRef.current;
        hasSoundedRef.current = false;
    }, []);

    // Handle user returning to tab
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (!document.hidden && isFlashingRef.current) {
                // User returned to tab, stop flashing
                stopFlashing();
            }
        };

        const handleFocus = () => {
            if (isFlashingRef.current) {
                stopFlashing();
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        window.addEventListener("focus", handleFocus);

        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            window.removeEventListener("focus", handleFocus);
        };
    }, [stopFlashing]);

    // Main effect to handle turn notifications
    useEffect(() => {
        if (isUserTurn && document.hidden) {
            // It's user's turn and they're not on the tab
            startFlashing();

            // Play sound once when turn starts
            if (enableSound && !hasSoundedRef.current) {
                playNotificationSound();
                hasSoundedRef.current = true;
            }
        } else if (!isUserTurn) {
            // Turn ended, stop flashing
            stopFlashing();
        }

        // Cleanup on unmount
        return () => {
            stopFlashing();
        };
    }, [isUserTurn, enableSound, startFlashing, playNotificationSound, stopFlashing]);

    // Cleanup audio context on unmount
    useEffect(() => {
        return () => {
            if (audioContextRef.current) {
                audioContextRef.current.close();
                audioContextRef.current = null;
            }
        };
    }, []);
};

/**
 * Utility function to create a visual notification using favicon
 * 
 * This function draws a notification indicator (colored dot) on the favicon
 * to provide an additional visual cue in the browser tab. This is an alternative
 * or complementary approach to tab title flashing.
 * 
 * Note: Currently not used in the main implementation as tab title flashing
 * provides a more noticeable notification. This function is exported for
 * potential future use or customization by implementers who prefer favicon
 * notification over title flashing.
 * 
 * @param shouldNotify - Whether to show the notification indicator
 * 
 * Usage example:
 * ```typescript
 * useEffect(() => {
 *   createFaviconNotification(isUserTurn && document.hidden);
 * }, [isUserTurn]);
 * ```
 */
export const createFaviconNotification = (shouldNotify: boolean) => {
    const favicon = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
    if (!favicon) return;

    if (shouldNotify) {
        // Create a canvas to draw a notification indicator
        const canvas = document.createElement("canvas");
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext("2d");
        
        if (ctx) {
            // Draw a colored circle indicator using brand color
            ctx.beginPath();
            ctx.arc(26, 6, 6, 0, 2 * Math.PI);
            ctx.fillStyle = colors.brand.primary;
            ctx.fill();
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        favicon.href = canvas.toDataURL("image/png");
    } else {
        // Reset to original favicon using constant
        favicon.href = DEFAULT_FAVICON_PATH;
    }
};
