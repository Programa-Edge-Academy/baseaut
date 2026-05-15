import { expect, test } from '@playwright/test';

test.describe('EP01 - Validações do Campo de E-mail', () => {
    
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
    });

    test('Deve validar que o e-mail é obrigatório', async ({ page }) => {
        await page.getByPlaceholder(/senha/i).fill('senha123');
        await page.getByText(/entrar/i).click();

        await expect(page.getByText(/email é obrigatório/i)).toBeVisible();
    });

    test('Deve validar formato inválido de e-mail', async ({ page }) => {
        await page.getByPlaceholder(/email/i).fill('email_invalido');
        await page.getByPlaceholder(/senha/i).fill('senha123');
        await page.getByText(/entrar/i).click();

        // Nota: O sistema deve exibir uma mensagem indicando formato inválido
        await expect(page.getByText(/email inválido/i)).toBeVisible();
    });

    test('Deve permitir no máximo 254 caracteres no e-mail', async ({ page }) => {
        const tooLongEmail = 'a'.repeat(246) + '@teste.com'; // 255 caracteres

        const emailInput = page.getByPlaceholder(/email/i);

        // Tenta preencher e verifica se a aplicação limita a entrada
        await emailInput.fill(tooLongEmail);
        const value = await emailInput.inputValue();
        
        // Se a aplicação não tiver maxlength, este teste continuará falhando para apontar o erro
        expect(value.length).toBeLessThanOrEqual(254);
    });

    test('Deve remover espaços em branco no início e no fim do e-mail', async ({ page }) => {
        // Simula um e-mail válido com espaços
        await page.getByPlaceholder(/email/i).fill('  qa.teste@email.com  ');
        await page.getByPlaceholder(/senha/i).fill('teste14');
        await page.getByText(/entrar/i).click();

        // Se o trim funcionar, o login deve prosseguir para a página de students
        await expect(page).toHaveURL(/students/i);
    });

    test('Deve exibir teclado adequado para e-mail (web/mobile)', async ({ page }) => {
        const emailInput = page.getByPlaceholder(/email/i);
        
        // Em aplicações React Native Web, keyboardType="email-address" mapeia para type="email" ou inputmode="email"
        const type = await emailInput.getAttribute('type');
        const inputMode = await emailInput.getAttribute('inputmode');
        
        expect(type === 'email' || inputMode === 'email').toBeTruthy();
    });
});
