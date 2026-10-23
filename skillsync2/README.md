# SkillSync - Fair Team Formation & Workspace

SkillSync is an intelligent, algorithmic team formation platform designed for hackathons, engineering competitions, and collaborative academic coursework. It balances overall skill scores and distribution fairness, honors mutual teammate preferences, avoids conflicts, and provides dedicated team workspaces with sprint progress tracking, member workload analytics, milestones, and Kanban task boards.

## Features

- **Algorithmic Team Balancing**:
  - Multi-objective greedy + iterative swap search optimizer.
  - Balances overall skill score distribution within configurable tolerance thresholds (`fairness_tolerance`).
  - Optimizes teammate wishes (`prefer` / `avoid` requests) while maintaining skill equilibrium across teams.
  - Automatically identifies and distributes qualified volunteer student leaders.
- **Coordinator Dashboard**:
  - Create and configure competitions with weighted skill requirements (e.g. AI/ML, Web, Hardware, DSA).
  - Review qualified applicants with fitness scores and leadership interest.
  - Generate multiple balanced candidate options (Option 1, Option 2, Option 3) with real-time metrics and team averages charts.
  - Run automated Monte Carlo fairness simulations benchmarked against 300 random assignment trials.
  - One-click CSV export of finalized teams and student rosters.
- **Student Dashboard**:
  - Overall fitness and general score breakdown (out of 10).
  - Interactive radar strength chart displaying top skill proficiencies.
  - Profile and skill proficiency/experience ratings management.
  - Real-time competition registration with volunteer leadership option.
  - Teammate wishes management (select up to 3 peers to prefer or avoid).
- **Team Workspace**:
  - Live sprint completion progress bar.
  - Interactive workload distribution chart showing planned hours per member.
  - Milestone management with due date tracking and overdue indicators.
  - 3-column Kanban board (To do, In progress, Done) with status transitions and ownership permissions.

## Tech Stack

- **Framework**: React 18 with TypeScript
- **Bundler**: Vite
- **Styling**: Tailwind CSS with custom theme variables
- **Data Visualization**: Chart.js (Radar & Bar charts)
- **Icons**: Lucide React
- **Architecture**: In-memory reactive store with local persistence and full client-side algorithmic balancing

## Development

```bash
npm install
npm run dev
```

Server runs on `http://0.0.0.0:3000`.
