# RUE3 Grok v0.1

Vocabulary trainer (Tree Model · trunk + sparse leaves). Sibling of **[RUE2 Grok](https://pernath1200.github.io/rue2-grok/)**.

Read **[CHARTER.md](./CHARTER.md)** and **[PLAN-A1-A2.md](./PLAN-A1-A2.md)** before changing scope.

## Run locally

```powershell
cd C:\Users\ADMIN\documents\projects\rue3-grok-v0.1
py -m http.server 8090
```

Open **http://localhost:8090** · hard-refresh **Ctrl+F5** after code changes.

## GitHub / Pages

Repo: [Pernath1200/rue3-grok-v0.1](https://github.com/Pernath1200/rue3-grok-v0.1) (static shell — `index.html` at root).  
Legacy experiment (pre-tree): [Pernath1200/rue3-grok](https://github.com/Pernath1200/rue3-grok).  
Enable **Settings → Pages → Deploy from branch `main` / root** for  
`https://pernath1200.github.io/rue3-grok-v0.1/` (once Pages is on).

## What exists now

- Level rail: **A1 open** · **A2 unlocks** after A1 level check (80%) · B1/B2 locked · C1 not yet
- **Author unlock** (util bar or `?unlock=all`) opens A2–B2 for content writing (local only)
- **Today** card: due units · recent activity · cover-next suggestion · **Start reviews**
- Unit-level SRS: finish Sentence → schedule review; pass reviews → Remembered / Mastered meters
- Tree board + honest progress (untouched / touched / fruit) via `localStorage`
- Practice ladder: Match → Quiz → Word · Sentence · thin **A1 level check**
- Full A1 sapling content (trunk frames + canopy leaves); A2 content next
- Author smoke: `?review=due` or **Force due (test)** when author unlock is on

## Progress

Stored in this browser only (`rue3-v0.1-progress`). Clear site data resets unlocks and block history.

## Not this folder

| Path | Role |
|------|------|
| `projects/rue3`, `rue3-grok`, forks | Legacy — do not polish into v0.1 |
| `projects/rue2-grok` + live Pages | Grammar sibling — visual reference |

## Version

v0.1 — shell + practice + progress (A0). No student deploy until amber.
