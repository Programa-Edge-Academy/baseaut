import type { TranslationKey } from "@/features/settings/constants/translations";
import {
  Activity,
  BarChart3,
  ClipboardList,
  Dumbbell,
  FileText,
  History,
  LayoutGrid,
  Users,
} from "lucide-react-native";
import type { ComponentType } from "react";

/** A translator function bound to the active locale. */
type Translate = (key: TranslationKey) => string;

/** A single fragmented step inside a tutorial module. */
export type TutorialStep = {
  /** Short step title. */
  title: string;
  /** Explanatory body shown under the title. */
  body: string;
  /**
   * Optional mock highlight rendered as a card in the step, illustrating the
   * UI element being described (label + value pairs, kept intentionally light).
   */
  mock?: { label: string; value: string }[];
  /** Optional call-to-action label the user taps to "perform" the mock action. */
  action?: string;
  /**
   * When true, the step gates progression on a guided simulation: the "Next"
   * button is hidden and the user advances only by completing the practice,
   * which then jumps the module to its next (wrap-up) step.
   */
  requiresSimulation?: boolean;
};

/** A tutorial module covering one platform feature. */
export type TutorialModule = {
  id: string;
  title: string;
  description: string;
  icon: ComponentType<{ size?: number; color?: string }>;
  /** Accent color token name resolved from the theme palette. */
  accent: string;
  steps: TutorialStep[];
};

/** Static, locale-independent shape of a tutorial module (text fields are keys). */
type TutorialModuleSpec = {
  id: string;
  titleKey: TranslationKey;
  descKey: TranslationKey;
  icon: ComponentType<{ size?: number; color?: string }>;
  accent: string;
  steps: {
    titleKey: TranslationKey;
    bodyKey: TranslationKey;
    action?: boolean;
    requiresSimulation?: boolean;
  }[];
};

/**
 * Locale-independent specs for the interactive tutorial modules, one per
 * platform feature. Text fields reference translation keys resolved at render
 * by {@link buildTutorialModules}.
 */
const TUTORIAL_MODULE_SPECS: TutorialModuleSpec[] = [
  {
    id: "alunos",
    titleKey: "tutorial.mod.alunos.title",
    descKey: "tutorial.mod.alunos.desc",
    icon: Users,
    accent: "primary",
    steps: [
      { titleKey: "tutorial.mod.alunos.s0.title", bodyKey: "tutorial.mod.alunos.s0.body" },
      { titleKey: "tutorial.mod.alunos.s1.title", bodyKey: "tutorial.mod.alunos.s1.body", action: true, requiresSimulation: true },
      { titleKey: "tutorial.simDoneTitle", bodyKey: "tutorial.mod.alunos.s2.body" },
    ],
  },
  {
    id: "exercicios",
    titleKey: "tutorial.mod.exercicios.title",
    descKey: "tutorial.mod.exercicios.desc",
    icon: Dumbbell,
    accent: "secondary",
    steps: [
      { titleKey: "tutorial.mod.exercicios.s0.title", bodyKey: "tutorial.mod.exercicios.s0.body" },
      { titleKey: "tutorial.mod.exercicios.s1.title", bodyKey: "tutorial.mod.exercicios.s1.body", action: true, requiresSimulation: true },
      { titleKey: "tutorial.simDoneTitle", bodyKey: "tutorial.mod.exercicios.s2.body" },
    ],
  },
  {
    id: "circuitos",
    titleKey: "tutorial.mod.circuitos.title",
    descKey: "tutorial.mod.circuitos.desc",
    icon: LayoutGrid,
    accent: "extra",
    steps: [
      { titleKey: "tutorial.mod.circuitos.s0.title", bodyKey: "tutorial.mod.circuitos.s0.body" },
      { titleKey: "tutorial.mod.circuitos.s1.title", bodyKey: "tutorial.mod.circuitos.s1.body", action: true, requiresSimulation: true },
      { titleKey: "tutorial.simDoneTitle", bodyKey: "tutorial.mod.circuitos.s2.body" },
    ],
  },
  {
    id: "sessoes",
    titleKey: "tutorial.mod.sessoes.title",
    descKey: "tutorial.mod.sessoes.desc",
    icon: Activity,
    accent: "primary",
    steps: [
      { titleKey: "tutorial.mod.sessoes.s0.title", bodyKey: "tutorial.mod.sessoes.s0.body" },
      { titleKey: "tutorial.mod.sessoes.s1.title", bodyKey: "tutorial.mod.sessoes.s1.body", action: true, requiresSimulation: true },
      { titleKey: "tutorial.simDoneTitle", bodyKey: "tutorial.mod.sessoes.s2.body" },
    ],
  },
  {
    id: "formularios",
    titleKey: "tutorial.mod.formularios.title",
    descKey: "tutorial.mod.formularios.desc",
    icon: ClipboardList,
    accent: "verbal",
    steps: [
      { titleKey: "tutorial.mod.formularios.s0.title", bodyKey: "tutorial.mod.formularios.s0.body" },
      { titleKey: "tutorial.mod.formularios.s1.title", bodyKey: "tutorial.mod.formularios.s1.body", action: true, requiresSimulation: true },
      { titleKey: "tutorial.simDoneTitle", bodyKey: "tutorial.mod.formularios.s2.body" },
    ],
  },
  {
    id: "historico",
    titleKey: "tutorial.mod.historico.title",
    descKey: "tutorial.mod.historico.desc",
    icon: History,
    accent: "muted",
    steps: [
      { titleKey: "tutorial.mod.historico.s0.title", bodyKey: "tutorial.mod.historico.s0.body" },
      { titleKey: "tutorial.mod.historico.s1.title", bodyKey: "tutorial.mod.historico.s1.body", action: true, requiresSimulation: true },
      { titleKey: "tutorial.simDoneTitle", bodyKey: "tutorial.mod.historico.s2.body" },
    ],
  },
  {
    id: "analises",
    titleKey: "tutorial.mod.analises.title",
    descKey: "tutorial.mod.analises.desc",
    icon: BarChart3,
    accent: "secondary",
    steps: [
      { titleKey: "tutorial.mod.analises.s0.title", bodyKey: "tutorial.mod.analises.s0.body" },
      { titleKey: "tutorial.mod.analises.s1.title", bodyKey: "tutorial.mod.analises.s1.body", action: true, requiresSimulation: true },
      { titleKey: "tutorial.simDoneTitle", bodyKey: "tutorial.mod.analises.s2.body" },
    ],
  },
  {
    id: "relatorios",
    titleKey: "tutorial.mod.relatorios.title",
    descKey: "tutorial.mod.relatorios.desc",
    icon: FileText,
    accent: "primary",
    steps: [
      { titleKey: "tutorial.mod.relatorios.s0.title", bodyKey: "tutorial.mod.relatorios.s0.body" },
      { titleKey: "tutorial.mod.relatorios.s1.title", bodyKey: "tutorial.mod.relatorios.s1.body", action: true, requiresSimulation: true },
      { titleKey: "tutorial.simDoneTitle", bodyKey: "tutorial.mod.relatorios.s2.body" },
    ],
  },
];

/** Ordered tutorial module ids (locale-independent structural reference). */
export const TUTORIAL_MODULE_IDS: string[] = TUTORIAL_MODULE_SPECS.map((m) => m.id);

/**
 * Resolves the tutorial modules for the active locale. Each module is split into
 * short, fast steps to keep engagement; the mock data shown in steps is
 * illustrative only and is discarded when the tutorial is closed or restarted.
 */
export function buildTutorialModules(t: Translate): TutorialModule[] {
  return TUTORIAL_MODULE_SPECS.map((spec) => ({
    id: spec.id,
    title: t(spec.titleKey),
    description: t(spec.descKey),
    icon: spec.icon,
    accent: spec.accent,
    steps: spec.steps.map((step) => ({
      title: t(step.titleKey),
      body: t(step.bodyKey),
      ...(step.action ? { action: t("tutorial.startSimulation") } : {}),
      ...(step.requiresSimulation ? { requiresSimulation: true } : {}),
    })),
  }));
}
