-- 20260501_000026_enable_rls.sql


ALTER TABLE public.profiles              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.preferencias_usuario  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissoes            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.perfil_permissoes     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itens_menu            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.solicitacoes_recuperacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipes               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.membros_equipe        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notificacoes          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alunos                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.avaliacoes            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.formularios           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.perguntas             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercicios            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.circuitos             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itens_circuito        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessoes               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.execucoes_exercicio   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registros_suporte     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.respostas_formulario  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.relatorios            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.secoes_relatorio      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.midias                ENABLE ROW LEVEL SECURITY;
