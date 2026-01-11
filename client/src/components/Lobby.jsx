import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';

const CATEGORIES = [
  { id: 'animals', name: 'Animals', icon: '🐾' },
  { id: 'food', name: 'Food', icon: '🍕' },
  { id: 'movies', name: 'Movies', icon: '🎬' },
  { id: 'countries', name: 'Countries', icon: '🌍' },
  { id: 'occupations', name: 'Occupations', icon: '👔' },
  { id: 'sports', name: 'Sports', icon: '⚽' }
];

export default function Lobby({ socket }) {
  const { gameState, updateState } = useGame();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!gameState.roomCode) {
      navigate('/');
    }
  }, [gameState.roomCode, navigate]);

  const copyCode = () => {
    navigator.clipboard.writeText(gameState.roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyLink = () => {
    const link = `${window.location.origin}/join/${gameState.shareId}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCategoryChange = (categoryId) => {
    if (!gameState.isHost) return;

    socket.emit('set-category', { category: categoryId }, (response) => {
      if (response?.success) {
        updateState({ category: categoryId });
      }
    });
  };

  const startGame = () => {
    socket.emit('start-game', (response) => {
      if (!response.success) {
        setError(response.error);
      }
    });
  };

  const canStart = gameState.players.length >= 3;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="max-w-lg w-full">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-300 mb-2">Room Code</h2>
          <div className="flex items-center justify-center gap-3">
            <span className="text-5xl font-mono font-bold tracking-widest text-white">
              {gameState.roomCode}
            </span>
            <button
              onClick={copyCode}
              className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              title="Copy code"
            >
              {copied ? '✓' : '📋'}
            </button>
          </div>
          <button
            onClick={copyLink}
            className="mt-2 text-purple-400 hover:text-purple-300 text-sm"
          >
            Copy invite link
          </button>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500 rounded-lg p-3 mb-4 text-center">
            {error}
          </div>
        )}

        <div className="bg-gray-800/50 backdrop-blur rounded-xl p-6 shadow-2xl mb-4">
          <h3 className="text-lg font-semibold mb-4 text-gray-300">
            Players ({gameState.players.length})
          </h3>
          <div className="space-y-2 mb-6">
            {gameState.players.map((player, index) => (
              <div
                key={player.id}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  player.id === gameState.playerId
                    ? 'bg-purple-600/30 border border-purple-500'
                    : 'bg-gray-700/50'
                }`}
              >
                <span className="font-medium">
                  {player.name}
                  {player.id === gameState.playerId && (
                    <span className="ml-2 text-xs text-purple-300">(You)</span>
                  )}
                </span>
                {index === 0 && (
                  <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded">
                    Host
                  </span>
                )}
              </div>
            ))}
          </div>

          {gameState.players.length < 3 && (
            <p className="text-center text-gray-400 text-sm mb-4">
              Waiting for more players... (need at least 3)
            </p>
          )}
        </div>

        {gameState.isHost && (
          <div className="bg-gray-800/50 backdrop-blur rounded-xl p-6 shadow-2xl mb-4">
            <h3 className="text-lg font-semibold mb-4 text-gray-300">Category</h3>
            <div className="grid grid-cols-3 gap-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryChange(cat.id)}
                  className={`p-3 rounded-lg text-sm font-medium transition-all ${
                    gameState.category === cat.id
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
                  }`}
                >
                  <span className="text-xl">{cat.icon}</span>
                  <div>{cat.name}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {!gameState.isHost && (
          <div className="bg-gray-800/50 backdrop-blur rounded-xl p-4 mb-4 text-center">
            <p className="text-gray-400">
              Category: <span className="text-white font-medium">
                {CATEGORIES.find(c => c.id === gameState.category)?.name || gameState.category}
              </span>
            </p>
          </div>
        )}

        {gameState.isHost ? (
          <button
            onClick={startGame}
            disabled={!canStart}
            className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 rounded-xl font-bold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {canStart ? 'Start Game' : `Need ${3 - gameState.players.length} more players`}
          </button>
        ) : (
          <div className="text-center text-gray-400">
            Waiting for host to start the game...
          </div>
        )}
      </div>
    </div>
  );
}
