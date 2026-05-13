import { expect, test } from '@playwright/test';

test('EP01 - Login com credenciais válidas', async({page}) => {
    await page.goto('/');

    await page.getByPlaceholder(/email/i).fill('qa.teste@email.com');

    await page.getByPlaceholder(/senha/i).fill('teste14');

    await page.getByText(/entrar/i).click();

    await expect(page).toHaveURL(/students/i);
});