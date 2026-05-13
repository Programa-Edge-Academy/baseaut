import { defineConfig } from '@playwright/test';


export default defineConfig({
    // Define o diretório dos testes
    testDir: './tests/e2e',
    // Define que será feito um teste por vez
    workers: 1,
    // Define a URL base dos testes
    use: {
        baseURL: 'http://localhost:8081'
    },
    // Comando para abrir o servidor automaticamente via web e rodar o teste
    webServer: {
        command: 'npx expo start --web --port 8081',
        url: 'http://localhost:8081',
        reuseExistingServer: true,
        // Tempo que ele espera o servidor responder para começar os testes, dado em segundos
        timeout: 300_000,
    },
});