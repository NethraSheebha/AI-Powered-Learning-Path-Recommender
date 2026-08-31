# PathMind — AI-Powered Personalized Learning Path Recommender (Frontend)

This directory contains the frontend application for **PathMind**, a personalized learning path recommender designed to dynamically generate and adapt learning journeys.

## Tech Stack

- **React 18** (with React Hooks)
- **TypeScript**
- **Vite**
- **Tailwind CSS + DaisyUI**
- **React Flow** (for rendering the interactive learning graph)
- **Framer Motion** (for smooth transitions and modal animations)
- **Lucide React** (icons)
- **React Router** (client-side routing)

## Features

1. **Goal Intake:** Conversational interface for users to specify their learning goals in plain text.
2. **Interactive Graph View:** Renders an interactive topological graph of prerequisites using React Flow.
3. **Node Mastery:** Nodes have distinct statuses (`locked`, `available`, `mastered`, `remedial`) with mastery bars reflecting the learner's current competence.
4. **Adaptive Updates:** Polling mechanism that listens for `graph_diff` changes (e.g., remedial nodes added upon failing a project).
5. **Assessment Modals:** Integrated quiz and project submission interfaces that update the graph locally and push results to the backend.
6. **Dashboard:** Key metrics tracking streak, mastery count, and progress towards completing the learning goal.

## Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- npm or yarn

### Installation

```bash
cd frontend
npm install
```

### Development

To start the development server:

```bash
npm run dev
```

The app will be available at [http://localhost:5173](http://localhost:5173).

### Environment Variables

Copy the example file to configure your environment:

```bash
cp .env.example .env
```

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Base URL for the backend API (default: `http://localhost:8000`) |
| `VITE_USE_MOCKS` | Set to `true` to use the embedded demo mock data without needing the backend running. Set to `false` for production/integration. |

### Building for Production

```bash
npm run build
```

This will create a `dist` directory with optimized, minified production assets.

## Architecture & State Management

- **Context API (`AppContext.tsx`)**: Manages the central state, including the active `learner`, the current `graph`, the `selectedNodeId`, and graph mutation differences (`seenDiffIds`, `pendingGraphDiff`).
- **Data Fetching & Integration (`api/`)**: Centralized fetch layer abstracting the backend REST endpoints. Fully typesafe and automatically falls back to `VITE_USE_MOCKS` if configured.
- **Layout Engine (`hooks/useGraphLayout.ts`)**: Uses a topological sort algorithm to group nodes into dependency layers and assign absolute X/Y coordinates to React Flow nodes, ensuring the prerequisite directionality is visually clear (left-to-right).
- **Polling (`hooks/useGraphDiffPolling.ts`)**: Polls the backend every 8 seconds for new graph additions (e.g., remedial nodes) and cleanly merges them into the active graph state.

## Design Philosophy

The PathMind frontend intentionally avoids generic "AI-generated" aesthetics (no neon gradients, robotic graphics, or generic Bootstrap themes). It employs a modern, clean, human-centric design with subtle micro-interactions, robust error states, and high visual polish to feel like a premium educational tool.
