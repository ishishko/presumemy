import { Page, expect } from '@playwright/test';

/**
 * Helper para autenticación en la aplicación
 */

export async function login(page: Page, email?: string, password?: string) {
  const testEmail = email || 'shimbo@test.com';
  const testPassword = password || 'shimbo123';

  await page.goto('/login');
  
  // Completar formulario de login
  await page.getByLabel('Email').fill(testEmail);
  await page.getByLabel('Contraseña').fill(testPassword);
  
  // Click en botón de login
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  
  // Esperar redirección al dashboard
  await page.waitForURL('/dashboard');
  
  // Validar que el login fue exitoso
  await expect(page.locator('h1')).toContainText('Hola');
}

export async function logout(page: Page) {
  // Click en menú de usuario
  await page.getByRole('button', { name: /shimbo|usuario/i }).click();
  
  // Click en cerrar sesión
  await page.getByRole('menuitem', { name: 'Cerrar sesión' }).click();
  
  // Esperar redirección al login
  await page.waitForURL('/login');
}

/**
 * Helper para verificar estado de autenticación
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  try {
    await page.waitForURL('**/dashboard', { timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}
