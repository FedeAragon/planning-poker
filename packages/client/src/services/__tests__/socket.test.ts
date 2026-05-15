import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventEmitter } from 'events';

type FakeSocket = EventEmitter & {
  connected: boolean;
  connect: () => void;
  disconnect: () => void;
};

const fakeSockets: { url: string; socket: FakeSocket }[] = [];
let connectBehavior: (url: string, s: FakeSocket) => void = () => {};

function makeFakeSocket(url: string): FakeSocket {
  const emitter = new EventEmitter() as FakeSocket;
  emitter.connected = false;
  emitter.connect = vi.fn(() => {
    setTimeout(() => connectBehavior(url, emitter), 0);
  }) as unknown as () => void;
  emitter.disconnect = vi.fn(() => {
    emitter.connected = false;
  }) as unknown as () => void;
  return emitter;
}

vi.mock('socket.io-client', () => ({
  io: (url: string) => {
    const s = makeFakeSocket(url);
    fakeSockets.push({ url, socket: s });
    return s;
  },
}));

vi.stubEnv('VITE_SERVER_URLS', 'https://primary.test,https://backup.test');

beforeEach(() => {
  fakeSockets.length = 0;
  connectBehavior = () => {};
  vi.resetModules();
});

describe('connectSocket fallback', () => {
  it('uses primary URL when it connects', async () => {
    connectBehavior = (_url, s) => {
      s.connected = true;
      s.emit('connect');
    };

    const { connectSocket, getSocket } = await import('../socket');
    await connectSocket();

    expect(fakeSockets).toHaveLength(1);
    expect(fakeSockets[0].url).toBe('https://primary.test');
    expect(getSocket()).toBe(fakeSockets[0].socket);
  });

  it('falls back to the next URL when primary errors', async () => {
    connectBehavior = (url, s) => {
      if (url === 'https://primary.test') {
        s.emit('connect_error', new Error('boom'));
      } else {
        s.connected = true;
        s.emit('connect');
      }
    };

    const { connectSocket, getSocket } = await import('../socket');
    await connectSocket();

    expect(fakeSockets.map((f) => f.url)).toEqual([
      'https://primary.test',
      'https://backup.test',
    ]);
    expect(fakeSockets[0].socket.disconnect).toHaveBeenCalled();
    expect(getSocket()).toBe(fakeSockets[1].socket);
  });

  it('rejects when every URL fails', async () => {
    connectBehavior = (_url, s) => {
      s.emit('connect_error', new Error('boom'));
    };

    const { connectSocket } = await import('../socket');
    await expect(connectSocket()).rejects.toThrow('boom');
    expect(fakeSockets).toHaveLength(2);
  });
});
