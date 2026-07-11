# AI Procurement Intelligence Agent (server)

A conversational [LangGraph](https://langchain-ai.github.io/langgraph/) agent that
turns freeform procurement requirements into a structured **Request for Proposal
(RFP)**. The agent interviews the buyer, progressively builds a structured RFP
draft, asks targeted clarifying questions for anything missing, and finally
composes a polished, vendor-ready RFP document in Markdown.

## How it works

```
START ─▶ triage ─▶ clear? ──▶ analyze ─▶ ready? ─▶ compose ─▶ await_review
                |                       |                          |
                |                       └─▶ await_human ─┐         |
                └─unclear─▶ advise ─▶ await_human ─────┴─▶ triage |
                                                                   |
                confirm ──────────────────────────────────────────▶ END
                edit ──────────────────────────────▶ analyze (revise loop)
```

Human-in-the-loop uses LangGraph **`interrupt()`** in two places:

1. **`await_human`** — after roadmap/guiding questions (`advise`) or clarifying
   questions (`analyze` when not ready).
2. **`await_review`** — after the RFP is generated (`compose`); UI pauses for
   **confirm** or **edit** before the run finishes.

- **triage** — Classifies intent (internal routing node).
- **advise** → **await_human** — Roadmap + guiding questions → interrupt.
- **analyze** → **await_human** or **compose** — Gather fields or generate.
- **compose** → **await_review** — RFP Markdown draft.
- **await_review** — Interrupt with full `rfp_markdown`; confirm → END, edit →
  **analyze** → **compose** → **await_review** again.

State (the evolving draft + conversation) is persisted across turns by the
LangGraph runtime, so each new user message continues the same RFP.

### Project layout

```
src/agent/
  rfp/
    graph.py       # builds & exports the compiled `graph`
    state.py       # graph State + run ConfigSchema
    schemas.py     # Triage + RFPDraft + structured-output models
    prompts.py     # system prompts
    llm.py         # provider-agnostic model factory
    nodes/
      triage.py    # intent classification
      advise.py    # roadmap + guiding questions
      analyze.py   # requirement extraction + clarifying questions
      await_human.py   # interrupt — questions before drafting
      await_review.py  # interrupt — confirm or edit after RFP generated
      compose.py   # Markdown RFP generation
      routing.py   # conditional edge routing
      _helpers.py  # shared node utilities
```

## Setup

```bash
cd server
uv sync                      # installs deps from pyproject/uv.lock
cp .env.example .env         # then add your API key
```

Set at least your provider key in `.env` (e.g. `OPENAI_API_KEY`). Switch models
by changing `RFP_MODEL` (format: `provider:model`), installing the matching
provider package if needed (e.g. `uv add langchain-anthropic`).

## Run

Launch the LangGraph dev server (Studio UI + REST API, with persistence):

```bash
uv run langgraph dev
```

Then open the printed LangGraph Studio URL and chat with the
`procurement_rfp_agent` graph. Try an opening message like:

> We need a vendor to supply and install 200 ergonomic office chairs across our
> Bangalore office by end of Q3, budget around 30 lakh INR.

The agent will fill in what it can, ask for the rest, and then generate the RFP.

## Human-in-the-loop (interrupts)

A **checkpointer is required** — `langgraph dev` provides one automatically.

### Before drafting (`await_human`)

```json
{
  "type": "rfp_human_input",
  "stage": "advise",
  "assistant_message": "... roadmap and questions ...",
  "missing_critical": ["budget range", "timeline"],
  "need_summary": "office furniture for Bangalore",
  "actions": ["reply"]
}
```

Resume with the user's answer:

```python
from langgraph.types import Command

graph.invoke(Command(resume="Budget is 30 lakh INR, due end of Q3."), config)
```

### After RFP generated (`await_review`)

```json
{
  "type": "rfp_review",
  "stage": "review",
  "rfp_markdown": "# Request for Proposal ...",
  "assistant_message": "Reply confirm to finalize, or describe edits...",
  "actions": ["confirm", "edit"]
}
```

Confirm:

```python
graph.invoke(Command(resume="confirm"), config)
# or Command(resume={"action": "confirm"})
```

Request edits (loops back to analyze → compose → await_review):

```python
graph.invoke(
    Command(resume="Change budget max to 25 lakh and add warranty requirement."),
    config,
)
```

In LangGraph Studio, the UI surfaces interrupts when you chat; reply to resume.

## Programmatic use

```python
import uuid
from langgraph.checkpoint.memory import InMemorySaver
from langgraph.types import Command
from agent.rfp.graph import build_graph

graph = build_graph().compile(checkpointer=InMemorySaver())
config = {"configurable": {"thread_id": str(uuid.uuid4())}}

# First message
result = graph.invoke(
    {"messages": [("human", "We need office chairs for our Bangalore office...")]},
    config,
)
# If interrupted, resume with the user's answer
if result.get("__interrupt__"):
    result = graph.invoke(
        Command(resume="About 200 chairs, budget 30 lakh INR, need by Q3."),
        config,
    )
print(result.get("rfp_markdown"))
```

> Note: `agent/rfp/graph.py` exports a `graph` compiled without a checkpointer for the
> LangGraph platform (which injects its own). For standalone scripts, compile
> with your own checkpointer as shown above.
