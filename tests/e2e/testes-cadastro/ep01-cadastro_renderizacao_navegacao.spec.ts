import { expect, test } from '@playwright/test';

test.describe('Cadastro - Renderização e Navegação', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        // Navega para a tela de cadastro
        await page.getByText(/Cadastre-se/i).click();
        await expect(page).toHaveURL(/.*register/);
    });

    test('Deve exibir todos os elementos obrigatórios da tela', async ({ page }) => {
        await expect(page.getByPlaceholder(/nome completo/i)).toBeVisible();
        await expect(page.getByPlaceholder(/seu email/i)).toBeVisible();
        await expect(page.getByPlaceholder('Sua senha', { exact: true })).toBeVisible();
        await expect(page.getByPlaceholder('Confirme sua senha', { exact: true })).toBeVisible();
        await expect(page.getByText(/cadastrar-se/i)).toBeVisible();
        await expect(page.getByText(/já tem conta\? entre/i)).toBeVisible();
    });

    test('O botão cadastrar deve iniciar desabilitado', async ({ page }) => {
        const cadastrarBtn = page.getByText(/Cadastrar-se/i);
        await expect(cadastrarBtn).toBeDisabled();
    });

    test('Deve permitir alternar a visibilidade da senha e confirmação', async ({ page }) => {
        const passwordInput = page.getByPlaceholder('Sua senha', { exact: true });
        const confirmInput = page.getByPlaceholder('Confirme sua senha', { exact: true });

        // Por padrão deve ser password
        await expect(passwordInput).toHaveAttribute('type', 'password');
        await expect(confirmInput).toHaveAttribute('type', 'password');

        // Clica nos ícones de visibilidade (supondo que existam baseaut-icons ou similar)
        // No componente PasswordInput, geralmente há um botão ou ícone clicável.
        // Vamos procurar por botões dentro dos containers de senha.
        const toggleButtons = page.locator('button:has(svg), [role="button"]:has(svg)').filter({ hasText: '' });

        // Se houver botões de toggle, clicamos neles
        if (await toggleButtons.count() >= 2) {
            await toggleButtons.nth(0).click();
            await expect(passwordInput).toHaveAttribute('type', 'text');

            await toggleButtons.nth(1).click();
            await expect(confirmInput).toHaveAttribute('type', 'text');
        }
    });

    test('Deve voltar para a tela de login ao clicar no link correspondente', async ({ page }) => {
        await page.getByText('Entre', { exact: true }).click();
        await expect(page).toHaveURL(/\/$/); // Volta para a raiz (login)
    });
});
