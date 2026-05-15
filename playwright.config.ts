import { defineConfig, devices } from '@playwright/test';


export default defineConfig({
    // Define o diretório dos testes
    testDir: './tests/e2e',
    // Define que será feito um teste por vez
    workers: 1,


    // Define a URL base dos testes
    use: {
        baseURL: 'http://localhost:8081',

        // Tira screenshot quando falha
        screenshot: 'only-on-failure',

        // Grava vídeo quando falha
        video: 'retain-on-failure',

        // Tenta abrir traces úteis para debug
        trace: 'on-first-retry'
    },

    // Dispositivos que irão testar
    projects: 
    [
        // web
        {
            name: 'Desktop Chrome',
            use: {
                ...devices['Desktop Chrome'],
            }, 
        },

        // iPhone
        {
            name: 'iPhone 13',
            use: {
                ...devices['iPhone13'],
            },
        },

        // Android
        {
            name: 'Pixel 7',
            use: {
                ...devices['Pixel 7'],
            },
        },
    ],

    // Comando para abrir o servidor automaticamente via web e rodar o teste
    webServer: {
        command: 'npx expo start --web --port 8081',
        url: 'http://localhost:8081',
        reuseExistingServer: true,
        // Tempo que ele espera o servidor responder para começar os testes, dado em segundos
        timeout: 3600_000,
    },
});