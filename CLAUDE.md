# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## About FISH

FISH is a web-based fish banks simulator for environmental psychology studies, based on Robert and Jonas Gifford's original FISH. It simulates a shared resource management scenario where participants (fishers) fish from a common ocean with regenerating fish populations.

## Architecture Overview

### Core Concepts

**Microworlds**: Experimental configurations created by experimenters that define simulation parameters (number of fishers, seasons, fish populations, costs, bot behaviors, etc.). Each microworld has a unique code and can be in test, active, or archived status.

**Runs/Sessions**: Individual simulation instances. When participants join using a microworld code, they're assigned to an Ocean instance that manages the actual gameplay.

**Ocean System**: The game engine that manages real-time simulation state:
- `OceanManager` (src/engine/ocean-manager.js): Assigns fishers to ocean instances based on microworld availability
- `Ocean` (src/engine/ocean.js): Manages a single simulation run with its own state (fish population, season progression, timer)
- `Fisher` (src/engine/fisher.js): Represents individual participants (human or bot) with behavior models for bots

### Data Flow

1. Experimenter creates/activates microworld via dashboard
2. Participant enters microworld code
3. OceanManager assigns participant to an Ocean instance (creates new one if needed)
4. Ocean manages real-time gameplay via Socket.IO
5. Results saved to MongoDB when simulation completes

### User Roles

- **Superusers**: Can create experimenters (access via `/super`)
- **Experimenters**: Create and manage microworlds, view results (access via `/admin`)
- **Participants**: Join active microworlds by code to fish (access via `/`)

### Key Technologies

- **Backend**: Express.js with Mongoose (MongoDB ODM)
- **Real-time**: Socket.IO for game state synchronization
  - Main namespace for participant-ocean communication
  - `/admin` namespace for experimenter dashboard updates
- **Frontend**: Pug templates, client-side JS in public/js/
- **Build**: Babel transpilation from src/ to dist/

## Development Commands

### Setup
```bash
npm install                    # Install dependencies and auto-populate DB
npm run populatedb            # Manually create admin user (username: admin, password: 123456789)
npm run cleandb               # Wipe all collections (experimenters, microworlds, sessions)
npm run resetdb               # Clean then populate DB
```

### Building & Running
```bash
npm run build                 # Build both server and client (src/ → dist/)
npm run build:server          # Build server only
npm run build:client          # Build client only
npm start                     # Build and run in production mode
npm run serve                 # Run pre-built code (no rebuild)
npm run dev                   # Development mode with auto-rebuild and nodemon
npm run devreset              # Reset DB and start dev server
```

### Testing & Code Quality
```bash
npm test                      # Run all tests with coverage (mocha + nyc)
npm run lint                  # ESLint check
npm run style-check           # Prettier check
npm run style-fix             # Auto-fix with Prettier
```

### Styles
```bash
npm run sass                  # Watch SCSS changes (public/scss/ → public/css/)
```

### Docker
```bash
npm run build-docker          # Build Docker images (run once or after Dockerfile changes)
npm run start-docker          # Run in foreground
npm run start-daemon-docker   # Run in background
npm run stop-daemon-docker    # Stop background services
npm run docker-populatedb     # Populate DB in Docker container
npm run logs-docker-fish      # View app logs
npm run logs-docker-mongo-fish # View MongoDB logs
```

## Important Code Patterns

### Socket.IO Event Flow

**Participant → Ocean**:
- `enterOcean(mwId, pId)`: Join simulation
- `readRules()`: Mark as ready to start
- `attemptToFish()`: Cast fishing attempt
- `goToSea()` / `return()`: Change location
- `recordIntendedCatch(numFish)`: Record catch intentions (if enabled)
- `requestPause()` / `requestResume()`: Pause controls (if enabled)

**Ocean → Participant**: Real-time state updates emitted to socket room (ocean ID)

**Admin Dashboard**: Uses `/admin` namespace, experimenters join room by their ID to receive simulation updates

### Access Control

Middleware in src/middlewares/access.js:
- `allowUsers`: Any logged-in experimenter
- `allowOnlySuperusers`: Superuser only
- `allowSelfAndSuperusers`: User accessing own resources or superuser
- `isUserSameAsParamsId`: Route param matches session user

### Bot Behavior

Bots simulate human behavior with configurable parameters:
- `greed`: Base fishing intensity (0-1)
- `greedSpread`: Randomness in behavior
- `trend`: 'increasing', 'decreasing', or 'stable' greed over seasons
- `predictability`: 'predictable' or 'erratic'
- `probAction`: Probability of taking action each second
- `attemptsSecond`: Fishing attempts per second when active

### Database Models

- **Experimenter** (src/models/experimenter-model.js): User accounts with bcrypt password hashing
- **Microworld** (src/models/microworld-model.js): Experimental configurations with nested params object
- **Run** (src/models/run-model.js): Completed simulation results

### Configuration

Environment handled via `NODE_ENV` (development/production/test):
- MongoDB connection in src/config.js (uses MONGO_HOST env var for Docker)
- Different logging levels and error handling per environment
- Test environment uses separate database (fish-test)

## Testing Notes

### Running Tests
- Tests use mocha with babel-register for ES6 support
- Coverage via nyc, configured to include src/ and public/js/
- Test files: `*.test.js` alongside source files
- Run with NODE_ENV=test to use test database and suppress logs
- **Important**: Ensure MongoDB is running and no server is on port 8080 before running tests

### Current Test Coverage (~17% overall)

**Well-Tested Components:**
- Data models (src/models/): **87%** coverage - schemas are solid
- Core game logic (src/engine/fisher.js): **64%** - bot behavior well-tested
- Ocean simulation (src/engine/ocean.js): **47%** - basic game mechanics covered

**Gaps in Coverage:**
- Client-side code (public/js/): **0%** - no browser-side tests exist
- API routes (src/routes/): **12%** - integration tests have MongoDB timeout issues
- Socket.IO handlers (src/engine/engine.js): **20%** - real-time events largely untested
- Access middleware: **32%** - authentication/authorization needs testing

**Known Issues:**
- Integration tests for routes (sessions, experimenters) fail with MongoDB connection timeouts
- No tests for client-side JavaScript (fish.js, microworld.js, dashboard.js, etc.)
- Socket.IO event flow not comprehensively tested

## File Structure Highlights

- `src/`: Server-side source code (transpiled to dist/)
- `public/js/`: Client-side JavaScript (transpiled to dist/public/js/)
- `views/`: Pug templates (not transpiled, referenced from dist/)
- `developer_scripts/`: MongoDB scripts for DB management
- `dist/`: Build output (gitignored, created by babel)
