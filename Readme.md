# ProcureAI

**ProcureAI** turns plain procurement requirements into structured RFPs, scores vendor proposals, and helps you award — with an AI assistant in the loop.

### What it does

1. **Intake** — Describe what you need in plain language (budget, timeline, constraints).
2. **RFP generation** — Pick an organization template; the AI drafts a full RFP section by section.
3. **Vendor evaluation** — Upload or use demo proposals; the AI scores vendors against your RFP.
4. **Award** — Review scores and move to a procurement decision.

Built for procurement managers who want less manual drafting and a clearer path from requirement → RFP → vendor shortlist.

---

# Setup Guide (New Laptop)

This guide helps you run **ProcureAI** on a brand-new computer, even if you are not a developer.

The app has two parts that must run at the same time:

| Part | What it does | Folder |
|------|----------------|--------|
| **Server** (AI backend) | Powers chat, RFP generation, and vendor analysis | `server` |
| **Client** (website) | The screen you click and type in | `client` |

You will open **two terminal windows**, start one part in each, then open the app in your web browser.

---

## Before you start — checklist

Make sure you have:

- [ ] A Windows 10/11 or Mac laptop with internet
- [ ] The project folder (from GitHub, USB drive, or zip from your team)
- [ ] An **OpenAI API key** (starts with `sk-...`) — ask your team lead if you do not have one
- [ ] About **30–45 minutes** for first-time setup

---

## Step 1 — Install required software

Install these **once** on your laptop. After that, you only repeat Steps 4–7 each time you use the app.

### 1A. Node.js (runs the website)

1. Open: [https://nodejs.org](https://nodejs.org)
2. Download the **LTS** version (recommended for most users).
3. Run the installer → click **Next** through the steps → finish.
4. **Check it worked** — open **Terminal** (Mac) or **PowerShell** (Windows):
   - Press `Win + X` → choose **Terminal** or **PowerShell** on Windows
   - On Mac: open **Terminal** from Applications → Utilities

   Type this and press Enter:

   ```text
   node --version
   ```

   You should see something like `v22.x.x`. If you get an error, restart your computer and try again.

### 1B. pnpm (installs website dependencies)

In the same terminal, run:

**Windows (PowerShell):**

```powershell
npm install -g pnpm
```

**Mac:**

```bash
npm install -g pnpm
```

Check:

```text
pnpm --version
```

You should see a version number (for example `9.x.x`).

### 1C. Python 3.12 (runs the AI server)

1. Open: [https://www.python.org/downloads/](https://www.python.org/downloads/)
2. Download **Python 3.12.x**.
3. **Windows only:** On the first installer screen, check **“Add python.exe to PATH”**, then install.
4. Check:

   ```text
   python --version
   ```

   You should see `Python 3.12.x`.

   > **Tip:** If `python` does not work on Windows, try `py --version` instead.

### 1D. uv (installs AI server dependencies)

**Windows (PowerShell):**

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

**Mac:**

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

Close and reopen your terminal, then check:

```text
uv --version
```

---

## Step 2 — Get the project on your laptop

Choose one option:

**Option A — Git (if your team uses GitHub)**

```text
git clone <your-team-repo-url>
cd Hackathon
```

**Option B — Zip file**

1. Unzip the folder (for example to `Desktop\Hackathon`).
2. Open terminal in that folder:

   **Windows:** Open the `Hackathon` folder in File Explorer → click the address bar → type `powershell` → Enter.

   **Mac:** Right-click the folder → **New Terminal at Folder** (or `cd` into it manually).

You should see two folders inside: `client` and `server`.

---

## Step 3 — Add your OpenAI API key

The AI features need an OpenAI key.

1. Go to the **`server`** folder.
2. Find the file **`.env.example`**.
3. Make a copy and name it **`.env`** (same folder):

   **Windows (PowerShell, from the `server` folder):**

   ```powershell
   copy .env.example .env
   ```

   **Mac:**

   ```bash
   cp .env.example .env
   ```

4. Open **`.env`** in Notepad (Windows) or TextEdit (Mac).
5. Find this line:

   ```text
   OPENAI_API_KEY=sk-...
   ```

6. Replace `sk-...` with your real key (keep `OPENAI_API_KEY=` at the start).
7. Save and close the file.

> **Important:** Never share your API key or commit `.env` to GitHub.

### Client settings (usually no changes needed)

In the **`client`** folder, copy the example env file the same way:

**Windows:**

```powershell
cd ..\client
copy .env.example .env
```

**Mac:**

```bash
cd ../client
cp .env.example .env
```

The defaults work for local use. You only need to edit `client\.env` if your server runs on a different address.

---

## Step 4 — Install project dependencies (first time only)

Run these **once** after cloning or unzipping.

### Server

```text
cd server
uv sync
```

Wait until it finishes (may take a few minutes).

### Client

Open a **new** terminal window (keep the first one open if you like), then:

```text
cd client
pnpm install
```

Wait until it finishes.

---

## Step 5 — Start the AI server (Terminal 1)

In a terminal:

```text
cd server
uv run langgraph dev
```

**Leave this window open.** Do not close it while using the app.

When it is ready, you will see messages mentioning:

- `http://localhost:2024` — API address
- A LangGraph Studio URL (optional; you can ignore it for normal use)

> First start may take 1–2 minutes. Wait until you see that the server is listening.

---

## Step 6 — Start the website (Terminal 2)

Open a **second** terminal window:

```text
cd client
pnpm dev
```

**Leave this window open too.**

You should see something like:

```text
Local:   http://localhost:5173/
```

That is the address of the app.

---

## Step 7 — Open the app and sign in

1. Open your browser (Chrome, Edge, or Firefox).
2. Go to: **http://localhost:5173**
3. Sign in with a demo account:

| Role | Email | Password |
|------|-------|----------|
| Procurement Manager (recommended) | `pm@procure.ai` | `pm123` |
| Admin | `admin@procure.ai` | `admin123` |
| Viewer (read-only) | `viewer@procure.ai` | `viewer123` |

You can also click the demo account links on the login page.

---

## Daily use — quick start

After the one-time setup (Steps 1–4), each time you want to use ProcureAI:

1. **Terminal 1:** `cd server` → `uv run langgraph dev` → leave open
2. **Terminal 2:** `cd client` → `pnpm dev` → leave open
3. Browser: **http://localhost:5173**

To stop the app: click each terminal window and press `Ctrl + C` (Mac: `Ctrl + C` or `Cmd + .`).

---

## How to know everything is working

| Check | Expected result |
|-------|------------------|
| Server terminal | No red error lines; mentions port `2024` |
| Client terminal | Shows `http://localhost:5173` |
| Browser | Login page loads |
| After login | Dashboard opens |
| AI chat | Agent replies within a few seconds (needs valid OpenAI key) |

For a guided walkthrough of features, see **`DEMO.md`** in this folder.

---

## Troubleshooting

### “node is not recognized” or “python is not recognized”

- Install Node.js / Python again and make sure **Add to PATH** is checked (Windows).
- **Restart your computer**, then open a **new** terminal.

### “pnpm is not recognized”

Run again:

```text
npm install -g pnpm
```

Restart the terminal.

### “uv is not recognized”

Re-run the uv install command from Step 1D, close all terminals, open a new one.

### Website opens but AI does not respond

1. Check **Terminal 1** (server) is still running.
2. Open `server\.env` and confirm `OPENAI_API_KEY` is correct (starts with `sk-`, no extra spaces).
3. Restart the server: in Terminal 1, press `Ctrl + C`, then run `uv run langgraph dev` again.

### “Port already in use” or “address already in use”

Something else is using that port, or you already started the app.

- Close old terminal windows running the server or client.
- Or restart your laptop and start again from Step 5.

### `uv sync` or `pnpm install` fails

- Check internet connection.
- Make sure you are inside the correct folder (`server` or `client`).
- Try again once; corporate VPN or firewall can sometimes block downloads.

### Browser shows a blank page

- Confirm the client terminal shows `http://localhost:5173`.
- Try a hard refresh: `Ctrl + Shift + R` (Mac: `Cmd + Shift + R`).
- Try another browser.

### Vendor AI analysis is slow

That is normal. Each vendor analysis can take **10–30 seconds** because it calls a real AI model.

---

## Folder reference

```text
Hackathon/
├── SETUP.md          ← this file
├── DEMO.md           ← demo scripts for presentations
├── client/           ← website (React)
│   ├── .env          ← you create from .env.example
│   └── package.json
└── server/           ← AI backend (Python / LangGraph)
    ├── .env          ← you create from .env.example (API key here)
    └── pyproject.toml
```

---

## Need help?

1. Read the error message in the terminal (often the last few red lines).
2. Confirm both terminals are still running.
3. Ask your team lead for: project zip/repo link, OpenAI API key, or a working `.env` example (without sharing keys in public chat).

---

**Summary:** Install Node, pnpm, Python 3.12, and uv once → copy `.env` files and add your OpenAI key → run server in one terminal → run client in another → open **http://localhost:5173** → sign in with `pm@procure.ai` / `pm123`.
