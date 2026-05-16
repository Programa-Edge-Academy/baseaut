import { expect, test } from '@playwright/test';

test.describe('Cadastro - Validações de E-mail', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/register');
    });

    test('Deve exibir erro para email com formato inválido', async ({ page }) => {
        await page.getByPlaceholder(/nome completo/i).fill('João Silva');
        await page.getByPlaceholder(/seu email/i).fill('emailinvalido');
        await page.getByPlaceholder('Sua senha', { exact: true }).fill('Senha@123');
        await page.getByPlaceholder('Confirme sua senha', { exact: true }).fill('Senha@123');

        // Se o botão habilitar mesmo com erro, clicamos para ver a mensagem
        const submitBtn = page.getByText(/cadastrar-se/i);
        if (!(await submitBtn.isDisabled())) {
            await submitBtn.click();
        }

        await expect(page.getByText(/email inválido/i)).toBeVisible();
    });

    test('Não deve permitir cadastro com email já existente', async ({ page }) => {
        // Assume-se que 'existente@exemplo.com' já está cadastrado ou mockado
        await page.getByPlaceholder(/nome completo/i).fill('Usuário Teste Mesmo Email');
        await page.getByPlaceholder(/seu email/i).fill('sucesso_1778886127724@exemplo.com');
        await page.getByPlaceholder('Sua senha', { exact: true }).fill('Senha123');
        await page.getByPlaceholder('Confirme sua senha', { exact: true }).fill('Senha123');

        await page.getByText(/cadastrar-se/i).click();

        // Aguarda mensagem de erro do backend
        await expect(page.getByText(/já existe cadastro com aquele email/i)).toBeVisible();
    });

    test('Deve validar o limite máximo de 254 caracteres', async ({ page }) => {
        const longEmail = 'a'.repeat(244) + '@exemplo.com'; // 244 + 12 = 256
        await page.getByPlaceholder(/seu email/i).fill(longEmail);

        // Verifica se há erro visual ou se o campo truncou
        // Se o botão habilitar mesmo com erro, clicamos para ver a mensagem
        const submitBtn = page.getByText(/cadastrar-se/i);
        if (!(await submitBtn.isDisabled())) {
            await submitBtn.click();
        }

        await expect(page.getByText(/email inválido/i)).toBeVisible();
    });
});
