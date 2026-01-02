/**
 * PRODUCTION-READY: 6-Player Table with CSS Grid Layout
 *
 * This is a drop-in replacement for the 6-player table layout portion
 * of Table.tsx that uses CSS Grid instead of hardcoded positions.
 *
 * LAYOUT PATTERN (Hexagon):
 * ```
 *      [seat-3]  [seat-4]
 *   [seat-2]   [center]   [seat-5]
 *      [seat-1]  [seat-6]
 * ```
 *
 * USAGE:
 * Import this component in Table.tsx and conditionally render it when tableSize === 6
 */

import React, { ReactNode } from 'react';
import './TableGridLayout.css';

interface Table6PlayerGridProps {
  /** Current rotation offset (0-5 for 6-player) */
  startIndex: number;

  /** Array of seat components in seat-number order [seat1, seat2, ..., seat6] */
  children: [ReactNode, ReactNode, ReactNode, ReactNode, ReactNode, ReactNode];

  /** Viewport mode for responsive adjustments */
  viewportMode?: 'mobile-portrait' | 'mobile-landscape' | 'tablet' | 'desktop';

  /** Center content (pot, community cards) */
  centerContent?: ReactNode;

  /** Chip positions for each seat */
  chipComponents?: ReactNode[];

  /** Dealer button component (positioned based on dealer seat) */
  dealerButton?: ReactNode;

  /** Current dealer seat number (1-6) */
  dealerSeat?: number;

  /** Turn animation components */
  turnAnimations?: ReactNode[];

  /** Win animation components */
  winAnimations?: ReactNode[];
}

/**
 * 6-Player Table Grid Layout
 *
 * Grid structure (4x3 grid):
 * ```
 *   [empty] [seat-3] [seat-4] [empty]
 *   [seat-2] [center] [center] [seat-5]
 *   [empty] [seat-1] [seat-6] [empty]
 * ```
 *
 * Rotation is handled by reordering children based on startIndex
 */
export const Table6PlayerGrid: React.FC<Table6PlayerGridProps> = ({
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
  // Grid positions: [0=bottom-left, 1=left, 2=top-left, 3=top-right, 4=right, 5=bottom-right]
  // Seat numbers: [1=bottom-left by default, 2, 3, 4, 5, 6]
  const reorderedChildren: ReactNode[] = [];
  for (let gridPos = 0; gridPos < 6; gridPos++) {
    // Calculate which seat should appear at this grid position
    const seatNumber = ((gridPos - startIndex + 6) % 6) + 1;
    reorderedChildren[gridPos] = children[seatNumber - 1] || null;
  }

  // Calculate which grid position the dealer is at (for positioning dealer button)
  const dealerGridPosition = dealerSeat
    ? ((dealerSeat - 1 + startIndex) % 6)
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
        - 4x3 grid
        - Seats at hexagonal positions
        - Center spans 2 columns for pot/community cards
      */}
      <div className="table-grid-6player">

        {/* SEAT 1 (Bottom-left - default hero position) */}
        <div className="seat-6p-bottom-left relative">
          {reorderedChildren[0]}
          {/* Chip component for bottom-left seat */}
          {chipComponents[((0 + startIndex) % 6)] && (
            <div className="chip-position">
              {chipComponents[((0 + startIndex) % 6)]}
            </div>
          )}
          {/* Dealer button if dealer is at bottom-left */}
          {dealerGridPosition === 0 && dealerButton && (
            <div className="dealer-button">
              {dealerButton}
            </div>
          )}
          {/* Turn animation */}
          {turnAnimations[((0 + startIndex) % 6)]}
          {/* Win animation */}
          {winAnimations[((0 + startIndex) % 6)]}
        </div>

        {/* SEAT 2 (Left) */}
        <div className="seat-6p-left relative">
          {reorderedChildren[1]}
          {chipComponents[((1 + startIndex) % 6)] && (
            <div className="chip-position">
              {chipComponents[((1 + startIndex) % 6)]}
            </div>
          )}
          {dealerGridPosition === 1 && dealerButton && (
            <div className="dealer-button">
              {dealerButton}
            </div>
          )}
          {turnAnimations[((1 + startIndex) % 6)]}
          {winAnimations[((1 + startIndex) % 6)]}
        </div>

        {/* SEAT 3 (Top-left) */}
        <div className="seat-6p-top-left relative">
          {reorderedChildren[2]}
          {chipComponents[((2 + startIndex) % 6)] && (
            <div className="chip-position">
              {chipComponents[((2 + startIndex) % 6)]}
            </div>
          )}
          {dealerGridPosition === 2 && dealerButton && (
            <div className="dealer-button">
              {dealerButton}
            </div>
          )}
          {turnAnimations[((2 + startIndex) % 6)]}
          {winAnimations[((2 + startIndex) % 6)]}
        </div>

        {/* SEAT 4 (Top-right) */}
        <div className="seat-6p-top-right relative">
          {reorderedChildren[3]}
          {chipComponents[((3 + startIndex) % 6)] && (
            <div className="chip-position">
              {chipComponents[((3 + startIndex) % 6)]}
            </div>
          )}
          {dealerGridPosition === 3 && dealerButton && (
            <div className="dealer-button">
              {dealerButton}
            </div>
          )}
          {turnAnimations[((3 + startIndex) % 6)]}
          {winAnimations[((3 + startIndex) % 6)]}
        </div>

        {/* SEAT 5 (Right) */}
        <div className="seat-6p-right relative">
          {reorderedChildren[4]}
          {chipComponents[((4 + startIndex) % 6)] && (
            <div className="chip-position">
              {chipComponents[((4 + startIndex) % 6)]}
            </div>
          )}
          {dealerGridPosition === 4 && dealerButton && (
            <div className="dealer-button">
              {dealerButton}
            </div>
          )}
          {turnAnimations[((4 + startIndex) % 6)]}
          {winAnimations[((4 + startIndex) % 6)]}
        </div>

        {/* SEAT 6 (Bottom-right) */}
        <div className="seat-6p-bottom-right relative">
          {reorderedChildren[5]}
          {chipComponents[((5 + startIndex) % 6)] && (
            <div className="chip-position">
              {chipComponents[((5 + startIndex) % 6)]}
            </div>
          )}
          {dealerGridPosition === 5 && dealerButton && (
            <div className="dealer-button">
              {dealerButton}
            </div>
          )}
          {turnAnimations[((5 + startIndex) % 6)]}
          {winAnimations[((5 + startIndex) % 6)]}
        </div>

        {/* CENTER AREA - Pot and Community Cards */}
        <div className="seat-6p-center">
          {centerContent}
        </div>

      </div>
    </div>
  );
};

export default Table6PlayerGrid;
