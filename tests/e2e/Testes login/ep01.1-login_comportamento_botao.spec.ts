import { test, expect } from '@playwright/test';

test.describe('US01.1 - Comportamento do Botão Entrar', () => {
    
    test.beforeEach(async ({ page }) => {
        page.on('dialog', dialog => dialog.accept());
        await page.goto('/');
    });

    test('O botão Entrar deve permanecer desabilitado enquanto e-mail ou senha estiverem vazios', async ({ page }) => {
        const btnSubmit = page.getByText(/entrar/i).locator('..');
        const emailInput = page.getByPlaceholder(/email/i);
        const passwordInput = page.getByPlaceholder(/senha/i);

        await expect(btnSubmit).toHaveAttribute('aria-disabled', 'true');
        await emailInput.fill('teste@baseaut.com');
        await expect(btnSubmit).toHaveAttribute('aria-disabled', 'true');
        await emailInput.fill('');
        await passwordInput.fill('senha123');
        await expect(btnSubmit).toHaveAttribute('aria-disabled', 'true');
    });

    test('O botão Entrar deve ser habilitado apenas quando os campos obrigatórios estiverem preenchidos', async ({ page }) => {
        const btnSubmit = page.getByText(/entrar/i).locator('..');
        await page.getByPlaceholder(/email/i).fill('teste@baseaut.com');
        await page.getByPlaceholder(/senha/i).fill('senha123');

        const ariaDisabled = await btnSubmit.getAttribute('aria-disabled');
        expect(ariaDisabled === 'false' || ariaDisabled === null).toBeTruthy();
    });

    test('O botão Entrar ao ser clicado, deve colocar a tela em estado de carregamento', async ({ page }) => {
        await page.getByPlaceholder(/email/i).fill('teste@baseaut.com');
        await page.getByPlaceholder(/senha/i).fill('senha123');
        await page.getByText(/entrar/i).click();

        // O estado de carregamento é indicado pela mudança do botão/overlay
        await expect(page.getByText(/entrando\.\.\./i)).toBeVisible();
    });

    test('O botão Entrar deve exibir indicador de carregamento (texto “Entrando...”)', async ({ page }) => {
        await page.getByPlaceholder(/email/i).fill('teste@baseaut.com');
        await page.getByPlaceholder(/senha/i).fill('senha123');
        await page.getByText(/entrar/i).click();

        await expect(page.getByText(/entrando\.\.\./i)).toBeVisible();
    });

    test('O botão Entrar deve desabilitar temporariamente os campos e o botão para evitar múltiplos envios', async ({ page }) => {
        const emailInput = page.getByPlaceholder(/email/i);
        const passwordInput = page.getByPlaceholder(/senha/i);
        
        await emailInput.fill('teste@baseaut.com');
        await passwordInput.fill('senha123');
        await page.getByText(/entrar/i).click();

        const btnLoading = page.getByText(/entrando\.\.\./i).locator('..');
        await expect(btnLoading).toHaveAttribute('aria-disabled', 'true');
        await expect(emailInput).toHaveAttribute('aria-disabled', 'true');
        await expect(passwordInput).toHaveAttribute('aria-disabled', 'true');
    });
});
