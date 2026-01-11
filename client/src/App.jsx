import { useEffect } from 'react';
import { Routes, Route, useNavigate, useParams } from 'react-router-dom';
import { GameProvider, useGame } from './context/GameContext';
import { useSocket } from './hooks/useSocket';
import Home from './components/Home';
import Lobby from './components/Lobby';
import Game from './components/Game';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

function AppContent() {
  const { socket, isConnected } = useSocket();
  const { gameState, updateState, resetGame } = useGame();
  const navigate = useNavigate();

  useEffect(() => {
    if (!socket) return;

    socket.on('player-joined', ({ players }) => {
      updateState({ players });
    });

    socket.on('player-left', ({ players, newHostId }) => {
      updateState({
        players,
        isHost: newHostId === gameState.playerId
      });
    });

    socket.on('category-changed', ({ category }) => {
      updateState({ category });
    });

    socket.on('game-started', (data) => {
      updateState({
        state: 'playing',
        isImposter: data.isImposter,
        word: data.word,
        players: data.players,
        currentTurnId: data.currentTurnId,
        round: data.round,
        totalRounds: data.totalRounds,
        hints: [],
        messages: []
      });
      navigate('/game');
    });

    socket.on('hint-submitted', ({ playerId, playerName, hint, nextPlayerId }) => {
      updateState({
        hints: [...gameState.hints, { playerId, playerName, hint }],
        currentTurnId: nextPlayerId
      });
    });

    socket.on('all-hints-complete', ({ hints }) => {
      updateState({ hints });
    });

    socket.on('discussion-started', ({ duration }) => {
      updateState({ state: 'discussion' });
    });

    socket.on('new-message', (msg) => {
      updateState({ messages: [...gameState.messages, msg] });
    });

    socket.on('voting-started', ({ players }) => {
      updateState({ state: 'voting', players });
    });

    socket.on('vote-submitted', ({ voteCount, totalPlayers }) => {
      updateState({ voteCount, totalPlayers });
    });

    socket.on('vote-results', (results) => {
      updateState({
        state: 'reveal',
        voteResults: results,
        scores: results.scores
      });
    });

    socket.on('imposter-guessed', ({ correct, guess, actualWord, scores }) => {
      updateState({ imposterGuessResult: { correct, guess, actualWord }, scores });
    });

    socket.on('round-started', (data) => {
      updateState({
        state: 'playing',
        isImposter: data.isImposter,
        word: data.word,
        currentTurnId: data.currentTurnId,
        round: data.round,
        totalRounds: data.totalRounds,
        hints: [],
        messages: [],
        voteResults: null,
        imposterGuessResult: null
      });
    });

    socket.on('game-ended', ({ finalScores, winner }) => {
      updateState({
        state: 'ended',
        finalScores,
        winner
      });
    });

    socket.on('game-reset', ({ players }) => {
      resetGame();
      updateState({ players });
      navigate('/lobby');
    });

    return () => {
      socket.off('player-joined');
      socket.off('player-left');
      socket.off('category-changed');
      socket.off('game-started');
      socket.off('hint-submitted');
      socket.off('all-hints-complete');
      socket.off('discussion-started');
      socket.off('new-message');
      socket.off('voting-started');
      socket.off('vote-submitted');
      socket.off('vote-results');
      socket.off('imposter-guessed');
      socket.off('round-started');
      socket.off('game-ended');
      socket.off('game-reset');
    };
  }, [socket, gameState.playerId, gameState.hints, gameState.messages]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      <Routes>
        <Route path="/" element={<Home socket={socket} isConnected={isConnected} />} />
        <Route path="/join/:shareId" element={<JoinByLink socket={socket} />} />
        <Route path="/lobby" element={<Lobby socket={socket} />} />
        <Route path="/game" element={<Game socket={socket} />} />
      </Routes>
    </div>
  );
}

function JoinByLink({ socket }) {
  const { shareId } = useParams();
  const navigate = useNavigate();
  const { updateState } = useGame();

  useEffect(() => {
    async function fetchRoom() {
      try {
        const res = await fetch(`${SERVER_URL}/api/room/${shareId}`);
        const data = await res.json();
        if (data.code) {
          updateState({ pendingJoinCode: data.code });
          navigate('/');
        }
      } catch (err) {
        navigate('/');
      }
    }
    fetchRoom();
  }, [shareId, navigate, updateState]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-xl">Joining room...</p>
    </div>
  );
}

export default function App() {
  return (
    <GameProvider>
      <AppContent />
    </GameProvider>
  );
}
