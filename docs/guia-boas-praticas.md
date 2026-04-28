# Guia de Boas Práticas

Este documento existe para manter o projeto consistente desde o início e evitar retrabalho com conflitos, merges difíceis, código duplicado e decisões de arquitetura dispersas.

## 1. Princípios gerais

- Prefira mudanças pequenas e bem delimitadas.
- Evite PRs grandes e longos períodos de branch aberta.
- Não misture refatoração, ajuste visual e mudança de regra de negócio no mesmo PR, a menos que isso seja realmente necessário.
- Se uma mudança exigir reorganização maior, documente isso no próprio PR.

## 2. Estrutura do projeto

- Use `app/` apenas para rotas, telas e composição de navegação do Expo Router.
- Coloque componentes reutilizáveis em `components/`.
- Centralize lógica reaproveitável em `hooks/`.
- Mantenha constantes, temas e tokens visuais em `constants/` ou arquivos de tema apropriados.
- Evite duplicar lógica entre rotas; quando perceber repetição, extraia um componente ou hook.

## 3. Padrões de código

- Use TypeScript de forma explícita quando o tipo não ficar claro pelo contexto.
- Prefira nomes descritivos para componentes, funções, variáveis e arquivos.
- Mantenha componentes pequenos e com responsabilidade única.
- Não adicione abstrações antecipadas sem necessidade real.
- Preserve o estilo existente do projeto ao tocar em arquivos já consolidados.

### 3.1. Padrões de nomenclatura

O projeto segue um padrão simples e consistente de nomes para facilitar leitura, busca e manutenção.

Arquivos e pastas:

- Use `kebab-case` para a maioria dos arquivos fora das rotas.
- Use nomes de rota do Expo Router em minúsculas e com grupos entre parênteses quando necessário.
- Mantenha nomes curtos e descritivos.

Exemplos:

- `themed-text.tsx`
- `use-color-scheme.ts`
- `use-theme-color.ts`
- `parallax-scroll-view.tsx`
- `app/(tabs)/index.tsx`
- `app/(tabs)/_layout.tsx`
- `app/modal.tsx`

Componentes:

- Nomeie componentes com `PascalCase`.
- O nome do arquivo deve refletir o nome do componente principal, porém utilizando `kebab-case`, como mencionado anteriormente.
- Prefira um componente principal por arquivo quando possível.

Exemplos:

- `ThemedText` -> Nesse caso, o nome do arquivo seria `themed-text.tsx`.
- `ThemedView`
- `ParallaxScrollView`
- `HapticTab`

Hooks:

- Nomeie hooks com `lowerCamelCase`.
- Hooks devem começar com `use`.
- O nome do arquivo normalmente reflete o nome do hook, porém utilizando `kebab-case`.
- Hooks devem expressar o que fazem, não como fazem.

Exemplos:

- `useColorScheme` -> Nesse caso, o nome do arquivo seria `use-color-scheme.ts`.
- `useThemeColor`
- `useColorScheme.web`

Funções, variáveis e parâmetros:

- Use `lowerCamelCase` para funções, variáveis e parâmetros.
- Booleans devem ter nomes que expressem estado ou condição.
- Evite abreviações confusas; prefira clareza.

Exemplos:

- `handlePress`
- `currentTheme`
- `isLoading`
- `hasError`
- `selectedTab`

Constantes e temas:

- Use `PascalCase` para objetos exportados que representam temas, mapas ou coleções de configuração.
- Use nomes claros para tokens visuais e valores compartilhados.

Exemplos:

- `Colors`
- `Fonts`

Tipos e interfaces:

- Use `PascalCase` para tipos e interfaces.
- Quando fizer sentido, use o sufixo `Props` para propriedades de componente.

Exemplos:

- `ThemedTextProps`
- `UserProfile`
- `NavigationState`

Regras práticas:

- Se o nome do arquivo, função ou componente não deixa claro o propósito, ele é ruim.
- Evite nomes genéricos como `utils.ts`, `helper.ts`, `data.ts` ou `component.tsx` sem necessidade.
- Se um arquivo crescer demais, prefira dividir em arquivos com responsabilidades mais específicas.

## 4. React Native, Expo Router e NativeWind

- Mantenha as rotas enxutas e deixe a lógica de interface em componentes dedicados quando a tela começar a crescer.
- Use NativeWind de forma consistente nos arquivos dentro do glob configurado em `tailwind.config.js`.
- Lembre-se de que a folha global de estilos do projeto está em `app/global.css`.
- Não altere a configuração de tema ou rota sem validar o impacto em web, iOS e Android quando aplicável.

## 5. Fluxo de branches e pull requests

- Use `conventional branch` para nomear branches de forma previsível.
- Crie uma branch por tarefa ou correção.
- Faça PRs pequenos e focados em um único objetivo.
- Rebase ou sincronize a branch com a base principal com frequência para reduzir conflitos acumulados.
- Resolva conflitos assim que aparecerem, em vez de empurrá-los para o final do fluxo.
- Evite mudanças de formatação em massa sem necessidade, porque isso dificulta revisão e aumenta conflito.

### 5.1. Conventional Branch

Adote o padrão `tipo/descricao-curta` para branch. Use minúsculas, hífen para separar palavras (kebab-case) e uma descrição curta do objetivo.

Tipos recomendados:

- `feat` para novas funcionalidades.
- `fix` para correções de bug.
- `refactor` para refatoração sem mudança de comportamento.
- `docs` para mudanças em documentação.
- `chore` para ajustes de manutenção, configuração ou limpeza.

Exemplos:

- `feat/login-screen`
- `feat/add-profile-form`
- `fix/navigation-back-button`
- `refactor/extract-card-component`
- `docs/update-development-guide`
- `chore/eslint-rules`

Regras práticas:

- Evite nomes genéricos como `teste`, `nova-branch` ou `ajustes`.
- Não coloque o nome do autor, data ou número de ticket como parte principal do nome da branch.
- Se o branch tiver duas ou mais mudanças grandes e independentes, provavelmente ele está grande demais. Divida-o.

### 5.2. Conventional Commits

Use `conventional commits` em todos os commits para deixar o histórico legível e automatizável.

Formato base:

- `tipo(escopo): descrição`

Obs.: o 'escopo' é opcional.

Tipos recomendados:

- `feat`: nova funcionalidade.
- `fix`: correção de problema.
- `refactor`: mudança interna sem alterar comportamento.
- `docs`: atualização de documentação.
- `style`: formatação, espaços, ajustes sem impacto funcional.
- `test`: adição ou ajuste de testes.
- `chore`: manutenção geral, dependências e tarefas auxiliares.

Exemplos:

- `feat(auth): add login screen`
- `fix(router): handle back navigation on modal`
- `refactor(ui): extract reusable card component`
- `docs: update development guide`
- `style: format button component`
- `test(auth): cover login validation`
- `chore: update expo dependencies`

Regras práticas:

- Escreva a descrição no imperativo e de forma curta.
- Cada commit deve representar uma intenção clara e isolada.
- Evite commits genéricos como `fixes`, `update`, `wip` ou `final`.
- Se houver mudança quebrando comportamento, explique isso no PR e mantenha o commit focado no que foi alterado.

Exemplo de sequência saudável:

- Branch: `feat/profile-edit`
- Commit 1: `feat(profile): add edit form`
- Commit 2: `fix(profile): validate required fields`
- Commit 3: `docs: update profile flow notes`

## 6. Revisão de código

- Todo PR deve responder claramente: o que mudou, por quê e como validar.
- Se uma mudança afeta comportamento visual, inclua evidência de validação, como captura de tela ou vídeo curto.
- Se a mudança afeta navegação, descreva os caminhos de tela testados.
- Se houver dívida técnica assumida, registre isso explicitamente.

### 6.1. Qualidade do Código (Quality Assurance)

A qualidade do aplicativo é de responsabilidade de toda a equipe. Para que o fluxo de testes seja mais eficiente, o alinhamento entre Desenvolvimento e QA deve seguir as seguintes diretrizes:

- Desk Check: Antes de mover qualquer task para a etapa de testes (in QA) é de responsabiildade do desenvolvedor rodar o aplicativo e garantir que o fluxo principaçl esteja funcionando e sem quebras óbvias.
- Validação dos Critérios de Aceite: O teste deve ser sempre baseado nos critérios de aceite definidos no backlog. Nenhuma tarefa deve ser aprovada se os critérios básicos não foram totalmente atendidos.
- Report de Bugs: Todo bug reportado precisa ser fácil de entender e reproduzir. Ao registrar uma falha, inclua sempre:
  - Ambiente
  - Passos para reproduzir o erro
  - Comportamento esperado vs Comportamento atual
  - Pelo menos uma evidência visual

## 7. Documentação

- Atualize este guia quando surgir uma decisão de processo importante.
- Documente novos padrões de UI, novos hooks compartilhados e configurações relevantes do projeto.
- Se um componente ou fluxo for reutilizável, escreva uma nota curta explicando o propósito e a responsabilidade dele.
- Mantenha o README focado no ponto de entrada do projeto e use este guia para regras de desenvolvimento.

## 8. Qualidade mínima antes de abrir PR

- O código deve compilar e passar nas checagens locais aplicáveis.
- Não deixe console logs, código morto ou blocos comentados sem justificativa.
- Verifique se os imports estão corretos e se não há arquivos duplicados sem necessidade.
- Confirme que a mudança não quebrou a navegação principal nem a experiência básica da tela afetada.

## 9. Checklist rápido

- A mudança é pequena e fácil de revisar?
- A lógica ficou no lugar certo?
- O padrão visual e estrutural do projeto foi preservado?
- A documentação necessária foi atualizada?
- A validação local foi feita?

## 10. Regra prática

Se uma decisão aumentar a chance de conflito, duplicação ou manutenção difícil, prefira a opção mais simples e explícita.
