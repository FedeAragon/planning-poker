import { describe, it, expect } from 'vitest';
import { roomRepository } from '../../repositories/room.repository';

describe('RoomRepository', () => {
  describe('create', () => {
    it('should create a room with active status', async () => {
      const room = await roomRepository.create({ name: 'Sprint 1' });

      expect(room).toBeDefined();
      expect(room.id).toBeDefined();
      expect(room.name).toBe('Sprint 1');
      expect(room.status).toBe('active');
      expect(room.currentTaskId).toBeNull();
    });
  });

  describe('findById', () => {
    it('should find room by id', async () => {
      const created = await roomRepository.create({ name: 'Test Room' });
      const found = await roomRepository.findById(created.id);

      expect(found).toBeDefined();
      expect(found?.id).toBe(created.id);
      expect(found?.name).toBe('Test Room');
    });

    it('should return null for non-existent room', async () => {
      const found = await roomRepository.findById('non-existent-id');
      expect(found).toBeNull();
    });
  });

  describe('update', () => {
    it('should update room name', async () => {
      const room = await roomRepository.create({ name: 'Original' });
      const updated = await roomRepository.update(room.id, { name: 'Updated' });

      expect(updated?.name).toBe('Updated');
    });

    it('should update room status', async () => {
      const room = await roomRepository.create({ name: 'Test' });
      const updated = await roomRepository.update(room.id, { status: 'finished' });

      expect(updated?.status).toBe('finished');
    });
  });

  describe('finish', () => {
    it('should set status to finished and clear currentTaskId', async () => {
      const room = await roomRepository.create({ name: 'Test' });
      await roomRepository.update(room.id, { currentTaskId: 'some-task-id' });
      
      const finished = await roomRepository.finish(room.id);

      expect(finished?.status).toBe('finished');
      expect(finished?.currentTaskId).toBeNull();
    });
  });

  describe('setCurrentTask', () => {
    it('should set current task id', async () => {
      const room = await roomRepository.create({ name: 'Test' });
      const updated = await roomRepository.setCurrentTask(room.id, 'task-123');

      expect(updated?.currentTaskId).toBe('task-123');
    });

    it('should clear current task id when null', async () => {
      const room = await roomRepository.create({ name: 'Test' });
      await roomRepository.setCurrentTask(room.id, 'task-123');
      const updated = await roomRepository.setCurrentTask(room.id, null);

      expect(updated?.currentTaskId).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete room', async () => {
      const room = await roomRepository.create({ name: 'To Delete' });
      await roomRepository.delete(room.id);
      
      const found = await roomRepository.findById(room.id);
      expect(found).toBeNull();
    });
  });
});


