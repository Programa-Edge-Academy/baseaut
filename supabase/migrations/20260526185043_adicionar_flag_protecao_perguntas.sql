-- Adiciona a coluna de controle para impedir modificações em perguntas de formulários já aplicados
ALTER TABLE public.perguntas 
ADD COLUMN IF NOT EXISTS protegida BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.perguntas.protegida IS 'Flag que define se a pergunta está travada para edições por pertencer a um formulário clínico já aplicado.';

-- Função para impedir modificação de perguntas protegidas
CREATE OR REPLACE FUNCTION public.check_pergunta_protegida()
RETURNS TRIGGER AS $$
BEGIN
    -- Só age se a pergunta JÁ ESTAVA protegida antes da operação
    IF (OLD.protegida = true) THEN
        
        -- 1. Se for uma tentativa de exclusão, bloqueia imediatamente
        IF (TG_OP = 'DELETE') THEN
            RAISE EXCEPTION 'Esta pergunta está protegida e não pode ser excluída.';
        END IF;

        -- 2. Se for uma tentativa de atualização
        IF (TG_OP = 'UPDATE') THEN
            -- Se tentarem alterar qualquer dado mantendo ela protegida, OU se tentarem mudar o texto/estrutura
            -- Nota: Só permitimos o UPDATE se a ÚNICA alteração for mudar 'protegida' de true para false.
            IF (NEW IS DISTINCT FROM OLD AND NEW.protegida = true) THEN
                RAISE EXCEPTION 'Esta pergunta está protegida e seus campos não podem ser modificados.';
            END IF;
        END IF;

    END IF;

    -- Se for um UPDATE válido (ex: destravando a flag), ou se for um registro não protegido, prossegue
    IF (TG_OP = 'DELETE') THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger para validar a proteção antes de UPDATE ou DELETE
DROP TRIGGER IF EXISTS trg_check_pergunta_protegida ON public.perguntas;
CREATE TRIGGER trg_check_pergunta_protegida
BEFORE UPDATE OR DELETE ON public.perguntas
FOR EACH ROW EXECUTE FUNCTION public.check_pergunta_protegida();