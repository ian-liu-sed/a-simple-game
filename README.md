# SED Line Pilot

Serious web game about [SED Machines](https://sedmachines.com) pharmaceutical & packaging equipment. We deployed this game on https://sed-line-pilot.onrender.com to let user know more about equipment function. 

Play as a line operator / plant engineer. Tune process parameters on tablet presses, capsule fillers, metal detectors, pill counters, cappers, induction sealers, and blister packers. Survive disturbances and chase OEE.

## Campaign mechanics

- Production failures are tracked per line with an immediate batch reminder.
- Three consecutive failed batches trigger a simulated 60-minute production hold and CAPA recovery checklist.
- A three-round client call scores transparency, recovery commitments, and trust. Successful recovery earns the client's compliment and unlocks the next cooperation.
- Players can choose Assistant, Expert, or Legend difficulty. The selector describes each mode qualitatively without revealing how many incidents will occur. Higher modes add multi-parameter incidents, tighter recovery precision, and an unplanned power outage.
- Mission reports show an immediate satisfied or disappointed client reaction based on the batch result.
- Incident-shifted controls pulse red with an **ADJUST NOW** badge until the parameter returns to its validated window.
- Successful client recovery recommends the next difficulty while keeping all three modes selectable.
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
