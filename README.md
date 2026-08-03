# RUE3 Vocab · **v0.2**

Vocabulary trainer (Tree Model · trunk + leaves). Sibling of **[RUE2 Grammar v1.1](https://pernath1200.github.io/rue2-grok-v1.0/)**.

**Live:** [https://pernath1200.github.io/rue3-exp/](https://pernath1200.github.io/rue3-exp/)  
**Repo (Pages):** [Pernath1200/rue3-exp](https://github.com/Pernath1200/rue3-exp)

| | |
|--|--|
| **Product version** | **v0.2** (active) |
| **Fallback** | tag **`v0.1`** · branch **`fallback/v0.1`** — [FALLBACK.md](./FALLBACK.md) |
| **Progress key** | `rue3-v0.1-progress` (do not rename) |
| **Agents** | [AGENTS.md](./AGENTS.md) |

Read **[CHARTER.md](./CHARTER.md)** and **[PLAN-A1-A2.md](./PLAN-A1-A2.md)** before changing scope.

```powershell
py scripts\smoke.py
```

## Run locally

```powershell
cd C:\Users\ADMIN\documents\projects\rue3-grok-exp
py -m http.server 8091
```

Open **http://localhost:8091** · hard-refresh **Ctrl+F5** after code changes.

## GitHub / Pages

Deploy from this repo: branch **`main`** · folder **`/` (root)** →  
`https://pernath1200.github.io/rue3-exp/`

## What exists now

- Level rail: **A1 open** · **A2** after A1 check (80%) · **B1** after A2 check (90%) · B2 locked · C1 not yet
- **Author unlock** (util bar or `?unlock=all`) opens A2–B2 for writing (local only; exp defaults author on)
- **Today** card: due units · recent activity · cover-next suggestion · **Start reviews**
- Unit-level SRS: Sentence **fruit** only when all correct (frame retries until clear) → schedule review
- Tree board + honest progress (untouched / touched / fruit) via `localStorage`
- Practice ladder: Match → Quiz → Word → Sentence · **A1 + A2 level checks**
- A1 sapling + A2 vocab canopy (themed leaves + recycle/lexis/chunks trunk)
- Author smoke: `?review=due` or **Force due (test)** when author unlock is on

## Progress

Stored in this browser only (`rue3-v0.1-progress`). Clear site data resets unlocks and block history.

## Not this folder

| Path | Role |
|------|------|
| `projects/rue3`, `rue3-grok`, forks | Legacy — do not polish into v0.1 |
| `projects/rue2-grok` + live Pages | Grammar sibling — visual reference |

## Version

**v0.2** — active line (shell + practice + progress). Fallback save is **v0.1**.
