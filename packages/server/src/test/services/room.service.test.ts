import { describe, it, expect } from 'vitest';
import { roomService } from '../../services/room.service';
import { userRepository } from '../../repositories/user.repository';

describe('RoomService', () => {
  describe('create', () => {
    it('should create room and user as creator', async () => {
      const result = await roomService.create('Sprint 1', 'John');

      expect(result.room.name).toBe('Sprint 1');
      expect(result.room.status).toBe('active');
      expect(result.user.name).toBe('John');
      expect(result.user.role).toBe('creator');
      expect(result.user.roomId).toBe(result.room.id);
    });
  });

  describe('join', () => {
    it('should join existing room as voter', async () => {
      const { room } = await roomService.create('Test Room', 'Creator');
      const result = await roomService.join(room.id, 'Joiner');

      expect(result).not.toBeNull();
      expect(result?.user.name).toBe('Joiner');
      expect(result?.user.role).toBe('voter');
      expect(result?.state.room.id).toBe(room.id);
      expect(result?.state.users).toHaveLength(2);
    });

    it('should return null for non-existent room', async () => {
      const result = await roomService.join('non-existent', 'User');
      expect(result).toBeNull();
    });
  });

  describe('getRoomState', () => {
    it('should return full room state', async () => {
      const { room } = await roomService.create('Test', 'Creator');
      await roomService.join(room.id, 'User2');

      const state = await roomService.getRoomState(room.id);

      expect(state).not.toBeNull();
      expect(state?.room.id).toBe(room.id);
      expect(state?.users).toHaveLength(2);
      expect(state?.tasks).toHaveLength(0);
    });
  });

  describe('finish', () => {
    it('should finish room when creator requests', async () => {
      const { room, user } = await roomService.create('Test', 'Creator');
      const finished = await roomService.finish(room.id, user.id);

      expect(finished?.status).toBe('finished');
    });

    it('should finish room when admin requests', async () => {
      const { room } = await roomService.create('Test', 'Creator');
      const joinResult = await roomService.join(room.id, 'Admin');
      await userRepository.setRole(joinResult!.user.id, 'admin');

      const finished = await roomService.finish(room.id, joinResult!.user.id);
      expect(finished?.status).toBe('finished');
    });

    it('should not finish room when voter requests', async () => {
      const { room } = await roomService.create('Test', 'Creator');
      const joinResult = await roomService.join(room.id, 'Voter');

      const finished = await roomService.finish(room.id, joinResult!.user.id);
      expect(finished).toBeNull();
    });
  });

  describe('exists', () => {
    it('should return true for existing room', async () => {
      const { room } = await roomService.create('Test', 'Creator');
      expect(await roomService.exists(room.id)).toBe(true);
    });

    it('should return false for non-existing room', async () => {
      expect(await roomService.exists('non-existent')).toBe(false);
    });
  });

  describe('isActive', () => {
    it('should return true for active room', async () => {
      const { room } = await roomService.create('Test', 'Creator');
      expect(await roomService.isActive(room.id)).toBe(true);
    });

    it('should return false for finished room', async () => {
      const { room, user } = await roomService.create('Test', 'Creator');
      await roomService.finish(room.id, user.id);
      expect(await roomService.isActive(room.id)).toBe(false);
    });
  });
});


