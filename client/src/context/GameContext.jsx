import { createContext, useContext, useState, useCallback } from 'react';

const GameContext = createContext(null);

export function GameProvider({ children }) {
  const [gameState, setGameState] = useState({
    roomCode: null,
    shareId: null,
    playerId: null,
    playerName: '',
    isHost: false,
    players: [],
    state: 'home',
    isImposter: false,
    word: null,
    currentTurnId: null,
    hints: [],
    messages: [],
    round: 0,
    totalRounds: 5,
    category: 'animals',
    imposterCount: 1,
    scores: [],
    voteResults: null
  });

  const updateState = useCallback((updates) => {
    setGameState(prev => ({ ...prev, ...updates }));
  }, []);

  const resetGame = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      state: 'lobby',
      isImposter: false,
      word: null,
      currentTurnId: null,
      hints: [],
      messages: [],
      round: 0,
      voteResults: null
    }));
  }, []);

  return (
    <GameContext.Provider value={{ gameState, updateState, resetGame }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within GameProvider');
  }
  return context;
}
