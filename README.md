# Live Chain Reaction

A real-time multiplayer strategy game where players place orbs on a grid to trigger explosive chain reactions.

## Project Setup Complete ✅

This Next.js project has been initialized with all the required dependencies and basic structure for the Live Chain Reaction game.

### What's Included

- **Next.js 15** with TypeScript and App Router
- **TailwindCSS v4** for styling
- **InstantDB** for real-time database synchronization
- **React Spring** for smooth animations
- **ESLint** configuration for code quality

### Project Structure

```
rxn/
├── src/
│   ├── app/                 # Next.js App Router pages
│   │   ├── api/            # API routes for game logic
│   │   │   ├── room/       # Room management endpoints
│   │   │   ├── game/       # Game action endpoints
│   │   │   └── user/       # User management endpoints
│   │   ├── globals.css     # Global styles with Tailwind
│   │   ├── layout.tsx      # Root layout component
│   │   └── page.tsx        # Home page
│   ├── components/         # React components (to be created)
│   ├── lib/               # Utility libraries
│   │   ├── instant.ts     # InstantDB configuration
│   │   └── gameLogic.ts   # Game logic utilities
│   └── types/             # TypeScript type definitions
│       └── game.ts        # Game-related types
├── .env.local.example     # Environment variables template
└── package.json           # Dependencies and scripts
```

### Getting Started

1. **Install dependencies** (already done):
   ```bash
   npm install
   ```

2. **Configure InstantDB**:
   - Copy `.env.local.example` to `.env.local`
   - Sign up at [InstantDB](https://instantdb.com) and get your app ID
   - Replace `your-app-id-here` with your actual InstantDB app ID

3. **Run the development server**:
   ```bash
   npm run dev
   ```

4. **Open your browser** and navigate to `http://localhost:3000`

### Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Next Steps

The project is ready for implementing the game features according to the design specification. The next tasks will involve:

1. Creating the game board UI components
2. Implementing real-time game state management
3. Adding multiplayer room functionality
4. Building the chain reaction animation system

### Dependencies

- **@instantdb/react** - Real-time database for multiplayer sync
- **@react-spring/web** - Animation library for smooth transitions
- **next** - React framework with App Router
- **react** & **react-dom** - React library
- **tailwindcss** - Utility-first CSS framework
- **typescript** - Type safety and better development experience

The project builds successfully and is ready for development!