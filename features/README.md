# Features Directory Documentation

## Overview

This directory groups domain functionality by feature area. Each feature typically contains:

- components: reusable UI building blocks for that feature
- hooks: data fetching, mutations, and side effects
- screens: route-level screens that compose the UI

## Auth

- components/login-form.tsx: Login form UI with client-side validation and error mapping, calls the login hook, and routes to register or password reset.
- components/auth-feedback-card.tsx: Status card for success and pending approval states after auth actions.
- components/password-input.tsx: Password input with show/hide toggle and optional styling overrides.
- components/register-form.tsx: Registration form with validations, password checks, and submit to the register hook.
- hooks/use-register.ts: Supabase sign-up wrapper that normalizes input and returns register, loading, and error state.
- hooks/use-login.ts: Supabase login wrapper that checks profile status and pending approval, returning isPendingApproval state.
- hooks/password-checker.tsx: Pure helper that validates password length and allowed characters.
- screens/feedback-screen.tsx: Screen that renders the logo and the auth feedback card based on route params.
- screens/reset-password-screen.tsx: Screen to update the user password after a recovery flow, with validation and feedback.
- screens/reset-password-code-screen.tsx: Screen to request a password reset email, with validation and success state.
- screens/register-screen.tsx: Screen layout that renders the logo and the register form.
- screens/login-screen.tsx: Screen layout that renders the logo and the login form.

## Exercises

- screens/exercises-screen.tsx: Main exercises screen with list, filtering by tags, search, create/edit modal, and delete confirmation.
- hooks/use-exercises.ts: Supabase-backed CRUD for exercises, resolves equipe id, exposes add/update/delete/duplicate and loading state.
- components/exercise-tag.tsx: Clickable tag pill used for filtering and selection.
- components/tag-group.tsx: Group renderer for exercise tags.
- components/exercise-card.tsx: Exercise list card with metadata and options trigger.
- components/exercise-row.tsx: Compact row item used in selection lists and modals.
- components/exercise-selection-modal.tsx: Modal for selecting the next exercise and an optional engagement action.
- components/continuation-options.tsx: Option list for continuation choices after a session step.
- components/new-order.tsx: Modal to reorder remaining exercises (visual list with confirm/cancel).
- components/session-completion.tsx: Completion summary with optional warning banner and action buttons.
- components/new-exercise.tsx: Create/edit exercise modal, supports photo/video selection and tag selection.
- components/warning-banner.tsx: Highlighted warning banner used after session completion.

## Forms

- types.ts: Shared question and answer type definitions for form rendering.
- components/form-question.tsx: Dispatcher that selects the correct question UI based on question type.
- components/open-question.tsx: Open text question UI with optional audio record action placeholder.
- components/yes-no-question.tsx: Yes/No question with optional conditional sub-question rendering.
- components/choice-list-question.tsx: Single or multi-select choice list with optional Other input.
- components/dropdown-question.tsx: Dropdown selector with modal list and optional Other input.
- components/linear-scale-question.tsx: Numeric scale input with slider and direct entry.
- components/matrix-question.tsx: Matrix question with rows and column selection per row.

## Reports

- components/observation-card.tsx: Read-only card for displaying observation text or a default message.
- components/new-report.tsx: Modal UI to configure report fields and observation text.
- components/chart-detail.tsx: Detail panel for performance or help levels by exercise per session.

## Students

- hooks/use-students.ts: Supabase-backed CRUD for students, resolves equipe id, uploads avatars, and exposes loading/error state.
- components/student-item.tsx: List item with student info and a contextual menu for edit/delete actions.
- components/new-student.tsx: Create/edit student modal with validation, photo selection, and support-level dropdown.
- screens/students-screen.tsx: Main students screen with search, list, create/edit modal, and delete confirmation.

## Teams

- hooks/use-team-data.ts: Fetches team students and companions, manages approval and removal flows, and handles avatar upload for student save.
- screens/team-screen.tsx: Team management screen with companion and student cards and create/edit flows.
- components/companion-card.tsx: Card list for team companions with accept/reject/remove actions.
- components/companion-item.tsx: Row for a single companion with status actions.
- components/student-card-team.tsx: Card list for team students with add/edit/remove actions.
- components/student-item-team.tsx: Row for a single student within the team card.
- components/family-share-card.tsx: Toggle card for family sharing preference.
- components/acess-code-card.tsx: Access code card with copy/refresh actions.
- components/team-code-cards.tsx: Team code card with copy/refresh actions.
- components/delete-team-card.tsx: Destructive action card for deleting a team.
