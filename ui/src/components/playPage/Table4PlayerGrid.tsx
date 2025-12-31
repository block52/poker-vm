/**
 * PRODUCTION-READY: 4-Player Table with CSS Grid Layout
 *
 * This is a drop-in replacement for the 4-player table layout portion
 * of Table.tsx that uses CSS Grid instead of hardcoded positions.
 *
 * USAGE:
 * Import this component in Table.tsx and conditionally render it when tableSize === 4
 */

import React, { ReactNode } from 'react';
import './TableGridLayout.css';

interface Table4PlayerGridProps {
  /** Current rotation offset (0-3 for 4-player) */
  startIndex: number;

  /** Array of seat components in seat-number order [seat1, seat2, seat3, seat4] */
  children: [ReactNode, ReactNode, ReactNode, ReactNode];

  /** Viewport mode for responsive adjustments */
  viewportMode?: 'mobile-portrait' | 'mobile-landscape' | 'tablet' | 'desktop';

  /** Center content (pot, community cards) */
  centerContent?: ReactNode;

  /** Chip positions for each seat */
  chipComponents?: ReactNode[];

  /** Dealer button component (positioned based on dealer seat) */
  dealerButton?: ReactNode;

  /** Current dealer seat number (1-4) */
  dealerSeat?: number;

  /** Turn animation components */
  turnAnimations?: ReactNode[];

  /** Win animation components */
  winAnimations?: ReactNode[];
}

/**
 * 4-Player Table Grid Layout
 *
 * Grid structure:
 * ```
 *   [empty] [seat-2] [empty]
 *   [seat-3] [center] [seat-4]
 *   [empty] [seat-1] [empty]
 * ```
 *
 * Rotation is handled by reordering children based on startIndex
 */
export const Table4PlayerGrid: React.FC<Table4PlayerGridProps> = ({
  startIndex,
  children,
  viewportMode = 'desktop',
  centerContent,
  chipComponents = [],
  dealerButton,
  dealerSeat,
  turnAnimations = [],
  winAnimations = [],
}) => {

  // Reorder children based on rotation (startIndex)
  // Grid positions: [0=bottom, 1=top, 2=left, 3=right]
  // Seat numbers: [1=bottom by default, 2, 3, 4]
  const reorderedChildren: ReactNode[] = [];
  for (let gridPos = 0; gridPos < 4; gridPos++) {
    // Calculate which seat should appear at this grid position
    const seatNumber = ((gridPos - startIndex + 4) % 4) + 1;
    reorderedChildren[gridPos] = children[seatNumber - 1] || null;
  }

  // Calculate which grid position the dealer is at (for positioning dealer button)
  const dealerGridPosition = dealerSeat
    ? ((dealerSeat - 1 + startIndex) % 4)
    : -1;

  // Responsive container classes
  const containerClasses = {
    'mobile-portrait': 'scale-75',
    'mobile-landscape': 'scale-85',
    'tablet': 'scale-90',
    'desktop': 'scale-100',
  };

  return (
    <div className={`relative w-full h-full flex items-center justify-center ${containerClasses[viewportMode]}`}>
      {/*
        GRID LAYOUT
        - 3x3 grid
        - Seats at cardinal positions (bottom, top, left, right)
        - Center cell for pot/community cards
      */}
      <div className="table-grid-4player">

        {/* SEAT 1 (Bottom - default hero position) */}
        <div className="seat-bottom relative">
          {reorderedChildren[0]}
          {/* Chip component for bottom seat */}
          {chipComponents[((0 + startIndex) % 4)] && (
            <div className="chip-position">
              {chipComponents[((0 + startIndex) % 4)]}
            </div>
          )}
          {/* Dealer button if dealer is at bottom */}
          {dealerGridPosition === 0 && dealerButton && (
            <div className="dealer-button">
              {dealerButton}
            </div>
          )}
          {/* Turn animation */}
          {turnAnimations[((0 + startIndex) % 4)]}
          {/* Win animation */}
          {winAnimations[((0 + startIndex) % 4)]}
        </div>

        {/* SEAT 2 (Top) */}
        <div className="seat-top relative">
          {reorderedChildren[1]}
          {chipComponents[((1 + startIndex) % 4)] && (
            <div className="chip-position">
              {chipComponents[((1 + startIndex) % 4)]}
            </div>
          )}
          {dealerGridPosition === 1 && dealerButton && (
            <div className="dealer-button">
              {dealerButton}
            </div>
          )}
          {turnAnimations[((1 + startIndex) % 4)]}
          {winAnimations[((1 + startIndex) % 4)]}
        </div>

        {/* SEAT 3 (Left) */}
        <div className="seat-left relative">
          {reorderedChildren[2]}
          {chipComponents[((2 + startIndex) % 4)] && (
            <div className="chip-position">
              {chipComponents[((2 + startIndex) % 4)]}
            </div>
          )}
          {dealerGridPosition === 2 && dealerButton && (
            <div className="dealer-button">
              {dealerButton}
            </div>
          )}
          {turnAnimations[((2 + startIndex) % 4)]}
          {winAnimations[((2 + startIndex) % 4)]}
        </div>

        {/* SEAT 4 (Right) */}
        <div className="seat-right relative">
          {reorderedChildren[3]}
          {chipComponents[((3 + startIndex) % 4)] && (
            <div className="chip-position">
              {chipComponents[((3 + startIndex) % 4)]}
            </div>
          )}
          {dealerGridPosition === 3 && dealerButton && (
            <div className="dealer-button">
              {dealerButton}
            </div>
          )}
          {turnAnimations[((3 + startIndex) % 4)]}
          {winAnimations[((3 + startIndex) % 4)]}
        </div>

        {/* CENTER AREA - Pot and Community Cards */}
        <div className="seat-center">
          {centerContent}
        </div>

      </div>
    </div>
  );
};

export default Table4PlayerGrid;
