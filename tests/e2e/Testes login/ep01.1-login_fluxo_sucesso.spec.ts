import { test, expect } from '@playwright/test';

test.describe('US01 - Autenticação com Credenciais Válidas', () => {
    
    test.beforeEach(async ({ page }) => {
        // Aceita automaticamente diálogos do sistema (alerts)
        page.on('dialog', dialog => dialog.accept());
        
        await page.goto('/');
    });

    test('Deve autenticar usuário com credenciais válidas e redirecionar para o dashboard', async ({ page }) => {
        const emailInput = page.getByPlaceholder(/email/i);
        const passwordInput = page.getByPlaceholder(/senha/i);
        const btnSubmit = page.getByText(/entrar/i);

        // Preenche credenciais (Use o usuário que você criou no Supabase se for diferente deste)
        await emailInput.fill('teste14@gmail.com');
        await passwordInput.fill('teste14');

        await btnSubmit.click();

        // 1. Valida redirecionamento para a URL de alunos
        await expect(page).toHaveURL(/.*students/);

        // 2. Valida se a tela de "Início" carregou (conforme students-screen.tsx)
        await expect(page.getByText(/início/i).first()).toBeVisible();
        await expect(page.getByText(/selecione um aluno/i)).toBeVisible();
    });

    test('Deve manter a sessão segura após o redirecionamento (Persistência)', async ({ page }) => {
        await page.getByPlaceholder(/email/i).fill('teste14@gmail.com');
        await page.getByPlaceholder(/senha/i).fill('teste14');
        await page.getByText(/entrar/i).click();

        // Aguarda estar na tela de alunos
        await expect(page).toHaveURL(/.*students/);

        // 1. Recarrega a página para testar a persistência da sessão
        await page.reload();

        // 2. Se a sessão for segura e persistente, o usuário deve continuar na tela de alunos
        // e não ser jogado de volta para o login
        await expect(page).toHaveURL(/.*students/);
        await expect(page.getByText(/início/i).first()).toBeVisible();
    });
});

