import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useUserStore, useRoomStore } from '../store';
import { getSocket, connectSocket } from '../services/socket';
import { getSession, saveSession, clearSession } from '../services/session';
import { Card, Button, Input, Badge } from '../components/ui';
import { Timer } from '../components/Timer';
import { VoteButton } from '../components/VoteButton';
import { UserList } from '../components/UserList';
import { TaskQueue } from '../components/TaskQueue';
import { VotingResults } from '../components/VotingResults';
import { CsvUpload } from '../components/CsvUpload';
import { SummaryModal } from '../components/SummaryModal';
import { toast } from '../components/Toast';
import type { VoteValue } from '@planning-poker/shared';
import { VOTE_VALUES } from '@planning-poker/shared';

export function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, setUser, setUserName, updateRole } = useUserStore();
  const { 
    room, users, tasks, votes, currentTaskId, votesRevealed, 
    setRoom, setUsers, addUser, updateUser, setTasks, addTask, updateTask, setVotes, 
    setCurrentTaskId, setVotesRevealed 
  } = useRoomStore();

  const [myVote, setMyVote] = useState<VoteValue | null>(null);
  const [taskTitle, setTaskTitle] = useState('');
  const [votedUserIds, setVotedUserIds] = useState<string[]>([]);
  const [percentages, setPercentages] = useState<Record<number, number>>({});
  const [finalEstimate, setFinalEstimate] = useState<number>(0);
  const [timerStart, setTimerStart] = useState<Date | null>(null);
  const [showSummary, setShowSummary] = useState(false);

  const currentTask = tasks.find((t) => t.id === currentTaskId);
  const isAdmin = user?.role === 'creator' || user?.role === 'admin';
  const canVote = user?.role !== 'observer';

  // Auto-rejoin from session or ?rejoin param
  useEffect(() => {
    if (room && user) return; // Already have data
    if (!roomId) return;

    // Check for ?rejoin=userId query param first (from API-created rooms)
    const rejoinParam = searchParams.get('rejoin');
    const session = getSession(roomId);
    
    const userIdToRejoin = rejoinParam || session?.userId;
    
    if (!userIdToRejoin) {
      navigate(`/?room=${roomId}`, { replace: true });
      return;
    }

    // Try to rejoin using userId
    const rejoin = async () => {
      try {
        await connectSocket();
        const socket = getSocket();

        socket.once('user:reconnected', (data) => {
          setUser(data.user);
          setUserName(data.user.name);
          setRoom(data.room);
          setUsers(data.users);
          setTasks(data.tasks);
          setVotes(data.votes);
          setCurrentTaskId(data.room.currentTaskId);
          // Save session for future reconnections
          saveSession(roomId, data.user.id, data.user.name);
          // Remove ?rejoin param from URL to get clean shareable link
          if (rejoinParam) {
            setSearchParams({}, { replace: true });
          }
        });

        socket.once('error', () => {
          if (rejoinParam) {
            // Invalid rejoin param, clear and redirect to login
            setSearchParams({}, { replace: true });
          }
          clearSession(roomId);
          navigate(`/?room=${roomId}`, { replace: true });
        });

        socket.emit('room:rejoin', { roomId, userId: userIdToRejoin });
      } catch {
        clearSession(roomId);
        navigate(`/?room=${roomId}`, { replace: true });
      }
    };

    rejoin();
  }, [room, user, roomId, navigate]);


  useEffect(() => {
    if (!room || !user) {
      return;
    }

    // Set initial timer if there's a voting task
    if (currentTask?.votingStartedAt) {
      setTimerStart(new Date(currentTask.votingStartedAt));
    }

    const socket = getSocket();

    // Remove existing listeners before adding new ones to prevent duplicates
    socket.off('user:connected');
    socket.off('user:disconnected');
    socket.off('user:role_changed');
    socket.off('room:user_joined');

    socket.on('user:connected', ({ user: newUser }) => {
      addUser(newUser);
      if (newUser.id !== user?.id) {
        toast(`${newUser.name} joined`, 'info');
      }
    });

    socket.on('user:disconnected', ({ userId }) => {
      const disconnectedUser = users.find(u => u.id === userId);
      updateUser(userId, { connected: false });
      if (disconnectedUser && disconnectedUser.id !== user?.id) {
        toast(`${disconnectedUser.name} disconnected`, 'info');
      }
    });

    socket.on('user:role_changed', ({ userId, role }) => {
      updateUser(userId, { role });
      // Update current user's role if it's them
      if (userId === user?.id) {
        updateRole(role);
        toast(`Your role changed to ${role}`, 'info');
      }
    });

    socket.on('room:user_joined', ({ user: newUser }) => {
      addUser(newUser);
    });

    // Remove existing task/vote listeners
    socket.off('task:added');
    socket.off('task:updated');
    socket.off('task:order_updated');
    socket.off('task:current_changed');
    socket.off('vote:registered');
    socket.off('vote:updated');
    socket.off('voting:revealed');
    socket.off('voting:reset');
    socket.off('voting:next_task');
    socket.off('timer:sync');

    socket.on('task:added', ({ task }) => {
      addTask(task);
      if (task.status === 'voting' && task.votingStartedAt) {
        setCurrentTaskId(task.id);
        setTimerStart(new Date(task.votingStartedAt));
      }
    });

    socket.on('task:updated', ({ task }) => {
      updateTask(task);
    });

    socket.on('task:order_updated', ({ tasks: newTasks }) => {
      setTasks(newTasks);
    });

    socket.on('task:current_changed', ({ taskId }) => {
      setCurrentTaskId(taskId);
      setMyVote(null);
      setVotedUserIds([]);
      setVotesRevealed(false);
    });

    socket.on('vote:registered', ({ userId }) => {
      setVotedUserIds(prev => [...new Set([...prev, userId])]);
    });

    socket.on('vote:updated', ({ userId }) => {
      console.log('Vote updated by:', userId);
    });

    socket.on('voting:revealed', ({ votes: newVotes, finalEstimate: estimate, percentages: pcts }) => {
      setVotes(newVotes);
      setVotesRevealed(true);
      setPercentages(pcts);
      setFinalEstimate(estimate);
    });

    socket.on('voting:reset', () => {
      setVotes([]);
      setVotesRevealed(false);
      setMyVote(null);
      setVotedUserIds([]);
    });

    socket.on('voting:next_task', ({ taskId }) => {
      setCurrentTaskId(taskId);
      setVotes([]);
      setVotesRevealed(false);
      setMyVote(null);
      setVotedUserIds([]);
    });

    socket.on('timer:sync', ({ startedAt }) => {
      setTimerStart(new Date(startedAt));
    });

    return () => {
      socket.off('user:connected');
      socket.off('user:disconnected');
      socket.off('user:role_changed');
      socket.off('room:user_joined');
      socket.off('task:added');
      socket.off('task:updated');
      socket.off('task:order_updated');
      socket.off('task:current_changed');
      socket.off('vote:registered');
      socket.off('vote:updated');
      socket.off('voting:revealed');
      socket.off('voting:reset');
      socket.off('voting:next_task');
      socket.off('timer:sync');
    };
  }, [room, user, roomId, currentTask?.votingStartedAt]);

  if (!room || !user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  const handleVote = (value: VoteValue) => {
    const socket = getSocket();
    socket.emit('vote:submit', { value });
    setMyVote(value);
  };

  const handleReveal = () => {
    const socket = getSocket();
    socket.emit('voting:reveal');
  };

  const handleNext = () => {
    const socket = getSocket();
    socket.emit('voting:next');
  };

  const handleReset = () => {
    const socket = getSocket();
    socket.emit('voting:reset');
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = taskTitle.trim();
    if (!trimmedTitle) {
      e.stopPropagation();
      return;
    }
    const socket = getSocket();
    socket.emit('task:add', { title: trimmedTitle });
    setTaskTitle('');
  };

  const handleBulkAdd = (titles: string[]) => {
    const socket = getSocket();
    socket.emit('task:add_bulk', { titles });
  };

  const handleUpdateTaskTitle = (taskId: string, title: string) => {
    const socket = getSocket();
    socket.emit('task:update_title', { taskId, title });
  };

  const copyRoomLink = () => {
    const link = `${window.location.origin}/?room=${room.id}`;
    navigator.clipboard.writeText(link);
    toast('Link copied to clipboard', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold">{room.name}</h2>
            <button
              onClick={copyRoomLink}
              className="text-gray-400 hover:text-primary-600 transition-colors p-1"
              title="Copy invite link"
            >
              🔗
            </button>
          </div>
          <div className="flex items-center gap-3">
            <Timer startedAt={timerStart} />
            <Button variant="secondary" size="sm" onClick={() => setShowSummary(true)}>
              📊 Summary
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left: Users */}
        <Card className="p-4 lg:col-span-1">
          <UserList 
            users={users} 
            currentUserId={user.id}
            currentUserRole={user.role}
            votedUserIds={votedUserIds}
          />
        </Card>

        {/* Center: Current Task & Voting */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-6 min-h-[320px] flex flex-col">
            <h3 className="font-semibold mb-4 text-gray-600 dark:text-gray-400">Current Task</h3>
            
            {currentTask ? (
              <div className="space-y-6 flex-1 flex flex-col justify-center">
                <p className="text-xl font-medium text-center">{currentTask.title}</p>
                
                {/* Voting buttons - visible before and after reveal */}
                {canVote && (
                  <div className="flex flex-wrap gap-3 justify-center">
                    {VOTE_VALUES.map((value) => (
                      <VoteButton
                        key={value}
                        value={value}
                        selected={myVote === value}
                        onClick={() => handleVote(value)}
                      />
                    ))}
                  </div>
                )}

                {/* Revealed votes */}
                {votesRevealed && votes.length > 0 && (
                  <VotingResults
                    votes={votes}
                    users={users}
                    percentages={percentages}
                    finalEstimate={finalEstimate}
                  />
                )}

                {/* Admin controls */}
                {isAdmin && (
                  <div className="flex flex-wrap gap-2 justify-center pt-4 border-t border-gray-200 dark:border-gray-700">
                    {!votesRevealed && (
                      <Button onClick={handleReveal} variant="primary">
                        Reveal Votes
                      </Button>
                    )}
                    {votesRevealed && (
                      <>
                        <Button onClick={handleReset} variant="secondary">
                          Re-vote
                        </Button>
                        <Button onClick={handleNext} variant="primary">
                          Next Task →
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                <p className="text-lg">No task selected</p>
                <p className="text-sm mt-1">Add a task to start voting</p>
              </div>
            )}
          </Card>

          {/* Add task */}
          {isAdmin && (
            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Add Task</h3>
                <CsvUpload onUpload={handleBulkAdd} />
              </div>
              <form onSubmit={handleAddTask} className="flex gap-2">
                <Input
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="Task title"
                  className="flex-1"
                />
                <Button type="submit">
                  Add
                </Button>
              </form>
            </Card>
          )}
        </div>

        {/* Right: Task Queue */}
        <div className="lg:col-span-1">
          <TaskQueue 
            tasks={tasks} 
            currentTaskId={currentTaskId}
            canReorder={isAdmin}
            isAdmin={isAdmin}
            onUpdateTitle={handleUpdateTaskTitle}
          />
        </div>
      </div>

      <SummaryModal
        isOpen={showSummary}
        onClose={() => setShowSummary(false)}
        tasks={tasks}
        roomName={room.name}
      />
    </div>
  );
}
