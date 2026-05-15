import { test, expect } from '@playwright/test';

test.describe('US01.1 - Validação do Campo de Senha', () => {
    
    test.beforeEach(async ({ page }) => {
        // Inicia na página de login
        await page.goto('/');
        // Garante que o formulário está visível
        await expect(page.getByText(/entre na sua conta/i)).toBeVisible();
    });

    test('O campo de senha deve ser obrigatório', async ({ page }) => {
        // Preenche o email para isolar o erro de senha
        await page.getByPlaceholder(/email/i).fill('teste@baseaut.com');
        
        // Clica no botão Entrar (usando getByText para maior compatibilidade com RipplePressable)
        await page.getByText(/entrar/i).click();

        // Verifica a mensagem de erro de campo obrigatório
        await expect(page.getByText(/senha é obrigatória/i)).toBeVisible();
    });

    test('O campo de senha deve aceitar entre 8 e 20 caracteres', async ({ page }) => {
        const passwordInput = page.getByPlaceholder(/senha/i);
        
        // Caso 1: Menos de 8 caracteres
        await passwordInput.fill('1234567');
        await page.getByText(/entrar/i).click();
        await expect(page.locator('text=/8 a 20 caracteres|mínimo.*8/i').first()).toBeVisible();

        // Caso 2: Limite inferior (8 caracteres) - deve ser aceito (sem erro de tamanho)
        await passwordInput.fill('12345678');
        await page.getByText(/entrar/i).click();
        await expect(page.locator('text=/8 a 20 caracteres|mínimo.*8/i')).not.toBeVisible();

        // Caso 3: Limite superior (20 caracteres) - deve ser aceito
        await passwordInput.fill('a'.repeat(20));
        await page.getByText(/entrar/i).click();
        await expect(page.locator('text=/8 a 20 caracteres|máximo.*20/i')).not.toBeVisible();

        // Caso 4: Mais de 20 caracteres
        await passwordInput.fill('a'.repeat(21));
        const value = await passwordInput.inputValue();
        
        if (value.length > 20) {
            await page.getByText(/entrar/i).click();
            await expect(page.locator('text=/8 a 20 caracteres|máximo.*20/i').first()).toBeVisible();
        } else {
            expect(value.length).toBe(20);
        }
    });

    test('O campo de senha deve permitir letras maiúsculas, minúsculas, números e caracteres especiais', async ({ page }) => {
        const passwordInput = page.getByPlaceholder(/senha/i);
        const complexPassword = 'Aa1!@#$%^&*()_+';
        
        await passwordInput.fill(complexPassword);
        
        // Verifica se o valor foi inserido corretamente
        await expect(passwordInput).toHaveValue(complexPassword);
        
        // Verifica se não há erro de complexidade para uma senha válida
        await expect(page.locator('text=/maiúscula, minúscula, número ou especial/i')).not.toBeVisible();
    });

    test('O campo de senha deve exibir caracteres ocultos por padrão e possuir ícone de visualização', async ({ page }) => {
        const passwordInput = page.getByPlaceholder(/senha/i);
        
        // Verifica se o tipo do input é password por padrão
        await expect(passwordInput).toHaveAttribute('type', 'password');

        // Localiza o ícone/botão de visibilidade dentro do container do input de senha
        // No Expo Web, o Pressable pode aparecer como div[role="button"] ou img/svg com cursor pointer
        const toggleButton = page.locator('div').filter({ has: passwordInput }).locator('img, svg, [role="button"]').last();
        await expect(toggleButton).toBeVisible();
    });

    test('Deve alternar entre senha oculta e visível sem apagar o conteúdo digitado', async ({ page }) => {
        const passwordInput = page.getByPlaceholder(/senha/i);
        const testPassword = 'MinhaSenhaSegura123!';
        
        // Localiza o botão de toggle de forma mais robusta
        const toggleButton = page.locator('div').filter({ has: passwordInput }).locator('img, svg, [role="button"]').last();

        // Preenche a senha
        await passwordInput.fill(testPassword);

        // 1. Alterna para visível
        await toggleButton.click();
        // No React Native Web, secureTextEntry={false} pode remover o atributo 'type' (valor default é text)
        const type = await passwordInput.getAttribute('type');
        expect(type === 'text' || type === null || type === '').toBeTruthy();
        await expect(passwordInput).toHaveValue(testPassword);

        // 2. Alterna de volta para oculto
        await toggleButton.click();
        await expect(passwordInput).toHaveAttribute('type', 'password');
        await expect(passwordInput).toHaveValue(testPassword);
    });
});

