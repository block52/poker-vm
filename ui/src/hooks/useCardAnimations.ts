import { useState, useEffect } from "react";
import useSWR from "swr";
import axios from "axios";
import { PROXY_URL } from "../config/constants";

// Define the fetcher function
const fetcher = (url: string) => 
  axios.get(url).then(res => res.data);

/**
 * Custom hook to handle card animations
 * @param tableId The ID of the table
 * @returns Object containing animation state for cards
 */
export const useCardAnimations = (tableId?: string) => {
  const [flipped1, setFlipped1] = useState(false);
  const [flipped2, setFlipped2] = useState(false);
  const [flipped3, setFlipped3] = useState(false);
  
  // Get the data to determine if we should show animations
  const { data } = useSWR(
    tableId ? `${PROXY_URL}/get_game_state/${tableId}` : null,
    fetcher,
    {
      refreshInterval: 5000,
      revalidateOnFocus: true
    }
  );
  
  // Derived state to replace showThreeCards
  const showThreeCards = data?.data?.communityCards?.length >= 3 || data?.communityCards?.length >= 3;
  
  // Function to animate card flipping
  const threeCardsTable = () => {
    setTimeout(() => {
      setFlipped1(true);
    }, 1000);
    setTimeout(() => {
      setFlipped2(true);
    }, 1100);
    setTimeout(() => {
      setFlipped3(true);
    }, 1200);
  };
  
  // Effect to trigger animations when cards should be shown
  useEffect(() => {
    if (showThreeCards) {
      threeCardsTable();
    }
  }, [showThreeCards]);
  
  return {
    flipped1,
    flipped2,
    flipped3,
    showThreeCards
  };
}; 