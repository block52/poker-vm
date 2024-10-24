import React from 'react';
import { useParams } from 'react-router-dom';
import './Game.css';

export const Game: React.FC = () => {
  const { gameId } = useParams<{ gameId: string }>();

  return (
    <div className="game-container">
      <h1>Game {gameId}</h1>
      <div className="game-content">
        <p>Game content goes here</p>
      </div>
    </div>
  );
};
