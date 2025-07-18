import React from "react";
import { motion } from "framer-motion";
import Chip from "./Chip";

export interface AnimatedChipProps {
  /**
   * Amount to display on the chip (in Wei or simple string/bigint).
   */
  amount: string | bigint;
  /**
   * Inline style for positioning the animated chip.
   */
  style: React.CSSProperties;
}

/**
 * AnimatedChip wraps the Chip component with Framer Motion animations
 * to transition from the pot to the winning seat (and back).
 */
const AnimatedChip: React.FC<AnimatedChipProps> = React.memo(({ amount, style }) => {
  return (
    <motion.div
      layoutId="winningChip"           // shared ID for cross-component animation
      initial={{ opacity: 1, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 1, scale: 0.8 }}
      transition={{ duration: 3 }}
      style={{
        position: "absolute",
        pointerEvents: "none",
        zIndex: 20,
        ...style,
      }}
    >
      <Chip amount={amount} />
    </motion.div>
  );
});

export default AnimatedChip;
