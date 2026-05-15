import { expect, test } from '@playwright/test';

test.describe('EP01 - Segurança e Integridade do Backend no Login', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('Critério 1: Validar as credenciais no servidor', async ({ page }) => {
    // Este teste valida se o servidor responde negativamente a credenciais que não existem
    await page.getByPlaceholder(/email/i).fill('usuario.inexistente@email.com');
    await page.getByPlaceholder(/senha/i).fill('SenhaInvalida123');
    
    const [response] = await Promise.all([
      page.waitForResponse(response => response.url().includes('supabase.co/auth/v1/token')),
      page.getByText(/entrar/i).click(),
    ]);

    // Valida que o servidor (Supabase) retornou um erro (400) e não autorizou
    expect(response.status()).toBe(400);
  });

  test('Critério 2: Não retornar a senha em nenhuma resposta', async ({ page }) => {
    // Intercepta a resposta de login bem-sucedido ou falho
    await page.getByPlaceholder(/email/i).fill('qa.teste@email.com');
    await page.getByPlaceholder(/senha/i).fill('teste14');

    const [response] = await Promise.all([
      page.waitForResponse(response => response.url().includes('supabase.co/auth/v1/token')),
      page.getByText(/entrar/i).click(),
    ]);

    const responseBody = await response.json();
    const responseString = JSON.stringify(responseBody);

    // Garante que o texto da senha ("teste14") não está presente no corpo da resposta JSON
    expect(responseString).not.toContain('teste14');
    // Garante que não existe um campo "password" no JSON retornado
    expect(responseBody).not.toHaveProperty('password');
  });

  test('Critério 3: Retornar erro genérico para credenciais inválidas', async ({ page }) => {
    // Cenário A: Email inexistente, Senha qualquer
    await page.getByPlaceholder(/email/i).fill('email.errado@email.com');
    await page.getByPlaceholder(/senha/i).fill('Senha123!');
    
    let errorEmailErrado = '';
    page.on('dialog', async dialog => {
      errorEmailErrado = dialog.message();
      await dialog.dismiss();
    });
    
    await page.getByText(/entrar/i).click();
    await page.waitForTimeout(2000);

    // Cenário B: Email correto, Senha errada
    await page.reload();
    await page.getByPlaceholder(/email/i).fill('qa.teste@email.com');
    await page.getByPlaceholder(/senha/i).fill('SenhaErrada!');
    
    let errorSenhaErrada = '';
    page.on('dialog', async dialog => {
      errorSenhaErrada = dialog.message();
      await dialog.dismiss();
    });
    
    await page.getByText(/entrar/i).click();
    await page.waitForTimeout(2000);

    // Valida se as mensagens de erro são idênticas (protege contra enumeração de usuários)
    // Nota: O Supabase costuma retornar "Invalid login credentials" para ambos.
    expect(errorEmailErrado).toBe(errorSenhaErrada);
    expect(errorEmailErrado).not.toMatch(/email|senha/i); // Não deve especificar qual campo está errado
  });

});
