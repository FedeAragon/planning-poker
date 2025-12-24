import { userRepository } from '../repositories/user.repository';
import type { User, Role } from '@planning-poker/shared';

export const userService = {
  async connect(userId: string): Promise<User | null> {
    return userRepository.setConnected(userId, true);
  },

  async disconnect(userId: string): Promise<{ user: User | null; newAdmin: User | null }> {
    const user = await userRepository.setConnected(userId, false);
    if (!user) return { user: null, newAdmin: null };

    // Check if we need to transfer admin role
    const newAdmin = await this.checkAndTransferAdmin(user.roomId);
    return { user, newAdmin };
  },

  async checkAndTransferAdmin(roomId: string): Promise<User | null> {
    // Get all connected admins (creator or admin)
    const admins = await userRepository.findAdminsByRoomId(roomId);
    const connectedAdmins = admins.filter(a => a.connected);

    // If there are still connected admins, no transfer needed
    if (connectedAdmins.length > 0) return null;

    // Get connected voters (excluding observers)
    const connectedVoters = await userRepository.findConnectedVotersByRoomId(roomId);
    const eligibleUsers = connectedVoters.filter(u => u.role === 'voter');

    if (eligibleUsers.length === 0) return null;

    // Select random user to become admin
    const randomIndex = Math.floor(Math.random() * eligibleUsers.length);
    const selectedUser = eligibleUsers[randomIndex];

    return userRepository.setRole(selectedUser.id, 'admin');
  },

  async changeRole(
    requesterId: string,
    targetUserId: string,
    newRole: Role
  ): Promise<User | null> {
    const requester = await userRepository.findById(requesterId);
    if (!requester) return null;

    const target = await userRepository.findById(targetUserId);
    if (!target) return null;

    // Cannot change creator's role
    if (target.role === 'creator') return null;

    // Only creator can assign/remove admin role
    if (newRole === 'admin' || target.role === 'admin') {
      if (requester.role !== 'creator') return null;
    }

    // Admins can change voter <-> observer
    if (newRole === 'voter' || newRole === 'observer') {
      if (requester.role !== 'creator' && requester.role !== 'admin') return null;
    }

    return userRepository.setRole(targetUserId, newRole);
  },

  async findById(userId: string): Promise<User | null> {
    return userRepository.findById(userId);
  },

  async findByRoomId(roomId: string): Promise<User[]> {
    return userRepository.findByRoomId(roomId);
  },

  async findConnectedByRoomId(roomId: string): Promise<User[]> {
    return userRepository.findConnectedByRoomId(roomId);
  },

  async isAdmin(userId: string): Promise<boolean> {
    const user = await userRepository.findById(userId);
    return user?.role === 'creator' || user?.role === 'admin';
  },

  async isCreator(userId: string): Promise<boolean> {
    const user = await userRepository.findById(userId);
    return user?.role === 'creator';
  },

  async canVote(userId: string): Promise<boolean> {
    const user = await userRepository.findById(userId);
    if (!user) return false;
    return user.role !== 'observer' && user.connected;
  },

  async kick(requesterId: string, targetUserId: string): Promise<boolean> {
    const requester = await userRepository.findById(requesterId);
    if (!requester) return false;

    // Only creator or admin can kick
    if (requester.role !== 'creator' && requester.role !== 'admin') return false;

    const target = await userRepository.findById(targetUserId);
    if (!target) return false;

    // Cannot kick yourself
    if (requesterId === targetUserId) return false;

    // Cannot kick creator
    if (target.role === 'creator') return false;

    // Admin cannot kick other admins
    if (requester.role === 'admin' && target.role === 'admin') return false;

    // Mark user as disconnected
    await userRepository.setConnected(targetUserId, false);
    return true;
  },
};


