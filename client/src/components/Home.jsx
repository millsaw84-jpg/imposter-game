import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';

export default function Home({ socket, isConnected }) {
  const [playerName, setPlayerName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');
  const [gameMode, setGameMode] = useState(null); // null, 'online', 'local'
  const [mode, setMode] = useState(null); // null, 'create', 'join'
  const { gameState, updateState } = useGame();
  const navigate = useNavigate();

  useEffect(() => {
    if (gameState.pendingJoinCode) {
      setJoinCode(gameState.pendingJoinCode);
      setGameMode('online');
      setMode('join');
      updateState({ pendingJoinCode: null });
    }
  }, [gameState.pendingJoinCode, updateState]);

  const handleCreate = () => {
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }

    socket.emit('create-room', { playerName: playerName.trim() }, (response) => {
      if (response.success) {
        updateState({
          roomCode: response.code,
          shareId: response.shareId,
          playerId: response.playerId,
          playerName: playerName.trim(),
          isHost: true,
          state: 'lobby',
          players: [{ id: response.playerId, name: playerName.trim(), score: 0 }]
        });
        navigate('/lobby');
      } else {
        setError(response.error || 'Failed to create room');
      }
    });
  };

  const handleJoin = () => {
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }
    if (!joinCode.trim()) {
      setError('Please enter a room code');
      return;
    }

    socket.emit('join-room', {
      code: joinCode.trim().toUpperCase(),
      playerName: playerName.trim()
    }, (response) => {
      if (response.success) {
        updateState({
          roomCode: response.code,
          shareId: response.shareId,
          playerId: response.playerId,
          playerName: playerName.trim(),
          isHost: response.isHost,
          state: 'lobby',
          players: response.players,
          category: response.category
        });
        navigate('/lobby');
      } else {
        setError(response.error || 'Failed to join room');
      }
    });
  };

  // Game mode selection
  if (gameMode === null) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="max-w-md w-full">
          <h1 className="text-5xl font-bold text-center mb-2 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
            IMPOSTER
          </h1>
          <p className="text-gray-400 text-center mb-8">Find the imposter... or blend in</p>

          <div className="space-y-4">
            <button
              onClick={() => setGameMode('online')}
              className="w-full p-6 bg-gray-800/50 backdrop-blur rounded-xl shadow-2xl hover:bg-gray-700/50 transition-all border-2 border-transparent hover:border-purple-500"
            >
              <div className="text-2xl mb-2">🌐</div>
              <h3 className="text-xl font-bold mb-1">Online</h3>
              <p className="text-gray-400 text-sm">Play with friends on different devices</p>
            </button>

            <button
              onClick={() => navigate('/pass-and-play')}
              className="w-full p-6 bg-gray-800/50 backdrop-blur rounded-xl shadow-2xl hover:bg-gray-700/50 transition-all border-2 border-transparent hover:border-pink-500"
            >
              <div className="text-2xl mb-2">📱</div>
              <h3 className="text-xl font-bold mb-1">Pass & Play</h3>
              <p className="text-gray-400 text-sm">Play in person on one device</p>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Online mode
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="max-w-md w-full">
        <button
          onClick={() => {
            setGameMode(null);
            setMode(null);
            setError('');
          }}
          className="mb-6 text-gray-400 hover:text-white"
        >
          ← Back
        </button>

        <h1 className="text-5xl font-bold text-center mb-2 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
          IMPOSTER
        </h1>
        <p className="text-gray-400 text-center mb-8">Online Mode</p>

        {!isConnected && (
          <div className="bg-red-500/20 border border-red-500 rounded-lg p-3 mb-4 text-center">
            Connecting to server...
          </div>
        )}

        {error && (
          <div className="bg-red-500/20 border border-red-500 rounded-lg p-3 mb-4 text-center">
            {error}
          </div>
        )}

        <div className="bg-gray-800/50 backdrop-blur rounded-xl p-6 shadow-2xl">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Your Name
            </label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Enter your name"
              className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-gray-400"
              maxLength={20}
            />
          </div>

          {mode === null && (
            <div className="space-y-3">
              <button
                onClick={() => setMode('create')}
                disabled={!isConnected}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Room
              </button>
              <button
                onClick={() => setMode('join')}
                disabled={!isConnected}
                className="w-full py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Join Room
              </button>
            </div>
          )}

          {mode === 'create' && (
            <div className="space-y-3">
              <button
                onClick={handleCreate}
                disabled={!isConnected}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-lg font-semibold transition-all disabled:opacity-50"
              >
                Create Room
              </button>
              <button
                onClick={() => setMode(null)}
                className="w-full py-2 text-gray-400 hover:text-white transition-colors"
              >
                Back
              </button>
            </div>
          )}

          {mode === 'join' && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Room Code
                </label>
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="Enter room code"
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-gray-400 uppercase tracking-widest text-center text-xl"
                  maxLength={6}
                />
              </div>
              <button
                onClick={handleJoin}
                disabled={!isConnected}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-lg font-semibold transition-all disabled:opacity-50"
              >
                Join Room
              </button>
              <button
                onClick={() => setMode(null)}
                className="w-full py-2 text-gray-400 hover:text-white transition-colors"
              >
                Back
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
