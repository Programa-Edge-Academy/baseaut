import { expect, test } from '@playwright/test';

test('EP01 - Login apenas o email vazio deve mostrar erro no email', async({page}) =>{
    await page.goto('/');

    await page.getByPlaceholder(/senha/i).fill('a');

    await page.getByText(/entrar/i).click();

    await expect(page.getByText(/email é obrigatório/i)).toBeVisible();
});