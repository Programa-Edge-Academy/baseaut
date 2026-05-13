import { expect, test } from '@playwright/test';

test('EP01 - Login com credenciais inválidas',async({page}) => {
    await page.goto('/');

    await page.getByPlaceholder(/email/i).fill('email@teste.com');

    await page.getByPlaceholder(/senha/i).fill('senhaaleatoria');

    await page.getByText(/entrar/i).click();

    await expect(page.getByText(/invalid login credentials/i)).toBeVisible();
});