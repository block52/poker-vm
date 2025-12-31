/**
 * PRODUCTION-READY: 9-Player Table with CSS Grid Layout
 *
 * This is a drop-in replacement for the 9-player table layout portion
 * of Table.tsx that uses CSS Grid instead of hardcoded positions.
 *
 * LAYOUT PATTERN (Elliptical - 9 seats):
 * ```
 *      [seat-4] [seat-5] [seat-6] [seat-7]
 *   [seat-3]         [center]         [seat-8]
 *      [seat-2]  [seat-1]  [seat-9]
 * ```
 *
 * USAGE:
 * Import this component in Table.tsx and conditionally render it when tableSize === 9
 */

import React, { ReactNode } from 'react';
import './TableGridLayout.css';

interface Table9PlayerGridProps {
  /** Current rotation offset (0-8 for 9-player) */
  startIndex: number;

  /** Array of seat components in seat-number order [seat1, ..., seat9] */
  children: [
    ReactNode, ReactNode, ReactNode, ReactNode, ReactNode,
    ReactNode, ReactNode, ReactNode, ReactNode
  ];

  /** Viewport mode for responsive adjustments */
  viewportMode?: 'mobile-portrait' | 'mobile-landscape' | 'tablet' | 'desktop';

  /** Center content (pot, community cards) */
  centerContent?: ReactNode;

  /** Chip positions for each seat */
  chipComponents?: ReactNode[];

  /** Dealer button component (positioned based on dealer seat) */
  dealerButton?: ReactNode;

  /** Current dealer seat number (1-9) */
  dealerSeat?: number;

  /** Turn animation components */
  turnAnimations?: ReactNode[];

  /** Win animation components */
  winAnimations?: ReactNode[];
}

/**
 * 9-Player Table Grid Layout
 *
 * Grid structure (5x4 grid for elliptical layout):
 * ```
 *   [empty] [seat-4] [seat-5] [seat-6] [seat-7] [empty]
 *   [seat-3]  [center] [center] [center]  [seat-8]
 *   [empty] [seat-2] [seat-1] [seat-9] [empty]
 * ```
 *
 * Rotation is handled by reordering children based on startIndex
 */
export const Table9PlayerGrid: React.FC<Table9PlayerGridProps> = ({
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
  // Grid positions: [0=bottom-center, 1=bottom-left, 2=left, 3=top-left-corner, 4=top-left, 5=top-right, 6=top-right-corner, 7=right, 8=bottom-right]
  // Seat numbers: [1-9]
  const reorderedChildren: ReactNode[] = [];
  for (let gridPos = 0; gridPos < 9; gridPos++) {
    // Calculate which seat should appear at this grid position
    const seatNumber = ((gridPos - startIndex + 9) % 9) + 1;
    reorderedChildren[gridPos] = children[seatNumber - 1] || null;
  }

  // Calculate which grid position the dealer is at (for positioning dealer button)
  const dealerGridPosition = dealerSeat
    ? ((dealerSeat - 1 + startIndex) % 9)
    : -1;

  // Responsive container classes
  const containerClasses = {
    'mobile-portrait': 'scale-65',
    'mobile-landscape': 'scale-75',
    'tablet': 'scale-85',
    'desktop': 'scale-100',
  };

  return (
    <div className={`relative w-full h-full flex items-center justify-center ${containerClasses[viewportMode]}`}>
      {/*
        GRID LAYOUT
        - 6x3 grid
        - Seats at elliptical positions (9 seats around center)
        - Center spans 3 columns for pot/community cards
      */}
      <div className="table-grid-9player">

        {/* SEAT 1 (Bottom-center - default hero position) */}
        <div className="seat-9p-bottom-center relative">
          {reorderedChildren[0]}
          {chipComponents[((0 + startIndex) % 9)] && (
            <div className="chip-position">{chipComponents[((0 + startIndex) % 9)]}</div>
          )}
          {dealerGridPosition === 0 && dealerButton && (
            <div className="dealer-button">{dealerButton}</div>
          )}
          {turnAnimations[((0 + startIndex) % 9)]}
          {winAnimations[((0 + startIndex) % 9)]}
        </div>

        {/* SEAT 2 (Bottom-left) */}
        <div className="seat-9p-bottom-left relative">
          {reorderedChildren[1]}
          {chipComponents[((1 + startIndex) % 9)] && (
            <div className="chip-position">{chipComponents[((1 + startIndex) % 9)]}</div>
          )}
          {dealerGridPosition === 1 && dealerButton && (
            <div className="dealer-button">{dealerButton}</div>
          )}
          {turnAnimations[((1 + startIndex) % 9)]}
          {winAnimations[((1 + startIndex) % 9)]}
        </div>

        {/* SEAT 3 (Left) */}
        <div className="seat-9p-left relative">
          {reorderedChildren[2]}
          {chipComponents[((2 + startIndex) % 9)] && (
            <div className="chip-position">{chipComponents[((2 + startIndex) % 9)]}</div>
          )}
          {dealerGridPosition === 2 && dealerButton && (
            <div className="dealer-button">{dealerButton}</div>
          )}
          {turnAnimations[((2 + startIndex) % 9)]}
          {winAnimations[((2 + startIndex) % 9)]}
        </div>

        {/* SEAT 4 (Top-left-corner) */}
        <div className="seat-9p-top-left-corner relative">
          {reorderedChildren[3]}
          {chipComponents[((3 + startIndex) % 9)] && (
            <div className="chip-position">{chipComponents[((3 + startIndex) % 9)]}</div>
          )}
          {dealerGridPosition === 3 && dealerButton && (
            <div className="dealer-button">{dealerButton}</div>
          )}
          {turnAnimations[((3 + startIndex) % 9)]}
          {winAnimations[((3 + startIndex) % 9)]}
        </div>

        {/* SEAT 5 (Top-left) */}
        <div className="seat-9p-top-left relative">
          {reorderedChildren[4]}
          {chipComponents[((4 + startIndex) % 9)] && (
            <div className="chip-position">{chipComponents[((4 + startIndex) % 9)]}</div>
          )}
          {dealerGridPosition === 4 && dealerButton && (
            <div className="dealer-button">{dealerButton}</div>
          )}
          {turnAnimations[((4 + startIndex) % 9)]}
          {winAnimations[((4 + startIndex) % 9)]}
        </div>

        {/* SEAT 6 (Top-right) */}
        <div className="seat-9p-top-right relative">
          {reorderedChildren[5]}
          {chipComponents[((5 + startIndex) % 9)] && (
            <div className="chip-position">{chipComponents[((5 + startIndex) % 9)]}</div>
          )}
          {dealerGridPosition === 5 && dealerButton && (
            <div className="dealer-button">{dealerButton}</div>
          )}
          {turnAnimations[((5 + startIndex) % 9)]}
          {winAnimations[((5 + startIndex) % 9)]}
        </div>

        {/* SEAT 7 (Top-right-corner) */}
        <div className="seat-9p-top-right-corner relative">
          {reorderedChildren[6]}
          {chipComponents[((6 + startIndex) % 9)] && (
            <div className="chip-position">{chipComponents[((6 + startIndex) % 9)]}</div>
          )}
          {dealerGridPosition === 6 && dealerButton && (
            <div className="dealer-button">{dealerButton}</div>
          )}
          {turnAnimations[((6 + startIndex) % 9)]}
          {winAnimations[((6 + startIndex) % 9)]}
        </div>

        {/* SEAT 8 (Right) */}
        <div className="seat-9p-right relative">
          {reorderedChildren[7]}
          {chipComponents[((7 + startIndex) % 9)] && (
            <div className="chip-position">{chipComponents[((7 + startIndex) % 9)]}</div>
          )}
          {dealerGridPosition === 7 && dealerButton && (
            <div className="dealer-button">{dealerButton}</div>
          )}
          {turnAnimations[((7 + startIndex) % 9)]}
          {winAnimations[((7 + startIndex) % 9)]}
        </div>

        {/* SEAT 9 (Bottom-right) */}
        <div className="seat-9p-bottom-right relative">
          {reorderedChildren[8]}
          {chipComponents[((8 + startIndex) % 9)] && (
            <div className="chip-position">{chipComponents[((8 + startIndex) % 9)]}</div>
          )}
          {dealerGridPosition === 8 && dealerButton && (
            <div className="dealer-button">{dealerButton}</div>
          )}
          {turnAnimations[((8 + startIndex) % 9)]}
          {winAnimations[((8 + startIndex) % 9)]}
        </div>

        {/* CENTER AREA - Pot and Community Cards */}
        <div className="seat-9p-center">
          {centerContent}
        </div>

      </div>
    </div>
  );
};

export default Table9PlayerGrid;
