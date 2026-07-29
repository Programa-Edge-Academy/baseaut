# Features Directory Documentation

## Overview

This directory groups domain functionality by feature area. Each feature typically contains:

- `components/`: reusable UI building blocks scoped to the feature
- `hooks/`: data fetching, mutations, and side effects (the only place that touches Supabase)
- `screens/`: route-level screens that compose the UI
- `contexts/`: feature-scoped React contexts (where needed)
- `constants/`: feature-specific constants
- `utils/`: feature-specific helpers (e.g. export/report generation)
- `types.ts`: domain types shared within the feature

Screens compose hooks; hooks own all data access and business logic. All code is
documented with TypeDoc-style `/** */` comments, in English.

## Auth

- components/login-form.tsx: Login form (e-mail or phone) with validation, Google sign-in, and localized errors.
- components/register-form.tsx: Registration form (e-mail or phone) with validation, password checks, Google sign-up, and submit.
- components/password-input.tsx: Password input with a show/hide toggle.
- components/auth-feedback-card.tsx: Status card for success and pending-approval auth states.
- hooks/use-login.ts: Supabase login wrapper (e-mail/phone) that checks profile status and pending approval.
- hooks/use-register.ts: Supabase sign-up wrapper for e-mail and phone (SMS OTP verify/resend).
- hooks/use-google-auth.ts: Google OAuth sign-in/sign-up backed by Supabase.
- hooks/use-account.ts: Loads the signed-in profile and manages name/email/phone/password/avatar and Google link/unlink.
- hooks/use-password-recovery.ts: Drives the recovery flow via the recovery Edge Functions.
- hooks/password-checker.tsx: Pure helper that validates password length and allowed characters.
- utils/phone.ts: Phone detection, E.164 normalization, and display formatting.
- utils/translate-auth-error.ts: Maps Supabase auth errors to localized messages (e-mail/phone/Google).
- screens/login-screen.tsx: Screen layout that renders the logo and the login form.
- screens/register-screen.tsx: Screen layout that renders the logo and the register form.
- screens/verify-phone-screen.tsx: SMS code confirmation step of the phone sign-up flow.
- screens/account-screen.tsx: Account page: profile photo, personal data, password, Google link, and logout.
- screens/feedback-screen.tsx: Renders the auth feedback card based on the route mode.
- screens/reset-password-code-screen.tsx: Requests a password reset code by e-mail.
- screens/reset-password-screen.tsx: Validates the recovery code and sets a new password.

## Exercises

- components/exercise-tag.tsx: Clickable tag pill used for filtering and selection.
- components/tag-group.tsx: Grouped tag/subtag selector (single or multiple).
- components/exercise-row.tsx: Compact row item used in selection lists.
- components/new-exercise.tsx: Create/edit exercise modal with photo and tag selection.
- components/start-activity.tsx: Card used to launch an activity, with an optional media preview.
- components/stopwatch.tsx: In-activity stopwatch with crisis/flight pills and play/pause/stop controls.
- components/activity-result-modal.tsx: Records the outcome of an activity (level, help, or reason).
- components/mabc-result-modal.tsx: Records a MABC-2 exercise's raw scores or a non-completion reason.
- components/continuation-options.tsx: Continuation choices shown after a session step.
- components/session-completion.tsx: Completion summary with an optional warning banner and actions.
- components/warning-banner.tsx: Highlighted warning banner used after session completion.
- constants/mabc-exercise-configs.ts: MABC-2 field configs per age band and exercise.
- hooks/use-exercises.ts: Supabase-backed CRUD for exercises (add/update/delete/duplicate).
- screens/exercises-screen.tsx: Exercises list with search, tag filtering, and CRUD modals.

## Circuits

- components/new-circuit.tsx: Create/edit circuit modal with exercise selection and drag-to-reorder.
- components/view-circuit.tsx: Read-only modal showing a circuit and its exercises.
- hooks/use-circuits.ts: Supabase-backed CRUD for circuits; seeds the fixed MABC-2 circuits.
- screens/circuits-screen.tsx: Circuits list with search and create/edit/duplicate/delete.

## Forms

- types.ts: Shared question and answer type definitions for dynamic form rendering.
- components/form-component.tsx: Loads a form instance, renders its questions, and persists answers.
- components/form-question.tsx: Dispatcher that selects the correct question UI by type.
- components/open-question.tsx: Open text (or numeric) question input.
- components/yes-no-question.tsx: Yes/No question with optional conditional sub-question.
- components/choice-list-question.tsx: Single or multi-select choice list with an optional "Other" input.
- components/dropdown-question.tsx: Dropdown selector with a modal list and optional "Other" input.
- components/linear-scale-question.tsx: Numeric scale input with a slider and direct entry.
- components/matrix-question.tsx: Matrix question with rows and a column selection per row.
- utils/export-form.ts: Exports a form instance as PDF and/or CSV.

## Reports

- components/new-report.tsx: Modal to create/edit a report (title and date range).
- components/protocol-record-view.tsx: Read-only view of an ATA/CARS/MABC-2 record.
- hooks/use-student-reports.ts: Supabase-backed CRUD for a student's reports, keeping a profile snapshot.
- hooks/use-report-data.ts: Aggregates the data sets that compose a report over a date range.
- screens/student-reports-screen.tsx: Lists a student's reports with filtering and batch export.
- screens/report-detail-screen.tsx: Detailed report view with charts, comparisons, and export.
- utils/export-report.ts: Builds report PDFs (with SVG charts) and CSVs and delivers them.

## Sessions

- contexts/session-global-context.tsx: Global registry and ticking stopwatches for active sessions.
- components/activity-record-card.tsx: Displays and inline-edits a recorded execution.
- components/finish-session-modal.tsx: Confirmation modal requiring a reason to finish a session.
- components/global-session-widget.tsx: Floating mini-player for active sessions on the main tabs.
- components/reorder-modal.tsx: Bottom-sheet drag-and-drop modal to reorder remaining exercises.
- hooks/use-session-flow.ts: Database side effects for a session (create, persist, finalize).
- hooks/use-session-detail.ts: Loads a session's executions and exposes update/cancel actions.
- hooks/use-resume-session.ts: Loads existing executions to reconstruct an in-progress session.
- hooks/use-student-sessions.ts: Loads a student's combined record history (sessions/forms/MABC-2).
- hooks/use-student-profile.ts: Loads a student's profile by id.
- hooks/use-history.ts: Loads all students with their record counts and pendency flags.
- screens/circuit-selection-screen.tsx: Lets the user pick a circuit/form to run for a student.
- screens/session-running-screen.tsx: Drives a structured (circuit) session run.
- screens/session-running-semi-structured-screen.tsx: Drives a free-choice semi-structured session.
- screens/engagement-activity-screen.tsx: Runs an engagement activity within a session.
- screens/session-completed-screen.tsx: Post-session screen with continuation options.
- utils/export-session.ts: Exports a session (and its Control Record) as PDF and/or CSV.

## Students

- hooks/use-students.ts: Supabase-backed CRUD for students; resolves equipe id and uploads avatars.
- components/new-student.tsx: Create/edit student modal with validation, photo, and support-level dropdown.
- screens/students-screen.tsx: Students list with search, list, create/edit, and delete confirmation.

## Teams

- hooks/use-team-data.ts: Fetches team students and companions and manages approval/removal flows.
- components/companion-card.tsx: Card listing team companions with accept/reject/remove actions.
- components/companion-item.tsx: Row for a single companion with status actions.
- components/student-card-team.tsx: Card listing team students with add/edit/remove actions.
- components/student-item-team.tsx: Row for a single student within the team card.
- screens/team-screen.tsx: Team management screen with companion and student cards and flows.

## Analysis

- components/student-info-card.tsx: Profile card with a student's photo and clinical details.
- components/analysis-option-card.tsx: Tappable row with a title, description, and status badge.
- components/applied-protocols-card.tsx: Links to the student's applied protocol forms (CARS/ATA).
- components/progress-exercise-card.tsx: Summary card of a student's progress on one exercise.
- components/exercise-progress-chart.tsx: Development-level-over-time chart for one exercise.
- components/exercise-selection-card.tsx: Dropdown to filter analysis views by a single exercise.
- components/period-selector.tsx: Calendar-icon row that opens a date-range picker.
- components/help-records-bar-chart.tsx: Grouped bar chart of intrusive vs autonomous help per session.
- components/observed-behaviors-chart.tsx: Bar chart of observed-behavior frequencies.
- components/behavior-detail-card.tsx: Detail card for a single observed behavior.
- components/analysis-summary.tsx / analysis-summary-card.tsx: Period comparison summary cards.
- components/comparison-card.tsx: Single comparison row between two periods.
- components/comparison-help.tsx: Table comparing help counts between two periods.
- components/comparison-behaviors.tsx: Table comparing behavior counts between two periods.
- components/exercice-comparison-card.tsx: Per-exercise development-level comparison.
- components/analysis-maturity-card.tsx: Per-exercise previous/current level comparison row.
- components/mabc2-record-card.tsx: List card summarizing a MABC-2 record.
- components/mabc2-motor-development-card.tsx / mabc2-section.tsx / mabc2-exercise-item.tsx: MABC-2 record structure.
- components/protocol-record-card.tsx / protocol-empty-state.tsx: Protocol record list item and empty state.
- hooks/use-exercise-progress.ts: Loads per-exercise motor progress (computed in the database).
- hooks/use-help-records.ts: Loads a student's help/autonomy records over a date range.
- hooks/use-observed-behaviors.ts: Loads observed behaviors over a date range.
- hooks/use-performance-comparison.ts: Loads the comparison between two date ranges.
- hooks/use-protocol-records.ts / use-protocol-record-detail.ts / use-protocol-statuses.ts: Protocol records, detail, and status.
- hooks/use-mabc2-records.ts: MABC-2 record list, draft load/save/delete, and creation.
- screens/analysis-screen.tsx: Analysis landing screen listing students.
- screens/student-analysis-screen.tsx: Per-student analysis overview with entry points.
- screens/exercise-progress-screen.tsx: Exercise progress with date filtering and chart.
- screens/help-records-screen.tsx: Help-records bar chart for a selected period.
- screens/observed-behaviors-screen.tsx: Observed-behaviors chart and detail cards.
- screens/performance-comparison-screen.tsx: Compares performance between two periods.
- screens/protocol-records-list-screen.tsx: Lists a student's records for a protocol type.
- screens/protocol-visualization-screen.tsx: Views a single protocol record (editable for ATA/CARS).
- screens/mabc2-records-list-screen.tsx / mabc2-record-form-screen.tsx: MABC-2 record list and form.
- screens/no-records-screen.tsx: Reusable empty/error state screen for analysis views.
- utils/export-mabc.ts: Exports a MABC-2 record as PDF and/or CSV.

## Settings

- contexts/theme-context.tsx: Light/dark theme with persistence, driving NativeWind's color scheme and exposing the resolved palette (useTheme / useThemeColors).
- contexts/i18n-context.tsx: App language (pt/en/es) with persistence and the `t()` translator (useI18n).
- constants/translations.ts: Locale catalog and translation keys.

## Tutorial

- constants/modules.ts: Interactive tutorial modules (one per feature) split into short steps.
- contexts/tutorial-context.tsx: Persists which modules were completed; mock data is ephemeral.
- screens/tutorial-list-screen.tsx: Lists modules with completion state.
- screens/tutorial-module-screen.tsx: Plays a module's steps from the start.
