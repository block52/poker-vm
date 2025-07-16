export const animationRegistry = {
  dealerMove: {
    initial: { scale: 0.8, opacity: 0.8 },
    animate: { scale: 1, opacity: 1 },
    transition: { 
      duration: 0.6, 
      ease: "easeInOut",
      type: "spring",
      stiffness: 300,
      damping: 30
    }
  },
  // Future animations will go here
};