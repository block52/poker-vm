import React, { createContext, useContext, useState, ReactNode } from "react";

interface AnimationContextProps {
  startAnimation: (key: string, params?: any) => void;
  registerAnimation: (key: string, callback: (params?: any) => void) => void;
}

const AnimationContext = createContext<AnimationContextProps | null>(null);

interface AnimationProviderProps {
  children: ReactNode;
}

export const AnimationProvider: React.FC<AnimationProviderProps> = ({ children }) => {
  const [animations, setAnimations] = useState<Record<string, (params?: any) => void>>({});

  const startAnimation = (key: string, params?: any) => {
    console.log(`Starting animation: ${key}`, params);
    if (animations[key]) {
      animations[key](params);
    }
  };

  const registerAnimation = (key: string, callback: (params?: any) => void) => {
    setAnimations((prev) => ({ ...prev, [key]: callback }));
  };

  return (
    <AnimationContext.Provider value={{ startAnimation, registerAnimation }}>
      {children}
    </AnimationContext.Provider>
  );
};

export const useAnimationContext = () => {
  const context = useContext(AnimationContext);
  if (!context) {
    throw new Error("useAnimationContext must be used within AnimationProvider");
  }
  return context;
};