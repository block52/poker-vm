import { useState, useEffect } from "react";
import { chipPosition } from "../utils/PositionArray";
import { useTableState } from "./useTableState";
import { ChipPositionsReturn, TableStateReturn, PositionArray } from "../types/index";

/**
 * Custom hook to manage chip positions based on table size
 * @param tableId The ID of the table
 * @param startIndex Optional starting index for reordering positions
 * @returns Object containing chip positions and utility functions
 */
export const useChipPositions = (tableId?: string, startIndex: number = 0): ChipPositionsReturn => {
  const [chipPositionArray, setChipPositionArray] = useState<PositionArray[]>([]);
  
  // Get table state to access tableSize
  const { tableSize }: TableStateReturn = useTableState(tableId);
  
  // Set initial chip positions based on table size
  useEffect(() => {
    if (!tableSize) return;
    
    switch (tableSize) {
      case 6:
        setChipPositionArray(chipPosition.six);
        break;
      case 9:
        setChipPositionArray(chipPosition.nine);
        break;
      default:
        setChipPositionArray([]);
    }
  }, [tableSize]);
  
  // Reorder positions based on startIndex if needed
  useEffect(() => {
    if (chipPositionArray.length === 0 || startIndex === 0) return;
    
    const reorderedChipArray = [
      ...chipPositionArray.slice(startIndex),
      ...chipPositionArray.slice(0, startIndex)
    ];
    
    setChipPositionArray(reorderedChipArray);
  }, [startIndex, chipPositionArray.length, chipPositionArray]);
  
  return {
    chipPositionArray,
    tableSize
  };
}; 