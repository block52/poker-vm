import { motion } from "framer-motion";
import React, { useEffect, useState } from "react";

interface ChipAnimationProps {
  from: { left: string; top: string };   // player seat
  to: { left: string; top: string };     // chip zone
  final: { left: string; top: string }; // center pot (optional)
  amount: number;
  triggerPotMove: boolean;
}

const getChipSize = (amount: number) => {
  if (amount >= 200) return "large";
  if (amount >= 50) return "medium";
  return "small";
};

const ChipAnimation: React.FC<ChipAnimationProps> = ({ from, to, final, amount, triggerPotMove }) => {
  const [stage, setStage] = useState<"toZone" | "toPot" | "hidden">("toZone");

  useEffect(() => {
    // When triggerPotMove becomes true, go to pot
    if (triggerPotMove && final) {
      setStage("toPot");
      const timer = setTimeout(() => {
        setStage("hidden");
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [triggerPotMove, final]);

  if (stage === "hidden") return null;

  const animateTo = stage === "toPot" && final ? final : to;

  return (
    <motion.div
      className={`absolute chip-animation chip-${getChipSize(amount)}`}
      initial={{ left: from.left, top: from.top, opacity: 1, scale: 1 }}
      animate={animateTo}
      transition={{ duration: 0.5, ease: "easeInOut" }}
      style={{
        width: "32px",
        height: "32px",
        backgroundImage: "url('/chip-stack.png')",
        backgroundSize: "contain",
        backgroundRepeat: "no-repeat",
        zIndex: 100,
      }}
    />
  );
};

export default ChipAnimation;
