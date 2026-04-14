# 9 — Novu workflow content (Subject, Body, Redirect)

Use this as a copy/paste sheet in Novu Dashboard for **all workflows used by code**.

## Workflows your backend triggers

These are the 9 workflow identifiers read from env:

- `task-assigned`
- `task-completed`
- `task-deadline-near`
- `password-reset`
- `welcome-user`
- `team-invite-sent`
- `team-invite-accepted`
- `team-invite-declined`
- `team-invite-joined`

> If your identifiers differ, keep the same content but apply it to the workflows linked to your `NOVU_WORKFLOW_*` variables.

## Recommended channel setup

- `task-assigned`, `task-completed`, `task-deadline-near`: **In-App** (optional Email)
- `password-reset`: **Email required** (In-App optional)
- `welcome-user`: **In-App + Email**
- `team-invite-*`: **In-App required** (Email optional)

## Copy/paste content for each workflow

### 1) `task-assigned`

**Payload fields available**

- `payload.taskId`
- `payload.title`
- `payload.description`
- `payload.status`
- `payload.dueDate`

**In-App**

- Title: `Task assigned: {{payload.title}}`
- Body: `You were assigned a task due on {{payload.dueDate}}.`
- Redirect URL: `/tasks`

**Email**

- Subject: `New task assigned: {{payload.title}}`
- Body:
  `A new task has been assigned to you.`
  ``
  `Title: {{payload.title}}`
  `Status: {{payload.status}}`
  `Due date: {{payload.dueDate}}`
  ``
  `Open tasks: {{subscriber.data.appUrl}}/tasks`

---

### 2) `task-completed`

**Payload fields available**

- `payload.taskId`
- `payload.title`
- `payload.status`
- `payload.dueDate`

**In-App**

- Title: `Task completed: {{payload.title}}`
- Body: `A task assigned to you has been marked as done.`
- Redirect URL: `/tasks`

**Email**

- Subject: `Task completed: {{payload.title}}`
- Body:
  `A task you are assigned to was completed.`
  ``
  `Title: {{payload.title}}`
  `Status: {{payload.status}}`
  `Due date: {{payload.dueDate}}`
  ``
  `View tasks: {{subscriber.data.appUrl}}/tasks`

---

### 3) `task-deadline-near`

**Payload fields available**

- `payload.taskId`
- `payload.title`
- `payload.status`
- `payload.dueDate`
- `payload.hoursAhead`

**In-App**

- Title: `Deadline soon: {{payload.title}}`
- Body: `This task is due within {{payload.hoursAhead}} hours.`
- Redirect URL: `/tasks`

**Email**

- Subject: `Deadline reminder: {{payload.title}}`
- Body:
  `This task is due soon.`
  ``
  `Title: {{payload.title}}`
  `Due date: {{payload.dueDate}}`
  `Window: next {{payload.hoursAhead}} hours`
  ``
  `Open tasks: {{subscriber.data.appUrl}}/tasks`

---

### 4) `password-reset`

**Payload fields available**

- `payload.name`
- `payload.email`
- `payload.resetUrl`
- `payload.expiresInMinutes`

**In-App (optional)**

- Title: `Password reset requested`
- Body: `A reset link was generated for your account and expires in {{payload.expiresInMinutes}} minutes.`
- Redirect URL: `/login`

**Email (required)**

- Subject: `Reset your Nexus Tasks password`
- Body:
  `Hello {{payload.name}},`
  ``
  `We received a request to reset your password.`
  `This link expires in {{payload.expiresInMinutes}} minutes.`
  ``
  `Reset password: {{payload.resetUrl}}`
  ``
  `If you did not request this, you can ignore this email.`

---

### 5) `welcome-user`

**Payload fields available**

- `payload.name`
- `payload.email`
- `payload.message`
- `payload.appUrl`

**In-App**

- Title: `Welcome to Nexus Tasks`
- Body: `{{payload.message}}`
- Redirect URL: `/dashboard`

**Email**

- Subject: `Welcome to Nexus Tasks, {{payload.name}}`
- Body:
  `Hi {{payload.name}},`
  ``
  `{{payload.message}}`
  ``
  `Get started here: {{payload.appUrl}}/dashboard`

---

### 6) `team-invite-sent`

**Payload fields available**

- `payload.type`
- `payload.actionRequired`
- `payload.inviteId`
- `payload.inviterName`
- `payload.inviterEmail`
- `payload.targetEmail`
- `payload.message`

**In-App**

- Title: `Team invitation`
- Body: `{{payload.message}}`
- Redirect URL: `/notifications?teamInvite={{payload.inviteId}}`

**Email**

- Subject: `Team invite from {{payload.inviterName}}`
- Body:
  `{{payload.message}}`
  ``
  `Open notifications: {{subscriber.data.appUrl}}/notifications?teamInvite={{payload.inviteId}}`

---

### 7) `team-invite-accepted`

**Payload fields available**

- `payload.type`
- `payload.status`
- `payload.inviteId`
- `payload.inviteeName`
- `payload.inviteeEmail`
- `payload.message`

**In-App**

- Title: `Invite accepted`
- Body: `{{payload.message}}`
- Redirect URL: `/team`

**Email**

- Subject: `Invite accepted by {{payload.inviteeName}}`
- Body:
  `{{payload.message}}`
  ``
  `Open team page: {{subscriber.data.appUrl}}/team`

---

### 8) `team-invite-declined`

**Payload fields available**

- `payload.type`
- `payload.status`
- `payload.inviteId`
- `payload.inviteeName`
- `payload.inviteeEmail`
- `payload.message`

**In-App**

- Title: `Invite declined`
- Body: `{{payload.message}}`
- Redirect URL: `/team`

**Email**

- Subject: `Invite declined by {{payload.inviteeName}}`
- Body:
  `{{payload.message}}`
  ``
  `Manage team: {{subscriber.data.appUrl}}/team`

---

### 9) `team-invite-joined`

**Payload fields available**

- `payload.type`
- `payload.status`
- `payload.inviteId`
- `payload.inviterName`
- `payload.message`

**In-App**

- Title: `Added to team`
- Body: `{{payload.message}}`
- Redirect URL: `/team`

**Email**

- Subject: `You joined {{payload.inviterName}}'s team`
- Body:
  `{{payload.message}}`
  ``
  `Open team page: {{subscriber.data.appUrl}}/team`

## Important notes

- Team invite click behavior in app relies on `payload.type = "team-invite"` and `payload.inviteId` from `team-invite-sent`.
- Use relative redirects like `/tasks`, `/team`, `/notifications?...` in Novu.
- In email bodies, `{{payload.resetUrl}}` is the canonical reset link generated by backend.
- If you use `{{subscriber.data.appUrl}}` in email templates, make sure you set that subscriber data in Novu (or replace with your real domain directly).

