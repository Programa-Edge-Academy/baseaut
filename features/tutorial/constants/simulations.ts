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
 * session simulation controller. Between the spotlit gates the user freely
 * practices the real execution flow (stopwatch, crisis/flight, activity result
 * types, showing/hiding the Control Record, reordering) on mock data.
 */
export const SESSOES_SIMULATION: SimulationSubStep[] = [
  { key: "selectStructured", hintKey: "tutorial.hint.sessoes.selectStructured" },
  { key: "startExercise", hintKey: "tutorial.hint.sessoes.startExercise" },
  { key: "goBack", hintKey: "tutorial.hint.sessoes.goBack" },
  { key: "reopenCircuit", hintKey: "tutorial.hint.sessoes.reopenCircuit" },
  { key: "concurrentContinue", hintKey: "tutorial.hint.sessoes.concurrentContinue" },
  { key: "finish", hintKey: "tutorial.hint.sessoes.finish" },
];

/**
 * Ordered sub-steps of the Forms guided simulation. It spans circuit-selection
 * (where forms are started) and the form route, demonstrating starting a form,
 * leaving it pending, the "pending form of the same type" warning, resuming it,
 * and filling/saving it (which may be complete or left pending).
 */
export const FORMULARIOS_SIMULATION: SimulationSubStep[] = [
  { key: "selectAta", hintKey: "tutorial.hint.formularios.selectAta" },
  { key: "goBackAta", hintKey: "tutorial.hint.formularios.goBackAta" },
  { key: "reopenAta", hintKey: "tutorial.hint.formularios.reopenAta" },
  { key: "continueAta", hintKey: "tutorial.hint.formularios.continueAta" },
  { key: "fillAndSave", hintKey: "tutorial.hint.formularios.fillAndSave" },
];

/**
 * Ordered sub-steps of the History guided simulation. It spans the history list,
 * a student's record history and the form editor, demonstrating opening a
 * student and editing a pending record (here the Control Record) and saving it.
 */
export const HISTORICO_SIMULATION: SimulationSubStep[] = [
  { key: "selectStudent", hintKey: "tutorial.hint.historico.selectStudent" },
  { key: "openRecord", hintKey: "tutorial.hint.historico.openRecord" },
  { key: "editSave", hintKey: "tutorial.hint.historico.editSave" },
];

/**
 * Ordered sub-steps of the Analysis guided simulation. It spans the analysis
 * list, the student's analysis overview and each chart screen, guiding the user
 * to open each of the six analysis views (seeded with mock data).
 */
export const ANALISES_SIMULATION: SimulationSubStep[] = [
  { key: "selectStudent", hintKey: "tutorial.hint.analises.selectStudent" },
  { key: "openProgress", hintKey: "tutorial.hint.analises.openProgress" },
  { key: "openHelp", hintKey: "tutorial.hint.analises.openHelp" },
  { key: "openBehaviors", hintKey: "tutorial.hint.analises.openBehaviors" },
  { key: "openCompare", hintKey: "tutorial.hint.analises.openCompare" },
  { key: "openProtocols", hintKey: "tutorial.hint.analises.openProtocols" },
  { key: "openMabc", hintKey: "tutorial.hint.analises.openMabc" },
];

/**
 * Ordered sub-steps of the Reports guided simulation: from a student's reports,
 * create one (student → +New → period), open it, export it, then build a
 * consolidated cross-student report from the landing screen.
 */
export const RELATORIOS_SIMULATION: SimulationSubStep[] = [
  { key: "selectStudent", hintKey: "tutorial.hint.relatorios.selectStudent" },
  { key: "newReport", hintKey: "tutorial.hint.relatorios.newReport" },
  { key: "saveReport", hintKey: "tutorial.hint.relatorios.saveReport" },
  { key: "openReport", hintKey: "tutorial.hint.relatorios.openReport" },
  { key: "exportReport", hintKey: "tutorial.hint.relatorios.exportReport" },
  { key: "consolidated", hintKey: "tutorial.hint.relatorios.consolidated" },
];
