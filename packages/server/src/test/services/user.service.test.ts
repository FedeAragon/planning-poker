import { describe, it, expect } from 'vitest';
import { userService } from '../../services/user.service';
import { roomService } from '../../services/room.service';
import { userRepository } from '../../repositories/user.repository';

describe('UserService', () => {
  describe('connect', () => {
    it('should set user as connected', async () => {
      const { room, user } = await roomService.create('Test', 'User');
      await userRepository.setConnected(user.id, false);

      const connected = await userService.connect(user.id);

      expect(connected?.connected).toBe(true);
    });
  });

  describe('disconnect', () => {
    it('should set user as disconnected', async () => {
      const { user } = await roomService.create('Test', 'User');

      const result = await userService.disconnect(user.id);

      expect(result.user?.connected).toBe(false);
    });

    it('should not transfer admin when other admins are connected', async () => {
      const { room, user: creator } = await roomService.create('Test', 'Creator');
      const joinResult = await roomService.join(room.id, 'Admin');
      await userRepository.setRole(joinResult!.user.id, 'admin');

      const result = await userService.disconnect(creator.id);

      expect(result.newAdmin).toBeNull();
    });

    it('should transfer admin to random voter when all admins disconnect', async () => {
      const { room, user: creator } = await roomService.create('Test', 'Creator');
      await roomService.join(room.id, 'Voter1');
      await roomService.join(room.id, 'Voter2');

      const result = await userService.disconnect(creator.id);

      expect(result.newAdmin).not.toBeNull();
      expect(result.newAdmin?.role).toBe('admin');
    });

    it('should not transfer admin to observers', async () => {
      const { room, user: creator } = await roomService.create('Test', 'Creator');
      const joinResult = await roomService.join(room.id, 'Observer');
      await userRepository.setRole(joinResult!.user.id, 'observer');

      const result = await userService.disconnect(creator.id);

      expect(result.newAdmin).toBeNull();
    });
  });

  describe('changeRole', () => {
    it('should allow creator to set admin role', async () => {
      const { room, user: creator } = await roomService.create('Test', 'Creator');
      const joinResult = await roomService.join(room.id, 'Voter');

      const updated = await userService.changeRole(creator.id, joinResult!.user.id, 'admin');

      expect(updated?.role).toBe('admin');
    });

    it('should not allow admin to set admin role', async () => {
      const { room, user: creator } = await roomService.create('Test', 'Creator');
      const adminJoin = await roomService.join(room.id, 'Admin');
      await userRepository.setRole(adminJoin!.user.id, 'admin');
      const voterJoin = await roomService.join(room.id, 'Voter');

      const updated = await userService.changeRole(adminJoin!.user.id, voterJoin!.user.id, 'admin');

      expect(updated).toBeNull();
    });

    it('should allow admin to change voter to observer', async () => {
      const { room, user: creator } = await roomService.create('Test', 'Creator');
      const adminJoin = await roomService.join(room.id, 'Admin');
      await userRepository.setRole(adminJoin!.user.id, 'admin');
      const voterJoin = await roomService.join(room.id, 'Voter');

      const updated = await userService.changeRole(adminJoin!.user.id, voterJoin!.user.id, 'observer');

      expect(updated?.role).toBe('observer');
    });

    it('should not allow changing creator role', async () => {
      const { room, user: creator } = await roomService.create('Test', 'Creator');
      const adminJoin = await roomService.join(room.id, 'Admin');
      await userRepository.setRole(adminJoin!.user.id, 'admin');

      const updated = await userService.changeRole(adminJoin!.user.id, creator.id, 'voter');

      expect(updated).toBeNull();
    });

    it('should not allow voter to change roles', async () => {
      const { room } = await roomService.create('Test', 'Creator');
      const voter1 = await roomService.join(room.id, 'Voter1');
      const voter2 = await roomService.join(room.id, 'Voter2');

      const updated = await userService.changeRole(voter1!.user.id, voter2!.user.id, 'observer');

      expect(updated).toBeNull();
    });
  });

  describe('isAdmin', () => {
    it('should return true for creator', async () => {
      const { user } = await roomService.create('Test', 'Creator');
      expect(await userService.isAdmin(user.id)).toBe(true);
    });

    it('should return true for admin', async () => {
      const { room } = await roomService.create('Test', 'Creator');
      const joinResult = await roomService.join(room.id, 'Admin');
      await userRepository.setRole(joinResult!.user.id, 'admin');

      expect(await userService.isAdmin(joinResult!.user.id)).toBe(true);
    });

    it('should return false for voter', async () => {
      const { room } = await roomService.create('Test', 'Creator');
      const joinResult = await roomService.join(room.id, 'Voter');

      expect(await userService.isAdmin(joinResult!.user.id)).toBe(false);
    });
  });

  describe('canVote', () => {
    it('should return true for connected voter', async () => {
      const { room } = await roomService.create('Test', 'Creator');
      const joinResult = await roomService.join(room.id, 'Voter');

      expect(await userService.canVote(joinResult!.user.id)).toBe(true);
    });

    it('should return false for observer', async () => {
      const { room } = await roomService.create('Test', 'Creator');
      const joinResult = await roomService.join(room.id, 'Observer');
      await userRepository.setRole(joinResult!.user.id, 'observer');

      expect(await userService.canVote(joinResult!.user.id)).toBe(false);
    });

    it('should return false for disconnected user', async () => {
      const { room } = await roomService.create('Test', 'Creator');
      const joinResult = await roomService.join(room.id, 'Voter');
      await userRepository.setConnected(joinResult!.user.id, false);

      expect(await userService.canVote(joinResult!.user.id)).toBe(false);
    });
  });
});


