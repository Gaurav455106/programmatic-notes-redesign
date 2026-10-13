# SPEC — Programmatic Notes

## What it is
A self-paced revision app for the programmatic module (DV360 focus) for MLP freshers. Not a simulation: notes + interactive tools + drills + viva practice + quiz.

## Source material
19 class recordings (Cyrus Taneja, Saikiran, MLP 49). Transcripts were noisy Hinglish; uncertain numbers are flagged in the page (Noise net-media %, UFC line-item split).

## Structure
5 parts, 22 modules: Foundations (why, ecosystem, RTB/auction, DSPs) · Buying & setup (deals, structure, platform tour, pacing, frequency, bidding) · Audience, safety & creative (targeting, data & ads.txt, brand safety & IVT, creatives) · Measure & plan (Floodlight, CM360, media planning, structuring cases) · Practice (optimisation lab, viva prep, final quiz, glossary).

## Scoring rules (drills)
- Optimisation lab: 10 cases, 1 point for the correct first move.
- Final quiz: 38 MCQs, 1 point each; debrief links to modules with wrong answers.
- Setting finder: 10 random settings, place at Advertiser / Campaign / IO / Line item / Creative.
- Brand-safety drill: 6 cases → Invalid traffic / Brand-safety issue / Fine.
- UFC rules drill: 6 proposed line items → Breaks a rule / Allowed (rules: no retargeting on OA; video for new audiences only; ≤4/week; one creative format per line item).
- Six-brands deal drill: class answers OA, PMP, PMP (or PD/PG), PG (or PD), PMP (or OA), PMP.

## Analytics
Supabase events table (insert-only for the public key) + passcode-protected `get_stats()` RPC. Optional student name + batch.

## Look and feel
Kraftshala style: white, navy, yellow; metric tiles with ▲▼; dark mode supported.
