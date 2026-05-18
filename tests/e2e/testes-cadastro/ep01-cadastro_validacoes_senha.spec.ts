import { expect, test } from '@playwright/test';

test.describe('Cadastro - Validações de Senha', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/register');
    });

    test('Deve exibir erro se as senhas não coincidem', async ({ page }) => {
        await page.getByPlaceholder(/nome completo/i).fill('João Silva');
        await page.getByPlaceholder(/seu email/i).fill('teste@exemplo.com');
        await page.getByPlaceholder('Sua senha', { exact: true }).fill('Senha@123');
        await page.getByPlaceholder('Confirme sua senha', { exact: true }).fill('Senha@124');

        await expect(page.getByText(/as senhas não coincidem/i)).toBeVisible();

        const submitBtn = page.getByText(/cadastrar-se/i);
        if (!(await submitBtn.isDisabled())) {
            await submitBtn.click();
            await expect(page.getByText(/as senhas não coincidem/i)).toBeVisible();
        }
    });

    test('Deve exibir erro se a senha não atender aos critérios de segurança', async ({ page }) => {
        const passwordInput = page.getByPlaceholder('Sua senha', { exact: true });
        const confirmInput = page.getByPlaceholder('Confirme sua senha', { exact: true });
        const securityErrorMessage = /A senha deve ter entre 8 e 20 caracteres, maiúscula, minúscula, número ou especial/i;

        // 1. Sem letra maiúscula
        await passwordInput.fill('senha@123');
        await confirmInput.fill('senha@123');
        await expect(page.getByText(securityErrorMessage)).toBeVisible();

        // 2. Sem número
        await passwordInput.fill('Senha@abc');
        await confirmInput.fill('Senha@abc');
        await expect(page.getByText(securityErrorMessage)).toBeVisible();

        // 3. Sem caractere especial
        await passwordInput.fill('Senha1234');
        await confirmInput.fill('Senha1234');
        await expect(page.getByText(securityErrorMessage)).toBeVisible();

        // 4. Menos de 8 caracteres
        await passwordInput.fill('Sen@1');
        await confirmInput.fill('Sen@1');
        await expect(page.getByText(securityErrorMessage)).toBeVisible();

        // 5. Mais de 20 caracteres
        await passwordInput.fill('SenhaMuitoLonga@123456');
        await confirmInput.fill('SenhaMuitoLonga@123456');
        await expect(page.getByText(securityErrorMessage)).toBeVisible();
    });

    test('Deve validar o limite máximo de 20 caracteres para a senha', async ({ page }) => {
        const securityErrorMessage = /A senha deve ter entre 8 e 20 caracteres, maiúscula, minúscula, número ou especial/i;
        const longPassword = 'Senha@123' + 'a'.repeat(15); // > 20
        await page.getByPlaceholder('Sua senha', { exact: true }).fill(longPassword);
        // Verifica se houve restrição ou erro
        await expect(page.getByText(securityErrorMessage)).toBeVisible();
    });
});
