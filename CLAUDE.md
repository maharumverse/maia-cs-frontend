# MAIA CS Frontend

Dashboard admin chatbot customer service MAIA CS (web dan WhatsApp), React + Vite, disajikan nginx di Cloud Run.

@README.md
@../docs-standard/memory/memory.rules.md

## Before You Search This Repository

**Code structure comes from the map, not from grepping.** The map is an AST map extracted by tree-sitter, and reading it costs no model tokens. Its report is generated into the vault at `../docs-standard/graph/code/maia-cs-frontend/GRAPH_REPORT.md` by `pmb digest`. Query it instead of walking the tree:

```bash
graphify query "di mana guard sesi mengalihkan ke login atau SSO" --graph ../docs-standard/graph/code/maia-cs-frontend/graph.json
graphify god-nodes --graph ../docs-standard/graph/code/maia-cs-frontend/graph.json
```

If the map is stale or missing, rebuild it with `pmb digest` rather than reading files to compensate. The exact `graph.json` location is To be confirmed: `graph/README.md` says it stays in the `plugmybrain` repository.

## Rules Come From the Vault, Not From Here

`../docs-standard/rules/` and `../docs-standard/memory/` are the human-authored control plane and they win on conflict with anything inferred from this code. Read the memory for decisions already made rather than re-deriving them.

Two exceptions are owner-decided for this project: `stacks.rules.md` is set aside, and `src/index.css` was rebuilt from `../docs-standard/component/` because `maia-legal-frontend/src/index.css` was not accessible. See "Deviations From the Standards" in the README. Every other rule applies.

Never read the whole vault to answer a question about this code. That is what the map is for. Never read a real `.env`, only `.env.example`. The frontend holds no secrets: every `VITE_*` value is public.

## The Memory Server

The memory is connected as an MCP server exposing two read-only tools:

- `recall` answers a question from the memory. **Always pass the brain**, which is the folder's own name lowercased, so one project's memory cannot leak into another's answer. This project's brain is `maia-cs-frontend`.
- `brains` lists which memories exist on this machine.

Call `recall` before answering anything about this project's rules, decisions, architecture, or history. `/pmb-map maia-cs-frontend` switches which memory the session reads from when the work moves elsewhere.

**Nothing here writes, on purpose.** To add a memory, write a markdown note under `../docs-standard/memory/` and run `pmb digest`.

## Two Things Not to Do

- **Do not write to the index directly.** It is derived from the markdown, so a direct write is gone at the next rebuild. Write the note, then digest.
- **Do not hand-edit anything under `../docs-standard/graph/`.** It is regenerated and gitignored.
