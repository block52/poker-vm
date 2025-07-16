import { useAnimationContext } from "../context/AnimationContext";

export const useAnimationOrchestrator = () => {
  const { startAnimation } = useAnimationContext();

  const playDealerTransition = (params: any) => {
    startAnimation("dealerMove", params);
  };

  // Future orchestration methods will go here
  const playWinningSequence = () => {
    // Will be implemented later
  };

  const playDealingSequence = () => {
    // Will be implemented later
  };

  return { 
    playDealerTransition,
    playWinningSequence, 
    playDealingSequence 
  };
};