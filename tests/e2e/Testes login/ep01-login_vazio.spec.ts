import { expect, test } from '@playwright/test';

test('EP01 - EP01 - Login com os campos de senha e e-mail deve mostrar erro em ambos', async({page}) => {
    await page.goto('/');

    await page.getByText(/entrar/i).click();

    await expect(page.getByText(/email é obrigatório/i)).toBeVisible();

    await expect(page.getByText(/senha é obrigatória/i)).toBeVisible();
});