# AI Inventory Planning & Procurement Platform Prototype

React + TypeScript + Tailwind CSS frontend prototype for inventory planning, supplier contact, purchase request approval, audit trail, and VMI simulation.

## Run

Requires Node.js 18+.

```bash
npm install
npm run dev
```

Open the local Vite URL shown in the terminal.

## Notes

- Uses mock data only from `src/data/mockData.ts`.
- No SAP, database, backend, or external service integration is included.
- In-memory state stores purchase requests and supplier contact logs for the current browser session.
- `src/App.tsx` has comments marking where real API integration can be added later.

## Main Demo Flow

Dashboard → C01 SKU Detail → Calculation Detail → Create Purchase Request with 20 เมตร → Submit to Regional → Approve → Request History → VMI Simulation
