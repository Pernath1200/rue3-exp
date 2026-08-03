# Agent rules — RUE3 Vocab v0.2

## Product

| | |
|--|--|
| **Folder** | `projects/rue3-exp` |
| **Live site** | https://pernath1200.github.io/rue3-exp/ |
| **Version** | **v0.2** active · **v0.1** = fallback tag |
| **Progress key** | `rue3-v0.1-progress` — **never rename** |
| **Local port** | 8091 (or free port) |

## Git

| | |
|--|--|
| **Lab remote** | `origin` → `Pernath1200/rue3-grok-v0.1` |
| **Pages remote** | `pages` → `Pernath1200/rue3-exp` |
| **Work base** | `exp/autonomous` for lab; deploy to Pages only via intentional push/PR to `pages`/`main` as documented |
| **PRs** | **Draft only** · human merges |

## Do

- Fix `agent-ready` issues `size:S` / `size:M`
- Run `py scripts/smoke.py` and paste output in the PR
- Match visual tokens in CHARTER (teal accent, dark UI)

## Don’t

- Rename progress / author keys  
- Polish legacy folders (`rue3`, `rue3-grok`, etc.)  
- Invent vocab unit ids outside Codex (`V_*`)  
- Touch `fallback/v0.1` or tag `v0.1`  

## Smoke

```powershell
cd C:\Users\ADMIN\documents\projects\rue3-exp
py scripts\smoke.py
```

## Content

- Label curriculum/quality PRs `needs-teacher-review`
