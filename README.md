# SED Line Pilot

Serious web game about [SED Machines](https://sedmachines.com) pharmaceutical & packaging equipment. We deployed this game on https://sed-line-pilot.onrender.com to let user know more about equipment function. 

Play as a line operator / plant engineer. Tune process parameters on tablet presses, capsule fillers, metal detectors, pill counters, cappers, induction sealers, and blister packers. Survive disturbances and chase OEE.

## Campaign mechanics

- Production failures are tracked per line with an immediate batch reminder.
- Three consecutive failed batches trigger a simulated 60-minute production hold and CAPA recovery checklist.
- A three-round client call scores transparency, recovery commitments, and trust. Successful recovery earns the client's compliment and unlocks the next cooperation.
- Difficulty escalates from process disturbances to human-error stops and parameter changes, then to a resilience drill with an unplanned power outage.
- Campaign progress, line holds, cooperation count, difficulty, language, and best scores persist locally.

## Stack

- TypeScript
- Vite static build
- Deployable on Render Static Site

## Scripts

```bash
npm install
npm run dev
npm run build
npm run test:smoke
```

## Render

- Build command: `npm install && npm run build`
- Publish directory: `dist`

Or use the included `render.yaml`.

## Disclaimer

Training simulation only. Not a machine control system or validation tool.
