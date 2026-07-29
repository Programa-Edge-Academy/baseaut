import { SimulationSubStep } from "@/features/tutorial/contexts/tutorial-simulation-context";

/**
 * Ordered sub-steps of the Students (Alunos) guided simulation. Each key maps to
 * a spotlight target registered by the students screen or its create/edit modal;
 * the user must complete them in order to finish the module's practice.
 */
export const ALUNOS_SIMULATION: SimulationSubStep[] = [
  { key: "new", hintKey: "tutorial.hint.alunos.new" },
  { key: "name", hintKey: "tutorial.hint.alunos.name" },
  { key: "birthdate", hintKey: "tutorial.hint.alunos.birthdate" },
  { key: "support", hintKey: "tutorial.hint.alunos.support" },
  { key: "save", hintKey: "tutorial.hint.alunos.save" },
  { key: "editMenu", hintKey: "tutorial.hint.alunos.editMenu" },
  { key: "editSelect", hintKey: "tutorial.hint.alunos.editSelect" },
  { key: "editSupport", hintKey: "tutorial.hint.alunos.editSupport" },
  { key: "editSave", hintKey: "tutorial.hint.alunos.editSave" },
  { key: "deleteMenu", hintKey: "tutorial.hint.alunos.deleteMenu" },
  { key: "deleteSelect", hintKey: "tutorial.hint.alunos.deleteSelect" },
  { key: "deleteConfirm", hintKey: "tutorial.hint.alunos.deleteConfirm" },
];

/**
 * Ordered sub-steps of the Exercises guided simulation: create an exercise,
 * duplicate it, then delete it (menu → item, with delete confirmation).
 */
export const EXERCICIOS_SIMULATION: SimulationSubStep[] = [
  { key: "new", hintKey: "tutorial.hint.exercicios.new" },
  { key: "title", hintKey: "tutorial.hint.exercicios.title" },
  { key: "tag", hintKey: "tutorial.hint.exercicios.tag" },
  { key: "save", hintKey: "tutorial.hint.exercicios.save" },
  { key: "duplicateMenu", hintKey: "tutorial.hint.exercicios.duplicateMenu" },
  { key: "duplicateSelect", hintKey: "tutorial.hint.exercicios.duplicateSelect" },
  { key: "deleteMenu", hintKey: "tutorial.hint.exercicios.deleteMenu" },
  { key: "deleteSelect", hintKey: "tutorial.hint.exercicios.deleteSelect" },
  { key: "deleteConfirm", hintKey: "tutorial.hint.exercicios.deleteConfirm" },
];

/**
 * Ordered sub-steps of the Circuits guided simulation: create a semi-structured
 * circuit, edit it into a structured one and reorder its exercises, then delete
 * it (menu → item, with delete confirmation).
 */
export const CIRCUITOS_SIMULATION: SimulationSubStep[] = [
  { key: "new", hintKey: "tutorial.hint.circuitos.new" },
  { key: "name", hintKey: "tutorial.hint.circuitos.name" },
  { key: "mode", hintKey: "tutorial.hint.circuitos.mode" },
  { key: "selectExercises", hintKey: "tutorial.hint.circuitos.selectExercises" },
  { key: "save", hintKey: "tutorial.hint.circuitos.save" },
  { key: "editMenu", hintKey: "tutorial.hint.circuitos.editMenu" },
  { key: "editSelect", hintKey: "tutorial.hint.circuitos.editSelect" },
  { key: "changeStructured", hintKey: "tutorial.hint.circuitos.changeStructured" },
  { key: "reorder", hintKey: "tutorial.hint.circuitos.reorder" },
  { key: "editSave", hintKey: "tutorial.hint.circuitos.editSave" },
  { key: "deleteMenu", hintKey: "tutorial.hint.circuitos.deleteMenu" },
  { key: "deleteSelect", hintKey: "tutorial.hint.circuitos.deleteSelect" },
  { key: "deleteConfirm", hintKey: "tutorial.hint.circuitos.deleteConfirm" },
];

/**
 * Ordered sub-steps of the Sessions guided simulation. It spans several real
 * routes (circuit selection → running screen → completed screen) driven by the
 * session simulation controller, and covers two consecutive sessions.
 *
 * The first session is reordered before it starts, exercises every stopwatch
 * control, and then ends *naturally* once every exercise is done — its completed
 * screen is an intermediate stop that returns to the circuit selection with the
 * simulation still running. The second session demonstrates leaving a session in
 * progress ({@link goBack}), the concurrent-session warning, and early
 * termination via the header's Finish button and its reason modal. Only the last
 * sub-step ends the simulation.
 *
 * Between the spotlit gates the user freely practices the real execution flow
 * (marking activity results, running the remaining exercises) on mock data.
 */
export const SESSOES_SIMULATION: SimulationSubStep[] = [
  { key: "selectStructured", hintKey: "tutorial.hint.sessoes.selectStructured" },
  { key: "openReorder", hintKey: "tutorial.hint.sessoes.openReorder" },
  { key: "reorder", hintKey: "tutorial.hint.sessoes.reorder" },
  { key: "confirmReorder", hintKey: "tutorial.hint.sessoes.confirmReorder" },
  { key: "startExercise", hintKey: "tutorial.hint.sessoes.startExercise" },
  { key: "crise", hintKey: "tutorial.hint.sessoes.crise" },
  { key: "crise2", hintKey: "tutorial.hint.sessoes.crise2" },
  { key: "fuga", hintKey: "tutorial.hint.sessoes.fuga" },
  { key: "fuga2", hintKey: "tutorial.hint.sessoes.fuga2" },
  { key: "pauseResume", hintKey: "tutorial.hint.sessoes.pauseResume" },
  { key: "pauseResume2", hintKey: "tutorial.hint.sessoes.pauseResume2" },
  { key: "toggleForm", hintKey: "tutorial.hint.sessoes.toggleForm" },
  { key: "toggleForm2", hintKey: "tutorial.hint.sessoes.toggleForm2" },
  { key: "restart", hintKey: "tutorial.hint.sessoes.restart" },
  { key: "stop", hintKey: "tutorial.hint.sessoes.stop" },
  // First session, exercise 1: defer the result to answer later.
  { key: "deferResult", hintKey: "tutorial.hint.sessoes.deferResult" },
  // First session, exercise 2: start it, stop it, fill the result and conclude.
  { key: "startSecond", hintKey: "tutorial.hint.sessoes.startSecond" },
  { key: "stopSecond", hintKey: "tutorial.hint.sessoes.stopSecond" },
  { key: "selectLevel", hintKey: "tutorial.hint.sessoes.selectLevel" },
  { key: "selectHelp", hintKey: "tutorial.hint.sessoes.selectHelp" },
  { key: "conclude", hintKey: "tutorial.hint.sessoes.conclude" },
  { key: "backToSelection", hintKey: "tutorial.hint.sessoes.backToSelection" },
  { key: "selectAgain", hintKey: "tutorial.hint.sessoes.selectAgain" },
  // Second session, exercise 1: start it, stop it and defer its result.
  { key: "startAgain", hintKey: "tutorial.hint.sessoes.startAgain" },
  { key: "stopNotDone", hintKey: "tutorial.hint.sessoes.stopNotDone" },
  { key: "deferAgain", hintKey: "tutorial.hint.sessoes.deferAgain" },
  { key: "goBack", hintKey: "tutorial.hint.sessoes.goBack" },
  { key: "reopenCircuit", hintKey: "tutorial.hint.sessoes.reopenCircuit" },
  { key: "concurrentContinue", hintKey: "tutorial.hint.sessoes.concurrentContinue" },
  // Resuming remounts the screen with no exercise running, so the session opens
  // back on the start card: run one exercise again before finishing early, which
  // is what makes the header's Finish button appear.
  { key: "startResumed", hintKey: "tutorial.hint.sessoes.startResumed" },
  { key: "stopResumed", hintKey: "tutorial.hint.sessoes.stopResumed" },
  { key: "deferResumed", hintKey: "tutorial.hint.sessoes.deferResumed" },
  { key: "finish", hintKey: "tutorial.hint.sessoes.finish" },
  { key: "finishReason", hintKey: "tutorial.hint.sessoes.finishReason" },
  { key: "finishSession", hintKey: "tutorial.hint.sessoes.finishSession" },
];

/**
 * Ordered sub-steps of the Forms guided simulation. It spans circuit-selection
 * (where forms are started) and the form route, and runs the same cycle three
 * times — pick the form, fill it, save it, land back on the circuit selection —
 * once per form type (ATA, CARS and MABC-2).
 *
 * The ATA cycle additionally demonstrates leaving a form pending and the
 * resulting "pending form of the same type" warning. Only the MABC-2 save, the
 * last sub-step, ends the simulation; the earlier saves are intermediate.
 */
export const FORMULARIOS_SIMULATION: SimulationSubStep[] = [
  { key: "selectAta", hintKey: "tutorial.hint.formularios.selectAta" },
  { key: "goBackAta", hintKey: "tutorial.hint.formularios.goBackAta" },
  { key: "reopenAta", hintKey: "tutorial.hint.formularios.reopenAta" },
  { key: "continueAta", hintKey: "tutorial.hint.formularios.continueAta" },
  { key: "answerAta", hintKey: "tutorial.hint.formularios.answer" },
  { key: "saveAta", hintKey: "tutorial.hint.formularios.saveAta" },
  { key: "selectCars", hintKey: "tutorial.hint.formularios.selectCars" },
  { key: "answerCars", hintKey: "tutorial.hint.formularios.answer" },
  { key: "saveCars", hintKey: "tutorial.hint.formularios.saveCars" },
  { key: "selectMabc", hintKey: "tutorial.hint.formularios.selectMabc" },
  { key: "answerMabc", hintKey: "tutorial.hint.formularios.answer" },
  { key: "saveMabc", hintKey: "tutorial.hint.formularios.saveMabc" },
];

/**
 * Ordered sub-steps of the History guided simulation. It spans the history list,
 * a student's record history, a session's detail and the form editor.
 *
 * It covers both kinds of editable record: a *session*, where an activity's
 * result and then the session's Control Record are each edited and saved on
 * their own, and a standalone *form* record. Every save but the last is
 * intermediate and returns to the screen it was opened from; only the form
 * record's save ends the simulation.
 */
export const HISTORICO_SIMULATION: SimulationSubStep[] = [
  { key: "selectStudent", hintKey: "tutorial.hint.historico.selectStudent" },
  { key: "openRecord", hintKey: "tutorial.hint.historico.openRecord" },
  { key: "editExercise", hintKey: "tutorial.hint.historico.editExercise" },
  { key: "saveExercise", hintKey: "tutorial.hint.historico.saveExercise" },
  { key: "openSessionRc", hintKey: "tutorial.hint.historico.openSessionRc" },
  { key: "saveSessionRc", hintKey: "tutorial.hint.historico.saveSessionRc" },
  { key: "backToRecords", hintKey: "tutorial.hint.historico.backToRecords" },
  { key: "openFormRecord", hintKey: "tutorial.hint.historico.openFormRecord" },
  { key: "editSave", hintKey: "tutorial.hint.historico.editSave" },
];

/**
 * Ordered sub-steps of the Analysis guided simulation. It spans the analysis
 * list, the student's analysis overview and each chart screen, guiding the user
 * through each of the six analysis views (seeded with mock data).
 *
 * Each view is explored, not just opened: the four screens that filter by date
 * require their period selector, and every view requires the header's back
 * button — including the last one, so the MABC-2 list is actually seen before
 * the simulation ends. The two record lists (protocols and MABC-2) have no
 * period selector, so they only require the visit and the way back.
 */
export const ANALISES_SIMULATION: SimulationSubStep[] = [
  { key: "selectStudent", hintKey: "tutorial.hint.analises.selectStudent" },
  { key: "openProgress", hintKey: "tutorial.hint.analises.openProgress" },
  { key: "selectExerciseProgress", hintKey: "tutorial.hint.analises.selectExerciseProgress" },
  { key: "periodProgress", hintKey: "tutorial.hint.analises.periodProgress" },
  { key: "backProgress", hintKey: "tutorial.hint.analises.backProgress" },
  { key: "openHelp", hintKey: "tutorial.hint.analises.openHelp" },
  { key: "periodHelp", hintKey: "tutorial.hint.analises.periodHelp" },
  { key: "backHelp", hintKey: "tutorial.hint.analises.backHelp" },
  { key: "openBehaviors", hintKey: "tutorial.hint.analises.openBehaviors" },
  { key: "periodBehaviors", hintKey: "tutorial.hint.analises.periodBehaviors" },
  { key: "backBehaviors", hintKey: "tutorial.hint.analises.backBehaviors" },
  { key: "openCompare", hintKey: "tutorial.hint.analises.openCompare" },
  { key: "periodCompare", hintKey: "tutorial.hint.analises.periodCompare" },
  { key: "compareRun", hintKey: "tutorial.hint.analises.compareRun" },
  { key: "backCompare", hintKey: "tutorial.hint.analises.backCompare" },
  { key: "openProtocols", hintKey: "tutorial.hint.analises.openProtocols" },
  { key: "openProtocolRecord", hintKey: "tutorial.hint.analises.openProtocolRecord" },
  { key: "backProtocolRecord", hintKey: "tutorial.hint.analises.backProtocolRecord" },
  { key: "backProtocols", hintKey: "tutorial.hint.analises.backProtocols" },
  { key: "openMabc", hintKey: "tutorial.hint.analises.openMabc" },
  { key: "openMabcRecord", hintKey: "tutorial.hint.analises.openMabcRecord" },
  { key: "backMabcRecord", hintKey: "tutorial.hint.analises.backMabcRecord" },
  { key: "backMabc", hintKey: "tutorial.hint.analises.backMabc" },
];

/**
 * Ordered sub-steps of the Reports guided simulation. It creates a report for a
 * student (student → +New → period → save), opens it, exports that single report
 * from its detail screen (choosing the formats in the picker), returns to the
 * reports landing and finally builds a consolidated cross-student report
 * (cross mode → students → confirm → period → export).
 *
 * Only the consolidated export, the last sub-step, ends the simulation.
 */
export const RELATORIOS_SIMULATION: SimulationSubStep[] = [
  { key: "selectStudent", hintKey: "tutorial.hint.relatorios.selectStudent" },
  { key: "newReport", hintKey: "tutorial.hint.relatorios.newReport" },
  { key: "periodReport", hintKey: "tutorial.hint.relatorios.periodReport" },
  { key: "saveReport", hintKey: "tutorial.hint.relatorios.saveReport" },
  { key: "openReport", hintKey: "tutorial.hint.relatorios.openReport" },
  { key: "exportReport", hintKey: "tutorial.hint.relatorios.exportReport" },
  { key: "exportConfirm", hintKey: "tutorial.hint.relatorios.exportConfirm" },
  { key: "backFromReport", hintKey: "tutorial.hint.relatorios.backFromReport" },
  { key: "backToReportsHome", hintKey: "tutorial.hint.relatorios.backToReportsHome" },
  { key: "consolidated", hintKey: "tutorial.hint.relatorios.consolidated" },
  { key: "consolidatedSelect", hintKey: "tutorial.hint.relatorios.consolidatedSelect" },
  { key: "consolidatedConfirm", hintKey: "tutorial.hint.relatorios.consolidatedConfirm" },
  { key: "consolidatedPeriod", hintKey: "tutorial.hint.relatorios.consolidatedPeriod" },
  { key: "consolidatedExport", hintKey: "tutorial.hint.relatorios.consolidatedExport" },
];
