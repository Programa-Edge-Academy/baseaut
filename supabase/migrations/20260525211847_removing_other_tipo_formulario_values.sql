ALTER TABLE public.formularios ALTER COLUMN tipo DROP DEFAULT;

ALTER TYPE tipo_formulario RENAME TO tipo_formulario_old;

CREATE TYPE tipo_formulario AS ENUM ('ata', 'cars', 'registro_controle');

ALTER TABLE public.formularios
  ALTER COLUMN tipo TYPE tipo_formulario
  USING tipo::text::tipo_formulario;

DROP TYPE tipo_formulario_old;