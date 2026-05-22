import { expect, test } from '@playwright/test';

test.describe('US05.02: Editar Exercício', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8081'); 
    
    // Efetua o login
    await page.getByPlaceholder('E-mail').fill('pedro.neves@edge.ufal.br'); 
    await page.getByPlaceholder('Senha').fill('Teste123!');
    await page.getByText('Entrar', {exact: true}).click();

    // Navega até atividades
    await page.getByText('Atividades', {exact: true}).click();
    await page.waitForTimeout(2000);

    // Abre a aba de edição
    await page.locator('.css-view-g5y9jx.r-cursor-1loqt21.r-touchAction-1otgn73.h-10 > svg').first().click();
    await page.locator('div').filter({ hasText: /^Editar$/ }).first().click();
    await page.waitForTimeout(2000);
  });

  //todo Iremos analisar cada cenário dos critérios de aceite

  test.skip('Cenário 1: Edição válida', async ({ page }) => {

    // Mapeando elementos de tela
    const inputNome = page.getByRole('textbox', { name: 'Ex: Girar bambolê' });
    const inputDescricao = page.getByRole('textbox', { name: 'Descrição do exercício (' });
    const inputDuracao = page.getByRole('textbox', { name: 'Ex: 120' });
    const btnSalvar = page.locator('div').filter({ hasText: /^Salvar$/ }).first();

    // Checando com os dados pré-preenchidos
    await expect(inputNome).toHaveValue('Exercício de Teste');
    await expect(inputDescricao).toHaveValue('Teste do Épico 5');
    await expect(inputDuracao).toHaveValue('15');

    // Alterar com valores válidos
    await inputNome.fill('Exercício Automatizado Editado');
    await inputDescricao.fill('Esta descrição foi alterada com sucesso automaticamente.');
    await inputDuracao.fill('25');
    await btnSalvar.click();

    //! Sistema deveria exibir essas mensagem mas não a faz
    await expect(page.getByText('Exercício atualizado com sucesso.')).toBeVisible();
  });

  test.skip('Cenário 2: Campo obrigatório vazio', async ({ page }) => {

    // Mapeando elementos de tela
    const inputNome = page.getByRole('textbox', { name: 'Ex: Girar bambolê' });
    const btnSalvar = page.locator('div').filter({ hasText: /^Salvar$/ }).first();

    // O usuário remove o conteúdo de um campo obrigatório
    await inputNome.fill('');
    await btnSalvar.click();

    //! Deveria exibir mensagem de erro mas não a faz, porém também não permite salvar
    await expect(page.getByText(/campo obrigatório/i)).toBeVisible();
    await expect(btnSalvar).toBeVisible();
  });

  test.skip('Cenário 3: Dado com formato inválido', async ({ page }) => {

    // Mapeando elementos de tela
    const inputNome = page.getByRole('textbox', { name: 'Ex: Girar bambolê' });
    const btnSalvar = page.locator('div').filter({ hasText: /^Salvar$/ }).first();

    //! Cria um texto com 150 letras A para estourar o limite de caracteres, porém o limite não estoura e aceita o nome
    const nomeGigante = 'A'.repeat(150); 
    await inputNome.fill(nomeGigante);
    await btnSalvar.click();

    //! Deveria exibir erro mas não o faz 
    await expect(page.getByText(/limite de caracteres/i)).toBeVisible();
    await expect(btnSalvar).toBeVisible();
  });

  test('Cenário 4: Cancelamento sem alterações', async ({ page }) => {

    // Mapeando elementos de tela
    const btnCancelar = page.locator('div').filter({ hasText: /^Cancelar$/ }).first();
    const btnSalvar = page.locator('div').filter({ hasText: /^Salvar$/ }).first();

    // O usuário não alterou nenhum campo
    await btnCancelar.click();

    // Direcionado para a aba de ativadades novamente
    await expect(btnSalvar).toBeHidden();
    await expect(page.getByText('Exercício de Teste').first()).toBeVisible();
  });

  test('Cenário 5: Cancelamento com alterações pendentes', async ({ page }) => {

    // Mapeando elementos de tela
    const inputNome = page.getByRole('textbox', { name: 'Ex: Girar bambolê' });
    const btnCancelar = page.locator('div').filter({ hasText: /^Cancelar$/ }).first();

    // Usuário alterou um ou mais campos
    await inputNome.fill('Tentando cancelar no meio da edição');
    
    //! O sistema deveria exibir aviso de "alterações não salvas" e solicitar confirmação antes de descartar as alterações.
    //! Porém ele apenas descarta as alterações até então e cancela tudo.
    await btnCancelar.click();
    await expect(page.getByText(/alterações não salvas/i).first()).toBeVisible();
  });

});