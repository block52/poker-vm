import useSWR from "swr";
import axios from "axios";
import { PROXY_URL } from "../config/constants";
import { dealerPosition } from "../utils/PositionArray";

// Define the fetcher function
const fetcher = (url: string) => 
  axios.get(url).then(res => res.data);

/**
 * Custom hook to fetch and provide dealer button position
 * @param tableId The ID of the table to fetch state for
 * @returns Object containing dealer button position and visibility state
 */
export const useDealerPosition = (tableId?: string) => {
  // Skip the request if no tableId is provided
  const { data, error, isLoading } = useSWR(
    tableId ? `${PROXY_URL}/get_game_state/${tableId}` : null,
    fetcher,
    {
      refreshInterval: 5000,
      revalidateOnFocus: true
    }
  );

  // Default values in case of error or loading
  const defaultState = {
    dealerButtonPosition: { left: "0px", top: "0px" },
    isDealerButtonVisible: false,
    isLoading,
    error
  };

  // If still loading or error occurred, return default values
  if (isLoading || error || !data) {
    return defaultState;
  }

  try {
    // Extract table data from the response (handling different API response structures)
    const tableData = data.data || data;
    
    if (!tableData) {
      console.warn("No table data found in API response");
      return defaultState;
    }

    // Default state if dealer position isn't set
    let dealerButtonPosition = { left: "0px", top: "0px" };
    let isDealerButtonVisible = false;

    // Handle dealer button
    if (tableData.dealer !== undefined && tableData.dealer !== null) {
      // If dealer position is 9, treat it as 0 for UI consistency
      const dealerSeat = tableData.dealer === 9 ? 0 : tableData.dealer;
      const dealerPos = dealerPosition.nine[dealerSeat];

      if (dealerPos) {
        // Set the position based on dealer's seat
        dealerButtonPosition = {
          left: dealerPos.left,
          top: dealerPos.top
        };
        isDealerButtonVisible = true;
      }
    }

    return {
      dealerButtonPosition,
      isDealerButtonVisible,
      isLoading: false,
      error: null
    };
  } catch (err) {
    console.error("Error parsing dealer position:", err);
    return {
      ...defaultState,
      error: err
    };
  }
}; 