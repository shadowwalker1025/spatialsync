# SpatialSync: Real-Time 3D Spatial Collaboration Hub

[![License: MIT](https://img.shields.io/badge/License-MIT-indigo.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-cyan.svg)](https://reactjs.org/)
[![Three.js](https://img.shields.io/badge/Three.js-r165-black.svg)](https://threejs.org/)
[![Socket.io](https://img.shields.io/badge/Socket.io-4.7-emerald.svg)](https://socket.io/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-teal.svg)](https://www.prisma.io/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED.svg)](https://www.docker.com/)

**SpatialSync** is a production-ready, full-stack real-time collaborative 3D spatial editor. It empowers distributed design, architecture, and engineering teams to synchronously build, transform, annotate, and inspect 3D scenes in real time with high-performance 60+ FPS manipulation, 3D spatial cursors, optimistic locking, and persistent snapshots.

---

## 🌟 Key Architecture & Features

### 1. Interactive 3D Canvas & Manipulators (React Three Fiber)
* **High-Precision Viewport:** Perspective camera with smooth damping (`drei/OrbitControls`), shadows, lighting presets, and dynamic infinite ground grid (`drei/Grid`).
* **Primitives & Custom 3D Models:** Instant spawning of Box, Sphere, Cylinder, Cone, Torus, Plane, and Capsule primitives, plus drag-and-drop `.glb` / `.gltf` model uploads.
* **Transform Gizmos:** Translate (`W`), Rotate (`E`), and Scale (`R`) manipulators with coordinate snapping (world vs local space).
* **60+ FPS Performance Decoupling:** Gizmo movements and remote transformations bypass React re-renders through mutable `useRef` handles and `useFrame` slerp/lerp interpolation loops.
* **GPU Memory Management:** Clean geometry, material, and texture `.dispose()` lifecycle management on unmount preventing WebGL memory leaks.

### 2. 2D Glassmorphic HUD & Annotation System
* **Scene Graph Hierarchy Panel:** Tree view with real-time search filter, peer lock badges, node visibility toggles, duplication (`Ctrl+D`), and deletion (`Delete`).
* **Property Inspector:** Live numeric inputs for XYZ Coordinates, Euler Angles, and Scaling factors, plus a material editor (color palette, roughness, metalness, wireframe, opacity, shader presets).
* **3D Surface-Anchored Annotations:** Click anywhere on mesh surfaces to place 3D annotation pins with author attribution, resolution states, and projected DOM overlay tags.
* **Asset Library Modal:** Drag-and-drop 3D asset uploader (streaming to backend disk storage) with sample featured models.
* **Performance HUD:** Real-time FPS monitor and WebGL mesh counters.

### 3. Real-Time Multi-User Collaboration (WebSockets & Redis)
* **Multi-Room Session Routing:** Join any room via URL parameter (`?room=room-id`) or via the in-app room switcher modal.
* **Throttled Delta Broadcasts:** 40Hz network delta emitter with client-side interpolation preventing packet congestion while maintaining fluid 60fps peer motion.
* **3D Spatial Cursors:** Real-time 3D laser beams and nametag badges projecting remote users' raycasted positions in space.
* **Optimistic Locking:** Peer bounding-box highlights and "Editing: [User]" indicators preventing concurrent edit collisions.
* **Spatial Chat & Activity Feed:** Integrated messaging drawer and system audit logs.

### 4. Persistence & REST API
* **Snapshot Persistence:** Save and restore complete scene graph snapshots (objects, materials, transforms, annotations).
* **Multi-Database Support:** SQLite zero-config out-of-the-box for standalone development + PostgreSQL via Prisma for containerized production.
* **Redis Pub/Sub:** Scalable horizontal multi-server synchronization with in-memory fallback.

---

## 🏗️ Project Structure

```
spatialsync/
├── shared-types/             # Shared TypeScript models, socket event definitions
│   ├── src/index.ts
│   ├── package.json
│   └── tsconfig.json
├── server/                   # Node.js + Express + Socket.io + Prisma + Redis
│   ├── src/
│   │   ├── config/env.ts
│   │   ├── controllers/      # REST API endpoints (/api/scenes, /api/assets)
│   │   ├── gateways/         # Socket.io real-time collaboration gateway
│   │   ├── models/           # Prisma client instance
│   │   ├── services/         # Scene snapshot & asset storage services
│   │   ├── app.ts
│   │   └── server.ts
│   ├── prisma/schema.prisma  # Persistence schema (Scene, SceneObject, Annotation)
│   ├── Dockerfile
│   └── package.json
├── client/                   # React 18 + Vite + Three.js + R3F + Tailwind + Zustand
│   ├── src/
│   │   ├── components/
│   │   │   ├── canvas/       # SceneCanvas, SceneObjectMesh, TransformGizmo, Cursors
│   │   │   └── ui/           # HeaderHUD, ToolbarHUD, Hierarchy, Inspector, Chat
│   │   ├── hooks/            # useSocket, useTransformThrottle, useGPUDisposal
│   │   ├── store/            # useSceneStore, useCollaborationStore, useUIStore
│   │   ├── services/         # REST API & Socket.io client
│   │   ├── types/
│   │   ├── utils/
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml        # Multi-container orchestration (Postgres, Redis, Backend, Client)
└── package.json              # Monorepo orchestration scripts
```

---

## 🚀 Quickstart & Installation

### Option A: Standalone Local Mode (Zero-Config)

#### Step 1: Install Dependencies
```bash
# In the spatialsync directory
npm install --prefix shared-types
npm install --prefix server
npm install --prefix client
```

#### Step 2: Initialize Database
```bash
cd server
npx prisma generate
npx prisma db push
cd ..
```

#### Step 3: Run Backend & Frontend in parallel
**Terminal 1 (Backend):**
```bash
cd server
npm run dev
# Server listening on http://localhost:4000
```

**Terminal 2 (Frontend):**
```bash
cd client
npm run dev
# Vite client running at http://localhost:5173
```

---

### Option B: Docker Compose (Full Stack with Postgres & Redis)

Run the entire stack with a single command:
```bash
docker compose up --build
```
* **Frontend:** `http://localhost:5173`
* **Backend API:** `http://localhost:4000/api/health`
* **PostgreSQL:** `localhost:5432`
* **Redis:** `localhost:6379`

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Description |
|---|---|
| **W** | Translate (Move) Gizmo mode |
| **E** | Rotate Gizmo mode |
| **R** | Scale Gizmo mode |
| **V** / **Q** | Select & Transform pointer tool |
| **C** / **A** | 3D Surface-Anchored Annotation pin tool |
| **F** | Focus camera on selected object |
| **Ctrl + D** | Duplicate selected object |
| **Delete** / **Backspace** | Delete selected object |
| **Ctrl + Z** | Undo last transform or action |
| **Ctrl + Y** | Redo last undone action |
| **Escape** | Deselect active object |
| **Left Click + Drag** | Orbit camera around scene |
| **Right Click + Drag** | Pan camera view |
| **Scroll Wheel** | Zoom camera in / out |

---

## 📡 REST API & WebSocket Reference

### REST Endpoints
* `GET /api/scenes`: List all recent saved scenes.
* `POST /api/scenes`: Create a new scene session with preset template.
* `GET /api/scenes/:id`: Fetch complete snapshot (objects, transforms, annotations).
* `PUT /api/scenes/:id`: Save scene state snapshot.
* `DELETE /api/scenes/:id`: Delete a scene.
* `POST /api/assets/upload`: Upload `.glb` / `.gltf` 3D binary model or textures.
* `GET /api/assets`: List uploaded 3D assets.
* `GET /api/health`: Health status endpoint.

### WebSocket Events
* `room:join` / `room:init`: Enter collaboration room & receive initial snapshot.
* `cursor:move` / `cursor:update`: 3D spatial cursor coordinates & surface normal.
* `object:transform` / `object:transformed`: Continuous throttled transform deltas during drag.
* `object:transform-end`: Final transform persistence upon drag release.
* `object:select` / `object:deselected`: Optimistic selection lock to prevent peer collisions.
* `object:create` / `object:update` / `object:delete`: Mesh lifecycle sync.
* `annotation:create` / `annotation:update` / `annotation:delete`: 3D pinned notes sync.
* `chat:send` / `chat:received`: Room messaging.
