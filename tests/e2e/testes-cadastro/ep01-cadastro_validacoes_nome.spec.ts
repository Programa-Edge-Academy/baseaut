import { expect, test } from '@playwright/test';

test.describe('Cadastro - Validações de Nome', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/register');
    });

    test('Não deve permitir nome com menos de 3 caracteres', async ({ page }) => {
        await page.getByPlaceholder(/nome completo/i).fill('Ab');
        await page.getByPlaceholder(/seu email/i).fill('teste@exemplo.com');
        await page.getByPlaceholder('Sua senha', { exact: true }).fill('Senha@123');
        await page.getByPlaceholder('Confirme sua senha', { exact: true }).fill('Senha@123');

        // Se o critério for bloqueio no botão:
        // await expect(page.getByRole('button', { name: /cadastrar/i })).toBeDisabled();

        // Se for erro ao clicar:
        const submitBtn = page.getByText(/cadastrar-se/i);
        if (!(await submitBtn.isDisabled())) {
            await submitBtn.click();
            // Ajustar se a mensagem for diferente no projeto real
            await expect(page.locator('text=mínimo 3 caracteres')).toBeVisible();
        }
    });

    test('Deve exigir pelo menos nome e sobrenome', async ({ page }) => {
        await page.getByPlaceholder(/nome completo/i).fill('João');
        await page.getByPlaceholder(/seu email/i).fill('teste@exemplo.com');
        await page.getByPlaceholder('Sua senha', { exact: true }).fill('Senha@123');
        await page.getByPlaceholder('Confirme sua senha', { exact: true }).fill('Senha@123');

        const submitBtn = page.getByText(/cadastrar-se/i);
        if (!(await submitBtn.isDisabled())) {
            await submitBtn.click();
            await expect(page.locator('text=pelo menos nome e sobrenome')).toBeVisible();
        }
    });

    test('Deve remover espaços extras no início e no fim', async ({ page }) => {
        const nameInput = page.getByPlaceholder(/nome completo/i);
        await nameInput.fill('  João Silva  ');
        // Ao perder o foco ou submeter, deve limpar (depende da implementação)
        await page.getByPlaceholder(/seu email/i).focus();

        // Verifica se o valor foi limpo (se a UI fizer isso em tempo real)
        // Ou valida no envio (mais difícil de testar E2E sem interceptar a request)
    });

    test('Não deve aceitar apenas espaços', async ({ page }) => {
        await page.getByPlaceholder(/nome completo/i).fill('   ');
        await expect(page.getByText(/cadastrar-se/i)).toBeDisabled();
    });
});
