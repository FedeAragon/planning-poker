const SESSION_PREFIX = 'planning-poker-session-';
const SESSION_EXPIRY_HOURS = 24;

export interface RoomSession {
  roomId: string;
  userId: string;
  userName: string;
  expiresAt: number; // Unix timestamp
}

function getSessionKey(roomId: string): string {
  return `${SESSION_PREFIX}${roomId}`;
}

export function saveSession(roomId: string, userId: string, userName: string): void {
  const session: RoomSession = {
    roomId,
    userId,
    userName,
    expiresAt: Date.now() + SESSION_EXPIRY_HOURS * 60 * 60 * 1000,
  };
  localStorage.setItem(getSessionKey(roomId), JSON.stringify(session));
}

export function getSession(roomId: string): RoomSession | null {
  const key = getSessionKey(roomId);
  const data = localStorage.getItem(key);
  
  if (!data) return null;

  try {
    const session: RoomSession = JSON.parse(data);
    
    // Check if expired
    if (Date.now() > session.expiresAt) {
      localStorage.removeItem(key);
      return null;
    }

    return session;
  } catch {
    localStorage.removeItem(key);
    return null;
  }
}

export function clearSession(roomId: string): void {
  localStorage.removeItem(getSessionKey(roomId));
}

export function refreshSession(roomId: string): void {
  const session = getSession(roomId);
  if (session) {
    saveSession(roomId, session.userId, session.userName);
  }
}


