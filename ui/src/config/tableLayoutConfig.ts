/**
 * Table Layout Configuration System
 * 
 * This configuration file centralizes all table and seat positioning logic
 * for different viewport modes and device orientations.
 * 
 * HOW TO ADJUST POSITIONS:
 * 1. Find the viewport mode you want to adjust (mobile-portrait, mobile-landscape, tablet, desktop)
 * 2. Locate the element type (players, vacantPlayers, chips, dealers, etc.)
 * 3. Find the seat number (array index 0 = seat 1, index 1 = seat 2, etc.)
 * 4. Adjust the left/top values (use px for absolute, % for relative positioning)
 * 5. Save and refresh to see changes
 * 
 * Viewport Breakpoints:
 * - Mobile Portrait: width <= 414px, portrait orientation
 * - Mobile Landscape: width <= 926px, landscape orientation  
 * - Tablet: 927px <= width <= 1024px
 * - Desktop: width > 1024px
 */

export interface Position {
  left: string;
  top: string;
  color?: string;
}

export interface ChipPosition {
  left: string;
  bottom: string;
}

export interface ViewportConfig {
  table: {
    scale: number;
    translateX: string;
    translateY: string;
    rotation?: number; // For fixing mobile landscape orientation
  };
  players: {
    six: Position[];
    nine: Position[];
  };
  vacantPlayers: {
    six: Position[];
    nine: Position[];
  };
  chips: {
    six: ChipPosition[];
    nine: ChipPosition[];
  };
  dealers: {
    six: Position[];
    nine: Position[];
  };
  turnAnimations: {
    six: Position[];
    nine: Position[];
  };
  winAnimations: {
    six: Position[];
    nine: Position[];
  };
}

// Helper function to detect viewport mode
export const getViewportMode = (): 'mobile-portrait' | 'mobile-landscape' | 'tablet' | 'desktop' => {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const isLandscape = width > height;
  
  if (width <= 414 && !isLandscape) {
    return 'mobile-portrait';
  } else if (width <= 926 && isLandscape) {
    return 'mobile-landscape';
  } else if (width <= 1024) {
    return 'tablet';
  } else {
    return 'desktop';
  }
};

// Configuration for each viewport mode
export const viewportConfigs: Record<string, ViewportConfig> = {
  /**
   * =====================================================
   * MOBILE PORTRAIT CONFIGURATION
   * For phones in vertical orientation (width <= 414px)
   * =====================================================
   */
  'mobile-portrait': {
    // TABLE POSITION & SCALE
    table: {
      scale: 1,           // Reduce size to fit small screen
      translateX: '-50%',   // Center horizontally
      translateY: '-50%',   // Center vertically  
      rotation: 0           // No rotation needed
    },
    
    // PLAYER SEAT POSITIONS (where players sit)
    players: {
      // 6-PLAYER TABLE POSITIONS
      six: [
        { left: "40%", top: "100%" },    // Seat 1 - Bottom left
        { left: "17%", top: "32%" },     // Seat 2 - Left side
        { left: "40%", top: "-35%" },    // Seat 3 - Top left
        { left: "60%", top: "-35%" },    // Seat 4 - Top right
        { left: "83%", top: "32%" },     // Seat 5 - Right side
        { left: "60%", top: "100%" }     // Seat 6 - Bottom right
      ],
      
      // 9-PLAYER TABLE POSITIONS
      nine: [
        { left: "450px", top: "390px", color: "#4ade80" },   // Seat 1 - Bottom center
        { left: "155px", top: "374px", color: "#f97316" },   // Seat 2 - Bottom left
        { left: "-100px", top: "230px", color: "#ef4444" },  // Seat 3 - Left side
        { left: "-55px", top: "-20px", color: "#3b82f6" },   // Seat 4 - Top left corner
        { left: "270px", top: "-100px", color: "#8b5cf6" },  // Seat 5 - Top left
        { left: "600px", top: "-100px", color: "#212529" },  // Seat 6 - Top right
        { left: "965px", top: "-20px", color: "#FFD700" },   // Seat 7 - Top right corner
        { left: "999px", top: "230px", color: "#ec4899" },   // Seat 8 - Right side
        { left: "745px", top: "374px", color: "#6b7280" }    // Seat 9 - Bottom right
      ]
    },
    
    // VACANT SEAT POSITIONS (empty seat indicators)
    vacantPlayers: {
      // 6-PLAYER VACANT SEATS
      six: [
        { left: "40%", top: "100%" },    // Empty Seat 1
        { left: "17%", top: "32%" },     // Empty Seat 2
        { left: "40%", top: "-35%" },    // Empty Seat 3
        { left: "60%", top: "-35%" },    // Empty Seat 4
        { left: "83%", top: "32%" },     // Empty Seat 5
        { left: "60%", top: "100%" }     // Empty Seat 6
      ],
      
      // 9-PLAYER VACANT SEATS
      nine: [
        { left: "414px", top: "399px" },   // Empty Seat 1
        { left: "130px", top: "374px" },   // Empty Seat 2
        { left: "-110px", top: "220px" },  // Empty Seat 3
        { left: "-55px", top: "-30px" },   // Empty Seat 4
        { left: "240px", top: "-110px" },  // Empty Seat 5
        { left: "580px", top: "-110px" },  // Empty Seat 6
        { left: "880px", top: "-30px" },   // Empty Seat 7
        { left: "929px", top: "220px" },   // Empty Seat 8
        { left: "700px", top: "374px" }    // Empty Seat 9
      ]
    },
    
    // CHIP POSITIONS (betting chips on table)
    chips: {
      // 6-PLAYER CHIP POSITIONS
      six: [
        { left: "40%", bottom: "10px" },    // Chips for Seat 1
        { left: "17%", bottom: "50%" },     // Chips for Seat 2
        { left: "40%", bottom: "90%" },     // Chips for Seat 3
        { left: "60%", bottom: "90%" },     // Chips for Seat 4
        { left: "83%", bottom: "50%" },     // Chips for Seat 5
        { left: "60%", bottom: "10px" }     // Chips for Seat 6
      ],
      
      // 9-PLAYER CHIP POSITIONS
      nine: [
        { bottom: "10px", left: "430px" },   // Chips for Seat 1
        { bottom: "12px", left: "130px" },   // Chips for Seat 2
        { bottom: "110px", left: "-20px" },  // Chips for Seat 3
        { bottom: "255px", left: "39px" },   // Chips for Seat 4
        { bottom: "310px", left: "245px" },  // Chips for Seat 5
        { bottom: "310px", left: "575px" },  // Chips for Seat 6
        { bottom: "255px", left: "810px" },  // Chips for Seat 7
        { bottom: "110px", left: "873px" },  // Chips for Seat 8
        { bottom: "12px", left: "720px" }    // Chips for Seat 9
      ]
    },
    
    // DEALER BUTTON POSITIONS
    dealers: {
      // 6-PLAYER DEALER POSITIONS
      six: [
        { left: "40%", top: "100%" },    // Dealer at Seat 1
        { left: "17%", top: "32%" },     // Dealer at Seat 2
        { left: "40%", top: "-35%" },    // Dealer at Seat 3
        { left: "60%", top: "-35%" },    // Dealer at Seat 4
        { left: "83%", top: "32%" },     // Dealer at Seat 5
        { left: "60%", top: "100%" }     // Dealer at Seat 6
      ],
      
      // 9-PLAYER DEALER POSITIONS
      nine: [
        { left: "320px", top: "350px" },   // Dealer at Seat 1
        { left: "25px", top: "335px" },    // Dealer at Seat 2
        { left: "-215px", top: "265px" },  // Dealer at Seat 3
        { left: "-169px", top: "28px" },   // Dealer at Seat 4
        { left: "150px", top: "-50px" },   // Dealer at Seat 5
        { left: "285px", top: "-50px" },   // Dealer at Seat 6
        { left: "635px", top: "30px" },    // Dealer at Seat 7
        { left: "680px", top: "265px" },   // Dealer at Seat 8
        { left: "445px", top: "331px" }    // Dealer at Seat 9
      ]
    },
    
    // TURN INDICATOR ANIMATIONS (shows whose turn)
    turnAnimations: {
      // 6-PLAYER TURN INDICATORS
      six: [
        { left: "40%", top: "100%" },    // Turn indicator at Seat 1
        { left: "17%", top: "32%" },     // Turn indicator at Seat 2
        { left: "40%", top: "-35%" },    // Turn indicator at Seat 3
        { left: "60%", top: "-35%" },    // Turn indicator at Seat 4
        { left: "83%", top: "32%" },     // Turn indicator at Seat 5
        { left: "60%", top: "100%" }     // Turn indicator at Seat 6
      ],
      
      // 9-PLAYER TURN INDICATORS
      nine: [
        { left: "450px", top: "470px" },   // Turn indicator at Seat 1
        { left: "155px", top: "460px" },   // Turn indicator at Seat 2
        { left: "-104px", top: "320px" },  // Turn indicator at Seat 3
        { left: "-59px", top: "69px" },    // Turn indicator at Seat 4
        { left: "267px", top: "-10px" },   // Turn indicator at Seat 5
        { left: "600px", top: "-10px" },   // Turn indicator at Seat 6
        { left: "960px", top: "69px" },    // Turn indicator at Seat 7
        { left: "999px", top: "320px" },   // Turn indicator at Seat 8
        { left: "740px", top: "460px" }    // Turn indicator at Seat 9
      ]
    },
    
    // WIN CELEBRATION ANIMATIONS
    winAnimations: {
      // 6-PLAYER WIN ANIMATIONS
      six: [
        { left: "40%", top: "100%" },    // Win animation at Seat 1
        { left: "17%", top: "32%" },     // Win animation at Seat 2
        { left: "40%", top: "-35%" },    // Win animation at Seat 3
        { left: "60%", top: "-35%" },    // Win animation at Seat 4
        { left: "83%", top: "32%" },     // Win animation at Seat 5
        { left: "60%", top: "100%" }     // Win animation at Seat 6
      ],
      
      // 9-PLAYER WIN ANIMATIONS
      nine: [
        { left: "450px", top: "470px" },   // Win animation at Seat 1
        { left: "155px", top: "460px" },   // Win animation at Seat 2
        { left: "-104px", top: "320px" },  // Win animation at Seat 3
        { left: "-59px", top: "69px" },    // Win animation at Seat 4
        { left: "267px", top: "-10px" },   // Win animation at Seat 5
        { left: "600px", top: "-10px" },   // Win animation at Seat 6
        { left: "960px", top: "69px" },    // Win animation at Seat 7
        { left: "999px", top: "320px" },   // Win animation at Seat 8
        { left: "740px", top: "460px" }    // Win animation at Seat 9
      ]
    }
  },
  
  /**
   * =====================================================
   * MOBILE LANDSCAPE CONFIGURATION
   * For phones in horizontal orientation (width <= 926px)
   * =====================================================
   */
  'mobile-landscape': {
    // TABLE POSITION & SCALE
    table: {
      scale: 1.1,           // Slightly larger than portrait
      translateX: '-50%',   // Center horizontally
      translateY: '20%',   // Moved up to account for removed header
      rotation: 180         // Needs to be 180 for proper orientation
    },
    
    // PLAYER SEAT POSITIONS
    players: {
      // 6-PLAYER TABLE POSITIONS
      six: [
        { left: "40%", top: "100%" },    // Seat 1 - Bottom left
        { left: "17%", top: "32%" },     // Seat 2 - Left side
        { left: "40%", top: "-35%" },    // Seat 3 - Top left
        { left: "60%", top: "-35%" },    // Seat 4 - Top right
        { left: "83%", top: "32%" },     // Seat 5 - Right side
        { left: "60%", top: "100%" }     // Seat 6 - Bottom right
      ],
      
      // 9-PLAYER TABLE POSITIONS
      nine: [
        { left: "450px", top: "390px", color: "#4ade80" },   // Seat 1 - Bottom center
        { left: "155px", top: "374px", color: "#f97316" },   // Seat 2 - Bottom left
        { left: "-100px", top: "230px", color: "#ef4444" },  // Seat 3 - Left side
        { left: "-55px", top: "-20px", color: "#3b82f6" },   // Seat 4 - Top left corner
        { left: "270px", top: "-100px", color: "#8b5cf6" },  // Seat 5 - Top left
        { left: "600px", top: "-100px", color: "#212529" },  // Seat 6 - Top right
        { left: "965px", top: "-20px", color: "#FFD700" },   // Seat 7 - Top right corner
        { left: "999px", top: "230px", color: "#ec4899" },   // Seat 8 - Right side
        { left: "745px", top: "374px", color: "#6b7280" }    // Seat 9 - Bottom right
      ]
    },
    
    // VACANT SEAT POSITIONS
    vacantPlayers: {
      // 6-PLAYER VACANT SEATS
      six: [
        { left: "40%", top: "100%" },    // Empty Seat 1
        { left: "17%", top: "32%" },     // Empty Seat 2
        { left: "40%", top: "-35%" },    // Empty Seat 3
        { left: "60%", top: "-35%" },    // Empty Seat 4
        { left: "83%", top: "32%" },     // Empty Seat 5
        { left: "60%", top: "100%" }     // Empty Seat 6
      ],
      
      // 9-PLAYER VACANT SEATS
      nine: [
        { left: "414px", top: "399px" },   // Empty Seat 1
        { left: "130px", top: "374px" },   // Empty Seat 2
        { left: "-110px", top: "220px" },  // Empty Seat 3
        { left: "-55px", top: "-30px" },   // Empty Seat 4
        { left: "240px", top: "-110px" },  // Empty Seat 5
        { left: "580px", top: "-110px" },  // Empty Seat 6
        { left: "880px", top: "-30px" },   // Empty Seat 7
        { left: "929px", top: "220px" },   // Empty Seat 8
        { left: "700px", top: "374px" }    // Empty Seat 9
      ]
    },
    
    // CHIP POSITIONS
    chips: {
      // 6-PLAYER CHIP POSITIONS
      six: [
        { left: "40%", bottom: "10px" },    // Chips for Seat 1
        { left: "17%", bottom: "50%" },     // Chips for Seat 2
        { left: "40%", bottom: "90%" },     // Chips for Seat 3
        { left: "60%", bottom: "90%" },     // Chips for Seat 4
        { left: "83%", bottom: "50%" },     // Chips for Seat 5
        { left: "60%", bottom: "10px" }     // Chips for Seat 6
      ],
      
      // 9-PLAYER CHIP POSITIONS
      nine: [
        { bottom: "10px", left: "430px" },   // Chips for Seat 1
        { bottom: "12px", left: "130px" },   // Chips for Seat 2
        { bottom: "110px", left: "-20px" },  // Chips for Seat 3
        { bottom: "255px", left: "39px" },   // Chips for Seat 4
        { bottom: "310px", left: "245px" },  // Chips for Seat 5
        { bottom: "310px", left: "575px" },  // Chips for Seat 6
        { bottom: "255px", left: "810px" },  // Chips for Seat 7
        { bottom: "110px", left: "873px" },  // Chips for Seat 8
        { bottom: "12px", left: "720px" }    // Chips for Seat 9
      ]
    },
    
    // DEALER BUTTON POSITIONS
    dealers: {
      // 6-PLAYER DEALER POSITIONS
      six: [
        { left: "40%", top: "100%" },    // Dealer at Seat 1
        { left: "17%", top: "32%" },     // Dealer at Seat 2
        { left: "40%", top: "-35%" },    // Dealer at Seat 3
        { left: "60%", top: "-35%" },    // Dealer at Seat 4
        { left: "83%", top: "32%" },     // Dealer at Seat 5
        { left: "60%", top: "100%" }     // Dealer at Seat 6
      ],
      
      // 9-PLAYER DEALER POSITIONS
      nine: [
        { left: "320px", top: "350px" },   // Dealer at Seat 1
        { left: "25px", top: "335px" },    // Dealer at Seat 2
        { left: "-215px", top: "265px" },  // Dealer at Seat 3
        { left: "-169px", top: "28px" },   // Dealer at Seat 4
        { left: "150px", top: "-50px" },   // Dealer at Seat 5
        { left: "285px", top: "-50px" },   // Dealer at Seat 6
        { left: "635px", top: "30px" },    // Dealer at Seat 7
        { left: "680px", top: "265px" },   // Dealer at Seat 8
        { left: "445px", top: "331px" }    // Dealer at Seat 9
      ]
    },
    
    // TURN INDICATOR ANIMATIONS
    turnAnimations: {
      // 6-PLAYER TURN INDICATORS
      six: [
        { left: "40%", top: "100%" },    // Turn indicator at Seat 1
        { left: "17%", top: "32%" },     // Turn indicator at Seat 2
        { left: "40%", top: "-35%" },    // Turn indicator at Seat 3
        { left: "60%", top: "-35%" },    // Turn indicator at Seat 4
        { left: "83%", top: "32%" },     // Turn indicator at Seat 5
        { left: "60%", top: "100%" }     // Turn indicator at Seat 6
      ],
      
      // 9-PLAYER TURN INDICATORS
      nine: [
        { left: "450px", top: "470px" },   // Turn indicator at Seat 1
        { left: "155px", top: "460px" },   // Turn indicator at Seat 2
        { left: "-104px", top: "320px" },  // Turn indicator at Seat 3
        { left: "-59px", top: "69px" },    // Turn indicator at Seat 4
        { left: "267px", top: "-10px" },   // Turn indicator at Seat 5
        { left: "600px", top: "-10px" },   // Turn indicator at Seat 6
        { left: "960px", top: "69px" },    // Turn indicator at Seat 7
        { left: "999px", top: "320px" },   // Turn indicator at Seat 8
        { left: "740px", top: "460px" }    // Turn indicator at Seat 9
      ]
    },
    
    // WIN CELEBRATION ANIMATIONS
    winAnimations: {
      // 6-PLAYER WIN ANIMATIONS
      six: [
        { left: "40%", top: "100%" },    // Win animation at Seat 1
        { left: "17%", top: "32%" },     // Win animation at Seat 2
        { left: "40%", top: "-35%" },    // Win animation at Seat 3
        { left: "60%", top: "-35%" },    // Win animation at Seat 4
        { left: "83%", top: "32%" },     // Win animation at Seat 5
        { left: "60%", top: "100%" }     // Win animation at Seat 6
      ],
      
      // 9-PLAYER WIN ANIMATIONS
      nine: [
        { left: "450px", top: "470px" },   // Win animation at Seat 1
        { left: "155px", top: "460px" },   // Win animation at Seat 2
        { left: "-104px", top: "320px" },  // Win animation at Seat 3
        { left: "-59px", top: "69px" },    // Win animation at Seat 4
        { left: "267px", top: "-10px" },   // Win animation at Seat 5
        { left: "600px", top: "-10px" },   // Win animation at Seat 6
        { left: "960px", top: "69px" },    // Win animation at Seat 7
        { left: "999px", top: "320px" },   // Win animation at Seat 8
        { left: "740px", top: "460px" }    // Win animation at Seat 9
      ]
    }
  },
  
  /**
   * =====================================================
   * TABLET CONFIGURATION
   * For tablets and medium screens (927px - 1024px)
   * =====================================================
   */
  'tablet': {
    // TABLE POSITION & SCALE
    table: {
      scale: 0.8,           // Good size for tablets
      translateX: '-50%',   // Center horizontally
      translateY: '-50%',   // Center vertically
      rotation: 0           // No rotation needed
    },
    
    // PLAYER SEAT POSITIONS
    players: {
      // 6-PLAYER TABLE POSITIONS
      six: [
        { left: "40%", top: "100%" },    // Seat 1 - Bottom left
        { left: "17%", top: "32%" },     // Seat 2 - Left side
        { left: "40%", top: "-35%" },    // Seat 3 - Top left
        { left: "60%", top: "-35%" },    // Seat 4 - Top right
        { left: "83%", top: "32%" },     // Seat 5 - Right side
        { left: "60%", top: "100%" }     // Seat 6 - Bottom right
      ],
      
      // 9-PLAYER TABLE POSITIONS
      nine: [
        { left: "450px", top: "390px", color: "#4ade80" },   // Seat 1 - Bottom center
        { left: "155px", top: "374px", color: "#f97316" },   // Seat 2 - Bottom left
        { left: "-100px", top: "230px", color: "#ef4444" },  // Seat 3 - Left side
        { left: "-55px", top: "-20px", color: "#3b82f6" },   // Seat 4 - Top left corner
        { left: "270px", top: "-100px", color: "#8b5cf6" },  // Seat 5 - Top left
        { left: "600px", top: "-100px", color: "#212529" },  // Seat 6 - Top right
        { left: "965px", top: "-20px", color: "#FFD700" },   // Seat 7 - Top right corner
        { left: "999px", top: "230px", color: "#ec4899" },   // Seat 8 - Right side
        { left: "745px", top: "374px", color: "#6b7280" }    // Seat 9 - Bottom right
      ]
    },
    
    // VACANT SEAT POSITIONS
    vacantPlayers: {
      // 6-PLAYER VACANT SEATS
      six: [
        { left: "40%", top: "100%" },    // Empty Seat 1
        { left: "17%", top: "32%" },     // Empty Seat 2
        { left: "40%", top: "-35%" },    // Empty Seat 3
        { left: "60%", top: "-35%" },    // Empty Seat 4
        { left: "83%", top: "32%" },     // Empty Seat 5
        { left: "60%", top: "100%" }     // Empty Seat 6
      ],
      
      // 9-PLAYER VACANT SEATS
      nine: [
        { left: "414px", top: "399px" },   // Empty Seat 1
        { left: "130px", top: "374px" },   // Empty Seat 2
        { left: "-110px", top: "220px" },  // Empty Seat 3
        { left: "-55px", top: "-30px" },   // Empty Seat 4
        { left: "240px", top: "-110px" },  // Empty Seat 5
        { left: "580px", top: "-110px" },  // Empty Seat 6
        { left: "880px", top: "-30px" },   // Empty Seat 7
        { left: "929px", top: "220px" },   // Empty Seat 8
        { left: "700px", top: "374px" }    // Empty Seat 9
      ]
    },
    
    // CHIP POSITIONS
    chips: {
      // 6-PLAYER CHIP POSITIONS
      six: [
        { left: "40%", bottom: "10px" },    // Chips for Seat 1
        { left: "17%", bottom: "50%" },     // Chips for Seat 2
        { left: "40%", bottom: "90%" },     // Chips for Seat 3
        { left: "60%", bottom: "90%" },     // Chips for Seat 4
        { left: "83%", bottom: "50%" },     // Chips for Seat 5
        { left: "60%", bottom: "10px" }     // Chips for Seat 6
      ],
      
      // 9-PLAYER CHIP POSITIONS
      nine: [
        { bottom: "10px", left: "430px" },   // Chips for Seat 1
        { bottom: "12px", left: "130px" },   // Chips for Seat 2
        { bottom: "110px", left: "-20px" },  // Chips for Seat 3
        { bottom: "255px", left: "39px" },   // Chips for Seat 4
        { bottom: "310px", left: "245px" },  // Chips for Seat 5
        { bottom: "310px", left: "575px" },  // Chips for Seat 6
        { bottom: "255px", left: "810px" },  // Chips for Seat 7
        { bottom: "110px", left: "873px" },  // Chips for Seat 8
        { bottom: "12px", left: "720px" }    // Chips for Seat 9
      ]
    },
    
    // DEALER BUTTON POSITIONS
    dealers: {
      // 6-PLAYER DEALER POSITIONS
      six: [
        { left: "40%", top: "100%" },    // Dealer at Seat 1
        { left: "17%", top: "32%" },     // Dealer at Seat 2
        { left: "40%", top: "-35%" },    // Dealer at Seat 3
        { left: "60%", top: "-35%" },    // Dealer at Seat 4
        { left: "83%", top: "32%" },     // Dealer at Seat 5
        { left: "60%", top: "100%" }     // Dealer at Seat 6
      ],
      
      // 9-PLAYER DEALER POSITIONS
      nine: [
        { left: "320px", top: "350px" },   // Dealer at Seat 1
        { left: "25px", top: "335px" },    // Dealer at Seat 2
        { left: "-215px", top: "265px" },  // Dealer at Seat 3
        { left: "-169px", top: "28px" },   // Dealer at Seat 4
        { left: "150px", top: "-50px" },   // Dealer at Seat 5
        { left: "285px", top: "-50px" },   // Dealer at Seat 6
        { left: "635px", top: "30px" },    // Dealer at Seat 7
        { left: "680px", top: "265px" },   // Dealer at Seat 8
        { left: "445px", top: "331px" }    // Dealer at Seat 9
      ]
    },
    
    // TURN INDICATOR ANIMATIONS
    turnAnimations: {
      // 6-PLAYER TURN INDICATORS
      six: [
        { left: "40%", top: "100%" },    // Turn indicator at Seat 1
        { left: "17%", top: "32%" },     // Turn indicator at Seat 2
        { left: "40%", top: "-35%" },    // Turn indicator at Seat 3
        { left: "60%", top: "-35%" },    // Turn indicator at Seat 4
        { left: "83%", top: "32%" },     // Turn indicator at Seat 5
        { left: "60%", top: "100%" }     // Turn indicator at Seat 6
      ],
      
      // 9-PLAYER TURN INDICATORS
      nine: [
        { left: "450px", top: "470px" },   // Turn indicator at Seat 1
        { left: "155px", top: "460px" },   // Turn indicator at Seat 2
        { left: "-104px", top: "320px" },  // Turn indicator at Seat 3
        { left: "-59px", top: "69px" },    // Turn indicator at Seat 4
        { left: "267px", top: "-10px" },   // Turn indicator at Seat 5
        { left: "600px", top: "-10px" },   // Turn indicator at Seat 6
        { left: "960px", top: "69px" },    // Turn indicator at Seat 7
        { left: "999px", top: "320px" },   // Turn indicator at Seat 8
        { left: "740px", top: "460px" }    // Turn indicator at Seat 9
      ]
    },
    
    // WIN CELEBRATION ANIMATIONS
    winAnimations: {
      // 6-PLAYER WIN ANIMATIONS
      six: [
        { left: "40%", top: "100%" },    // Win animation at Seat 1
        { left: "17%", top: "32%" },     // Win animation at Seat 2
        { left: "40%", top: "-35%" },    // Win animation at Seat 3
        { left: "60%", top: "-35%" },    // Win animation at Seat 4
        { left: "83%", top: "32%" },     // Win animation at Seat 5
        { left: "60%", top: "100%" }     // Win animation at Seat 6
      ],
      
      // 9-PLAYER WIN ANIMATIONS
      nine: [
        { left: "450px", top: "470px" },   // Win animation at Seat 1
        { left: "155px", top: "460px" },   // Win animation at Seat 2
        { left: "-104px", top: "320px" },  // Win animation at Seat 3
        { left: "-59px", top: "69px" },    // Win animation at Seat 4
        { left: "267px", top: "-10px" },   // Win animation at Seat 5
        { left: "600px", top: "-10px" },   // Win animation at Seat 6
        { left: "960px", top: "69px" },    // Win animation at Seat 7
        { left: "999px", top: "320px" },   // Win animation at Seat 8
        { left: "740px", top: "460px" }    // Win animation at Seat 9
      ]
    }
  },
  
  /**
   * =====================================================
   * DESKTOP CONFIGURATION
   * For large screens (width > 1024px)
   * =====================================================
   */
  'desktop': {
    // TABLE POSITION & SCALE
    table: {
      scale: 1.0,           // Full size for desktop
      translateX: '-50%',   // Center horizontally
      translateY: '-50%',   // Center vertically
      rotation: 0           // No rotation needed
    },
    
    // PLAYER SEAT POSITIONS
    players: {
      // 6-PLAYER TABLE POSITIONS
      six: [
        { left: "40%", top: "100%" },    // Seat 1 - Bottom left
        { left: "17%", top: "32%" },     // Seat 2 - Left side
        { left: "40%", top: "-35%" },    // Seat 3 - Top left
        { left: "60%", top: "-35%" },    // Seat 4 - Top right
        { left: "83%", top: "32%" },     // Seat 5 - Right side
        { left: "60%", top: "100%" }     // Seat 6 - Bottom right
      ],
      
      // 9-PLAYER TABLE POSITIONS
      nine: [
        { left: "450px", top: "390px", color: "#4ade80" },   // Seat 1 - Bottom center
        { left: "155px", top: "374px", color: "#f97316" },   // Seat 2 - Bottom left
        { left: "-100px", top: "230px", color: "#ef4444" },  // Seat 3 - Left side
        { left: "-55px", top: "-20px", color: "#3b82f6" },   // Seat 4 - Top left corner
        { left: "270px", top: "-100px", color: "#8b5cf6" },  // Seat 5 - Top left
        { left: "600px", top: "-100px", color: "#212529" },  // Seat 6 - Top right
        { left: "965px", top: "-20px", color: "#FFD700" },   // Seat 7 - Top right corner
        { left: "999px", top: "230px", color: "#ec4899" },   // Seat 8 - Right side
        { left: "745px", top: "374px", color: "#6b7280" }    // Seat 9 - Bottom right
      ]
    },
    
    // VACANT SEAT POSITIONS
    vacantPlayers: {
      // 6-PLAYER VACANT SEATS
      six: [
        { left: "40%", top: "100%" },    // Empty Seat 1
        { left: "17%", top: "32%" },     // Empty Seat 2
        { left: "40%", top: "-35%" },    // Empty Seat 3
        { left: "60%", top: "-35%" },    // Empty Seat 4
        { left: "83%", top: "32%" },     // Empty Seat 5
        { left: "60%", top: "100%" }     // Empty Seat 6
      ],
      
      // 9-PLAYER VACANT SEATS
      nine: [
        { left: "414px", top: "399px" },   // Empty Seat 1
        { left: "130px", top: "374px" },   // Empty Seat 2
        { left: "-110px", top: "220px" },  // Empty Seat 3
        { left: "-55px", top: "-30px" },   // Empty Seat 4
        { left: "240px", top: "-110px" },  // Empty Seat 5
        { left: "580px", top: "-110px" },  // Empty Seat 6
        { left: "880px", top: "-30px" },   // Empty Seat 7
        { left: "929px", top: "220px" },   // Empty Seat 8
        { left: "700px", top: "374px" }    // Empty Seat 9
      ]
    },
    
    // CHIP POSITIONS
    chips: {
      // 6-PLAYER CHIP POSITIONS
      six: [
        { left: "40%", bottom: "10px" },    // Chips for Seat 1
        { left: "17%", bottom: "50%" },     // Chips for Seat 2
        { left: "40%", bottom: "90%" },     // Chips for Seat 3
        { left: "60%", bottom: "90%" },     // Chips for Seat 4
        { left: "83%", bottom: "50%" },     // Chips for Seat 5
        { left: "60%", bottom: "10px" }     // Chips for Seat 6
      ],
      
      // 9-PLAYER CHIP POSITIONS
      nine: [
        { bottom: "10px", left: "430px" },   // Chips for Seat 1
        { bottom: "12px", left: "130px" },   // Chips for Seat 2
        { bottom: "110px", left: "-20px" },  // Chips for Seat 3
        { bottom: "255px", left: "39px" },   // Chips for Seat 4
        { bottom: "310px", left: "245px" },  // Chips for Seat 5
        { bottom: "310px", left: "575px" },  // Chips for Seat 6
        { bottom: "255px", left: "810px" },  // Chips for Seat 7
        { bottom: "110px", left: "873px" },  // Chips for Seat 8
        { bottom: "12px", left: "720px" }    // Chips for Seat 9
      ]
    },
    
    // DEALER BUTTON POSITIONS
    dealers: {
      // 6-PLAYER DEALER POSITIONS
      six: [
        { left: "40%", top: "100%" },    // Dealer at Seat 1
        { left: "17%", top: "32%" },     // Dealer at Seat 2
        { left: "40%", top: "-35%" },    // Dealer at Seat 3
        { left: "60%", top: "-35%" },    // Dealer at Seat 4
        { left: "83%", top: "32%" },     // Dealer at Seat 5
        { left: "60%", top: "100%" }     // Dealer at Seat 6
      ],
      
      // 9-PLAYER DEALER POSITIONS
      nine: [
        { left: "320px", top: "350px" },   // Dealer at Seat 1
        { left: "25px", top: "335px" },    // Dealer at Seat 2
        { left: "-215px", top: "265px" },  // Dealer at Seat 3
        { left: "-169px", top: "28px" },   // Dealer at Seat 4
        { left: "150px", top: "-50px" },   // Dealer at Seat 5
        { left: "285px", top: "-50px" },   // Dealer at Seat 6
        { left: "635px", top: "30px" },    // Dealer at Seat 7
        { left: "680px", top: "265px" },   // Dealer at Seat 8
        { left: "445px", top: "331px" }    // Dealer at Seat 9
      ]
    },
    
    // TURN INDICATOR ANIMATIONS
    turnAnimations: {
      // 6-PLAYER TURN INDICATORS
      six: [
        { left: "40%", top: "100%" },    // Turn indicator at Seat 1
        { left: "17%", top: "32%" },     // Turn indicator at Seat 2
        { left: "40%", top: "-35%" },    // Turn indicator at Seat 3
        { left: "60%", top: "-35%" },    // Turn indicator at Seat 4
        { left: "83%", top: "32%" },     // Turn indicator at Seat 5
        { left: "60%", top: "100%" }     // Turn indicator at Seat 6
      ],
      
      // 9-PLAYER TURN INDICATORS
      nine: [
        { left: "450px", top: "470px" },   // Turn indicator at Seat 1
        { left: "155px", top: "460px" },   // Turn indicator at Seat 2
        { left: "-104px", top: "320px" },  // Turn indicator at Seat 3
        { left: "-59px", top: "69px" },    // Turn indicator at Seat 4
        { left: "267px", top: "-10px" },   // Turn indicator at Seat 5
        { left: "600px", top: "-10px" },   // Turn indicator at Seat 6
        { left: "960px", top: "69px" },    // Turn indicator at Seat 7
        { left: "999px", top: "320px" },   // Turn indicator at Seat 8
        { left: "740px", top: "460px" }    // Turn indicator at Seat 9
      ]
    },
    
    // WIN CELEBRATION ANIMATIONS
    winAnimations: {
      // 6-PLAYER WIN ANIMATIONS
      six: [
        { left: "40%", top: "100%" },    // Win animation at Seat 1
        { left: "17%", top: "32%" },     // Win animation at Seat 2
        { left: "40%", top: "-35%" },    // Win animation at Seat 3
        { left: "60%", top: "-35%" },    // Win animation at Seat 4
        { left: "83%", top: "32%" },     // Win animation at Seat 5
        { left: "60%", top: "100%" }     // Win animation at Seat 6
      ],
      
      // 9-PLAYER WIN ANIMATIONS
      nine: [
        { left: "450px", top: "470px" },   // Win animation at Seat 1
        { left: "155px", top: "460px" },   // Win animation at Seat 2
        { left: "-104px", top: "320px" },  // Win animation at Seat 3
        { left: "-59px", top: "69px" },    // Win animation at Seat 4
        { left: "267px", top: "-10px" },   // Win animation at Seat 5
        { left: "600px", top: "-10px" },   // Win animation at Seat 6
        { left: "960px", top: "69px" },    // Win animation at Seat 7
        { left: "999px", top: "320px" },   // Win animation at Seat 8
        { left: "740px", top: "460px" }    // Win animation at Seat 9
      ]
    }
  }
};

// Get current configuration based on viewport
export const getCurrentConfig = (): ViewportConfig => {
  const mode = getViewportMode();
  return viewportConfigs[mode];
};

// Helper to get specific position arrays
export const getPositionArrays = (tableSize: 6 | 9) => {
  const config = getCurrentConfig();
  const sizeKey = tableSize === 6 ? 'six' : 'nine';
  
  return {
    players: config.players[sizeKey],
    vacantPlayers: config.vacantPlayers[sizeKey],
    chips: config.chips[sizeKey],
    dealers: config.dealers[sizeKey],
    turnAnimations: config.turnAnimations[sizeKey],
    winAnimations: config.winAnimations[sizeKey]
  };
};

// Calculate dynamic zoom based on viewport
export const calculateTableZoom = (): number => {
  const mode = getViewportMode();
  const config = viewportConfigs[mode];
  
  // Base calculation can be overridden by config
  const baseWidth = 2000;
  const baseHeight = 850;
  const headerFooterHeight = 550;
  
  const availableHeight = window.innerHeight - headerFooterHeight;
  const scaleWidth = window.innerWidth / baseWidth;
  const scaleHeight = availableHeight / baseHeight;
  
  // Use config scale as a multiplier
  const calculatedScale = Math.min(scaleWidth, scaleHeight) * 1.5;
  const finalScale = calculatedScale * config.table.scale;
  
  return Math.min(finalScale, 2);
};

// Export a method to update configurations dynamically (for testing/debugging)
export const updateViewportConfig = (
  mode: string,
  updates: Partial<ViewportConfig>
): void => {
  viewportConfigs[mode] = {
    ...viewportConfigs[mode],
    ...updates
  };
};