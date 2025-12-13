# Sprint Planning Poker - Implementation Plan

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** as build tool
- **Tailwind CSS** for styling (responsive, dark/light mode)
- **Socket.IO Client** for real-time communication
- **React Router** for navigation
- **Zustand** for state management (lightweight, simple)

### Backend
- **Node.js** with Express
- **TypeScript**
- **Socket.IO** for WebSocket handling
- **Prisma** as ORM (type-safe, easy migrations)
- **PostgreSQL** for production database
- **SQLite** for local development

### Testing
- **Vitest** for unit tests (fast, Vite-compatible)
- **React Testing Library** for component tests

### Monorepo Structure
- **pnpm workspaces** for package management

---

## Project Structure

```
planning-poker/
├── package.json                 # Root package.json (workspaces config)
├── pnpm-workspace.yaml
├── tsconfig.base.json           # Shared TypeScript config
├── .gitignore
├── README.md
│
├── packages/
│   ├── client/                  # Frontend React app
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── vite.config.ts
│   │   ├── tailwind.config.js
│   │   ├── index.html
│   │   ├── src/
│   │   │   ├── main.tsx
│   │   │   ├── App.tsx
│   │   │   ├── index.css
│   │   │   ├── components/      # Reusable UI components
│   │   │   ├── pages/           # Page components
│   │   │   ├── hooks/           # Custom hooks
│   │   │   ├── store/           # Zustand stores
│   │   │   ├── services/        # API/Socket services
│   │   │   ├── types/           # TypeScript types
│   │   │   └── utils/           # Helper functions
│   │   └── tests/               # Unit tests
│   │
│   ├── server/                  # Backend Node.js app
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── prisma/
│   │   │   └── schema.prisma    # Database schema
│   │   ├── src/
│   │   │   ├── index.ts         # Entry point
│   │   │   ├── app.ts           # Express app setup
│   │   │   ├── socket/          # Socket.IO handlers
│   │   │   ├── services/        # Business logic
│   │   │   ├── repositories/    # Database access
│   │   │   ├── types/           # TypeScript types
│   │   │   └── utils/           # Helper functions
│   │   └── tests/               # Unit tests
│   │
│   └── shared/                  # Shared types between client/server
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           ├── types.ts         # Shared TypeScript types
│           └── constants.ts     # Shared constants (vote values, etc.)
```

---

## Milestones

### Phase 1: Project Setup
- [ ] Initialize monorepo with pnpm workspaces
- [ ] Setup shared package with common types
- [ ] Setup client package (Vite + React + TypeScript + Tailwind)
- [ ] Setup server package (Express + TypeScript + Prisma)
- [ ] Configure Tailwind dark/light mode
- [ ] Create basic responsive layout structure

### Phase 2: Database & Models
- [ ] Define Prisma schema (User, Room, Task, Vote)
- [ ] Setup database migrations
- [ ] Create repository layer (CRUD operations)
- [ ] Write unit tests for repositories

### Phase 3: Core Backend Services
- [ ] Implement RoomService (create, join, finish)
- [ ] Implement UserService (register, connect, disconnect, role management)
- [ ] Implement TaskService (add, add bulk, reorder, timer management)
- [ ] Implement VoteService (submit, reveal, reset)
- [ ] Implement timer logic (start on voting, reset on re-vote, save on next)
- [ ] Write unit tests for all services (90% coverage)

### Phase 4: WebSocket Layer
- [ ] Setup Socket.IO server
- [ ] Implement connection/disconnection handling
- [ ] Implement all client→server events
- [ ] Implement all server→client events
- [ ] Handle room-based broadcasting
- [ ] Write unit tests for socket handlers

### Phase 5: Frontend - Base UI
- [ ] Create shared UI components (Button, Input, Card, Badge, Modal)
- [ ] Implement dark/light theme toggle
- [ ] Create responsive navigation/layout
- [ ] Write component unit tests

### Phase 6: Frontend - User Flow
- [ ] Create Login page (name input)
- [ ] Create Home page (create room / join via link)
- [ ] Create Room page (main voting interface)
- [ ] Implement Socket.IO client connection
- [ ] Setup Zustand stores for state management
- [ ] Implement session storage (localStorage per room, 24h expiry)
- [ ] Implement auto-rejoin flow (skip login if valid session exists)

### Phase 7: Frontend - Room Features
- [ ] Implement user list with status indicators
- [ ] Implement role badges (creator, admin, voter, observer)
- [ ] Implement role change functionality (creator only for admin)
- [ ] Write unit tests for room components

### Phase 8: Frontend - Task Management
- [ ] Implement task queue display (pending, current, voted)
- [ ] Implement add task form
- [ ] Implement CSV upload for bulk tasks
- [ ] Implement drag-and-drop reordering
- [ ] Implement current task override
- [ ] Write unit tests for task components

### Phase 9: Frontend - Voting System
- [ ] Implement voting buttons (0, 1, 2, 3, 5, 8)
- [ ] Implement vote status indicators (who voted)
- [ ] Implement voting timer (real-time, synced)
- [ ] Implement reveal button (admin only)
- [ ] Implement results display (percentages, winner)
- [ ] Implement post-reveal vote change
- [ ] Implement re-vote button (admin only, resets timer)
- [ ] Implement next task button (admin only, saves timer)
- [ ] Write unit tests for voting components

### Phase 10: Frontend - Summary Screen
- [ ] Create final summary page/modal
- [ ] Display all tasks with estimates and times
- [ ] Implement top 3 slowest tasks highlight
- [ ] Display total session time
- [ ] Write unit tests for summary components

### Phase 11: Edge Cases & Polish
- [ ] Handle admin auto-transfer on disconnect
- [ ] Handle reconnection (restore state)
- [ ] Handle room finish state
- [ ] Add loading states and error handling
- [ ] Add toast notifications for events
- [ ] Final responsive adjustments
- [ ] Final dark/light mode polish

### Phase 12: Integration & Final Testing
- [x] Verify 90% test coverage
- [x] Manual testing of all flows
- [x] Fix any remaining bugs
- [x] Code cleanup and documentation

### Phase 13: UI/UX Improvements (Post-MVP)
- [x] Logo "Planning Poker" links to home page
- [x] Current task appears first in "Upcoming Tasks" list with visual indicator
- [x] Multi-tab support (no duplicate disconnect/connect notifications)
- [x] Toast notifications for key events (join, disconnect, vote reveal, copy link)
- [x] Cleaner header (room name + link icon only, no truncated ID)
- [x] Better "Make current" button (⏭ icon with "Vote this now" tooltip)
- [x] Improved center area spacing (min-height, centered content)
- [x] Observer role properly hides Add Task form
- [x] Drag-and-drop doesn't override current task (only ⏭ button does)
- [x] Edit task title while voting
- [x] Task management restricted to admins only (add, edit, reorder)
- [x] Edit task title moved to TaskQueue (right sidebar)
- [x] Vote change after reveal (recalculates and updates results in real-time)

### Phase 14: REST API for External Integration
- [x] Implement POST /api/rooms endpoint
- [x] Create room with name
- [x] Create creator user
- [x] Add tasks in bulk
- [x] Return room URL with ?rejoin param for admin access
- [x] Add validation and error handling
- [x] Frontend: detect ?rejoin param and auto-login as creator

---

## Database Schema (Prisma)

```prisma
model User {
  id visibleId visibleId           String   @id @default(uuid())
  name           String
visibleId   roomId         String
  room           Room     @relation(fields: [roomId], references: [id])
  connected      Boolean  @default(true)
  role           Role     @default(VOTER)
  lastConnection DateTime @default(now())
  votes          Vote[]

  @@index([roomId])
}

model Room {
  id            String   @id @default(uuid())
  name          String
  status        RoomStatus @default(ACTIVE)
  currentTaskId String?
  createdAt     DateTime @default(now())
  users         User[]
  tasks         Task[]
}

model Task {
  id                    String     @id @default(uuid())
  roomId                String
  room                  Room       @relation(fields: [roomId], references: [id])
  title                 String
  order                 Int
  status                TaskStatus @default(PENDING)
  finalEstimate         Int?
  votingStartedAt       DateTime?
  votingDurationSeconds Int?
  createdAt             DateTime   @default(now())
  votes                 Vote[]

  @@index([roomId])
}

model Vote {
  id        String   @id @default(uuid())
  taskId    String
  task      Task     @relation(fields: [taskId], references: [id])
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  value     Int
  createdAt DateTime @default(now())

  @@unique([taskId, userId])
  @@index([taskId])
}

enum Role {
  CREATOR
  ADMIN
  VOTER
  OBSERVER
}

enum RoomStatus {
  ACTIVE
  FINISHED
}

enum TaskStatus {
  PENDING
  VOTING
  VOTED
}
```

---

## Shared Types (packages/shared)

```typescript
// Vote values
export const VOTE_VALUES = [0, 1, 2, 3, 5, 8] as const;
export type VoteValue = typeof VOTE_VALUES[number];

// Roles
export type Role = 'creator' | 'admin' | 'voter' | 'observer';

// Room status
export type RoomStatus = 'active' | 'finished';

// Task status
export type TaskStatus = 'pending' | 'voting' | 'voted';

// User
export interface User {
  id: string;
  name: string;
  roomId: string;
  connected: boolean;
  role: Role;
}

// Room
export interface Room {
  id: string;
  name: string;
  status: RoomStatus;
  currentTaskId: string | null;
}

// Task
export interface Task {
  id: string;
  roomId: string;
  title: string;
  order: number;
  status: TaskStatus;
  finalEstimate: number | null;
  votingStartedAt: Date | null;
  votingDurationSeconds: number | null;
}

// Vote
export interface Vote {
  id: string;
  taskId: string;
  userId: string;
  value: VoteValue;
}

// Socket Events - Client to Server
export interface ClientToServerEvents {
  'user:register': (data: { name: string }) => void;
  'room:create': (data: { name: string }) => void;
  'room:join': (data: { roomId: string }) => void;
  'room:rejoin': (data: { roomId: string; userId: string }) => void;
  'room:finish': () => void;
  'user:change_role': (data: { userId: string; role: Role }) => void;
  'task:add': (data: { title: string }) => void;
  'task:add_bulk': (data: { titles: string[] }) => void;
  'task:reorder': (data: { taskId: string; newOrder: number }) => void;
  'vote:submit': (data: { value: VoteValue }) => void;
  'voting:reveal': () => void;
  'voting:next': () => void;
  'voting:reset': () => void;
}

// Socket Events - Server to Client
export interface ServerToClientEvents {
  'user:reconnected': (data: { user: User; room: Room; users: User[]; tasks: Task[]; votes: Vote[] }) => void;
  'user:connected': (data: { user: User }) => void;
  'user:disconnected': (data: { userId: string }) => void;
  'user:role_changed': (data: { userId: string; role: Role }) => void;
  'room:updated': (data: { room: Room }) => void;
  'room:state': (data: { room: Room; users: User[]; tasks: Task[]; votes: Vote[] }) => void;
  'task:added': (data: { task: Task }) => void;
  'task:order_updated': (data: { tasks: Task[] }) => void;
  'task:current_changed': (data: { taskId: string }) => void;
  'vote:registered': (data: { userId: string }) => void;
  'vote:updated': (data: { userId: string }) => void;
  'voting:revealed': (data: { votes: Vote[]; finalEstimate: number }) => void;
  'voting:next_task': (data: { taskId: string; previousTaskDuration: number }) => void;
  'timer:sync': (data: { startedAt: Date }) => void;
  'voting:reset': () => void;
  'error': (data: { message: string }) => void;
}
```

---

## Testing Strategy

### Unit Test Coverage Target: 90%

### Backend Tests
- **Repositories**: Test CRUD operations with in-memory SQLite
- **Services**: Test business logic with mocked repositories
- **Socket Handlers**: Test event handling with mocked services

### Frontend Tests
- **Components**: Test rendering and user interactions
- **Hooks**: Test custom hooks in isolation
- **Stores**: Test Zustand store actions and selectors
- **Utils**: Test helper functions

### Test File Naming
- `*.test.ts` for backend tests
- `*.test.tsx` for frontend component tests

---

## Scripts

### Root package.json
```json
{
  "scripts": {
    "dev": "pnpm --parallel -r dev",
    "build": "pnpm -r build",
    "test": "pnpm -r test",
    "test:coverage": "pnpm -r test:coverage",
    "lint": "pnpm -r lint",
    "db:migrate": "pnpm --filter server db:migrate",
    "db:generate": "pnpm --filter server db:generate"
  }
}
```

---

## Environment Variables

### Server (.env)
```
DATABASE_URL="file:./dev.db"           # SQLite for dev
# DATABASE_URL="postgresql://..."      # PostgreSQL for production
PORT=3001
CLIENT_URL="http://localhost:5173"
```

### Client (.env)
```
VITE_SERVER_URL="http://localhost:3001"
```

---

## Deployment Notes (Render)

### Backend (Web Service)
- Build command: `cd packages/server && pnpm install && pnpm build`
- Start command: `cd packages/server && pnpm start`
- Environment: Add `DATABASE_URL` (PostgreSQL from Render)

### Frontend (Static Site)
- Build command: `cd packages/client && pnpm install && pnpm build`
- Publish directory: `packages/client/dist`
- Environment: Add `VITE_SERVER_URL` pointing to backend URL

### Database
- Create PostgreSQL instance on Render (free tier available)
- Copy connection string to backend `DATABASE_URL`

