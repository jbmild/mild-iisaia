# mild-iisaia

Student repo for **Introducción a la ingeniería de software asistida por IA** (2026). Student: **Mild, Jonatan**. Teacher: Enzo Pacilio.

This is coursework, not the course-authoring repo. The student is the architectural supervisor: specify, review, correct drift, and be able to explain every decision. Working software is not enough.

## Folder map

| Path | Role |
|------|------|
| `README.md` | Repo **index**: who, which delivery, status. Keep the table in sync. |
| `tp1/` `tp2/` `tp-final/` | One folder per graded delivery. Each folder's `README.md` is the **report**. |
| `Material/` | Official course content (gitignored). Read it; do not edit or commit it. |
| `Material/programa.md` | Canonical syllabus and weekly schedule. |
| `Material/semanas/NN/` | Week N slides (`slides/index.html`) and source (`source_material/`). |
| `Material/semanas/00/source_material/` | How the repo is graded and how folders should look. |

## How to help

1. **Do not invent consignas.** Requirements live in `Material/` or in the student's brief. If neither exists, ask.
2. Before implementing a TP, read that week's `source_material/` (and `programa.md` if the week is unclear).
3. Put student work only in the matching `tpN/` folder. Do not scatter files at the repo root.
4. Student-facing files (`README.md`, `prompts.md`, comments meant for the teacher) are in **Spanish**. Chat with the student may be in English or Spanish — match the student.
5. Treat the student as reviewer, not as a passenger: surface architecture choices, propose alternatives, wait for a decision on anything that would show up under "Decisiones que tomé yo".
6. For TP1, keep `tp1/prompts.md` current (see below). Do not wait until the delivery is finished.
7. Commit history is evidence. Prefer small commits with messages that describe *why*. Do not squash the process into one "entrega" commit. Do not commit `Material/`.

## TP1 prompt log (`tp1/prompts.md`)

Whenever the student gives a prompt while working on `tp1/`, create or update `tp1/prompts.md`. Follow the structure of `Material/semanas/00/source_material/apellido-iisaia/tp1/prompts.md`: numbered entries in chronological order, prompt quoted verbatim, then what came back and what the student did with it.

For **every** TP1 prompt (not only the ones that "changed the result"):

1. Append a new numbered section **in the same turn** as the work.
2. Paste the student's prompt **textual** inside a fenced code block.
3. **Qué devolvió:** one line on what this turn produced (artifact created, files changed, or the gist of the reply).
4. **Qué hice con eso:** `lo acepté` / `lo corregí` / `lo tiré y volví a empezar`.

The student's verdict usually arrives on the **next** TP1 message. When it does, go back and fill **Qué hice con eso** on the previous entry before logging the new prompt. Until then, leave it as `pendiente`.

Use **Por qué** on correction entries (what was wrong with the previous result). Skip a prompt only if it is clearly unrelated to TP1 (e.g. asking about git in general). Do not invent entries or rewrite history. The file is in Spanish.

## Each delivery folder

Follow the week-00 template. Typical TP1 shape:

```
tp1/
├── README.md      report (not an index)
├── prompts.md     full TP1 prompt log (see above)
└── index.html     artifact (when the consigna is a single-file UI)
```

Each delivery `README.md` must include: how to run it, what was specified *before* the first prompt, decisions the student made (not model defaults), what went wrong and how it was corrected, and 2–3 prompts that actually changed the outcome (full log in `prompts.md`).

From week 6 onward, also keep spec/plan files on disk and use branches + pull requests.

## Do not

- Edit `Material/` unless the student explicitly asks to change course files.
- Accept the model's first architecture without flagging it.
- Fabricate a prompt log or git history after the fact.
- Add extra root docs (`CONTRIBUTING.md`, etc.) unless asked.
