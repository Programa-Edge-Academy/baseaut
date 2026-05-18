import { expect, test } from '@playwright/test';

test.describe('Cadastro - Fluxo de Sucesso', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/register');
    });

    test('Deve realizar o cadastro com sucesso e exibir as mensagens corretas', async ({ page }) => {
        // Preenche com dados válidos
        await page.getByPlaceholder(/nome completo/i).fill('Usuário Teste Silva');
        await page.getByPlaceholder(/seu email/i).fill(`sucesso_${Date.now()}@exemplo.com`);
        await page.getByPlaceholder('Sua senha', { exact: true }).fill('Senha@123');
        await page.getByPlaceholder('Confirme sua senha', { exact: true }).fill('Senha@123');

        // Botão deve estar habilitado
        const submitBtn = page.getByText(/cadastrar-se/i);
        await expect(submitBtn).toBeEnabled();

        // Clica em cadastrar
        await submitBtn.click();

        // Verifica estado de carregamento (se possível)
        await expect(page.getByText(/cadastrando/i)).toBeVisible();

        // Verifica se foi redirecionado para login ou tela de aviso
        await expect(page).toHaveURL(/.*auth-feedback/);
        // Verifica mensagem de sucesso
        await expect(page.getByText(/aguarde a aprovação da Coordenadora/i)).toBeVisible();

    });
});
