import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getSocket, connectSocket } from '../services/socket';
import { getSession, saveSession } from '../services/session';
import { useUserStore, useRoomStore } from '../store';

export function HomePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [name, setName] = useState('');
  const [roomName, setRoomName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { setUser, setUserName, setConnected } = useUserStore();
  const { setRoom, setUsers, setTasks, setVotes, setCurrentTaskId } = useRoomStore();

  const roomIdFromUrl = searchParams.get('room');

  // Check for existing session and redirect to room
  useEffect(() => {
    if (!roomIdFromUrl) return;

    const session = getSession(roomIdFromUrl);
    if (session) {
      // Session exists, redirect to room page which will handle rejoin
      navigate(`/room/${roomIdFromUrl}`, { replace: true });
    }
  }, [roomIdFromUrl, navigate]);

  useEffect(() => {
    const socket = getSocket();
    let pendingUser: { id: string; name: string } | null = null;

    socket.on('user:registered', ({ user }) => {
      setUser(user);
      pendingUser = { id: user.id, name: user.name };
    });

    socket.on('room:created', ({ room }) => {
      setRoom(room);
    });

    socket.on('room:joined', (state) => {
      setRoom(state.room);
      setUsers(state.users);
      setTasks(state.tasks);
      setVotes(state.votes);
      setCurrentTaskId(state.room.currentTaskId);
      
      // Save session using the pending user (set during user:registered)
      if (pendingUser) {
        saveSession(state.room.id, pendingUser.id, pendingUser.name);
      }
      
      navigate(`/room/${state.room.id}`);
    });

    socket.on('error', ({ message }) => {
      setError(message);
      setIsLoading(false);
    });

    socket.on('connect', () => {
      setConnected(true);
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    return () => {
      socket.off('user:registered');
      socket.off('room:created');
      socket.off('room:joined');
      socket.off('error');
      socket.off('connect');
      socket.off('disconnect');
    };
  }, [navigate, setUser, setRoom, setUsers, setTasks, setVotes, setCurrentTaskId, setConnected]);

  const handleSubmit = async (e: React.FormEvent, action: 'create' | 'join') => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await connectSocket();
      const socket = getSocket();
      
      setUserName(name);
      socket.emit('user:register', { name });

      if (action === 'create') {
        if (!roomName.trim()) {
          setError('Please enter a room name');
          setIsLoading(false);
          return;
        }
        socket.emit('room:create', { name: roomName });
      } else {
        if (!roomIdFromUrl) {
          setError('No room ID provided');
          setIsLoading(false);
          return;
        }
        socket.emit('room:join', { roomId: roomIdFromUrl });
      }
    } catch (err) {
      setError('Failed to connect to server');
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-2">Welcome to Planning Poker</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Estimate your sprint tasks with your team in real-time
        </p>
      </div>

      <div className="card p-8 w-full max-w-md">
        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1">
              Your Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="input"
              disabled={isLoading}
            />
          </div>

          {roomIdFromUrl ? (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                You're joining room: <span className="font-mono text-xs">{roomIdFromUrl}</span>
              </p>
              <button
                type="submit"
                onClick={(e) => handleSubmit(e, 'join')}
                disabled={isLoading}
                className="btn btn-primary w-full"
              >
                {isLoading ? 'Joining...' : 'Join Room'}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label htmlFor="roomName" className="block text-sm font-medium mb-1">
                  Room Name
                </label>
                <input
                  id="roomName"
                  type="text"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder="e.g., Sprint 42"
                  className="input"
                  disabled={isLoading}
                />
              </div>
              <button
                type="submit"
                onClick={(e) => handleSubmit(e, 'create')}
                disabled={isLoading}
                className="btn btn-primary w-full"
              >
                {isLoading ? 'Creating...' : 'Create Room'}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
