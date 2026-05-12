# NPCI Onboarding App — How It Was Built

> A manager-friendly explanation of the tools, process, language, and setup required to run this app.

---

## Table of Contents

1. [What Is the App?](#1-what-is-the-app)
2. [Tools Used and What They Actually Do](#2-tools-used-and-what-they-actually-do)
   - [ChatGPT](#chatgpt)
   - [Cursor](#cursor)
   - [GitHub](#github)
   - [Vercel](#vercel)
3. [What Language Is the App Written In?](#3-what-language-is-the-app-written-in)
4. [My Step-by-Step Development Workflow](#4-my-step-by-step-development-workflow)
5. [Requirements to Run on a Different Machine](#5-requirements-to-run-this-app-on-a-different-machine)
6. [All Dependencies](#6-all-dependencies)
7. [Cloud Services Needed](#7-what-needs-to-be-set-up-in-the-cloud)

---

## 1. What Is the App?

The NPCI Onboarding App is a digital onboarding platform for new NPCI Group employees. Instead of physical paperwork and scattered emails, everything is available on one web page — document submission, HR induction videos, buddy Q&A, onboarding kit selection, a 15-day check-in, and an admin panel for HR to manage it all.

---

## 2. Tools Used and What They Actually Do

### ChatGPT

**What it is:** An AI assistant made by OpenAI, accessible at [chat.openai.com](https://chat.openai.com).

**How I used it:**
- On Day 1, I described the app idea to ChatGPT in plain English and asked it to suggest what pages I would need, what features to include, and how to structure everything.
- ChatGPT gave me a blueprint — a list of pages, features, and a logical flow for the app.
- I then manually created the initial page files in Cursor based on that blueprint.
- Later in the project, whenever I needed to add a new feature or fix a problem, I asked ChatGPT to write a detailed, specific prompt that I could then paste into Cursor's AI chat. ChatGPT is very good at understanding what you want in plain English and converting it into a technical instruction for a coding tool.

> **In short:** ChatGPT was my planning partner and prompt-writing helper.

---

### Cursor

**What it is:** A code editor (like Microsoft Word, but for writing code). It has a built-in AI assistant that can read your entire codebase and make changes directly to files.

**How I used it:**
- I write and edit all my code inside Cursor.
- Initially, I manually created pages by typing code myself, guided by what ChatGPT had explained.
- As I got more comfortable, I started giving prompts directly to Cursor's AI chat (the AI panel on the right side). Because Cursor's AI can see all the files in the project, it can make changes across multiple files at once — something ChatGPT alone cannot do.
- Eventually, most of my development work happened by writing clear instructions in Cursor's chat and letting it implement changes while I reviewed and approved them.

> **In short:** Cursor is where all the code lives and where I made all the changes, using both manual typing and AI assistance.

---

### GitHub

**What it is:** A website ([github.com](https://github.com)) that stores your code online, tracks every change you ever make, and lets you recover any old version. Think of it like OneDrive for code, but much more powerful.

**Why I used it:**
- Every time I made meaningful changes to the app, I "pushed" (saved/uploaded) the code to GitHub.
- This gave me a full history — if something broke, I could go back to a working version.
- It also acts as the bridge to Vercel — whenever code is pushed to GitHub, Vercel automatically picks it up and republishes the app.

**Commands used in the terminal:**

```bash
# First-time setup — link your local project folder to GitHub
git init
git remote add origin https://github.com/your-username/npci-onboarding-app.git

# Every time you make changes and want to save them to GitHub
git add .
git commit -m "describe what you changed"
git push origin main
```

> **In short:** GitHub is the online backup and history system for the code.

---

### Vercel

**What it is:** A free cloud hosting platform ([vercel.com](https://vercel.com)) that specialises in Next.js apps. It takes your code from GitHub and publishes it as a live website — no server setup needed.

**Why I used it:**
- Vercel is the easiest and most reliable way to host a Next.js app.
- Every time I push code to GitHub, Vercel automatically rebuilds and redeploys the app. I never have to manually upload anything.
- It handles HTTPS (the secure padlock), performance, and global availability automatically.

**Commands used to connect and deploy:**

```bash
# Install the Vercel command-line tool
npm install -g vercel

# First-time login and project link
vercel login
vercel

# For subsequent deploys (usually done automatically via GitHub push)
vercel --prod
```

After the first `vercel` command, I went into the Vercel website dashboard, connected it to the GitHub repository, and added all the secret configuration values (like the database password). After that, every `git push` automatically triggered a new deployment.

> **In short:** Vercel is the live hosting platform — it makes the app accessible on the internet.

---

## 3. What Language Is the App Written In?

The app is written in **TypeScript** (a version of JavaScript that catches errors before they happen) using a framework called **Next.js**.

| Layer | Technology | Simple Explanation |
|---|---|---|
| Core Language | TypeScript | Like JavaScript but safer — catches typos and bugs early |
| Framework | Next.js 16 | Gives structure to the app; handles pages, routing, and server logic |
| Styling | Tailwind CSS | A toolkit that makes the app look good without writing custom CSS from scratch |
| Animations | Framer Motion | Makes elements slide, fade, and animate smoothly |
| Icons | Lucide React | A library of clean icons used throughout the UI |
| Database | MongoDB (Atlas) | Stores all employee data, documents, and responses in the cloud |
| File Storage | MongoDB GridFS | Stores uploaded document files inside the same MongoDB database |
| Email | Nodemailer | Sends email notifications when a document is approved |
| Notifications | React Hot Toast | Shows pop-up toast messages inside the app |

---

## 4. My Step-by-Step Development Workflow

**Day 1 — Planning with ChatGPT:**
I explained the NPCI onboarding problem to ChatGPT. It helped me list all the pages I would need (login, dashboard, documents, HR induction, etc.) and the features for each. I used this as my blueprint.

**Week 1 — Building pages manually in Cursor:**
I created each page file in Cursor by hand, referencing ChatGPT's suggestions. At this point I was writing most of the code myself, with ChatGPT helping me understand how to do specific things.

**Week 2 onwards — Using Cursor AI directly:**
I started giving prompts directly to Cursor's built-in AI chat. Because Cursor can see all my files at the same time, I could say things like "add a notification bell to the dashboard" and it would update all the right files automatically. I shifted from writing code to reviewing and guiding the AI.

**Throughout — Saving to GitHub:**
After every meaningful feature, I ran the following commands to save the work to GitHub:

```bash
git add .
git commit -m "added feature name here"
git push
```

**Deployment — Vercel:**
I connected the GitHub repository to Vercel once. After that, every `git push` automatically updated the live app within 2–3 minutes.

---

## 5. Requirements to Run This App on a Different Machine

> This section is written for someone setting up the app for the first time with no prior technical experience. Follow each step in order and do not skip any.

---

### Step 1 — Install Node.js

Node.js is the engine that runs this app. Think of it like installing Microsoft Office before you can open a Word file — the app cannot run without it.

1. Open your browser and go to **[nodejs.org](https://nodejs.org)**
2. Click the big green button that says **"LTS"** (this stands for Long Term Support — it is the stable, recommended version)
3. Download and run the installer
4. Keep clicking **Next** and **Install** — all default options are fine
5. Once installation is complete, open the **Command Prompt** (search for "cmd" in the Windows Start menu) and type:
   ```
   node -v
   ```
   You should see a version number like `v20.x.x`. This confirms Node.js is installed correctly.

> **Note:** npm (the tool that installs app packages) comes automatically with Node.js — you do not need to install it separately.

---

### Step 2 — Install Git

Git is the tool that lets you download the code from GitHub onto your machine. Think of it like a download manager specifically for code.

1. Go to **[git-scm.com](https://git-scm.com)**
2. Click **Download for Windows**
3. Run the installer — keep all default options and click **Next** through every screen
4. Once done, open Command Prompt and type:
   ```
   git -v
   ```
   You should see something like `git version 2.x.x`. This confirms Git is installed.

---

### Step 3 — Download the App Code from GitHub

This step copies the entire app code from GitHub onto your computer.

1. Open **Command Prompt**
2. Decide where you want to keep the project folder. For example, if you want it on your Desktop, type:
   ```
   cd Desktop
   ```
3. Now type the following command to download the code (replace the URL with the actual GitHub link):
   ```
   git clone https://github.com/your-username/npci-onboarding-app.git
   ```
4. A new folder called `npci-onboarding-app` will appear. Navigate into it:
   ```
   cd npci-onboarding-app
   ```

> You are now "inside" the project folder in the terminal. All further commands must be run from inside this folder.

---

### Step 4 — Install the App's Packages

The app depends on several third-party libraries (listed in Section 6). This single command downloads and installs all of them automatically.

In the Command Prompt (still inside the project folder), type:

```
npm install
```

This may take 1–3 minutes. You will see a lot of text scrolling — that is normal. Wait until it stops and you see the cursor blinking again.

> If you see a warning about "vulnerabilities", that is normal for a development project and can be ignored for now.

---

### Step 5 — Create the Configuration File

The app needs a special file called `.env.local` that contains secret settings — like the database password and email credentials. This file is **never uploaded to GitHub** for security reasons, so you have to create it manually on each new machine.

**How to create it:**

1. Open the project folder in **File Explorer** (it is wherever you ran the `git clone` command — e.g. your Desktop)
2. Right-click inside the folder → **New** → **Text Document**
3. Name the file exactly `.env.local` (make sure to delete the `.txt` extension — it must be `.env.local`, not `.env.local.txt`)
   - If Windows warns you about changing the extension, click **Yes**
4. Open the file with Notepad and paste in the following content, filling in the real values:

```
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/
DUMMY_OTP=000000
ADMIN_ACCESS_KEY=your-strong-secret-key
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=noreply@example.com
SMTP_PASS=your-smtp-password
UEM_TEAM_EMAIL=uem-team@npci.org.in
```

5. Save and close the file

> **What each line means:**
> - `MONGODB_URI` — the address and password of the database. Get this from MongoDB Atlas (the database dashboard).
> - `DUMMY_OTP` — a fixed test OTP (000000) so you can log in during testing without needing a real SMS.
> - `ADMIN_ACCESS_KEY` — a secret password that protects the admin panel's background operations.
> - `SMTP_*` — email server settings so the app can send document approval emails.
> - `UEM_TEAM_EMAIL` — the email address that receives notifications when a document is approved.

---

### Step 6 — Start the App

You are now ready to run the app. In the Command Prompt (inside the project folder), type:

```
npm run dev
```

After about 10–15 seconds you will see a message like:

```
▲ Next.js 16.2.3
- Local: http://localhost:3000
```

Open your browser and go to **http://localhost:3000** — the app will load.

> **Important:** The Command Prompt window must stay open while you are using the app. Closing it will stop the app.

---

### Step 7 — Stopping and Restarting the App

- To **stop** the app: click the Command Prompt window and press **Ctrl + C**
- To **start it again**: open Command Prompt, navigate to the project folder, and run `npm run dev` again

```
cd Desktop\npci-onboarding-app
npm run dev
```

---

### Summary Checklist

| # | What to do | Command |
|---|---|---|
| 1 | Install Node.js from nodejs.org | *(installer, no command)* |
| 2 | Install Git from git-scm.com | *(installer, no command)* |
| 3 | Download the code from GitHub | `git clone <repo-url>` |
| 4 | Go into the project folder | `cd npci-onboarding-app` |
| 5 | Install all packages | `npm install` |
| 6 | Create `.env.local` with the secret values | *(create file manually)* |
| 7 | Start the app | `npm run dev` |
| 8 | Open in browser | Go to `http://localhost:3000` |

---

## 6. All Dependencies

### Runtime Dependencies *(needed to run the app)*

| Package | Version | Purpose |
|---|---|---|
| `next` | 16.2.3 | The core framework — handles pages, routing, server APIs |
| `react` | 19.2.4 | The UI library — builds all the visual components |
| `react-dom` | 19.2.4 | Renders React components in the browser |
| `mongoose` | 9.4.1 | Connects to MongoDB and defines the data structure |
| `nodemailer` | 8.0.5 | Sends emails for document approval notifications |
| `framer-motion` | 12.38.0 | Smooth animations and transitions |
| `lucide-react` | 1.8.0 | Icon library used throughout the UI |
| `react-hot-toast` | 2.6.0 | Pop-up toast notification messages |

### Development Dependencies *(only needed while building/coding)*

| Package | Purpose |
|---|---|
| `typescript` | Type-safe JavaScript for catching errors at build time |
| `tailwindcss` | Utility-first CSS styling framework |
| `@tailwindcss/postcss` | PostCSS plugin to process Tailwind CSS |
| `eslint` | Code quality checker / linter |
| `eslint-config-next` | ESLint rules specific to Next.js |
| `@types/node` | TypeScript types for Node.js |
| `@types/react` | TypeScript types for React |
| `@types/react-dom` | TypeScript types for React DOM |
| `@types/nodemailer` | TypeScript types for Nodemailer |

---

## 7. What Needs to Be Set Up in the Cloud

| Service | What It Is | Why Needed |
|---|---|---|
| MongoDB Atlas | Free cloud database | Stores all employee and admin data |
| SMTP Email Server | Email sending service (e.g. Gmail SMTP, SendGrid) | Sends document approval emails |
| Vercel | Hosting platform | Makes the app live on the internet |

---

## Quick Reference — All Terminal Commands

### GitHub

```bash
git init                                          # Initialise a new git repo
git remote add origin <github-repo-url>           # Link to GitHub
git add .                                         # Stage all changes
git commit -m "your message"                      # Save a snapshot
git push origin main                              # Upload to GitHub
git pull origin main                              # Download latest from GitHub
git status                                        # Check what has changed
git log --oneline                                 # See commit history
```

### Vercel

```bash
npm install -g vercel     # Install Vercel CLI (one time)
vercel login              # Log in to your Vercel account (one time)
vercel                    # Deploy for the first time / link project
vercel --prod             # Deploy to production manually
```

### App

```bash
npm install               # Install all packages
npm run dev               # Start local development server (localhost:3000)
npm run build             # Build for production
npm start                 # Start production server
npm run lint              # Check code for errors
```

---

*Document prepared by the developer. Screenshots of each tool and step to be attached alongside the relevant sections.*
