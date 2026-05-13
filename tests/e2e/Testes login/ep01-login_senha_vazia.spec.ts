import { expect, test } from '@playwright/test';

test('EP01 - Login com apenas senha vazia deve mostrar erro',async({page}) => {
    await page.goto('/');

    await page.getByPlaceholder(/email/i).fill('a');

    await page.getByText(/entrar/i).click();

    await expect(page.getByText(/senha é obrigatória/i)).toBeVisible();
});