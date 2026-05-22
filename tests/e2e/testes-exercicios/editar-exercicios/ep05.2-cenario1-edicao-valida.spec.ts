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

    // Busca o exercício específico do Cenário 1
    const inputBusca = page.getByPlaceholder('Buscar por nome...');
    await inputBusca.fill('Exercicio Base Cenario 1');
    await page.waitForTimeout(1000);

    // Abre a aba de edição
    await page.locator('.css-view-g5y9jx.r-cursor-1loqt21.r-touchAction-1otgn73.h-10 > svg').first().click();
    await page.locator('div').filter({ hasText: /^Editar$/ }).first().click();
    await page.waitForTimeout(2000);
  });

  // O teste encontrou um bug, marcamos com o método fail pois indica que ele foi eficiente e o bug é do próprio sistema, assim o playwriht não marca como teste falho
  test.fail('Cenário 1: Edição válida', async ({ page }) => {

    // Mapeando elementos de tela
    const inputNome = page.getByRole('textbox', { name: 'Ex: Girar bambolê' });
    const inputDescricao = page.getByRole('textbox', { name: 'Descrição do exercício (' });
    const inputDuracao = page.getByRole('textbox', { name: 'Ex: 120' });
    const btnSalvar = page.locator('div').filter({ hasText: /^Salvar$/ }).first();

    // Checando com o dado pré-preenchido
    await expect(inputNome).toHaveValue('Exercicio Base Cenario 1');
    
    // Alterar com valores válidos
    await inputNome.fill('Exercicio Editado com Sucesso Cenario 1');
    await inputDescricao.fill('Descrição atualizada no teste isolado do cenário 1.');
    await inputDuracao.fill('25');
    await btnSalvar.click();

    //! Sistema deveria exibir essas mensagem mas não a faz
    await expect(page.getByText('Exercício atualizado com sucesso.')).toBeVisible();
  });
});