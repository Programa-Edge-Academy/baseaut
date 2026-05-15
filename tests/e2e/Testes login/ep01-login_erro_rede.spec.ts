import { expect, test } from '@playwright/test';

test('EP01 - erro de conexão no login', async ({ page }) => {

    // intercepta requests do Supabase
    await page.route('**/auth/v1/token**', async route => {

        // força falha de rede
        await route.abort();
    });

    await page.goto('/');

    await page.getByPlaceholder(/email/i)
        .fill('qa_monitorlogin@email.com');

    await page.getByPlaceholder(/senha/i)
        .fill('teste14');

    await page.getByText(/entrar/i).click();

    // verifica mensagem de erro
    await expect(
        page.getByText(/failed to fetch/i)
    ).toBeVisible();
});