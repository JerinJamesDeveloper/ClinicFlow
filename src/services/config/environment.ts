// src/services/config/environment.ts
interface Environment {
  API_URL: string;
  WS_URL: string;
  ENV: 'development' | 'staging' | 'production';
  API_TIMEOUT: number;
}

const environments: Record<string, Environment> = {
  development: {
    API_URL: 'http://localhost:8000/v1',
    WS_URL: 'ws://localhost:8000/ws',
    ENV: 'development',
    API_TIMEOUT: 30000,
  },
  staging: {
    API_URL: 'https://staging-api.clinicflow.com/v1',
    WS_URL: 'wss://staging-api.clinicflow.com/ws',
    ENV: 'staging',
    API_TIMEOUT: 30000,
  },
  production: {
    API_URL: 'https://api.clinicflow.com/v1',
    WS_URL: 'wss://api.clinicflow.com/ws',
    ENV: 'production',
    API_TIMEOUT: 30000,
  },
};

export const environment = environments[import.meta.env.MODE || 'development'];