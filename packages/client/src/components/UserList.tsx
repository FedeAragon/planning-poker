import { useState } from 'react';
import type { User, Role } from '@planning-poker/shared';
import { getSocket } from '../services/socket';

interface UserListProps {
  users: User[];
  currentUserId?: string;
  currentUserRole?: Role;
  votedUserIds?: string[];
}

const roleBadges: Record<Role, { emoji: string; label: string; color: string } | null> = {
  creator: { emoji: '👑', label: 'Creator', color: 'text-yellow-500' },
  admin: { emoji: '⭐', label: 'Admin', color: 'text-blue-500' },
  voter: null,
  observer: { emoji: '👁️', label: 'Observer', color: 'text-gray-500' },
};

export function UserList({ users, currentUserId, currentUserRole, votedUserIds = [] }: UserListProps) {
  const [menuOpenFor, setMenuOpenFor] = useState<string | null>(null);
  const connectedCount = users.filter(u => u.connected).length;

  const canChangeRoles = currentUserRole === 'creator' || currentUserRole === 'admin';
  const isCreator = currentUserRole === 'creator';

  const handleRoleChange = (targetUserId: string, newRole: Role) => {
    const socket = getSocket();
    socket.emit('user:change_role', { userId: targetUserId, role: newRole });
    setMenuOpenFor(null);
  };

  const getAvailableRoles = (targetRole: Role): Role[] => {
    if (targetRole === 'creator') return []; // Can't change creator

    if (isCreator) {
      // Creator can assign any role except creator
      if (targetRole === 'admin') return ['voter', 'observer'];
      if (targetRole === 'voter') return ['admin', 'observer'];
      if (targetRole === 'observer') return ['admin', 'voter'];
    } else if (currentUserRole === 'admin') {
      // Admin can only toggle voter <-> observer
      if (targetRole === 'voter') return ['observer'];
      if (targetRole === 'observer') return ['voter'];
    }
    return [];
  };

  return (
    <div>
      <h3 className="font-semibold mb-3">
        Users ({connectedCount}/{users.length})
      </h3>
      <ul className="space-y-2">
        {users.map((user) => {
          const badge = roleBadges[user.role];
          const hasVoted = votedUserIds.includes(user.id);
          const isCurrentUser = user.id === currentUserId;
          const availableRoles = getAvailableRoles(user.role);
          const canChange = canChangeRoles && !isCurrentUser && availableRoles.length > 0;

          return (
            <li
              key={user.id}
              className={`
                flex items-center gap-2 p-2 rounded-lg relative
                ${!user.connected ? 'opacity-50' : ''}
                ${isCurrentUser ? 'bg-primary-50 dark:bg-primary-900/20' : ''}
              `}
            >
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                user.connected ? 'bg-green-500' : 'bg-gray-400'
              }`} />
              
              <span className="flex-1 truncate">
                {user.name}
                {isCurrentUser && <span className="text-xs text-gray-500 ml-1">(you)</span>}
              </span>

              {hasVoted && user.connected && (
                <span className="text-green-500 text-sm">✓</span>
              )}

              {badge && (
                <span title={badge.label} className={`text-sm ${badge.color}`}>
                  {badge.emoji}
                </span>
              )}

              {canChange && (
                <div className="relative">
                  <button
                    onClick={() => setMenuOpenFor(menuOpenFor === user.id ? null : user.id)}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-500 text-xs"
                    title="Change role"
                  >
                    ⋮
                  </button>

                  {menuOpenFor === user.id && (
                    <>
                      <div 
                        className="fixed inset-0 z-10" 
                        onClick={() => setMenuOpenFor(null)} 
                      />
                      <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20 min-w-[140px]">
                        <div className="py-1">
                          {availableRoles.map((role) => (
                            <button
                              key={role}
                              onClick={() => handleRoleChange(user.id, role)}
                              className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                            >
                              {roleBadges[role]?.emoji || '👤'}
                              <span className="capitalize">{role}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
