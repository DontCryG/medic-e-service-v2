# Medic E-Service V2 - AI Agent Guidelines

Welcome to the **Medic E-Service V2** project. If you are an AI coding assistant (e.g., GitHub Copilot, Cursor, Antigravity, etc.) working on this repository, please adhere to the following architectural guidelines, tech stack constraints, and coding standards.

## 🛠️ Tech Stack
- **Framework:** React 18 + TypeScript + Vite
- **Routing:** React Router v7 (using `createBrowserRouter`)
- **Styling:** Tailwind CSS
- **State Management:** Zustand (Global/Auth), TanStack React Query (Server State)
- **Backend/BaaS:** Supabase (PostgreSQL, Auth, Realtime)
- **Forms & Validation:** React Hook Form + Zod
- **Icons:** `lucide-react`
- **UI Components:** Headless/Custom built with Tailwind (No heavy component libraries)

## 🏗️ Architecture & Patterns

### 1. Data Fetching (React Query)
- **DO NOT** use standard `useEffect` for data fetching.
- **ALWAYS** use `@tanstack/react-query` (`useQuery`, `useMutation`).
- Place hooks in their respective feature folders (e.g., `src/pages/LeaveSystem/hooks/useLeaveQueries.ts`).
- Ensure optimistic updates for mutations where applicable to make the UI feel fast.

### 2. Global State (Zustand)
- Only use Zustand for global states like `authStore` (User Session) and UI toggles that need to be accessed globally.
- Avoid storing server data in Zustand. Server data belongs in React Query cache.

### 3. Forms & Validation
- **ALWAYS** use `react-hook-form` coupled with `@hookform/resolvers/zod`.
- Define Zod schemas explicitly for payload validation before submitting to Supabase.
- Show error messages below input fields in red text.

### 4. Supabase Integration
- Use the initialized client from `src/lib/supabase.ts`.
- Write type-safe queries using the generated types in `src/lib/database.types.ts`.
- If complex joins or multiple round-trips are needed, consider creating an RPC (Remote Procedure Call) function in PostgreSQL rather than making multiple frontend requests.

### 5. Styling (Tailwind)
- Avoid inline CSS (`style={{ ... }}`). Use Tailwind utility classes.
- Ensure all UIs are responsive (mobile-first approach).
- Primary brand color is purple/indigo (e.g., `#7e22ce`, `purple-700`).

## 🛑 Critical Rules

1. **Handling Thai Language Strings (PowerShell Trap)**
   - If generating scripts or writing files via CLI tools on Windows PowerShell, **DO NOT** use inline string literals for Thai text (it will cause encoding corruption).
   - Use Node.js scripts with `fs.writeFileSync(..., 'utf8')` or standard file writing APIs that enforce UTF-8.
2. **ChunkLoadError Recovery**
   - The app uses route-level code splitting (`lazy`). A `lazyWithRetry` wrapper is implemented in `App.tsx` to automatically reload the page if a JS chunk fails to load after a deployment. Do not remove this logic.
3. **Print Layouts**
   - When building printable reports/modals, ensure they use `@media print` or Tailwind's `print:` modifiers correctly. Use `print:fixed` instead of `print:absolute` for modals to prevent scroll-shifting issues. Hide the main layout elements (Sidebar, Header) using `print:hidden`.

## 📂 Project Structure
```
src/
├── components/   # Reusable UI components (Modals, Inputs, Buttons)
├── hooks/        # Global hooks (e.g., useAppRealtime)
├── layouts/      # MainLayout, Sidebar, Header
├── lib/          # Third-party integrations (Supabase client, Sentry)
├── pages/        # Feature modules (DutySystem, LeaveSystem, etc.)
│   └── [Feature]/
│       ├── components/  # Feature-specific components
│       ├── hooks/       # Feature-specific React Query hooks
│       └── utils/       # Feature-specific helpers
├── store/        # Zustand stores
└── utils/        # Global utilities (date formatting, sound)
```