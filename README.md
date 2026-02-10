# Lungsodaan High School SSLG Elections Hub

Kiosk-ready voting system for LHS SSLG officers and grade level representatives.

## Stack

- Next.js (App Router)
- Supabase (Auth, Database, Realtime)
- Tailwind CSS
- Lucide Icons

## Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Supabase Schema

The full schema and the `process_vote` RPC function live in [supabase/schema.sql](supabase/schema.sql).

### Vote Processing (RPC)

`process_vote(student_id, selections)` accepts a JSON array of selections like:

```json
[
  { "position": "President", "candidate_id": "<uuid>" },
  { "position": "Vice-President", "candidate_id": "<uuid>" }
]
```

The function inserts all votes in one transaction and marks the student as
`has_voted = true`.

## App Routes

- `/` Home + portal entry points
- `/admin` Admin dashboard (sections, parties, candidates)
- `/facilitator/[sectionId]` Facilitator portal for a section
- `/ballot/[studentId]` Student ballot with grade-shift logic
- `/results` Realtime results dashboard

## Notes

- Grade shift logic: voters see representatives for `grade_level + 1`. Grade 12
  voters see no grade representatives.
- The UI is designed for touch kiosks with high-contrast buttons.
