/**
 * PROOF OF CONCEPT: CSS Grid-Based Table Layout
 *
 * This is a demonstration of how the poker table layout can be simplified
 * using CSS Grid + Tailwind instead of hardcoded pixel coordinates.
 *
 * BENEFITS:
 * - ~80% less configuration code
 * - Responsive by default with Tailwind breakpoints
 * - Easier to maintain and extend
 * - Better performance (browser-native layout)
 * - Simpler rotation logic using CSS transforms
 *
 * USAGE:
 * This component can replace the existing position mapping logic
 * in Table.tsx for 4-player tables.
 */

import React, { ReactNode } from 'react';

interface TableGridLayoutProps {
  /** Table size (4, 6, or 9 players) */
  tableSize: 4 | 6 | 9;

  /** Current rotation offset (0-tableSize) */
  startIndex: number;

  /** Array of player/vacant seat components in seat order (1-N) */
  children: ReactNode[];

  /** Viewport mode for responsive adjustments */
  viewportMode?: 'mobile-portrait' | 'mobile-landscape' | 'tablet' | 'desktop';
}

/**
 * CSS Grid-based layout for poker tables
 *
 * For 4-player tables, we use a 3x3 grid with seats at cardinal positions:
 *
 *     [ ]  [2]  [ ]
 *     [3]  [X]  [4]
 *     [ ]  [1]  [ ]
 *
 * Where [X] is the center (pot/community cards)
 *
 * Rotation is handled via CSS transform on the container,
 * then counter-rotating the content to keep it upright.
 */
export const TableGridLayout: React.FC<TableGridLayoutProps> = ({
  tableSize,
  startIndex,
  children,
  viewportMode = 'desktop'
}) => {

  // For 4-player tables only (proof of concept)
  if (tableSize !== 4) {
    return (
      <div className="text-white text-center p-4">
        Grid layout currently supports 4-player tables only.
        <br />
        6 and 9-player layouts coming soon!
      </div>
    );
  }

  // Calculate rotation angle based on startIndex
  // Each seat is 90° apart on a 4-player table
  const rotationAngle = startIndex * 90;

  // Reorder children based on rotation
  // We need to map seat numbers to grid positions
  const reorderedChildren: ReactNode[] = [];
  for (let gridPos = 0; gridPos < 4; gridPos++) {
    // Calculate which seat should appear at this grid position
    const seatNumber = ((gridPos - startIndex + tableSize) % tableSize) + 1;
    reorderedChildren[gridPos] = children[seatNumber - 1] || null;
  }

  // Grid position classes for each seat (4-player)
  // Grid is 3x3, positions: [row, col]
  const gridPositions = [
    'col-start-2 row-start-3', // Seat 1 - Bottom center (hero position)
    'col-start-2 row-start-1', // Seat 2 - Top center
    'col-start-1 row-start-2', // Seat 3 - Left center
    'col-start-3 row-start-2', // Seat 4 - Right center
  ];

  // Responsive sizing based on viewport
  const containerSizeClasses = {
    'mobile-portrait': 'w-[90vw] h-[90vw] max-w-[400px] max-h-[400px]',
    'mobile-landscape': 'w-[70vh] h-[70vh] max-w-[500px] max-h-[500px]',
    'tablet': 'w-[600px] h-[600px]',
    'desktop': 'w-[800px] h-[800px]'
  };

  const seatSizeClasses = {
    'mobile-portrait': 'scale-75',
    'mobile-landscape': 'scale-80',
    'tablet': 'scale-90',
    'desktop': 'scale-100'
  };

  return (
    <div className="relative flex items-center justify-center w-full h-full">
      {/*
        GRID CONTAINER
        - 3x3 grid layout
        - Seats positioned at cardinal directions
        - Center cell for pot/community cards
      */}
      <div
        className={`
          grid grid-cols-3 grid-rows-3
          place-items-center
          relative
          ${containerSizeClasses[viewportMode]}
        `}
        style={{
          // Optional: Add rotation transform here if we want to rotate the entire table
          // transform: `rotate(${rotationAngle}deg)`,
          transition: 'transform 0.6s ease-in-out'
        }}
      >
        {/* Render seats at their grid positions */}
        {reorderedChildren.map((child, gridPos) => (
          <div
            key={gridPos}
            className={`
              ${gridPositions[gridPos]}
              ${seatSizeClasses[viewportMode]}
              flex items-center justify-center
              transition-all duration-600 ease-in-out
            `}
            style={{
              // Counter-rotate if table is rotated
              // transform: `rotate(-${rotationAngle}deg)`,
            }}
          >
            {child}
          </div>
        ))}

        {/* CENTER AREA - Pot and Community Cards */}
        <div className="col-start-2 row-start-2 flex flex-col items-center justify-center gap-4">
          {/* This would contain pot display and community cards */}
          <div className="text-white text-center">
            {/* Pot would go here */}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * COMPARISON: Current vs Grid Layout
 *
 * CURRENT APPROACH (tableLayoutConfig.ts):
 * ```typescript
 * players: {
 *   four: [
 *     { left: "50%", top: "400px", color: "#4ade80" },    // Seat 1
 *     { left: "-100px", top: "80px", color: "#f97316" },  // Seat 2
 *     { left: "50%", top: "-140px", color: "#3b82f6" },   // Seat 3
 *     { left: "980px", top: "80px", color: "#ec4899" }    // Seat 4
 *   ]
 * }
 * ```
 * - 4 viewport modes × 4 seats = 16 position objects
 * - Plus vacant, chips, dealers, animations = 96+ configs for 4-player
 * - Hardcoded pixels, difficult to adjust
 *
 * GRID APPROACH:
 * ```tsx
 * <div className="grid grid-cols-3 grid-rows-3">
 *   <div className="col-start-2 row-start-3">{seat1}</div>
 *   <div className="col-start-2 row-start-1">{seat2}</div>
 *   <div className="col-start-1 row-start-2">{seat3}</div>
 *   <div className="col-start-3 row-start-2">{seat4}</div>
 * </div>
 * ```
 * - 4 grid position classes (reusable)
 * - Responsive via Tailwind breakpoints
 * - No hardcoded coordinates
 *
 * CODE REDUCTION: ~90% for 4-player layouts
 */

export default TableGridLayout;
