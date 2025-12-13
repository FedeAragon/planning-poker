import { describe, it, expect, beforeEach } from 'vitest';
import { userRepository } from '../../repositories/user.repository';
import { roomRepository } from '../../repositories/room.repository';

describe('UserRepository', () => {
  let roomId: string;

  beforeEach(async () => {
    const room = await roomRepository.create({ name: 'Test Room' });
    roomId = room.id;
  });

  describe('create', () => {
    it('should create a user with default voter role', async () => {
      const user = await userRepository.create({ name: 'John', roomId });

      expect(user).toBeDefined();
      expect(user.id).toBeDefined();
      expect(user.name).toBe('John');
      expect(user.roomId).toBe(roomId);
      expect(user.role).toBe('voter');
      expect(user.connected).toBe(true);
    });

    it('should create a user with specified role', async () => {
      const user = await userRepository.create({ name: 'Admin', roomId, role: 'creator' });

      expect(user.role).toBe('creator');
    });
  });

  describe('findById', () => {
    it('should find user by id', async () => {
      const created = await userRepository.create({ name: 'Test', roomId });
      const found = await userRepository.findById(created.id);

      expect(found?.id).toBe(created.id);
      expect(found?.name).toBe('Test');
    });

    it('should return null for non-existent user', async () => {
      const found = await userRepository.findById('non-existent');
      expect(found).toBeNull();
    });
  });

  describe('findByRoomId', () => {
    it('should find all users in room', async () => {
      await userRepository.create({ name: 'User1', roomId });
      await userRepository.create({ name: 'User2', roomId });

      const users = await userRepository.findByRoomId(roomId);

      expect(users).toHaveLength(2);
    });

    it('should return empty array for room with no users', async () => {
      const users = await userRepository.findByRoomId(roomId);
      expect(users).toHaveLength(0);
    });
  });

  describe('findConnectedByRoomId', () => {
    it('should only find connected users', async () => {
      const user1 = await userRepository.create({ name: 'Connected', roomId });
      const user2 = await userRepository.create({ name: 'Disconnected', roomId });
      await userRepository.setConnected(user2.id, false);

      const connected = await userRepository.findConnectedByRoomId(roomId);

      expect(connected).toHaveLength(1);
      expect(connected[0].id).toBe(user1.id);
    });
  });

  describe('findConnectedVotersByRoomId', () => {
    it('should find connected voters, admins, and creator', async () => {
      await userRepository.create({ name: 'Creator', roomId, role: 'creator' });
      await userRepository.create({ name: 'Admin', roomId, role: 'admin' });
      await userRepository.create({ name: 'Voter', roomId, role: 'voter' });
      await userRepository.create({ name: 'Observer', roomId, role: 'observer' });

      const voters = await userRepository.findConnectedVotersByRoomId(roomId);

      expect(voters).toHaveLength(3);
      expect(voters.map(u => u.role)).not.toContain('observer');
    });
  });

  describe('setRole', () => {
    it('should update user role', async () => {
      const user = await userRepository.create({ name: 'Test', roomId });
      const updated = await userRepository.setRole(user.id, 'admin');

      expect(updated?.role).toBe('admin');
    });
  });

  describe('setConnected', () => {
    it('should update connection status', async () => {
      const user = await userRepository.create({ name: 'Test', roomId });
      const updated = await userRepository.setConnected(user.id, false);

      expect(updated?.connected).toBe(false);
    });
  });

  describe('getCreatorByRoomId', () => {
    it('should find the creator of a room', async () => {
      await userRepository.create({ name: 'Creator', roomId, role: 'creator' });
      await userRepository.create({ name: 'Voter', roomId, role: 'voter' });

      const creator = await userRepository.getCreatorByRoomId(roomId);

      expect(creator?.name).toBe('Creator');
      expect(creator?.role).toBe('creator');
    });

    it('should return null if no creator', async () => {
      const creator = await userRepository.getCreatorByRoomId(roomId);
      expect(creator).toBeNull();
    });
  });

  describe('countConnectedByRoomId', () => {
    it('should count connected users', async () => {
      await userRepository.create({ name: 'User1', roomId });
      const user2 = await userRepository.create({ name: 'User2', roomId });
      await userRepository.create({ name: 'User3', roomId });
      await userRepository.setConnected(user2.id, false);

      const count = await userRepository.countConnectedByRoomId(roomId);

      expect(count).toBe(2);
    });
  });
});


