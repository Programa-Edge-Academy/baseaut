/**
 * Central translation catalog. Keys are dot-namespaced by area; every locale
 * provides the same keys. Consumed through the `t()` helper from the i18n
 * context ({@link useI18n}).
 *
 * @remarks
 * This catalog covers the primary surfaces (settings, account, auth, common
 * actions and headers). Remaining hardcoded pt-BR strings across feature
 * screens are migrated incrementally; until then they render in pt-BR.
 */

/** Supported UI languages. */
export type Locale = "pt" | "en";

/** Ordered locale options for the settings selector. */
export const LOCALE_OPTIONS: { value: Locale; label: string }[] = [
  { value: "pt", label: "Português (BR)" },
  { value: "en", label: "English" },
];

/** All translatable message keys. */
export type TranslationKey =
  | "common.save"
  | "common.cancel"
  | "common.back"
  | "common.confirm"
  | "common.remove"
  | "common.loading"
  | "settings.title"
  | "settings.subtitle"
  | "settings.appearance"
  | "settings.theme"
  | "settings.theme.system"
  | "settings.theme.light"
  | "settings.theme.dark"
  | "settings.language"
  | "settings.language.description"
  | "settings.tutorial"
  | "settings.openTutorial"
  | "settings.showTutorialButton"
  | "settings.showTutorialButtonHint"
  | "account.title"
  | "account.subtitle"
  | "account.photo"
  | "account.changePhoto"
  | "account.removePhoto"
  | "account.personalData"
  | "account.name"
  | "account.email"
  | "account.phone"
  | "account.emailManagedByGoogle"
  | "account.saveName"
  | "account.saveEmail"
  | "account.savePhone"
  | "account.changePassword"
  | "account.currentPassword"
  | "account.newPassword"
  | "account.confirmNewPassword"
  | "account.google"
  | "account.googleLinked"
  | "account.googleUnlinkedHint"
  | "account.linkGoogle"
  | "account.unlinkGoogle"
  | "account.googleOnly"
  | "account.logout"
  | "auth.loginTitle"
  | "auth.email"
  | "auth.emailPlaceholder"
  | "auth.invalidEmail"
  | "auth.password"
  | "auth.enter"
  | "auth.or"
  | "auth.google"
  | "auth.noAccount"
  | "auth.signUp"
  | "auth.pendingApproval"
  | "auth.forgotPassword"
  | "common.searchPlaceholder"
  | "common.saving"
  | "common.gotIt"
  | "common.delete"
  | "common.edit"
  | "common.duplicate"
  | "common.copySuffix"
  | "common.deleteConfirmMessage"
  | "pageHeader.new"
  | "exercises.error.createTitle"
  | "exercises.error.createBody"
  | "exercises.error.editTitle"
  | "exercises.error.editBody"
  | "exercises.error.deleteTitle"
  | "exercises.error.duplicateTitle"
  | "exercises.error.duplicateBody"
  | "common.tags"
  | "section.exercises"
  | "section.circuits"
  | "section.analysis"
  | "section.reports"
  | "tags.all"
  | "tags.coordenacao"
  | "tags.forca"
  | "tags.equilibrio"
  | "subtags.locomotor"
  | "subtags.manipulativo"
  | "subtags.estabilizador"
  | "exercises.title"
  | "exercises.subtitle"
  | "exercises.empty"
  | "exercises.deleteTitle"
  | "exercises.deleteLinkedSingular"
  | "exercises.deleteLinkedPlural"
  | "exercises.form.createTitle"
  | "exercises.form.editTitle"
  | "exercises.form.name"
  | "exercises.form.namePlaceholder"
  | "exercises.form.description"
  | "exercises.form.descriptionPlaceholder"
  | "exercises.form.duration"
  | "exercises.form.durationPlaceholder"
  | "exercises.form.tags"
  | "exercises.form.removeIconTitle"
  | "exercises.form.err.required"
  | "exercises.form.err.nameMax"
  | "exercises.form.err.tagRequired"
  | "exercises.form.err.subtagRequired"
  | "exercises.form.err.duration"
  | "tutorial.hint.exercicios.new"
  | "tutorial.hint.exercicios.title"
  | "tutorial.hint.exercicios.tag"
  | "tutorial.hint.exercicios.save"
  | "tutorial.hint.exercicios.duplicateMenu"
  | "tutorial.hint.exercicios.duplicateSelect"
  | "tutorial.hint.exercicios.deleteMenu"
  | "tutorial.hint.exercicios.deleteSelect"
  | "tutorial.hint.exercicios.deleteConfirm"
  | "circuits.title"
  | "circuits.subtitle"
  | "circuits.empty"
  | "circuits.deleteTitle"
  | "circuits.noExercises"
  | "circuits.exercisesSuffix"
  | "circuits.badge.structured"
  | "circuits.badge.semi"
  | "circuits.badge.mabc"
  | "circuits.form.createTitle"
  | "circuits.form.editTitle"
  | "circuits.form.name"
  | "circuits.form.namePlaceholder"
  | "circuits.form.type"
  | "circuits.form.structured"
  | "circuits.form.structuredDesc"
  | "circuits.form.semi"
  | "circuits.form.semiDesc"
  | "circuits.form.selectByTag"
  | "circuits.form.selectExercises"
  | "circuits.form.order"
  | "circuits.form.orderHint"
  | "circuits.form.createdSuccess"
  | "circuits.form.editedSuccess"
  | "circuits.form.err.nameRequired"
  | "circuits.form.err.exercisesRequired"
  | "circuits.error.createTitle"
  | "circuits.error.createBody"
  | "circuits.error.editTitle"
  | "circuits.error.editBody"
  | "circuits.error.deleteTitle"
  | "circuits.error.duplicateTitle"
  | "circuits.error.duplicateBody"
  | "tutorial.hint.circuitos.new"
  | "tutorial.hint.circuitos.name"
  | "tutorial.hint.circuitos.mode"
  | "tutorial.hint.circuitos.selectExercises"
  | "tutorial.hint.circuitos.save"
  | "tutorial.hint.circuitos.editMenu"
  | "tutorial.hint.circuitos.editSelect"
  | "tutorial.hint.circuitos.changeStructured"
  | "tutorial.hint.circuitos.reorder"
  | "tutorial.hint.circuitos.editSave"
  | "tutorial.hint.circuitos.deleteMenu"
  | "tutorial.hint.circuitos.deleteSelect"
  | "tutorial.hint.circuitos.deleteConfirm"
  | "tutorial.hint.sessoes.selectStructured"
  | "tutorial.hint.sessoes.startExercise"
  | "tutorial.hint.sessoes.goBack"
  | "tutorial.hint.sessoes.reopenCircuit"
  | "tutorial.hint.sessoes.concurrentContinue"
  | "tutorial.hint.sessoes.finish"
  | "tutorial.hint.formularios.selectAta"
  | "tutorial.hint.formularios.goBackAta"
  | "tutorial.hint.formularios.reopenAta"
  | "tutorial.hint.formularios.continueAta"
  | "tutorial.hint.formularios.fillAndSave"
  | "tutorial.hint.historico.selectStudent"
  | "tutorial.hint.historico.openRecord"
  | "tutorial.hint.historico.editSave"
  | "tutorial.hint.analises.selectStudent"
  | "tutorial.hint.analises.openProgress"
  | "tutorial.hint.analises.openHelp"
  | "tutorial.hint.analises.openBehaviors"
  | "tutorial.hint.analises.openCompare"
  | "tutorial.hint.analises.openProtocols"
  | "tutorial.hint.analises.openMabc"
  | "tutorial.hint.relatorios.selectStudent"
  | "tutorial.hint.relatorios.newReport"
  | "tutorial.hint.relatorios.saveReport"
  | "tutorial.hint.relatorios.openReport"
  | "tutorial.hint.relatorios.exportReport"
  | "tutorial.hint.relatorios.consolidated"
  | "common.allM"
  | "common.register"
  | "analysis.level.maduro"
  | "analysis.level.intermediario"
  | "analysis.level.inicial"
  | "analysis.variation"
  | "analysis.period1"
  | "analysis.period2"
  | "analysis.summary.exercisesEvaluated"
  | "analysis.summary.helpRecords"
  | "analysis.summary.behaviors"
  | "analysis.summary.sessions"
  | "analysis.summary.title"
  | "analysis.summary.note"
  | "analysis.protocol.viewRegistered"
  | "analysis.behavior.behavior"
  | "analysis.behavior.occurrences"
  | "analysis.behavior.sessions"
  | "analysis.behavior.associatedExercises"
  | "analysis.behavior.lastOccurrence"
  | "analysis.help.intrusive"
  | "analysis.help.autonomous"
  | "analysis.noRecord"
  | "analysis.unknownExercise"
  | "analysis.helpChart.title"
  | "analysis.helpChart.explanation"
  | "analysis.helpChart.session"
  | "analysis.motorDev"
  | "analysis.selectPeriodProgress"
  | "analysis.emptyProtocol.title"
  | "analysis.emptyProtocol.desc"
  | "analysis.info.name"
  | "analysis.info.age"
  | "analysis.info.supportLevel"
  | "analysis.info.title"
  | "analysis.info.generalObservations"
  | "common.yearsOld"
  | "analysis.appliedProtocols"
  | "analysis.helpModal.openButton"
  | "analysis.helpModal.title"
  | "analysis.helpModal.subtitle"
  | "analysis.helpModal.empty"
  | "analysis.helpModal.noRecords"
  | "analysis.help.comparisonTitle"
  | "analysis.help.type"
  | "analysis.help.footnote"
  | "common.student"
  | "common.dateNotSet"
  | "common.retry"
  | "common.exit"
  | "common.export"
  | "common.download"
  | "common.exportedSuccess"
  | "common.exportError"
  | "mabcForm.recordNotProvided"
  | "mabcForm.loadError"
  | "mabcForm.fillRequiredSave"
  | "mabcForm.fillRequiredCreate"
  | "mabcForm.editedSuccess"
  | "mabcForm.savedSuccess"
  | "mabcForm.editError"
  | "mabcForm.saveError"
  | "mabcForm.deleteError"
  | "mabcForm.exitTitle"
  | "mabcForm.exitMessage"
  | "mabcForm.selectFormat"
  | "mabcForm.csvTabular"
  | "export.selectAtLeastOne"
  | "export.issuedOn"
  | "export.issue"
  | "export.totalScore"
  | "export.totalPercentile"
  | "export.category"
  | "export.attempts"
  | "export.unit"
  | "export.categoryScore"
  | "export.categoryPercentile"
  | "export.scoreLabel"
  | "export.exportMabcTitle"
  | "concurrentSession.title"
  | "concurrentSession.message"
  | "concurrentSession.continueLabel"
  | "concurrentSession.finishLabel"
  | "common.finish"
  | "common.yes"
  | "common.no"
  | "forms.observationsOptional"
  | "forms.addObservation"
  | "common.done"
  | "activityResult.title"
  | "activityResult.deferAnswer"
  | "activityResult.time"
  | "activityResult.developmentLevel"
  | "activityResult.levelRequired"
  | "activityResult.helpRecord"
  | "activityResult.helpRequired"
  | "activityResult.subRequired"
  | "activityResult.notCompleted"
  | "activityResult.reason"
  | "activityResult.motiveRequired"
  | "activityResult.motiveDescription"
  | "activityResult.describeMotive"
  | "activityResult.motiveDescRequired"
  | "activityResult.motive.refusal"
  | "activityResult.motive.disruptive"
  | "activityResult.motive.fatigue"
  | "activityResult.motive.insufficientTime"
  | "activityResult.motive.physicalDifficulty"
  | "activityResult.motive.other"
  | "chip.verbal"
  | "chip.model"
  | "common.continue"
  | "sessionCompletion.title"
  | "sessionCompletion.completed"
  | "sessionCompletion.backToStart"
  | "continuation.tryUnrealizedTitle"
  | "continuation.unrealizedOne"
  | "continuation.unrealizedMany"
  | "continuation.repeatTitle"
  | "continuation.repeatDesc"
  | "continuation.otherTitle"
  | "continuation.otherDesc"
  | "warningBanner.title"
  | "warningBanner.subtitle"
  | "common.notSelected"
  | "activityResult.notApplicable"
  | "activityRecord.status"
  | "activityRecord.notPerformed"
  | "activityRecord.performed"
  | "activityRecord.duration"
  | "activityRecord.helpLevel"
  | "activityRecord.exerciseStatus"
  | "activityRecord.durationSeconds"
  | "activityRecord.durationExample"
  | "activityRecord.helpOffered"
  | "activityRecord.pendingInfo"
  | "activityRecord.describeReason"
  | "activityRecord.reasonLabel"
  | "confirm.finishSession.title"
  | "confirm.logout.title"
  | "confirm.delete.title"
  | "confirm.finishEngagement.message"
  | "confirm.finishSession.message"
  | "confirm.logout.message"
  | "confirm.delete.message"
  | "common.updateList"
  | "common.tryAgain"
  | "common.error"
  | "common.changePeriod"
  | "common.compare"
  | "analysis.compareScreen.periodValue"
  | "analysis.compareScreen.selectRange"
  | "analysis.compareScreen.periodRequired"
  | "analysis.compareScreen.futureDate"
  | "analysis.compareScreen.p1AfterP2"
  | "analysis.compareScreen.overlapP2"
  | "analysis.compareScreen.p2BeforeP1"
  | "analysis.compareScreen.overlapP1"
  | "analysis.compareScreen.bothRequired"
  | "analysis.behaviorsScreen.title"
  | "analysis.behaviorsScreen.selectPeriod"
  | "analysis.behaviorsScreen.periodRequired"
  | "analysis.behaviorsScreen.detailsTitle"
  | "analysis.behaviorsScreen.errorTitle"
  | "analysis.behaviorsScreen.errorMessage"
  | "analysis.behaviorsScreen.emptyTitle"
  | "analysis.behaviorsScreen.emptyMessage"
  | "analysis.behaviorsScreen.sessionOf"
  | "common.until"
  | "analysis.period.selectedDate"
  | "analysis.period.range"
  | "analysis.progressChart.singleRecordWarning"
  | "analysis.helpScreen.title"
  | "analysis.helpScreen.selectPeriod"
  | "analysis.helpScreen.emptyText"
  | "analysis.helpScreen.errorTitle"
  | "analysis.helpScreen.errorDesc"
  | "analysis.list.sessionsRecordedOne"
  | "analysis.list.sessionsRecordedMany"
  | "analysis.card.progress.title"
  | "analysis.card.progress.desc"
  | "analysis.card.help.title"
  | "analysis.card.help.desc"
  | "analysis.card.behaviors.title"
  | "analysis.card.behaviors.desc"
  | "analysis.card.compare.title"
  | "analysis.card.compare.desc"
  | "analysis.card.mabc.title"
  | "analysis.card.mabc.desc"
  | "analysis.noRecords.header"
  | "analysis.noRecords.sessions.title"
  | "analysis.noRecords.sessions.message"
  | "analysis.noRecords.protocol.title"
  | "analysis.noRecords.protocol.message"
  | "analysis.noRecords.help.title"
  | "analysis.noRecords.help.message"
  | "analysis.noRecords.behavior.title"
  | "analysis.noRecords.behavior.message"
  | "analysis.noRecords.loadRecords.title"
  | "analysis.noRecords.loadRecords.message"
  | "analysis.noRecords.loadEvolution.title"
  | "analysis.noRecords.loadEvolution.message"
  | "analysis.noRecords.loadBehavior.title"
  | "analysis.noRecords.loadBehavior.message"
  | "analysis.mabcForm.deleteTitle"
  | "analysis.mabcForm.deleteMessage"
  | "analysis.protocolViz.formSaved"
  | "analysis.protocolViz.formSavedDesc"
  | "analysis.protocolViz.saveError"
  | "analysis.protocolViz.formLabel"
  | "analysis.protocolViz.testSummary"
  | "analysis.protocolViz.noData"
  | "analysis.mabcList.subtitle"
  | "analysis.mabcList.empty"
  | "analysis.protocolList.recordOne"
  | "analysis.protocolList.recordMany"
  | "analysis.protocolList.viewRecords"
  | "analysis.protocolList.loadError"
  | "analysis.protocolList.noRecordsFound"
  | "analysis.protocolCard.record"
  | "analysis.protocolCard.ageGroup"
  | "analysis.protocolCard.evaluatedBy"
  | "analysis.progressChart.selectedExercise"
  | "analysis.comparisonCard.loadError"
  | "analysis.comparisonCard.insufficientData"
  | "analysis.behaviors.comparisonTitle"
  | "analysis.behaviors.footnote"
  | "analysis.behaviorChart.title"
  | "analysis.behaviorChart.note"
  | "analysis.behaviorChart.stereotypy.label"
  | "analysis.behaviorChart.stereotypy.legend"
  | "analysis.behaviorChart.eyePeople.label"
  | "analysis.behaviorChart.eyePeople.legend"
  | "analysis.behaviorChart.eyeObjects.label"
  | "analysis.behaviorChart.eyeObjects.legend"
  | "analysis.behaviorChart.engagement.label"
  | "analysis.behaviorChart.engagement.legend"
  | "analysis.behaviorChart.escape.label"
  | "analysis.behaviorChart.escape.legend"
  | "analysis.behaviorChart.crisis.label"
  | "analysis.behaviorChart.crisis.legend"
  | "analysis.behaviorChart.unfit.label"
  | "analysis.behaviorChart.unfit.legend"
  | "analysis.behaviorChart.preferred.label"
  | "analysis.behaviorChart.preferred.legend"
  | "analysis.status.notFilled"
  | "analysis.status.registered"
  | "analysis.status.notRegistered"
  | "analysis.evolution.improved"
  | "analysis.evolution.stable"
  | "analysis.evolution.needsReinforcement"
  | "analysis.progress.lastPerformance"
  | "analysis.progress.evolution"
  | "analysis.progress.awaiting"
  | "analysis.progress.notYetRecorded"
  | "analysis.progress.sessionsOne"
  | "analysis.progress.sessionsMany"
  | "analysis.compare.title"
  | "analysis.compare.exercise"
  | "analysis.compare.empty"
  | "analysis.compare.footnote"
  | "analysis.summaryCard.loadError"
  | "analysis.summaryCard.insufficientData"
  | "analysis.mabc.categories"
  | "analysis.mabcSection.manualDexterity"
  | "analysis.mabcSection.aimingCatching"
  | "analysis.mabcSection.balance"
  | "analysis.mabc.score"
  | "analysis.mabc.percentile"
  | "analysis.mabc.totalScore"
  | "analysis.mabc.totalPercentile"
  | "analysis.mabc.recordsFound"
  | "reports.title"
  | "reports.subtitle"
  | "reports.subtitleCross"
  | "reports.crossToggle"
  | "reports.empty"
  | "reports.recordsSuffix"
  | "analysis.title"
  | "analysis.subtitle"
  | "history.title"
  | "history.subtitle"
  | "history.empty"
  | "history.recordsSuffix"
  | "history.detailTitle"
  | "forms.conflict.title"
  | "forms.conflict.message"
  | "forms.conflict.continue"
  | "forms.conflict.finishNew"
  | "sessions.circuitSelection.title"
  | "sessions.circuitSelection.subtitle"
  | "sessions.circuitSelection.empty"
  | "sessions.badge.structured"
  | "sessions.badge.semi"
  | "sessions.concurrent.title"
  | "sessions.concurrent.message"
  | "sessions.concurrent.continue"
  | "sessions.concurrent.finishNew"
  | "students.deleteMessage"
  | "nav.activities"
  | "nav.home"
  | "nav.analysis"
  | "students.title"
  | "students.subtitle"
  | "students.empty"
  | "students.years"
  | "students.support.n1"
  | "students.support.n2"
  | "students.support.n3"
  | "students.deleteTitle"
  | "students.form.createTitle"
  | "students.form.editTitle"
  | "students.form.fullName"
  | "students.form.fullNamePlaceholder"
  | "students.form.birthDate"
  | "students.form.birthDatePlaceholder"
  | "students.form.calendar"
  | "students.form.weight"
  | "students.form.weightPlaceholder"
  | "students.form.height"
  | "students.form.heightPlaceholder"
  | "students.form.waist"
  | "students.form.waistPlaceholder"
  | "students.form.supportLevel"
  | "students.form.selectHere"
  | "students.form.supportOption1"
  | "students.form.supportOption2"
  | "students.form.supportOption3"
  | "students.form.healthConditions"
  | "students.form.healthConditionsPlaceholder"
  | "students.form.observations"
  | "students.form.observationsPlaceholder"
  | "students.form.removePhotoTitle"
  | "students.form.replace"
  | "students.form.err.nameRequired"
  | "students.form.err.nameMin"
  | "students.form.err.nameMax"
  | "students.form.err.nameFull"
  | "students.form.err.dateRequired"
  | "students.form.err.dateInvalid"
  | "students.form.err.dateUnreal"
  | "students.form.err.observationsMax"
  | "students.form.err.invalidValue"
  | "students.form.err.supportRequired"
  | "students.error.createTitle"
  | "students.error.createBody"
  | "students.error.editTitle"
  | "students.error.editBody"
  | "students.error.deleteTitle"
  | "tutorial.inTutorial"
  | "tutorial.practiceNotice"
  | "tutorial.exitPractice"
  | "tutorial.askHelp"
  | "tutorial.helpTitle"
  | "tutorial.helpDone"
  | "tutorial.hint.alunos.new"
  | "tutorial.hint.alunos.name"
  | "tutorial.hint.alunos.birthdate"
  | "tutorial.hint.alunos.support"
  | "tutorial.hint.alunos.save"
  | "tutorial.hint.alunos.editMenu"
  | "tutorial.hint.alunos.editSelect"
  | "tutorial.hint.alunos.editSupport"
  | "tutorial.hint.alunos.editSave"
  | "tutorial.hint.alunos.deleteMenu"
  | "tutorial.hint.alunos.deleteSelect"
  | "tutorial.hint.alunos.deleteConfirm"
  | "tutorial.startSimulation"
  | "tutorial.simDoneTitle"
  | "tutorial.listTitle"
  | "tutorial.listSubtitle"
  | "tutorial.stepOf"
  | "tutorial.previous"
  | "tutorial.next"
  | "tutorial.moduleNotFound"
  | "tutorial.finishTutorial"
  | "tutorial.finishModule"
  | "tutorial.practiceNotFound"
  | "tutorial.practiceArea"
  | "tutorial.practiceEnvBanner"
  | "tutorial.practiceEnvTitle"
  | "tutorial.practiceNoticeLong"
  | "tutorial.stopwatchPractice"
  | "tutorial.selectTag"
  | "tutorial.practiceDone"
  | "tutorial.finishPractice"
  | "tutorial.backToTutorial"
  | "tutorial.congratsTitle"
  | "tutorial.congratsBody"
  | "tutorial.startUsing"
  | "tutorial.mod.alunos.title"
  | "tutorial.mod.alunos.desc"
  | "tutorial.mod.alunos.s0.title"
  | "tutorial.mod.alunos.s0.body"
  | "tutorial.mod.alunos.s1.title"
  | "tutorial.mod.alunos.s1.body"
  | "tutorial.mod.alunos.s2.body"
  | "tutorial.mod.exercicios.title"
  | "tutorial.mod.exercicios.desc"
  | "tutorial.mod.exercicios.s0.title"
  | "tutorial.mod.exercicios.s0.body"
  | "tutorial.mod.exercicios.s1.title"
  | "tutorial.mod.exercicios.s1.body"
  | "tutorial.mod.exercicios.s2.body"
  | "tutorial.mod.circuitos.title"
  | "tutorial.mod.circuitos.desc"
  | "tutorial.mod.circuitos.s0.title"
  | "tutorial.mod.circuitos.s0.body"
  | "tutorial.mod.circuitos.s1.title"
  | "tutorial.mod.circuitos.s1.body"
  | "tutorial.mod.circuitos.s2.body"
  | "tutorial.mod.sessoes.title"
  | "tutorial.mod.sessoes.desc"
  | "tutorial.mod.sessoes.s0.title"
  | "tutorial.mod.sessoes.s0.body"
  | "tutorial.mod.sessoes.s1.title"
  | "tutorial.mod.sessoes.s1.body"
  | "tutorial.mod.sessoes.s2.body"
  | "tutorial.mod.formularios.title"
  | "tutorial.mod.formularios.desc"
  | "tutorial.mod.formularios.s0.title"
  | "tutorial.mod.formularios.s0.body"
  | "tutorial.mod.formularios.s1.title"
  | "tutorial.mod.formularios.s1.body"
  | "tutorial.mod.formularios.s2.body"
  | "tutorial.mod.historico.title"
  | "tutorial.mod.historico.desc"
  | "tutorial.mod.historico.s0.title"
  | "tutorial.mod.historico.s0.body"
  | "tutorial.mod.historico.s1.title"
  | "tutorial.mod.historico.s1.body"
  | "tutorial.mod.historico.s2.body"
  | "tutorial.mod.analises.title"
  | "tutorial.mod.analises.desc"
  | "tutorial.mod.analises.s0.title"
  | "tutorial.mod.analises.s0.body"
  | "tutorial.mod.analises.s1.title"
  | "tutorial.mod.analises.s1.body"
  | "tutorial.mod.analises.s2.body"
  | "tutorial.mod.relatorios.title"
  | "tutorial.mod.relatorios.desc"
  | "tutorial.mod.relatorios.s0.title"
  | "tutorial.mod.relatorios.s0.body"
  | "tutorial.mod.relatorios.s1.title"
  | "tutorial.mod.relatorios.s1.body"
  | "tutorial.mod.relatorios.s2.body";

/** Translation tables keyed by locale then message key. */
export const translations: Record<Locale, Record<TranslationKey, string>> = {
  pt: {
    "common.save": "Salvar",
    "common.cancel": "Cancelar",
    "common.back": "Voltar",
    "common.confirm": "Confirmar",
    "common.remove": "Remover",
    "common.loading": "Carregando...",
    "settings.title": "Configurações",
    "settings.subtitle": "Gerencie suas preferências e conta",
    "settings.appearance": "Aparência",
    "settings.theme": "Tema",
    "settings.theme.system": "Sistema",
    "settings.theme.light": "Claro",
    "settings.theme.dark": "Escuro",
    "settings.language": "Idioma",
    "settings.language.description": "Escolha o idioma do aplicativo",
    "settings.tutorial": "Tutorial",
    "settings.openTutorial": "Abrir tutorial",
    "settings.showTutorialButton": "Mostrar tutorial no cabeçalho",
    "settings.showTutorialButtonHint": "Exibe o atalho de ajuda no topo das telas principais",
    "account.title": "Minha conta",
    "account.subtitle": "Personalize seus dados e foto de perfil",
    "account.photo": "Foto de perfil",
    "account.changePhoto": "Alterar foto",
    "account.removePhoto": "Remover foto",
    "account.personalData": "Dados pessoais",
    "account.name": "Nome completo",
    "account.email": "E-mail",
    "account.phone": "Telefone",
    "account.emailManagedByGoogle": "O e-mail é gerenciado pela sua conta Google.",
    "account.saveName": "Salvar nome",
    "account.saveEmail": "Salvar e-mail",
    "account.savePhone": "Salvar telefone",
    "account.changePassword": "Alterar senha",
    "account.currentPassword": "Senha atual",
    "account.newPassword": "Nova senha",
    "account.confirmNewPassword": "Confirmar nova senha",
    "account.google": "Conta Google",
    "account.googleLinked": "Sua conta está vinculada ao Google.",
    "account.googleUnlinkedHint": "Vincule sua conta Google para entrar com um toque.",
    "account.linkGoogle": "Vincular conta Google",
    "account.unlinkGoogle": "Desvincular conta Google",
    "account.googleOnly":
      "Não é possível desvincular: o Google é o único acesso desta conta.",
    "account.logout": "Sair da conta",
    "auth.loginTitle": "Entre na sua conta",
    "auth.email": "E-mail",
    "auth.emailPlaceholder": "Seu e-mail",
    "auth.invalidEmail": "E-mail inválido",
    "auth.password": "Senha",
    "auth.enter": "Entrar",
    "auth.or": "ou",
    "auth.google": "Entrar com Google",
    "auth.noAccount": "Não tem conta? ",
    "auth.signUp": "Cadastre-se",
    "auth.pendingApproval": "Seu cadastro ainda está aguardando aprovação.",
    "auth.forgotPassword": "Esqueci a senha",
    "common.searchPlaceholder": "Buscar...",
    "common.saving": "Salvando...",
    "common.gotIt": "Entendi",
    "common.delete": "Excluir",
    "common.edit": "Editar",
    "common.duplicate": "Duplicar",
    "common.copySuffix": " (Cópia)",
    "common.deleteConfirmMessage":
      "Tem certeza que deseja excluir? Esta ação não poderá ser desfeita.",
    "pageHeader.new": "+ Novo",
    "exercises.error.createTitle": "Erro ao Criar",
    "exercises.error.createBody": "Não foi possível salvar o exercício.",
    "exercises.error.editTitle": "Erro ao Editar",
    "exercises.error.editBody": "Não foi possível atualizar o exercício.",
    "exercises.error.deleteTitle": "Erro ao Remover",
    "exercises.error.duplicateTitle": "Erro ao Duplicar",
    "exercises.error.duplicateBody": "Não foi possível duplicar o exercício.",
    "common.tags": "Tags",
    "section.exercises": "Exercícios",
    "section.circuits": "Circuitos",
    "section.analysis": "Análises",
    "section.reports": "Relatórios",
    "tags.all": "Todas",
    "tags.coordenacao": "Coordenação",
    "tags.forca": "Força",
    "tags.equilibrio": "Equilíbrio",
    "subtags.locomotor": "Locomotor",
    "subtags.manipulativo": "Manipulativo",
    "subtags.estabilizador": "Estabilizador",
    "exercises.title": "Exercícios",
    "exercises.subtitle": "Gerencie os exercícios disponíveis",
    "exercises.empty": "Nenhum exercício encontrado.",
    "exercises.deleteTitle": "Excluir exercício?",
    "exercises.deleteLinkedSingular":
      "Este exercício está vinculado a {n} circuito. Ele será removido dele e esta ação não pode ser desfeita.",
    "exercises.deleteLinkedPlural":
      "Este exercício está vinculado a {n} circuitos. Ele será removido deles e esta ação não pode ser desfeita.",
    "exercises.form.createTitle": "Novo exercício",
    "exercises.form.editTitle": "Editar exercício",
    "exercises.form.name": "Nome do exercício",
    "exercises.form.namePlaceholder": "Ex: Girar bambolê",
    "exercises.form.description": "Descrição",
    "exercises.form.descriptionPlaceholder": "Descrição do exercício (opcional)",
    "exercises.form.duration": "Duração máxima (segundos)",
    "exercises.form.durationPlaceholder": "Ex: 120",
    "exercises.form.tags": "Tags",
    "exercises.form.removeIconTitle": "Remover ícone?",
    "exercises.form.err.required": "Este campo é obrigatório",
    "exercises.form.err.nameMax": "O nome deve ter no máximo 100 caracteres",
    "exercises.form.err.tagRequired": "É obrigatória a seleção de uma tag",
    "exercises.form.err.subtagRequired": "É obrigatória a seleção de pelo menos uma subtag",
    "exercises.form.err.duration": "A duração deve ser menor que 300 segundos",
    "tutorial.hint.exercicios.new": "Toque em \"+ Novo\" para criar um exercício.",
    "tutorial.hint.exercicios.title": "Preencha o nome do exercício.",
    "tutorial.hint.exercicios.tag": "Selecione uma tag e ao menos uma subtag.",
    "tutorial.hint.exercicios.save": "Toque em \"Salvar\" para criar o exercício.",
    "tutorial.hint.exercicios.duplicateMenu": "Abra o menu do exercício criado tocando nos três pontos.",
    "tutorial.hint.exercicios.duplicateSelect": "No menu, toque em \"Duplicar\".",
    "tutorial.hint.exercicios.deleteMenu": "Abra novamente o menu do exercício criado.",
    "tutorial.hint.exercicios.deleteSelect": "No menu, toque em \"Excluir\".",
    "tutorial.hint.exercicios.deleteConfirm": "Confirme a exclusão tocando em \"Excluir\".",
    "circuits.title": "Circuitos",
    "circuits.subtitle": "Monte circuitos com exercícios",
    "circuits.empty": "Nenhum circuito encontrado.",
    "circuits.deleteTitle": "Excluir circuito?",
    "circuits.noExercises": "Sem exercícios vinculados",
    "circuits.exercisesSuffix": "exercícios",
    "circuits.badge.structured": "Estruturado",
    "circuits.badge.semi": "Semi-estruturado",
    "circuits.badge.mabc": "MABC-2",
    "circuits.form.createTitle": "Novo circuito",
    "circuits.form.editTitle": "Editar circuito",
    "circuits.form.name": "Nome do circuito",
    "circuits.form.namePlaceholder": "Ex: Circuito 1",
    "circuits.form.type": "Tipo do circuito",
    "circuits.form.structured": "Estruturado",
    "circuits.form.structuredDesc": "Realiza todos os exercícios definidos",
    "circuits.form.semi": "Semi-estruturado",
    "circuits.form.semiDesc": "Para engajamento e atividades parciais",
    "circuits.form.selectByTag": "Selecionar exercícios por tag",
    "circuits.form.selectExercises": "Selecione os exercícios",
    "circuits.form.order": "Ordem do Circuito",
    "circuits.form.orderHint": "Segure e arraste pelo ícone de alça para reordenar.",
    "circuits.form.createdSuccess": "Circuito criado com sucesso",
    "circuits.form.editedSuccess": "Circuito editado com sucesso",
    "circuits.form.err.nameRequired": "Este campo é obrigatório",
    "circuits.form.err.exercisesRequired": "É obrigatória a seleção de pelo menos um exercício",
    "circuits.error.createTitle": "Erro ao Criar",
    "circuits.error.createBody": "Não foi possível salvar o circuito.",
    "circuits.error.editTitle": "Erro ao Editar",
    "circuits.error.editBody": "Não foi possível atualizar o circuito.",
    "circuits.error.deleteTitle": "Erro ao Remover",
    "circuits.error.duplicateTitle": "Erro ao Duplicar",
    "circuits.error.duplicateBody": "Não foi possível duplicar o circuito.",
    "tutorial.hint.circuitos.new": "Toque em \"+ Novo\" para criar um circuito.",
    "tutorial.hint.circuitos.name": "Preencha o nome do circuito.",
    "tutorial.hint.circuitos.mode": "Selecione o tipo \"Semi-estruturado\".",
    "tutorial.hint.circuitos.selectExercises": "Selecione ao menos dois exercícios.",
    "tutorial.hint.circuitos.save": "Toque em \"Salvar\" para criar o circuito.",
    "tutorial.hint.circuitos.editMenu": "Abra o menu do circuito criado tocando nos três pontos.",
    "tutorial.hint.circuitos.editSelect": "No menu, toque em \"Editar\".",
    "tutorial.hint.circuitos.changeStructured": "Altere o tipo para \"Estruturado\".",
    "tutorial.hint.circuitos.reorder": "Arraste pelo ícone de alça para reordenar os exercícios.",
    "tutorial.hint.circuitos.editSave": "Toque em \"Salvar\" para confirmar as alterações.",
    "tutorial.hint.circuitos.deleteMenu": "Abra novamente o menu do circuito criado.",
    "tutorial.hint.circuitos.deleteSelect": "No menu, toque em \"Excluir\".",
    "tutorial.hint.circuitos.deleteConfirm": "Confirme a exclusão tocando em \"Excluir\".",
    "tutorial.hint.sessoes.selectStructured": "Toque no circuito estruturado para iniciar a sessão.",
    "tutorial.hint.sessoes.startExercise": "Toque em \"Iniciar atividade\". Depois pratique livremente: cronômetro, registrar crise/fuga, parar e marcar o resultado (realizada — com ajuda intrusiva ou verbal —, não realizada ou adiado), e mostrar/ocultar o Registro de Controle (que pode ficar vazio para preencher depois no Histórico).",
    "tutorial.hint.sessoes.goBack": "Toque em \"Voltar\" para sair sem finalizar — a sessão continua em andamento.",
    "tutorial.hint.sessoes.reopenCircuit": "Toque num circuito novamente para ver o aviso de sessão em andamento.",
    "tutorial.hint.sessoes.concurrentContinue": "Toque em \"Continuar sessão em andamento\" para retomar. Esse aviso também aparece quando há um Registro de Controle pendente ou um formulário do mesmo tipo pendente para o aluno.",
    "tutorial.hint.sessoes.finish": "Toque em \"Finalizar\" e confirme para encerrar a sessão.",
    "tutorial.hint.formularios.selectAta": "Toque no formulário ATA para iniciá-lo.",
    "tutorial.hint.formularios.goBackAta": "Toque em \"Voltar\" para sair sem preencher — o ATA fica pendente.",
    "tutorial.hint.formularios.reopenAta": "Toque no ATA novamente para ver o aviso de formulário do mesmo tipo pendente.",
    "tutorial.hint.formularios.continueAta": "Toque em \"Continuar formulário anterior\" para retomar o ATA pendente.",
    "tutorial.hint.formularios.fillAndSave": "Responda a pergunta obrigatória e toque em salvar (no cabeçalho). Campos opcionais podem ficar em branco. CARS e MABC-2 funcionam igual — o MABC-2 é dividido por faixa etária (3-6, 7-10 e 11-16 anos).",
    "tutorial.hint.historico.selectStudent": "Toque no aluno para ver seus registros passados.",
    "tutorial.hint.historico.openRecord": "Toque no Registro de Controle pendente para editá-lo.",
    "tutorial.hint.historico.editSave": "Complete o que faltava e salve. Da mesma forma você edita os resultados das atividades de uma sessão e os formulários ATA, CARS e MABC-2.",
    "tutorial.hint.analises.selectStudent": "Toque no aluno para ver as análises dele.",
    "tutorial.hint.analises.openProgress": "Abra \"Progresso por exercício\". Veja o gráfico com dados; se filtrar por um período sem registros, ele aparece vazio — volte a um período com dados. Depois volte.",
    "tutorial.hint.analises.openHelp": "Abra \"Registros de ajuda por sessão\" para ver a evolução da autonomia. Depois volte.",
    "tutorial.hint.analises.openBehaviors": "Abra \"Comportamentos observados\" para ver as frequências. Depois volte.",
    "tutorial.hint.analises.openCompare": "Abra \"Comparar desempenho\" para ver dois períodos lado a lado. Depois volte.",
    "tutorial.hint.analises.openProtocols": "Abra os protocolos aplicados (ATA/CARS) para ver os registros. Depois volte.",
    "tutorial.hint.analises.openMabc": "Abra \"Registros de desenvolvimento motor\" (MABC-2) para ver as avaliações.",
    "tutorial.hint.relatorios.selectStudent": "Toque no aluno para ver os relatórios dele.",
    "tutorial.hint.relatorios.newReport": "Toque em \"+ Novo\" para criar um relatório.",
    "tutorial.hint.relatorios.saveReport": "Escolha o período e salve para gerar o relatório.",
    "tutorial.hint.relatorios.openReport": "Toque no relatório criado para abri-lo.",
    "tutorial.hint.relatorios.exportReport": "Toque no ícone de exportar, selecione um ou mais relatórios, confirme e exporte (ou baixe no dispositivo).",
    "tutorial.hint.relatorios.consolidated": "Volte e toque em \"Cruzar dados de alunos\" para gerar um relatório consolidado de vários alunos.",
    "common.allM": "Todos",
    "common.register": "Registrar",
    "analysis.level.maduro": "Maduro",
    "analysis.level.intermediario": "Intermediário",
    "analysis.level.inicial": "Inicial",
    "analysis.variation": "Variação",
    "analysis.period1": "Período 1",
    "analysis.period2": "Período 2",
    "analysis.summary.exercisesEvaluated": "Exercícios avaliados",
    "analysis.summary.helpRecords": "Registros de ajuda",
    "analysis.summary.behaviors": "Comportamentos observados",
    "analysis.summary.sessions": "Sessões registradas",
    "analysis.summary.title": "Resumo da comparação",
    "analysis.summary.note": "Os valores exibem a diferença absoluta e percentual entre os dois períodos selecionados.",
    "analysis.protocol.viewRegistered": "Visualizar formulário registrado",
    "analysis.behavior.behavior": "Comportamento",
    "analysis.behavior.occurrences": "Ocorrências",
    "analysis.behavior.sessions": "Sessões",
    "analysis.behavior.associatedExercises": "Exercícios associados",
    "analysis.behavior.lastOccurrence": "Última ocorrência",
    "analysis.help.intrusive": "Ajuda Intrusiva",
    "analysis.help.autonomous": "Autônomo",
    "analysis.noRecord": "Sem registro",
    "analysis.unknownExercise": "Exercício Desconhecido",
    "analysis.helpChart.title": "Registros de ajuda por sessão",
    "analysis.helpChart.explanation": "A redução de Ajuda Intrusiva e o aumento de registros Autônomos indicam evolução na autonomia do aluno.",
    "analysis.helpChart.session": "Sessão",
    "analysis.motorDev": "Desenvolvimento motor",
    "analysis.selectPeriodProgress": "Selecione o período para visualizar o progresso",
    "analysis.emptyProtocol.title": "Ainda não há registro deste protocolo para este aluno.",
    "analysis.emptyProtocol.desc": "Quando houver um registro, os dados ficarão disponíveis para visualização nesta tela.",
    "analysis.info.name": "Nome",
    "analysis.info.age": "Idade",
    "analysis.info.supportLevel": "Nível de suporte do TEA",
    "analysis.info.title": "Informações da criança",
    "analysis.info.generalObservations": "Observações gerais",
    "common.yearsOld": "anos",
    "analysis.appliedProtocols": "Protocolos/Testes aplicados",
    "analysis.helpModal.openButton": "Ver registros de ajuda por sessão",
    "analysis.helpModal.title": "Registros por sessão",
    "analysis.helpModal.subtitle": "Toque em uma sessão para ver seus exercícios e registros de ajuda.",
    "analysis.helpModal.empty": "Nenhuma sessão com registros de ajuda no período.",
    "analysis.helpModal.noRecords": "Sem registros de ajuda nesta sessão.",
    "analysis.help.comparisonTitle": "Comparação dos registros de ajuda",
    "analysis.help.type": "Tipo",
    "analysis.help.footnote": "Os valores exibem a diferença absoluta e percentual dos registros de ajuda entre os dois períodos selecionados.",
    "common.student": "Aluno",
    "common.dateNotSet": "Data não definida",
    "common.retry": "Tente novamente",
    "common.exit": "Sair",
    "common.export": "Exportar",
    "common.download": "Baixar",
    "common.exportedSuccess": "Exportado com sucesso",
    "common.exportError": "Erro ao exportar",
    "mabcForm.recordNotProvided": "Registro não informado.",
    "mabcForm.loadError": "Não foi possível carregar os dados de desenvolvimento motor.",
    "mabcForm.fillRequiredSave": "Preencha os campos obrigatórios para salvar a avaliação",
    "mabcForm.fillRequiredCreate": "Preencha os campos obrigatórios para registrar a avaliação",
    "mabcForm.editedSuccess": "Registro editado com sucesso",
    "mabcForm.savedSuccess": "Registro salvo com sucesso",
    "mabcForm.editError": "Não foi possível editar o registro.",
    "mabcForm.saveError": "Não foi possível salvar o registro.",
    "mabcForm.deleteError": "Não foi possível excluir o registro.",
    "mabcForm.exitTitle": "Você tem certeza que deseja sair?",
    "mabcForm.exitMessage": "Os dados preenchidos serão perdidos.",
    "mabcForm.selectFormat": "Selecionar formato",
    "mabcForm.csvTabular": "CSV (dados tabulares)",
    "export.selectAtLeastOne": "Selecione ao menos um formato para exportar.",
    "export.issuedOn": "Emitido em",
    "export.issue": "Emissão",
    "export.totalScore": "Escore Total",
    "export.totalPercentile": "Percentil Total",
    "export.category": "Categoria",
    "export.attempts": "Tentativas",
    "export.unit": "Unidade",
    "export.categoryScore": "Escore Categoria",
    "export.categoryPercentile": "Percentil Categoria",
    "export.scoreLabel": "Escore",
    "export.exportMabcTitle": "Exportar MABC-2",
    "concurrentSession.title": "Sessão em andamento",
    "concurrentSession.message": "Já existe uma sessão em andamento com este aluno. O que deseja fazer?",
    "concurrentSession.continueLabel": "Continuar sessão em andamento",
    "concurrentSession.finishLabel": "Finalizar sessão e iniciar nova",
    "common.finish": "Finalizar",
    "common.yes": "Sim",
    "common.no": "Não",
    "forms.observationsOptional": "Observações (opcional)",
    "forms.addObservation": "Adicione uma observação",
    "common.done": "Concluir",
    "activityResult.title": "Resultado da atividade",
    "activityResult.deferAnswer": "Adiar resposta",
    "activityResult.time": "Tempo",
    "activityResult.developmentLevel": "Nível de desenvolvimento",
    "activityResult.levelRequired": "É obrigatório selecionar um nível de desenvolvimento.",
    "activityResult.helpRecord": "Registro de ajuda",
    "activityResult.helpRequired": "É obrigatório selecionar um registro de ajuda.",
    "activityResult.subRequired": "Selecione pelo menos um complemento: Verbal ou Modelo.",
    "activityResult.notCompleted": "Não realizada",
    "activityResult.reason": "Motivo:",
    "activityResult.motiveRequired": "Selecione o motivo da não realização.",
    "activityResult.motiveDescription": "Descrição do motivo:",
    "activityResult.describeMotive": "Descreva o motivo...",
    "activityResult.motiveDescRequired": "Descreva o motivo da não realização.",
    "activityResult.motive.refusal": "Recusa do aluno",
    "activityResult.motive.disruptive": "Comportamento disruptivo",
    "activityResult.motive.fatigue": "Fadiga ou cansaço",
    "activityResult.motive.insufficientTime": "Tempo insuficiente",
    "activityResult.motive.physicalDifficulty": "Dificuldade física",
    "activityResult.motive.other": "Outro",
    "chip.verbal": "Verbal",
    "chip.model": "Modelo",
    "common.continue": "Continuar",
    "sessionCompletion.title": "Sessão Concluída!",
    "sessionCompletion.completed": "Realizadas",
    "sessionCompletion.backToStart": "Voltar ao início",
    "continuation.tryUnrealizedTitle": "Tentar exercício não realizado",
    "continuation.unrealizedOne": "1 exercício não realizado",
    "continuation.unrealizedMany": "{n} exercícios não realizados",
    "continuation.repeatTitle": "Repetir exercício",
    "continuation.repeatDesc": "Escolher exercício do circuito para repetir",
    "continuation.otherTitle": "Realizar outro exercício",
    "continuation.otherDesc": "Escolher qualquer exercício da equipe",
    "warningBanner.title": "Há atividades pendentes no histórico",
    "warningBanner.subtitle": "Responda o formulário incompleto no histórico",
    "common.notSelected": "Não selecionado",
    "activityResult.notApplicable": "Não se aplica",
    "activityRecord.status": "Status",
    "activityRecord.notPerformed": "Não realizado",
    "activityRecord.performed": "Realizado",
    "activityRecord.duration": "Duração",
    "activityRecord.helpLevel": "Nível de ajuda",
    "activityRecord.exerciseStatus": "Status do exercício",
    "activityRecord.durationSeconds": "Duração (segundos)",
    "activityRecord.durationExample": "Ex: 90",
    "activityRecord.helpOffered": "Nível de ajuda oferecida",
    "activityRecord.pendingInfo": "Existem informações não selecionadas neste registro.",
    "activityRecord.describeReason": "Descreva o motivo",
    "activityRecord.reasonLabel": "Motivo",
    "confirm.finishSession.title": "Finalizar sessão?",
    "confirm.logout.title": "Sair da conta?",
    "confirm.delete.title": "Excluir",
    "confirm.finishEngagement.message": "O progresso atual desta atividade de engajamento será salvo de acordo com o tipo de circuito escolhido.",
    "confirm.finishSession.message": "O progresso atual desta sessão será salvo de acordo com o tipo de circuito escolhido.",
    "confirm.logout.message": "Você será redirecionado para a tela de login.",
    "confirm.delete.message": "Tem certeza que deseja excluir? Esta ação não poderá ser desfeita.",
    "common.updateList": "Atualizar Lista",
    "common.tryAgain": "Tentar Novamente",
    "common.error": "Erro",
    "common.changePeriod": "Alterar Período",
    "common.compare": "Comparar",
    "analysis.compareScreen.periodValue": "Período {n}",
    "analysis.compareScreen.selectRange": "selecionar intervalo de datas",
    "analysis.compareScreen.periodRequired": "O Período é obrigatório. Selecione o início e o fim no calendário.",
    "analysis.compareScreen.futureDate": "Data inválida. Não é possível selecionar períodos futuros.",
    "analysis.compareScreen.p1AfterP2": "O Período 1 não pode iniciar depois do Período 2.",
    "analysis.compareScreen.overlapP2": "As datas não podem coincidir com o Período 2.",
    "analysis.compareScreen.p2BeforeP1": "O Período 2 não pode iniciar antes do Período 1.",
    "analysis.compareScreen.overlapP1": "As datas não podem coincidir com o Período 1.",
    "analysis.compareScreen.bothRequired": "Ambos os períodos são obrigatórios para a comparação.",
    "analysis.behaviorsScreen.title": "Comportamentos Observados",
    "analysis.behaviorsScreen.selectPeriod": "Selecione o período para visualizar os comportamentos",
    "analysis.behaviorsScreen.periodRequired": "O período é obrigatório.",
    "analysis.behaviorsScreen.detailsTitle": "Detalhamento dos comportamentos",
    "analysis.behaviorsScreen.errorTitle": "Não foi possível carregar os comportamentos observados. Tente novamente.",
    "analysis.behaviorsScreen.errorMessage": "Verifique sua conexão ou tente acessar os dados novamente mais tarde.",
    "analysis.behaviorsScreen.emptyTitle": "Ainda não há comportamentos observados para o período selecionado.",
    "analysis.behaviorsScreen.emptyMessage": "Ainda não há comportamentos observados registrados para o período selecionado.",
    "analysis.behaviorsScreen.sessionOf": "Sessão de",
    "common.until": "até",
    "analysis.period.selectedDate": "Data selecionada",
    "analysis.period.range": "Período",
    "analysis.progressChart.singleRecordWarning": "Há apenas um registro disponível para este exercício. Ainda não é possível identificar evolução.",
    "analysis.helpScreen.title": "Registros de ajuda",
    "analysis.helpScreen.selectPeriod": "Selecione o período para visualizar os registros de ajuda",
    "analysis.helpScreen.emptyText": "Ainda não há registros suficientes para visualizar a evolução dos registros de ajuda.",
    "analysis.helpScreen.errorTitle": "Não foi possível carregar a evolução dos registros de ajuda. Tente novamente.",
    "analysis.helpScreen.errorDesc": "Verifique sua conexão ou tente acessar os dados novamente mais tarde.",
    "analysis.list.sessionsRecordedOne": "{n} sessão registrada",
    "analysis.list.sessionsRecordedMany": "{n} sessões registradas",
    "analysis.card.progress.title": "Progresso por exercício",
    "analysis.card.progress.desc": "Acompanhe a evolução de cada exercício nas sessões.",
    "analysis.card.help.title": "Registros de ajuda por sessão",
    "analysis.card.help.desc": "Acompanhe a evolução da autonomia nas sessões.",
    "analysis.card.behaviors.title": "Comportamentos observados",
    "analysis.card.behaviors.desc": "Visualize a frequência dos comportamentos observados",
    "analysis.card.compare.title": "Comparar desempenho",
    "analysis.card.compare.desc": "Compare dois períodos e acompanhe diferenças no desempenho do aluno.",
    "analysis.card.mabc.title": "Registros de desenvolvimento motor",
    "analysis.card.mabc.desc": "Visualize e registre avaliações motoras do aluno.",
    "analysis.noRecords.header": "Sem registros",
    "analysis.noRecords.sessions.title": "Ainda não há registros de sessão",
    "analysis.noRecords.sessions.message": "Quando houver uma sessão salva para este aluno, ela aparecerá aqui para acompanhamento.",
    "analysis.noRecords.protocol.title": "Ainda não há registro deste protocolo",
    "analysis.noRecords.protocol.message": "Os dados deste protocolo aparecerão aqui assim que houver um registro válido.",
    "analysis.noRecords.help.title": "Não há evolução de ajuda para exibir",
    "analysis.noRecords.help.message": "Os registros de ajuda por sessão ficarão disponíveis quando houver dados suficientes.",
    "analysis.noRecords.behavior.title": "Nenhum comportamento observado registrado",
    "analysis.noRecords.behavior.message": "Os comportamentos observados aparecerão aqui quando houver registros no período selecionado.",
    "analysis.noRecords.loadRecords.title": "Não foi possível carregar os registros",
    "analysis.noRecords.loadRecords.message": "Tente novamente em alguns instantes ou verifique sua conexão para acessar os dados do aluno.",
    "analysis.noRecords.loadEvolution.title": "Não foi possível carregar a evolução",
    "analysis.noRecords.loadEvolution.message": "Os dados de evolução de ajuda não puderam ser carregados no momento.",
    "analysis.noRecords.loadBehavior.title": "Não foi possível carregar os comportamentos",
    "analysis.noRecords.loadBehavior.message": "Não conseguimos acessar os comportamentos observados para este período agora.",
    "analysis.mabcForm.deleteTitle": "Excluir registro?",
    "analysis.mabcForm.deleteMessage": "Tem certeza que deseja excluir este registro de desenvolvimento motor?\nEsta ação não poderá ser desfeita.",
    "analysis.protocolViz.formSaved": "Formulário salvo",
    "analysis.protocolViz.formSavedDesc": "As respostas foram salvas com sucesso!",
    "analysis.protocolViz.saveError": "Erro ao salvar",
    "analysis.protocolViz.formLabel": "Formulário {x}",
    "analysis.protocolViz.testSummary": "Resumo do teste",
    "analysis.protocolViz.noData": "Nenhum dado disponível para este registro.",
    "analysis.mabcList.subtitle": "Registros de avaliação motora",
    "analysis.mabcList.empty": "Nenhum registro MABC-2 encontrado.",
    "analysis.protocolList.recordOne": "{n} registro",
    "analysis.protocolList.recordMany": "{n} registros",
    "analysis.protocolList.viewRecords": "Visualização de registros",
    "analysis.protocolList.loadError": "Não foi possível carregar os protocolos/testes aplicados. Tente novamente.",
    "analysis.protocolList.noRecordsFound": "Nenhum registro encontrado.",
    "analysis.protocolCard.record": "Registro",
    "analysis.protocolCard.ageGroup": "Grupo de idade",
    "analysis.protocolCard.evaluatedBy": "Avaliado por",
    "analysis.progressChart.selectedExercise": "Exercício selecionado",
    "analysis.comparisonCard.loadError": "Não foi possível carregar esta comparação. Tente novamente.",
    "analysis.comparisonCard.insufficientData": "Dados insuficientes para comparação.",
    "analysis.behaviors.comparisonTitle": "Comparação dos comportamentos observados",
    "analysis.behaviors.footnote": "Os valores exibem a diferença absoluta e percentual dos comportamentos observados entre os dois períodos selecionados.",
    "analysis.behaviorChart.title": "Frequência de comportamentos observados",
    "analysis.behaviorChart.note": "A frequência dos comportamentos observados ajuda a identificar padrões durante as sessões e apoiar decisões de acompanhamento.",
    "analysis.behaviorChart.stereotypy.label": "Estereotipias",
    "analysis.behaviorChart.stereotypy.legend": "Estereotipias",
    "analysis.behaviorChart.eyePeople.label": "Contato\nvisual\n(Pessoas)",
    "analysis.behaviorChart.eyePeople.legend": "Contato visual (Pessoas)",
    "analysis.behaviorChart.eyeObjects.label": "Contato\nvisual\n(Objetos)",
    "analysis.behaviorChart.eyeObjects.legend": "Contato visual (Objetos)",
    "analysis.behaviorChart.engagement.label": "Engajamento",
    "analysis.behaviorChart.engagement.legend": "Engajamento",
    "analysis.behaviorChart.escape.label": "Fuga",
    "analysis.behaviorChart.escape.legend": "Fuga",
    "analysis.behaviorChart.crisis.label": "Crises",
    "analysis.behaviorChart.crisis.legend": "Crises",
    "analysis.behaviorChart.unfit.label": "Comporta-\nmentos\ninaptos",
    "analysis.behaviorChart.unfit.legend": "Comportamentos inaptos",
    "analysis.behaviorChart.preferred.label": "Atividades\npreferenciais",
    "analysis.behaviorChart.preferred.legend": "Atividades preferenciais",
    "analysis.status.notFilled": "Não preenchido",
    "analysis.status.registered": "Registrado",
    "analysis.status.notRegistered": "Não registrado",
    "analysis.evolution.improved": "Melhorou",
    "analysis.evolution.stable": "Estável",
    "analysis.evolution.needsReinforcement": "Precisa reforço",
    "analysis.progress.lastPerformance": "Último desempenho",
    "analysis.progress.evolution": "Evolução",
    "analysis.progress.awaiting": "Aguardando novos registros",
    "analysis.progress.notYetRecorded": "Ainda não registrado",
    "analysis.progress.sessionsOne": "{n} sessão realizada",
    "analysis.progress.sessionsMany": "{n} sessões realizadas",
    "analysis.compare.title": "Comparação por exercício",
    "analysis.compare.exercise": "Exercício",
    "analysis.compare.empty": "Não há exercícios com níveis registrados para comparar nos períodos selecionados.",
    "analysis.compare.footnote": "A variação indica a diferença de níveis no desempenho médio por exercício entre os dois períodos selecionados.",
    "analysis.summaryCard.loadError": "Não foi possível carregar o resumo da comparação. Tente novamente.",
    "analysis.summaryCard.insufficientData": "Não há dados suficientes para comparar os períodos selecionados.",
    "analysis.mabc.categories": "Categorias",
    "analysis.mabcSection.manualDexterity": "Destreza manual",
    "analysis.mabcSection.aimingCatching": "Pontaria e agarrar",
    "analysis.mabcSection.balance": "Equilíbrio",
    "analysis.mabc.score": "Pontuação",
    "analysis.mabc.percentile": "Percentil",
    "analysis.mabc.totalScore": "Pontuação total",
    "analysis.mabc.totalPercentile": "Percentil total",
    "analysis.mabc.recordsFound": "Registros, {n} encontrados",
    "reports.title": "Relatórios",
    "reports.subtitle": "Selecione um aluno para ver os relatórios registrados",
    "reports.subtitleCross": "Selecione os alunos para cruzar os dados",
    "reports.crossToggle": "Cruzar dados de alunos (relatório consolidado)",
    "reports.empty": "Nenhum aluno encontrado.",
    "reports.recordsSuffix": "relatórios",
    "analysis.title": "Análises",
    "analysis.subtitle": "Selecione um aluno para ver o desempenho",
    "history.title": "Histórico de registros",
    "history.subtitle": "Selecione um aluno para acessar registros passados",
    "history.empty": "Nenhum histórico encontrado.",
    "history.recordsSuffix": "registros",
    "history.detailTitle": "Histórico - {name}",
    "forms.conflict.title": "Formulário {form} pendente",
    "forms.conflict.message": "Já existe um formulário {form} pendente para este aluno. O que deseja fazer?",
    "forms.conflict.continue": "Continuar formulário anterior",
    "forms.conflict.finishNew": "Apagar anterior e iniciar um novo",
    "sessions.circuitSelection.title": "Sessão de {name}",
    "sessions.circuitSelection.subtitle": "Selecione o circuito",
    "sessions.circuitSelection.empty": "Nenhum circuito encontrado.",
    "sessions.badge.structured": "Estruturado",
    "sessions.badge.semi": "Semi-estruturado",
    "sessions.concurrent.title": "Sessão em andamento",
    "sessions.concurrent.message": "Já existe uma sessão em andamento com este aluno. O que deseja fazer?",
    "sessions.concurrent.continue": "Continuar sessão em andamento",
    "sessions.concurrent.finishNew": "Finalizar sessão e iniciar nova",
    "students.deleteMessage":
      "Tem certeza que deseja excluir? Esta ação não poderá ser desfeita.",
    "nav.activities": "Atividades",
    "nav.home": "Início",
    "nav.analysis": "Análises",
    "students.title": "Início",
    "students.subtitle": "Selecione um aluno para iniciar uma sessão",
    "students.empty": "Nenhum aluno encontrado.",
    "students.years": "anos",
    "students.support.n1": "TEA nível 1",
    "students.support.n2": "TEA nível 2",
    "students.support.n3": "TEA nível 3",
    "students.deleteTitle": "Excluir aluno?",
    "students.form.createTitle": "Novo aluno",
    "students.form.editTitle": "Editar aluno",
    "students.form.fullName": "Nome completo",
    "students.form.fullNamePlaceholder": "Nome do aluno",
    "students.form.birthDate": "Data de nascimento",
    "students.form.birthDatePlaceholder": "DD/MM/AAAA",
    "students.form.calendar": "Calendário",
    "students.form.weight": "Massa",
    "students.form.weightPlaceholder": "Ex: 30.5",
    "students.form.height": "Estatura",
    "students.form.heightPlaceholder": "Ex: 120",
    "students.form.waist": "Cintura",
    "students.form.waistPlaceholder": "Ex: 50",
    "students.form.supportLevel": "Nível de suporte",
    "students.form.selectHere": "Selecione aqui",
    "students.form.supportOption1": "Transtorno do Espectro Autista Nível 1",
    "students.form.supportOption2": "Transtorno do Espectro Autista Nível 2",
    "students.form.supportOption3": "Transtorno do Espectro Autista Nível 3",
    "students.form.healthConditions": "Outras condições de saúde",
    "students.form.healthConditionsPlaceholder": "Outras condições de saúde (opcional)",
    "students.form.observations": "Observações",
    "students.form.observationsPlaceholder": "Observações adicionais (opcionais)",
    "students.form.removePhotoTitle": "Remover foto?",
    "students.form.replace": "Substituir",
    "students.form.err.nameRequired": "Nome é obrigatório",
    "students.form.err.nameMin": "No mínimo 3 caracteres",
    "students.form.err.nameMax": "O nome deve ter no máximo 100 caracteres",
    "students.form.err.nameFull": "Informe nome e sobrenome",
    "students.form.err.dateRequired": "Data é obrigatória",
    "students.form.err.dateInvalid": "Data inválida",
    "students.form.err.dateUnreal": "Data irreal ou no futuro",
    "students.form.err.observationsMax": "O campo deve ter no máximo 250 caracteres",
    "students.form.err.invalidValue": "Valor inválido",
    "students.form.err.supportRequired": "Nível de suporte é obrigatório",
    "students.error.createTitle": "Erro ao Criar",
    "students.error.createBody": "Não foi possível salvar o aluno.",
    "students.error.editTitle": "Erro ao Editar",
    "students.error.editBody": "Não foi possível atualizar o aluno.",
    "students.error.deleteTitle": "Erro ao Remover",
    "tutorial.inTutorial": "Em tutorial",
    "tutorial.practiceNotice":
      "Esta é uma tela de prática do tutorial: uma réplica local da funcionalidade " +
      "real. Tudo o que você fizer aqui é descartado ao sair e não afeta seus dados. " +
      "Se estiver com dúvidas sobre o que fazer, toque em \"Pedir ajuda\" para ver a " +
      "dica do passo atual.",
    "tutorial.exitPractice": "Sair da simulação",
    "tutorial.askHelp": "Pedir ajuda",
    "tutorial.helpTitle": "Dica do passo",
    "tutorial.helpDone": "Você concluiu todos os passos desta simulação.",
    "tutorial.hint.alunos.new": "Toque no botão \"+ Novo\" para começar o cadastro de um aluno.",
    "tutorial.hint.alunos.name": "Preencha o nome completo do aluno (nome e sobrenome).",
    "tutorial.hint.alunos.birthdate": "Informe a data de nascimento no formato DD/MM/AAAA.",
    "tutorial.hint.alunos.support": "Selecione o nível de suporte do aluno.",
    "tutorial.hint.alunos.save": "Toque em \"Salvar\" para cadastrar o aluno.",
    "tutorial.hint.alunos.editMenu": "Abra o menu do aluno recém-criado tocando no ícone de três pontos.",
    "tutorial.hint.alunos.editSelect": "No menu, toque em \"Editar\".",
    "tutorial.hint.alunos.editSupport": "Altere o nível de suporte do aluno.",
    "tutorial.hint.alunos.editSave": "Toque em \"Salvar\" para confirmar a alteração.",
    "tutorial.hint.alunos.deleteMenu": "Abra novamente o menu do aluno criado tocando nos três pontos.",
    "tutorial.hint.alunos.deleteSelect": "No menu, toque em \"Excluir\".",
    "tutorial.hint.alunos.deleteConfirm": "Confirme a exclusão tocando em \"Excluir\".",
    "tutorial.startSimulation": "Iniciar simulação",
    "tutorial.simDoneTitle": "Simulação concluída!",
    "tutorial.listTitle": "Tutorial",
    "tutorial.listSubtitle": "Aprenda a usar a plataforma · {done}/{total} concluídos",
    "tutorial.stepOf": "Passo {n} de {total}",
    "tutorial.previous": "Anterior",
    "tutorial.next": "Próximo",
    "tutorial.moduleNotFound": "Módulo não encontrado.",
    "tutorial.finishTutorial": "Concluir tutorial",
    "tutorial.finishModule": "Concluir módulo",
    "tutorial.practiceNotFound": "Prática de tutorial não encontrada.",
    "tutorial.practiceArea": "Área de prática",
    "tutorial.practiceEnvBanner": "Ambiente de prática — nada aqui afeta seus dados reais.",
    "tutorial.practiceEnvTitle": "Ambiente de prática",
    "tutorial.practiceNoticeLong":
      "Você está em uma tela de prática do tutorial. Ela é uma réplica local da " +
      "funcionalidade real, criada exclusivamente para que você experimente e " +
      "aprenda a utilizá-la. Todas as ações realizadas aqui — preenchimentos, " +
      "seleções e confirmações — acontecem apenas nesta tela e são descartadas ao " +
      "sair. Nada é enviado ao servidor nem afeta os dados reais do aplicativo, " +
      "seus alunos, sessões ou relatórios. Sinta-se à vontade para explorar sem " +
      "qualquer risco.",
    "tutorial.stopwatchPractice": "Cronômetro (prática)",
    "tutorial.selectTag": "Selecione uma tag",
    "tutorial.practiceDone": "Prática concluída! Você pode voltar ao tutorial.",
    "tutorial.finishPractice": "Concluir prática",
    "tutorial.backToTutorial": "Voltar ao tutorial",
    "tutorial.congratsTitle": "Parabéns! Tutorial concluído",
    "tutorial.congratsBody": "Você concluiu todos os módulos e está pronto para usar a plataforma. O botão de tutorial será ocultado do cabeçalho — você pode acessá-lo novamente a qualquer momento pela página de Configurações.",
    "tutorial.startUsing": "Começar a usar",
    "tutorial.mod.alunos.title": "Alunos",
    "tutorial.mod.alunos.desc": "Cadastro e gestão das crianças acompanhadas.",
    "tutorial.mod.alunos.s0.title": "O que são os alunos",
    "tutorial.mod.alunos.s0.body": "Cada aluno representa uma criança acompanhada pela sua equipe. É a partir dele que sessões, formulários, análises e relatórios são organizados.",
    "tutorial.mod.alunos.s1.title": "Pratique o cadastro",
    "tutorial.mod.alunos.s1.body": "Vamos praticar numa réplica da tela de alunos. Siga o destaque piscante para cadastrar um aluno, editar o nível de suporte e, por fim, removê-lo. Ao concluir todos os passos, você avança automaticamente.",
    "tutorial.mod.alunos.s2.body": "Muito bem! Você cadastrou um aluno, editou o nível de suporte e o removeu — exatamente o fluxo de gestão de alunos. A remoção é suave: o histórico é preservado, mas o aluno deixa de aparecer nas listas ativas. Você já está pronto para gerenciar os alunos da sua equipe.",
    "tutorial.mod.exercicios.title": "Exercícios",
    "tutorial.mod.exercicios.desc": "Biblioteca de exercícios reutilizáveis.",
    "tutorial.mod.exercicios.s0.title": "Biblioteca de exercícios",
    "tutorial.mod.exercicios.s0.body": "Exercícios são blocos reutilizáveis que compõem os circuitos. Cada um tem título, descrição, tags e uma imagem demonstrativa opcional.",
    "tutorial.mod.exercicios.s1.title": "Pratique os exercícios",
    "tutorial.mod.exercicios.s1.body": "Vamos praticar numa réplica da tela de exercícios. Siga o destaque piscante para criar um exercício, duplicá-lo e, por fim, removê-lo. Ao concluir todos os passos, você avança automaticamente.",
    "tutorial.mod.exercicios.s2.body": "Muito bem! Você criou um exercício, duplicou e removeu. Ao excluir um exercício usado em circuitos, o app informa em quantos circuitos ativos ele está antes de confirmar. Você já sabe gerenciar a biblioteca de exercícios.",
    "tutorial.mod.circuitos.title": "Circuitos",
    "tutorial.mod.circuitos.desc": "Sequências de exercícios para as sessões.",
    "tutorial.mod.circuitos.s0.title": "O que é um circuito",
    "tutorial.mod.circuitos.s0.body": "Um circuito reúne exercícios numa ordem definida. Ele pode ser estruturado (todos os exercícios) ou semi-estruturado (para engajamento e atividades parciais).",
    "tutorial.mod.circuitos.s1.title": "Pratique os circuitos",
    "tutorial.mod.circuitos.s1.body": "Vamos praticar numa réplica da tela de circuitos. Siga o destaque piscante para montar um circuito semi-estruturado, editá-lo para estruturado, reordenar seus exercícios e, por fim, removê-lo. Ao concluir todos os passos, você avança automaticamente.",
    "tutorial.mod.circuitos.s2.body": "Muito bem! Você montou um circuito, mudou o tipo, reordenou os exercícios e o removeu. A ordem definida em circuitos estruturados é a sequência que a sessão seguirá. Você já sabe montar e gerenciar circuitos.",
    "tutorial.mod.sessoes.title": "Sessões",
    "tutorial.mod.sessoes.desc": "Execução de circuitos com um aluno.",
    "tutorial.mod.sessoes.s0.title": "Como funciona uma sessão",
    "tutorial.mod.sessoes.s0.body": "Escolha o aluno e o circuito. A sessão guia você exercício a exercício, com um cronômetro por atividade, registros de crise/fuga, resultado por atividade e o Registro de Controle da sessão (que pode ser preenchido depois no Histórico).",
    "tutorial.mod.sessoes.s1.title": "Pratique uma sessão",
    "tutorial.mod.sessoes.s1.body": "Vamos praticar numa réplica real da execução de sessão. Siga o destaque piscante: escolha o circuito estruturado e inicie o exercício. Depois pratique livremente o cronômetro, crise/fuga, os resultados e o Registro de Controle. Em seguida, saia sem finalizar e veja o aviso de sessão em andamento ao reabrir. Ao concluir, você avança automaticamente.",
    "tutorial.mod.sessoes.s2.body": "Muito bem! Você iniciou uma sessão estruturada, praticou a execução (cronômetro, crise/fuga, resultados e Registro de Controle), viu o aviso de sessão em andamento, retomou e finalizou. Lembre-se: o Registro de Controle pode ficar vazio e ser completado depois no Histórico. Você já sabe conduzir sessões.",
    "tutorial.mod.formularios.title": "Formulários",
    "tutorial.mod.formularios.desc": "Registros de controle e protocolos.",
    "tutorial.mod.formularios.s0.title": "Tipos de formulário",
    "tutorial.mod.formularios.s0.body": "O app inclui o Registro de Controle da sessão e protocolos como ATA, CARS e MABC-2, cada um com suas perguntas e escalas. O MABC-2 é dividido por faixa etária (3-6, 7-10 e 11-16 anos).",
    "tutorial.mod.formularios.s1.title": "Pratique os formulários",
    "tutorial.mod.formularios.s1.body": "Vamos praticar numa réplica real. Siga o destaque piscante: inicie o formulário ATA, saia deixando-o pendente e veja o aviso ao tentar iniciá-lo de novo, retome e preencha para salvar. Um formulário pode ser salvo completo ou ficar pendente. Ao concluir, você avança automaticamente.",
    "tutorial.mod.formularios.s2.body": "Muito bem! Você iniciou um formulário, viu o aviso de formulário pendente do mesmo tipo, retomou e salvou. CARS e MABC-2 seguem o mesmo fluxo, e formulários podem ser salvos completos ou ficar pendentes para completar depois no Histórico. Você já sabe usar os formulários.",
    "tutorial.mod.historico.title": "Histórico",
    "tutorial.mod.historico.desc": "Linha do tempo de sessões e registros.",
    "tutorial.mod.historico.s0.title": "Consultar o histórico",
    "tutorial.mod.historico.s0.body": "O histórico reúne, por aluno, as sessões realizadas e seus registros (resultados de atividades, Registro de Controle e formulários ATA/CARS/MABC-2). Registros pendentes ficam destacados para você completá-los depois.",
    "tutorial.mod.historico.s1.title": "Pratique o histórico",
    "tutorial.mod.historico.s1.body": "Vamos praticar numa réplica real. Siga o destaque piscante: abra o aluno, toque no Registro de Controle pendente e edite-o, salvando ao final. Da mesma forma você edita resultados de atividades e os outros formulários. Ao concluir, você avança automaticamente.",
    "tutorial.mod.historico.s2.body": "Muito bem! Você abriu o histórico de um aluno, editou um registro pendente e salvou. Resultados de atividades, o Registro de Controle e os formulários ATA/CARS/MABC-2 são todos editáveis pelo histórico. Você já sabe consultar e completar registros.",
    "tutorial.mod.analises.title": "Análises",
    "tutorial.mod.analises.desc": "Evolução do aluno em gráficos.",
    "tutorial.mod.analises.s0.title": "Painel de análises",
    "tutorial.mod.analises.s0.body": "As análises transformam os registros em gráficos de evolução do aluno: progresso por exercício, registros de ajuda por sessão, comportamentos observados, comparação entre períodos, protocolos aplicados (ATA/CARS) e avaliações motoras (MABC-2).",
    "tutorial.mod.analises.s1.title": "Pratique as análises",
    "tutorial.mod.analises.s1.body": "Vamos praticar numa réplica real com dados fictícios. Siga o destaque piscante para abrir o aluno e, em sequência, cada um dos gráficos. No progresso por exercício, note que ao filtrar por um período sem registros o gráfico aparece vazio — volte a um período com dados. Ao ver todos os gráficos, você avança automaticamente.",
    "tutorial.mod.analises.s2.body": "Muito bem! Você viu os seis painéis de análise — progresso por exercício, registros de ajuda, comportamentos, comparação de períodos, protocolos ATA/CARS e MABC-2 —, sempre com dados, e também como um período sem registros aparece vazio. Você já sabe acompanhar a evolução dos alunos.",
    "tutorial.mod.relatorios.title": "Relatórios",
    "tutorial.mod.relatorios.desc": "Documentos de evolução exportáveis.",
    "tutorial.mod.relatorios.s0.title": "O que são os relatórios",
    "tutorial.mod.relatorios.s0.body": "Um relatório consolida, para um aluno e um período, o progresso, os registros de ajuda, os comportamentos, a comparação e os protocolos daquele intervalo. Você pode abrir, renomear, excluir, exportar (PDF com gráficos ou CSV) e baixar relatórios, além de cruzar vários alunos num relatório consolidado.",
    "tutorial.mod.relatorios.s1.title": "Pratique os relatórios",
    "tutorial.mod.relatorios.s1.body": "Vamos praticar numa réplica real. Siga o destaque piscante: abra o aluno, crie um relatório escolhendo o período, abra-o, exporte-o (um ou vários, com opção de baixar) e, por fim, gere um relatório consolidado cruzando dados de alunos. Ao concluir, você avança automaticamente.",
    "tutorial.mod.relatorios.s2.body": "Muito bem! Você criou, abriu e exportou relatórios e gerou um consolidado cruzando alunos. A foto do aluno é salva junto ao relatório e reaproveitada por períodos que se sobrepõem. Você já sabe gerar e exportar relatórios de evolução.",
  },
  en: {
    "common.save": "Save",
    "common.cancel": "Cancel",
    "common.back": "Back",
    "common.confirm": "Confirm",
    "common.remove": "Remove",
    "common.loading": "Loading...",
    "settings.title": "Settings",
    "settings.subtitle": "Manage your preferences and account",
    "settings.appearance": "Appearance",
    "settings.theme": "Theme",
    "settings.theme.system": "System",
    "settings.theme.light": "Light",
    "settings.theme.dark": "Dark",
    "settings.language": "Language",
    "settings.language.description": "Choose the app language",
    "settings.tutorial": "Tutorial",
    "settings.openTutorial": "Open tutorial",
    "settings.showTutorialButton": "Show tutorial in the header",
    "settings.showTutorialButtonHint": "Displays the help shortcut at the top of the main screens",
    "account.title": "My account",
    "account.subtitle": "Customize your data and profile photo",
    "account.photo": "Profile photo",
    "account.changePhoto": "Change photo",
    "account.removePhoto": "Remove photo",
    "account.personalData": "Personal data",
    "account.name": "Full name",
    "account.email": "Email",
    "account.phone": "Phone",
    "account.emailManagedByGoogle": "Your email is managed by your Google account.",
    "account.saveName": "Save name",
    "account.saveEmail": "Save email",
    "account.savePhone": "Save phone",
    "account.changePassword": "Change password",
    "account.currentPassword": "Current password",
    "account.newPassword": "New password",
    "account.confirmNewPassword": "Confirm new password",
    "account.google": "Google account",
    "account.googleLinked": "Your account is linked to Google.",
    "account.googleUnlinkedHint": "Link your Google account to sign in with one tap.",
    "account.linkGoogle": "Link Google account",
    "account.unlinkGoogle": "Unlink Google account",
    "account.googleOnly": "Cannot unlink: Google is the only sign-in for this account.",
    "account.logout": "Sign out",
    "auth.loginTitle": "Sign in to your account",
    "auth.email": "Email",
    "auth.emailPlaceholder": "Your email",
    "auth.invalidEmail": "Invalid email",
    "auth.password": "Password",
    "auth.enter": "Sign in",
    "auth.or": "or",
    "auth.google": "Sign in with Google",
    "auth.noAccount": "No account? ",
    "auth.signUp": "Sign up",
    "auth.pendingApproval": "Your registration is still awaiting approval.",
    "auth.forgotPassword": "Forgot password",
    "common.searchPlaceholder": "Search...",
    "common.saving": "Saving...",
    "common.gotIt": "Got it",
    "common.delete": "Delete",
    "common.edit": "Edit",
    "common.duplicate": "Duplicate",
    "common.copySuffix": " (Copy)",
    "common.deleteConfirmMessage":
      "Are you sure you want to delete? This action cannot be undone.",
    "pageHeader.new": "+ New",
    "exercises.error.createTitle": "Error creating",
    "exercises.error.createBody": "Could not save the exercise.",
    "exercises.error.editTitle": "Error editing",
    "exercises.error.editBody": "Could not update the exercise.",
    "exercises.error.deleteTitle": "Error removing",
    "exercises.error.duplicateTitle": "Error duplicating",
    "exercises.error.duplicateBody": "Could not duplicate the exercise.",
    "common.tags": "Tags",
    "section.exercises": "Exercises",
    "section.circuits": "Circuits",
    "section.analysis": "Analysis",
    "section.reports": "Reports",
    "tags.all": "All",
    "tags.coordenacao": "Coordination",
    "tags.forca": "Strength",
    "tags.equilibrio": "Balance",
    "subtags.locomotor": "Locomotor",
    "subtags.manipulativo": "Manipulative",
    "subtags.estabilizador": "Stabilizer",
    "exercises.title": "Exercises",
    "exercises.subtitle": "Manage the available exercises",
    "exercises.empty": "No exercises found.",
    "exercises.deleteTitle": "Delete exercise?",
    "exercises.deleteLinkedSingular":
      "This exercise is linked to {n} circuit. It will be removed from it and this action cannot be undone.",
    "exercises.deleteLinkedPlural":
      "This exercise is linked to {n} circuits. It will be removed from them and this action cannot be undone.",
    "exercises.form.createTitle": "New exercise",
    "exercises.form.editTitle": "Edit exercise",
    "exercises.form.name": "Exercise name",
    "exercises.form.namePlaceholder": "e.g. Spin the hoop",
    "exercises.form.description": "Description",
    "exercises.form.descriptionPlaceholder": "Exercise description (optional)",
    "exercises.form.duration": "Maximum duration (seconds)",
    "exercises.form.durationPlaceholder": "e.g. 120",
    "exercises.form.tags": "Tags",
    "exercises.form.removeIconTitle": "Remove icon?",
    "exercises.form.err.required": "This field is required",
    "exercises.form.err.nameMax": "Name must be at most 100 characters",
    "exercises.form.err.tagRequired": "A tag selection is required",
    "exercises.form.err.subtagRequired": "At least one subtag is required",
    "exercises.form.err.duration": "Duration must be less than 300 seconds",
    "tutorial.hint.exercicios.new": "Tap \"+ New\" to create an exercise.",
    "tutorial.hint.exercicios.title": "Fill in the exercise name.",
    "tutorial.hint.exercicios.tag": "Select a tag and at least one subtag.",
    "tutorial.hint.exercicios.save": "Tap \"Save\" to create the exercise.",
    "tutorial.hint.exercicios.duplicateMenu": "Open the created exercise's menu by tapping the three dots.",
    "tutorial.hint.exercicios.duplicateSelect": "In the menu, tap \"Duplicate\".",
    "tutorial.hint.exercicios.deleteMenu": "Open the created exercise's menu again.",
    "tutorial.hint.exercicios.deleteSelect": "In the menu, tap \"Delete\".",
    "tutorial.hint.exercicios.deleteConfirm": "Confirm deletion by tapping \"Delete\".",
    "circuits.title": "Circuits",
    "circuits.subtitle": "Build circuits with exercises",
    "circuits.empty": "No circuits found.",
    "circuits.deleteTitle": "Delete circuit?",
    "circuits.noExercises": "No linked exercises",
    "circuits.exercisesSuffix": "exercises",
    "circuits.badge.structured": "Structured",
    "circuits.badge.semi": "Semi-structured",
    "circuits.badge.mabc": "MABC-2",
    "circuits.form.createTitle": "New circuit",
    "circuits.form.editTitle": "Edit circuit",
    "circuits.form.name": "Circuit name",
    "circuits.form.namePlaceholder": "e.g. Circuit 1",
    "circuits.form.type": "Circuit type",
    "circuits.form.structured": "Structured",
    "circuits.form.structuredDesc": "Runs all the defined exercises",
    "circuits.form.semi": "Semi-structured",
    "circuits.form.semiDesc": "For engagement and partial activities",
    "circuits.form.selectByTag": "Select exercises by tag",
    "circuits.form.selectExercises": "Select the exercises",
    "circuits.form.order": "Circuit order",
    "circuits.form.orderHint": "Press and drag by the handle icon to reorder.",
    "circuits.form.createdSuccess": "Circuit created successfully",
    "circuits.form.editedSuccess": "Circuit edited successfully",
    "circuits.form.err.nameRequired": "This field is required",
    "circuits.form.err.exercisesRequired": "At least one exercise selection is required",
    "circuits.error.createTitle": "Error creating",
    "circuits.error.createBody": "Could not save the circuit.",
    "circuits.error.editTitle": "Error editing",
    "circuits.error.editBody": "Could not update the circuit.",
    "circuits.error.deleteTitle": "Error removing",
    "circuits.error.duplicateTitle": "Error duplicating",
    "circuits.error.duplicateBody": "Could not duplicate the circuit.",
    "tutorial.hint.circuitos.new": "Tap \"+ New\" to create a circuit.",
    "tutorial.hint.circuitos.name": "Fill in the circuit name.",
    "tutorial.hint.circuitos.mode": "Select the \"Semi-structured\" type.",
    "tutorial.hint.circuitos.selectExercises": "Select at least two exercises.",
    "tutorial.hint.circuitos.save": "Tap \"Save\" to create the circuit.",
    "tutorial.hint.circuitos.editMenu": "Open the created circuit's menu by tapping the three dots.",
    "tutorial.hint.circuitos.editSelect": "In the menu, tap \"Edit\".",
    "tutorial.hint.circuitos.changeStructured": "Change the type to \"Structured\".",
    "tutorial.hint.circuitos.reorder": "Drag by the handle icon to reorder the exercises.",
    "tutorial.hint.circuitos.editSave": "Tap \"Save\" to confirm the changes.",
    "tutorial.hint.circuitos.deleteMenu": "Open the created circuit's menu again.",
    "tutorial.hint.circuitos.deleteSelect": "In the menu, tap \"Delete\".",
    "tutorial.hint.circuitos.deleteConfirm": "Confirm deletion by tapping \"Delete\".",
    "tutorial.hint.sessoes.selectStructured": "Tap the structured circuit to start the session.",
    "tutorial.hint.sessoes.startExercise": "Tap \"Start activity\". Then practice freely: the stopwatch, recording crisis/flight, stopping and marking the result (completed — with intrusive or verbal help —, not completed, or deferred), and showing/hiding the Control Record (which can be left empty to fill later in History).",
    "tutorial.hint.sessoes.goBack": "Tap \"Back\" to leave without finishing — the session stays in progress.",
    "tutorial.hint.sessoes.reopenCircuit": "Tap a circuit again to see the in-progress session warning.",
    "tutorial.hint.sessoes.concurrentContinue": "Tap \"Continue session in progress\" to resume. This warning also appears when there is a pending Control Record or a pending form of the same type for the student.",
    "tutorial.hint.sessoes.finish": "Tap \"Finish\" and confirm to end the session.",
    "tutorial.hint.formularios.selectAta": "Tap the ATA form to start it.",
    "tutorial.hint.formularios.goBackAta": "Tap \"Back\" to leave without filling it — the ATA stays pending.",
    "tutorial.hint.formularios.reopenAta": "Tap the ATA again to see the pending same-type form warning.",
    "tutorial.hint.formularios.continueAta": "Tap \"Continue previous form\" to resume the pending ATA.",
    "tutorial.hint.formularios.fillAndSave": "Answer the required question and tap save (in the header). Optional fields can be left blank. CARS and MABC-2 work the same — MABC-2 is split by age band (3-6, 7-10 and 11-16 years).",
    "tutorial.hint.historico.selectStudent": "Tap the student to see their past records.",
    "tutorial.hint.historico.openRecord": "Tap the pending Control Record to edit it.",
    "tutorial.hint.historico.editSave": "Complete what was missing and save. You edit a session's activity results and the ATA, CARS and MABC-2 forms the same way.",
    "tutorial.hint.analises.selectStudent": "Tap the student to see their analyses.",
    "tutorial.hint.analises.openProgress": "Open \"Exercise progress\". View the chart with data; if you filter by a period with no records it shows empty — return to a period with data. Then go back.",
    "tutorial.hint.analises.openHelp": "Open \"Help records per session\" to see the autonomy trend. Then go back.",
    "tutorial.hint.analises.openBehaviors": "Open \"Observed behaviors\" to see the frequencies. Then go back.",
    "tutorial.hint.analises.openCompare": "Open \"Compare performance\" to see two periods side by side. Then go back.",
    "tutorial.hint.analises.openProtocols": "Open the applied protocols (ATA/CARS) to see the records. Then go back.",
    "tutorial.hint.analises.openMabc": "Open \"Motor development records\" (MABC-2) to see the assessments.",
    "tutorial.hint.relatorios.selectStudent": "Tap the student to see their reports.",
    "tutorial.hint.relatorios.newReport": "Tap \"+ New\" to create a report.",
    "tutorial.hint.relatorios.saveReport": "Choose the period and save to generate the report.",
    "tutorial.hint.relatorios.openReport": "Tap the created report to open it.",
    "tutorial.hint.relatorios.exportReport": "Tap the export icon, select one or more reports, confirm and export (or download to the device).",
    "tutorial.hint.relatorios.consolidated": "Go back and tap \"Cross-student data\" to build a consolidated report of several students.",
    "common.allM": "All",
    "common.register": "Register",
    "analysis.level.maduro": "Mature",
    "analysis.level.intermediario": "Intermediate",
    "analysis.level.inicial": "Initial",
    "analysis.variation": "Variation",
    "analysis.period1": "Period 1",
    "analysis.period2": "Period 2",
    "analysis.summary.exercisesEvaluated": "Exercises evaluated",
    "analysis.summary.helpRecords": "Help records",
    "analysis.summary.behaviors": "Observed behaviors",
    "analysis.summary.sessions": "Recorded sessions",
    "analysis.summary.title": "Comparison summary",
    "analysis.summary.note": "The values show the absolute and percentage difference between the two selected periods.",
    "analysis.protocol.viewRegistered": "View registered form",
    "analysis.behavior.behavior": "Behavior",
    "analysis.behavior.occurrences": "Occurrences",
    "analysis.behavior.sessions": "Sessions",
    "analysis.behavior.associatedExercises": "Associated exercises",
    "analysis.behavior.lastOccurrence": "Last occurrence",
    "analysis.help.intrusive": "Intrusive help",
    "analysis.help.autonomous": "Autonomous",
    "analysis.noRecord": "No record",
    "analysis.unknownExercise": "Unknown exercise",
    "analysis.helpChart.title": "Help records per session",
    "analysis.helpChart.explanation": "The reduction in Intrusive help and the increase in Autonomous records indicate progress in the student's autonomy.",
    "analysis.helpChart.session": "Session",
    "analysis.motorDev": "Motor development",
    "analysis.selectPeriodProgress": "Select the period to view the progress",
    "analysis.emptyProtocol.title": "There is no record of this protocol for this student yet.",
    "analysis.emptyProtocol.desc": "Once there is a record, the data will be available to view on this screen.",
    "analysis.info.name": "Name",
    "analysis.info.age": "Age",
    "analysis.info.supportLevel": "ASD support level",
    "analysis.info.title": "Child information",
    "analysis.info.generalObservations": "General notes",
    "common.yearsOld": "years old",
    "analysis.appliedProtocols": "Applied protocols/tests",
    "analysis.helpModal.openButton": "View help records by session",
    "analysis.helpModal.title": "Records by session",
    "analysis.helpModal.subtitle": "Tap a session to see its exercises and help records.",
    "analysis.helpModal.empty": "No sessions with help records in the period.",
    "analysis.helpModal.noRecords": "No help records in this session.",
    "analysis.help.comparisonTitle": "Help records comparison",
    "analysis.help.type": "Type",
    "analysis.help.footnote": "The values show the absolute and percentage difference of help records between the two selected periods.",
    "common.student": "Student",
    "common.dateNotSet": "Date not set",
    "common.retry": "Try again",
    "common.exit": "Exit",
    "common.export": "Export",
    "common.download": "Download",
    "common.exportedSuccess": "Exported successfully",
    "common.exportError": "Error exporting",
    "mabcForm.recordNotProvided": "Record not provided.",
    "mabcForm.loadError": "Could not load the motor development data.",
    "mabcForm.fillRequiredSave": "Fill in the required fields to save the assessment",
    "mabcForm.fillRequiredCreate": "Fill in the required fields to register the assessment",
    "mabcForm.editedSuccess": "Record edited successfully",
    "mabcForm.savedSuccess": "Record saved successfully",
    "mabcForm.editError": "Could not edit the record.",
    "mabcForm.saveError": "Could not save the record.",
    "mabcForm.deleteError": "Could not delete the record.",
    "mabcForm.exitTitle": "Are you sure you want to exit?",
    "mabcForm.exitMessage": "The entered data will be lost.",
    "mabcForm.selectFormat": "Select format",
    "mabcForm.csvTabular": "CSV (tabular data)",
    "export.selectAtLeastOne": "Select at least one format to export.",
    "export.issuedOn": "Issued on",
    "export.issue": "Issue",
    "export.totalScore": "Total score",
    "export.totalPercentile": "Total percentile",
    "export.category": "Category",
    "export.attempts": "Attempts",
    "export.unit": "Unit",
    "export.categoryScore": "Category score",
    "export.categoryPercentile": "Category percentile",
    "export.scoreLabel": "Score",
    "export.exportMabcTitle": "Export MABC-2",
    "concurrentSession.title": "Session in progress",
    "concurrentSession.message": "There is already a session in progress with this student. What would you like to do?",
    "concurrentSession.continueLabel": "Continue session in progress",
    "concurrentSession.finishLabel": "Finish session and start a new one",
    "common.finish": "Finish",
    "common.yes": "Yes",
    "common.no": "No",
    "forms.observationsOptional": "Notes (optional)",
    "forms.addObservation": "Add a note",
    "common.done": "Done",
    "activityResult.title": "Activity result",
    "activityResult.deferAnswer": "Defer answer",
    "activityResult.time": "Time",
    "activityResult.developmentLevel": "Development level",
    "activityResult.levelRequired": "You must select a development level.",
    "activityResult.helpRecord": "Help record",
    "activityResult.helpRequired": "You must select a help record.",
    "activityResult.subRequired": "Select at least one complement: Verbal or Model.",
    "activityResult.notCompleted": "Not completed",
    "activityResult.reason": "Reason:",
    "activityResult.motiveRequired": "Select the reason for not completing.",
    "activityResult.motiveDescription": "Reason description:",
    "activityResult.describeMotive": "Describe the reason...",
    "activityResult.motiveDescRequired": "Describe the reason for not completing.",
    "activityResult.motive.refusal": "Student refusal",
    "activityResult.motive.disruptive": "Disruptive behavior",
    "activityResult.motive.fatigue": "Fatigue or tiredness",
    "activityResult.motive.insufficientTime": "Insufficient time",
    "activityResult.motive.physicalDifficulty": "Physical difficulty",
    "activityResult.motive.other": "Other",
    "chip.verbal": "Verbal",
    "chip.model": "Model",
    "common.continue": "Continue",
    "sessionCompletion.title": "Session Complete!",
    "sessionCompletion.completed": "Completed",
    "sessionCompletion.backToStart": "Back to start",
    "continuation.tryUnrealizedTitle": "Try uncompleted exercise",
    "continuation.unrealizedOne": "1 uncompleted exercise",
    "continuation.unrealizedMany": "{n} uncompleted exercises",
    "continuation.repeatTitle": "Repeat exercise",
    "continuation.repeatDesc": "Choose an exercise from the circuit to repeat",
    "continuation.otherTitle": "Do another exercise",
    "continuation.otherDesc": "Choose any exercise from the team",
    "warningBanner.title": "There are pending activities in the history",
    "warningBanner.subtitle": "Answer the incomplete form in the history",
    "common.notSelected": "Not selected",
    "activityResult.notApplicable": "Not applicable",
    "activityRecord.status": "Status",
    "activityRecord.notPerformed": "Not performed",
    "activityRecord.performed": "Performed",
    "activityRecord.duration": "Duration",
    "activityRecord.helpLevel": "Help level",
    "activityRecord.exerciseStatus": "Exercise status",
    "activityRecord.durationSeconds": "Duration (seconds)",
    "activityRecord.durationExample": "e.g. 90",
    "activityRecord.helpOffered": "Help level offered",
    "activityRecord.pendingInfo": "There is unselected information in this record.",
    "activityRecord.describeReason": "Describe the reason",
    "activityRecord.reasonLabel": "Reason",
    "confirm.finishSession.title": "Finish session?",
    "confirm.logout.title": "Log out?",
    "confirm.delete.title": "Delete",
    "confirm.finishEngagement.message": "The current progress of this engagement activity will be saved according to the chosen circuit type.",
    "confirm.finishSession.message": "The current progress of this session will be saved according to the chosen circuit type.",
    "confirm.logout.message": "You will be redirected to the login screen.",
    "confirm.delete.message": "Are you sure you want to delete? This action cannot be undone.",
    "common.updateList": "Update List",
    "common.tryAgain": "Try Again",
    "common.error": "Error",
    "common.changePeriod": "Change Period",
    "common.compare": "Compare",
    "analysis.compareScreen.periodValue": "Period {n}",
    "analysis.compareScreen.selectRange": "select date range",
    "analysis.compareScreen.periodRequired": "The period is required. Select the start and end in the calendar.",
    "analysis.compareScreen.futureDate": "Invalid date. You cannot select future periods.",
    "analysis.compareScreen.p1AfterP2": "Period 1 cannot start after Period 2.",
    "analysis.compareScreen.overlapP2": "The dates cannot overlap with Period 2.",
    "analysis.compareScreen.p2BeforeP1": "Period 2 cannot start before Period 1.",
    "analysis.compareScreen.overlapP1": "The dates cannot overlap with Period 1.",
    "analysis.compareScreen.bothRequired": "Both periods are required for the comparison.",
    "analysis.behaviorsScreen.title": "Observed Behaviors",
    "analysis.behaviorsScreen.selectPeriod": "Select the period to view the behaviors",
    "analysis.behaviorsScreen.periodRequired": "The period is required.",
    "analysis.behaviorsScreen.detailsTitle": "Behavior breakdown",
    "analysis.behaviorsScreen.errorTitle": "Could not load the observed behaviors. Please try again.",
    "analysis.behaviorsScreen.errorMessage": "Check your connection or try accessing the data again later.",
    "analysis.behaviorsScreen.emptyTitle": "There are no observed behaviors for the selected period yet.",
    "analysis.behaviorsScreen.emptyMessage": "No observed behaviors have been recorded for the selected period yet.",
    "analysis.behaviorsScreen.sessionOf": "Session of",
    "common.until": "to",
    "analysis.period.selectedDate": "Selected date",
    "analysis.period.range": "Period",
    "analysis.progressChart.singleRecordWarning": "There is only one record available for this exercise. It is not yet possible to identify evolution.",
    "analysis.helpScreen.title": "Help records",
    "analysis.helpScreen.selectPeriod": "Select the period to view the help records",
    "analysis.helpScreen.emptyText": "There are not enough records yet to view the evolution of help records.",
    "analysis.helpScreen.errorTitle": "Could not load the evolution of help records. Please try again.",
    "analysis.helpScreen.errorDesc": "Check your connection or try accessing the data again later.",
    "analysis.list.sessionsRecordedOne": "{n} recorded session",
    "analysis.list.sessionsRecordedMany": "{n} recorded sessions",
    "analysis.card.progress.title": "Progress by exercise",
    "analysis.card.progress.desc": "Track the evolution of each exercise across sessions.",
    "analysis.card.help.title": "Help records per session",
    "analysis.card.help.desc": "Track the evolution of autonomy across sessions.",
    "analysis.card.behaviors.title": "Observed behaviors",
    "analysis.card.behaviors.desc": "View the frequency of observed behaviors",
    "analysis.card.compare.title": "Compare performance",
    "analysis.card.compare.desc": "Compare two periods and track differences in the student's performance.",
    "analysis.card.mabc.title": "Motor development records",
    "analysis.card.mabc.desc": "View and record the student's motor assessments.",
    "analysis.noRecords.header": "No records",
    "analysis.noRecords.sessions.title": "No session records yet",
    "analysis.noRecords.sessions.message": "When a session is saved for this student, it will appear here for tracking.",
    "analysis.noRecords.protocol.title": "No record of this protocol yet",
    "analysis.noRecords.protocol.message": "This protocol's data will appear here as soon as there is a valid record.",
    "analysis.noRecords.help.title": "No help evolution to display",
    "analysis.noRecords.help.message": "Help records per session will be available once there is enough data.",
    "analysis.noRecords.behavior.title": "No observed behaviors recorded",
    "analysis.noRecords.behavior.message": "Observed behaviors will appear here when there are records in the selected period.",
    "analysis.noRecords.loadRecords.title": "Could not load the records",
    "analysis.noRecords.loadRecords.message": "Try again in a few moments or check your connection to access the student's data.",
    "analysis.noRecords.loadEvolution.title": "Could not load the evolution",
    "analysis.noRecords.loadEvolution.message": "The help evolution data could not be loaded at this time.",
    "analysis.noRecords.loadBehavior.title": "Could not load the behaviors",
    "analysis.noRecords.loadBehavior.message": "We could not access the observed behaviors for this period right now.",
    "analysis.mabcForm.deleteTitle": "Delete record?",
    "analysis.mabcForm.deleteMessage": "Are you sure you want to delete this motor development record?\nThis action cannot be undone.",
    "analysis.protocolViz.formSaved": "Form saved",
    "analysis.protocolViz.formSavedDesc": "The answers were saved successfully!",
    "analysis.protocolViz.saveError": "Error saving",
    "analysis.protocolViz.formLabel": "{x} form",
    "analysis.protocolViz.testSummary": "Test summary",
    "analysis.protocolViz.noData": "No data available for this record.",
    "analysis.mabcList.subtitle": "Motor assessment records",
    "analysis.mabcList.empty": "No MABC-2 records found.",
    "analysis.protocolList.recordOne": "{n} record",
    "analysis.protocolList.recordMany": "{n} records",
    "analysis.protocolList.viewRecords": "Records view",
    "analysis.protocolList.loadError": "Could not load the applied protocols/tests. Please try again.",
    "analysis.protocolList.noRecordsFound": "No records found.",
    "analysis.protocolCard.record": "Record",
    "analysis.protocolCard.ageGroup": "Age group",
    "analysis.protocolCard.evaluatedBy": "Evaluated by",
    "analysis.progressChart.selectedExercise": "Selected exercise",
    "analysis.comparisonCard.loadError": "Could not load this comparison. Please try again.",
    "analysis.comparisonCard.insufficientData": "Insufficient data for comparison.",
    "analysis.behaviors.comparisonTitle": "Comparison of observed behaviors",
    "analysis.behaviors.footnote": "The values show the absolute and percentage difference of observed behaviors between the two selected periods.",
    "analysis.behaviorChart.title": "Frequency of observed behaviors",
    "analysis.behaviorChart.note": "The frequency of observed behaviors helps identify patterns during sessions and support follow-up decisions.",
    "analysis.behaviorChart.stereotypy.label": "Stereotypies",
    "analysis.behaviorChart.stereotypy.legend": "Stereotypies",
    "analysis.behaviorChart.eyePeople.label": "Eye\ncontact\n(People)",
    "analysis.behaviorChart.eyePeople.legend": "Eye contact (People)",
    "analysis.behaviorChart.eyeObjects.label": "Eye\ncontact\n(Objects)",
    "analysis.behaviorChart.eyeObjects.legend": "Eye contact (Objects)",
    "analysis.behaviorChart.engagement.label": "Engagement",
    "analysis.behaviorChart.engagement.legend": "Engagement",
    "analysis.behaviorChart.escape.label": "Escape",
    "analysis.behaviorChart.escape.legend": "Escape",
    "analysis.behaviorChart.crisis.label": "Crises",
    "analysis.behaviorChart.crisis.legend": "Crises",
    "analysis.behaviorChart.unfit.label": "Unfit\nbehaviors",
    "analysis.behaviorChart.unfit.legend": "Unfit behaviors",
    "analysis.behaviorChart.preferred.label": "Preferred\nactivities",
    "analysis.behaviorChart.preferred.legend": "Preferred activities",
    "analysis.status.notFilled": "Not filled",
    "analysis.status.registered": "Registered",
    "analysis.status.notRegistered": "Not registered",
    "analysis.evolution.improved": "Improved",
    "analysis.evolution.stable": "Stable",
    "analysis.evolution.needsReinforcement": "Needs reinforcement",
    "analysis.progress.lastPerformance": "Last performance",
    "analysis.progress.evolution": "Evolution",
    "analysis.progress.awaiting": "Awaiting new records",
    "analysis.progress.notYetRecorded": "Not yet recorded",
    "analysis.progress.sessionsOne": "{n} session completed",
    "analysis.progress.sessionsMany": "{n} sessions completed",
    "analysis.compare.title": "Comparison by exercise",
    "analysis.compare.exercise": "Exercise",
    "analysis.compare.empty": "There are no exercises with recorded levels to compare in the selected periods.",
    "analysis.compare.footnote": "The variation indicates the difference in average performance levels per exercise between the two selected periods.",
    "analysis.summaryCard.loadError": "Could not load the comparison summary. Please try again.",
    "analysis.summaryCard.insufficientData": "There is not enough data to compare the selected periods.",
    "analysis.mabc.categories": "Categories",
    "analysis.mabcSection.manualDexterity": "Manual dexterity",
    "analysis.mabcSection.aimingCatching": "Aiming and catching",
    "analysis.mabcSection.balance": "Balance",
    "analysis.mabc.score": "Score",
    "analysis.mabc.percentile": "Percentile",
    "analysis.mabc.totalScore": "Total score",
    "analysis.mabc.totalPercentile": "Total percentile",
    "analysis.mabc.recordsFound": "Records, {n} found",
    "reports.title": "Reports",
    "reports.subtitle": "Select a student to see the saved reports",
    "reports.subtitleCross": "Select the students to cross-reference the data",
    "reports.crossToggle": "Cross-student data (consolidated report)",
    "reports.empty": "No students found.",
    "reports.recordsSuffix": "reports",
    "analysis.title": "Analysis",
    "analysis.subtitle": "Select a student to view performance",
    "history.title": "Records history",
    "history.subtitle": "Select a student to access past records",
    "history.empty": "No history found.",
    "history.recordsSuffix": "records",
    "history.detailTitle": "History - {name}",
    "forms.conflict.title": "Pending {form} form",
    "forms.conflict.message": "There is already a pending {form} form for this student. What would you like to do?",
    "forms.conflict.continue": "Continue previous form",
    "forms.conflict.finishNew": "Delete previous and start a new one",
    "sessions.circuitSelection.title": "{name}'s session",
    "sessions.circuitSelection.subtitle": "Select the circuit",
    "sessions.circuitSelection.empty": "No circuits found.",
    "sessions.badge.structured": "Structured",
    "sessions.badge.semi": "Semi-structured",
    "sessions.concurrent.title": "Session in progress",
    "sessions.concurrent.message": "There is already a session in progress with this student. What would you like to do?",
    "sessions.concurrent.continue": "Continue session in progress",
    "sessions.concurrent.finishNew": "Finish session and start new",
    "students.deleteMessage":
      "Are you sure you want to delete? This action cannot be undone.",
    "nav.activities": "Activities",
    "nav.home": "Home",
    "nav.analysis": "Analysis",
    "students.title": "Home",
    "students.subtitle": "Select a student to start a session",
    "students.empty": "No students found.",
    "students.years": "years old",
    "students.support.n1": "ASD level 1",
    "students.support.n2": "ASD level 2",
    "students.support.n3": "ASD level 3",
    "students.deleteTitle": "Delete student?",
    "students.form.createTitle": "New student",
    "students.form.editTitle": "Edit student",
    "students.form.fullName": "Full name",
    "students.form.fullNamePlaceholder": "Student name",
    "students.form.birthDate": "Date of birth",
    "students.form.birthDatePlaceholder": "DD/MM/YYYY",
    "students.form.calendar": "Calendar",
    "students.form.weight": "Weight",
    "students.form.weightPlaceholder": "e.g. 30.5",
    "students.form.height": "Height",
    "students.form.heightPlaceholder": "e.g. 120",
    "students.form.waist": "Waist",
    "students.form.waistPlaceholder": "e.g. 50",
    "students.form.supportLevel": "Support level",
    "students.form.selectHere": "Select here",
    "students.form.supportOption1": "Autism Spectrum Disorder Level 1",
    "students.form.supportOption2": "Autism Spectrum Disorder Level 2",
    "students.form.supportOption3": "Autism Spectrum Disorder Level 3",
    "students.form.healthConditions": "Other health conditions",
    "students.form.healthConditionsPlaceholder": "Other health conditions (optional)",
    "students.form.observations": "Notes",
    "students.form.observationsPlaceholder": "Additional notes (optional)",
    "students.form.removePhotoTitle": "Remove photo?",
    "students.form.replace": "Replace",
    "students.form.err.nameRequired": "Name is required",
    "students.form.err.nameMin": "At least 3 characters",
    "students.form.err.nameMax": "Name must be at most 100 characters",
    "students.form.err.nameFull": "Enter first and last name",
    "students.form.err.dateRequired": "Date is required",
    "students.form.err.dateInvalid": "Invalid date",
    "students.form.err.dateUnreal": "Unreal or future date",
    "students.form.err.observationsMax": "The field must be at most 250 characters",
    "students.form.err.invalidValue": "Invalid value",
    "students.form.err.supportRequired": "Support level is required",
    "students.error.createTitle": "Error creating",
    "students.error.createBody": "Could not save the student.",
    "students.error.editTitle": "Error editing",
    "students.error.editBody": "Could not update the student.",
    "students.error.deleteTitle": "Error removing",
    "tutorial.inTutorial": "In tutorial",
    "tutorial.practiceNotice":
      "This is a tutorial practice screen: a local replica of the real feature. " +
      "Everything you do here is discarded when you leave and does not affect your " +
      "data. If you're unsure what to do, tap \"Ask for help\" to see the current " +
      "step's hint.",
    "tutorial.exitPractice": "Exit practice",
    "tutorial.askHelp": "Ask for help",
    "tutorial.helpTitle": "Step hint",
    "tutorial.helpDone": "You have completed all steps of this simulation.",
    "tutorial.hint.alunos.new": "Tap the \"+ New\" button to start registering a student.",
    "tutorial.hint.alunos.name": "Enter the student's full name (first and last name).",
    "tutorial.hint.alunos.birthdate": "Enter the date of birth in DD/MM/YYYY format.",
    "tutorial.hint.alunos.support": "Select the student's support level.",
    "tutorial.hint.alunos.save": "Tap \"Save\" to register the student.",
    "tutorial.hint.alunos.editMenu": "Open the menu of the student you just created by tapping the three-dots icon.",
    "tutorial.hint.alunos.editSelect": "In the menu, tap \"Edit\".",
    "tutorial.hint.alunos.editSupport": "Change the student's support level.",
    "tutorial.hint.alunos.editSave": "Tap \"Save\" to confirm the change.",
    "tutorial.hint.alunos.deleteMenu": "Open the created student's menu again by tapping the three dots.",
    "tutorial.hint.alunos.deleteSelect": "In the menu, tap \"Delete\".",
    "tutorial.hint.alunos.deleteConfirm": "Confirm deletion by tapping \"Delete\".",
    "tutorial.startSimulation": "Start simulation",
    "tutorial.simDoneTitle": "Simulation complete!",
    "tutorial.listTitle": "Tutorial",
    "tutorial.listSubtitle": "Learn to use the platform · {done}/{total} completed",
    "tutorial.stepOf": "Step {n} of {total}",
    "tutorial.previous": "Previous",
    "tutorial.next": "Next",
    "tutorial.moduleNotFound": "Module not found.",
    "tutorial.finishTutorial": "Finish tutorial",
    "tutorial.finishModule": "Finish module",
    "tutorial.practiceNotFound": "Tutorial practice not found.",
    "tutorial.practiceArea": "Practice area",
    "tutorial.practiceEnvBanner": "Practice environment — nothing here affects your real data.",
    "tutorial.practiceEnvTitle": "Practice environment",
    "tutorial.practiceNoticeLong":
      "You are on a tutorial practice screen. It is a local replica of the real " +
      "feature, created exclusively so you can experiment and learn how to use it. " +
      "Every action taken here — entries, selections, and confirmations — happens " +
      "only on this screen and is discarded when you leave. Nothing is sent to the " +
      "server or affects the app's real data, your students, sessions, or reports. " +
      "Feel free to explore without any risk.",
    "tutorial.stopwatchPractice": "Stopwatch (practice)",
    "tutorial.selectTag": "Select a tag",
    "tutorial.practiceDone": "Practice complete! You can go back to the tutorial.",
    "tutorial.finishPractice": "Finish practice",
    "tutorial.backToTutorial": "Back to tutorial",
    "tutorial.congratsTitle": "Congratulations! Tutorial complete",
    "tutorial.congratsBody": "You've completed all the modules and are ready to use the platform. The tutorial button will be hidden from the header — you can access it again at any time from the Settings page.",
    "tutorial.startUsing": "Start using",
    "tutorial.mod.alunos.title": "Students",
    "tutorial.mod.alunos.desc": "Registration and management of the children you support.",
    "tutorial.mod.alunos.s0.title": "What students are",
    "tutorial.mod.alunos.s0.body": "Each student represents a child supported by your team. Sessions, forms, analyses, and reports are all organized around them.",
    "tutorial.mod.alunos.s1.title": "Practice registration",
    "tutorial.mod.alunos.s1.body": "Let's practice on a replica of the students screen. Follow the blinking highlight to register a student, edit the support level, and finally remove them. Once you complete all the steps, you advance automatically.",
    "tutorial.mod.alunos.s2.body": "Well done! You registered a student, edited the support level, and removed them — exactly the student management flow. Removal is soft: the history is preserved, but the student no longer appears in the active lists. You're ready to manage your team's students.",
    "tutorial.mod.exercicios.title": "Exercises",
    "tutorial.mod.exercicios.desc": "Library of reusable exercises.",
    "tutorial.mod.exercicios.s0.title": "Exercise library",
    "tutorial.mod.exercicios.s0.body": "Exercises are reusable blocks that make up circuits. Each has a title, description, tags, and an optional demonstration image.",
    "tutorial.mod.exercicios.s1.title": "Practice exercises",
    "tutorial.mod.exercicios.s1.body": "Let's practice on a replica of the exercises screen. Follow the blinking highlight to create an exercise, duplicate it, and finally remove it. Once you complete all the steps, you advance automatically.",
    "tutorial.mod.exercicios.s2.body": "Well done! You created an exercise, duplicated it, and removed it. When you delete an exercise used in circuits, the app tells you how many active circuits it's in before confirming. You now know how to manage the exercise library.",
    "tutorial.mod.circuitos.title": "Circuits",
    "tutorial.mod.circuitos.desc": "Sequences of exercises for sessions.",
    "tutorial.mod.circuitos.s0.title": "What a circuit is",
    "tutorial.mod.circuitos.s0.body": "A circuit gathers exercises in a defined order. It can be structured (all exercises) or semi-structured (for engagement and partial activities).",
    "tutorial.mod.circuitos.s1.title": "Practice circuits",
    "tutorial.mod.circuitos.s1.body": "Let's practice on a replica of the circuits screen. Follow the blinking highlight to build a semi-structured circuit, edit it to structured, reorder its exercises, and finally remove it. Once you complete all the steps, you advance automatically.",
    "tutorial.mod.circuitos.s2.body": "Well done! You built a circuit, changed its type, reordered the exercises, and removed it. The order defined in structured circuits is the sequence the session will follow. You now know how to build and manage circuits.",
    "tutorial.mod.sessoes.title": "Sessions",
    "tutorial.mod.sessoes.desc": "Running circuits with a student.",
    "tutorial.mod.sessoes.s0.title": "How a session works",
    "tutorial.mod.sessoes.s0.body": "Choose the student and the circuit. The session guides you exercise by exercise, with a per-activity stopwatch, crisis/flight records, a result per activity, and the session's Control Record (which can be filled in later in History).",
    "tutorial.mod.sessoes.s1.title": "Practice a session",
    "tutorial.mod.sessoes.s1.body": "Let's practice on a real replica of session execution. Follow the blinking highlight: choose the structured circuit and start the exercise. Then freely practice the stopwatch, crisis/flight, the results, and the Control Record. Next, exit without finishing and see the session-in-progress warning when you reopen it. Once you finish, you advance automatically.",
    "tutorial.mod.sessoes.s2.body": "Well done! You started a structured session, practiced the execution (stopwatch, crisis/flight, results, and Control Record), saw the session-in-progress warning, resumed, and finished. Remember: the Control Record can be left empty and completed later in History. You now know how to run sessions.",
    "tutorial.mod.formularios.title": "Forms",
    "tutorial.mod.formularios.desc": "Control records and protocols.",
    "tutorial.mod.formularios.s0.title": "Types of form",
    "tutorial.mod.formularios.s0.body": "The app includes the session Control Record and protocols such as ATA, CARS, and MABC-2, each with its own questions and scales. MABC-2 is split by age group (3-6, 7-10, and 11-16 years).",
    "tutorial.mod.formularios.s1.title": "Practice forms",
    "tutorial.mod.formularios.s1.body": "Let's practice on a real replica. Follow the blinking highlight: start the ATA form, exit leaving it pending and see the warning when you try to start it again, resume and fill it in to save. A form can be saved complete or left pending. Once you finish, you advance automatically.",
    "tutorial.mod.formularios.s2.body": "Well done! You started a form, saw the pending same-type form warning, resumed, and saved. CARS and MABC-2 follow the same flow, and forms can be saved complete or left pending to finish later in History. You now know how to use the forms.",
    "tutorial.mod.historico.title": "History",
    "tutorial.mod.historico.desc": "Timeline of sessions and records.",
    "tutorial.mod.historico.s0.title": "Reviewing the history",
    "tutorial.mod.historico.s0.body": "The history gathers, per student, the completed sessions and their records (activity results, Control Record, and ATA/CARS/MABC-2 forms). Pending records are highlighted so you can complete them later.",
    "tutorial.mod.historico.s1.title": "Practice history",
    "tutorial.mod.historico.s1.body": "Let's practice on a real replica. Follow the blinking highlight: open the student, tap the pending Control Record and edit it, saving at the end. In the same way you edit activity results and the other forms. Once you finish, you advance automatically.",
    "tutorial.mod.historico.s2.body": "Well done! You opened a student's history, edited a pending record, and saved it. Activity results, the Control Record, and the ATA/CARS/MABC-2 forms are all editable from the history. You now know how to review and complete records.",
    "tutorial.mod.analises.title": "Analyses",
    "tutorial.mod.analises.desc": "Student progress in charts.",
    "tutorial.mod.analises.s0.title": "Analysis panel",
    "tutorial.mod.analises.s0.body": "Analyses turn records into charts of the student's progress: progress by exercise, help records per session, observed behaviors, comparison between periods, applied protocols (ATA/CARS), and motor assessments (MABC-2).",
    "tutorial.mod.analises.s1.title": "Practice analyses",
    "tutorial.mod.analises.s1.body": "Let's practice on a real replica with sample data. Follow the blinking highlight to open the student and, in sequence, each of the charts. In progress by exercise, note that filtering by a period with no records shows an empty chart — go back to a period with data. Once you've seen all the charts, you advance automatically.",
    "tutorial.mod.analises.s2.body": "Well done! You saw the six analysis panels — progress by exercise, help records, behaviors, period comparison, ATA/CARS protocols, and MABC-2 — always with data, and also how a period with no records appears empty. You now know how to track students' progress.",
    "tutorial.mod.relatorios.title": "Reports",
    "tutorial.mod.relatorios.desc": "Exportable progress documents.",
    "tutorial.mod.relatorios.s0.title": "What reports are",
    "tutorial.mod.relatorios.s0.body": "A report consolidates, for a student and a period, the progress, help records, behaviors, comparison, and protocols of that interval. You can open, rename, delete, export (PDF with charts or CSV), and download reports, plus cross several students in a consolidated report.",
    "tutorial.mod.relatorios.s1.title": "Practice reports",
    "tutorial.mod.relatorios.s1.body": "Let's practice on a real replica. Follow the blinking highlight: open the student, create a report choosing the period, open it, export it (one or several, with a download option), and finally generate a consolidated report crossing students' data. Once you finish, you advance automatically.",
    "tutorial.mod.relatorios.s2.body": "Well done! You created, opened, and exported reports and generated a consolidated one crossing students. The student's photo is saved with the report and reused for overlapping periods. You now know how to generate and export progress reports.",
  },
};
