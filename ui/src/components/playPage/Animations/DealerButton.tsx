import React, { useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { useAnimationContext } from "../../../context/AnimationContext";
import { dealerPosition } from "../../../utils/PositionArray";
import { animationRegistry } from "../../../utils/animationRegistry";
import CustomDealer from "../../../assets/CustomDealer.svg";

interface DealerButtonProps {
  dealerSeat: number;
  tableSize: number;
  startIndex: number;
}

const DealerButton: React.FC<DealerButtonProps> = ({ 
  dealerSeat, 
  tableSize, 
  startIndex 
}) => {
  const { registerAnimation } = useAnimationContext();
  
  // Calculate visual position based on dealer seat and table configuration
  const position = useMemo(() => {
    if (!dealerSeat || dealerSeat === 0) return null;
    
    // Get the appropriate position array for table size
    const positionArray = tableSize === 6 ? dealerPosition.six : dealerPosition.nine;
    
    // Calculate visual index based on dealer seat and start index
    // This matches the same logic used in player positioning
    const visualIndex = (dealerSeat - 1 - startIndex + tableSize) % tableSize;
    
    return positionArray[visualIndex];
  }, [dealerSeat, tableSize, startIndex]);

  // Register animation for dealer movement
  useEffect(() => {
    registerAnimation('dealerMove', (params) => {
      console.log('Dealer button animation triggered:', params);
    });
  }, [registerAnimation]);

  // Don't render if no valid position
  if (!position) return null;

  return (
    <motion.div
      className="absolute z-50 w-12 h-12 flex items-center justify-center"
      style={{
        left: position.left,
        top: position.top
      }}
      initial={false}
      animate={{
        left: position.left,
        top: position.top
      }}
      transition={animationRegistry.dealerMove.transition}
      layoutId="dealerButton" // For shared layout transitions
    >
      <img src={CustomDealer} alt="Dealer Button" className="w-full h-full" />
    </motion.div>
  );
};

export default DealerButton;