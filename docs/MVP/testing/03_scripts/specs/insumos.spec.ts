import { test, expect, Page } from '@playwright/test';
import { TEST_INSUMO } from '../utils/test-data';

test.describe('Módulo Insumos', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/insumos');
    await page.waitForSelector('table');
  });

  test.describe('Listado y Navegación', () => {
    
    test('Paso 1: El módulo carga correctamente', async ({ page }) => {
      // Validar URL
      await expect(page).toHaveURL('/insumos');
      
      // Validar sidebar activo
      const sidebarInsumos = page.locator('aside').getByText('Insumos');
      await expect(sidebarInsumos).toHaveAttribute('aria-current', 'page');
      
      // Validar tabla visible
      await expect(page.locator('table')).toBeVisible();
      
      // Validar filtros de stock
      await expect(page.getByRole('button', { name: /Todos/ })).toBeVisible();
      await expect(page.getByRole('button', { name: /OK/ })).toBeVisible();
      await expect(page.getByRole('button', { name: /Bajo/ })).toBeVisible();
      await expect(page.getByRole('button', { name: /Crítico/ })).toBeVisible();
      await expect(page.getByRole('button', { name: /Sin unidades/ })).toBeVisible();
      
      // Validar botón Crear nuevo
      await expect(page.getByRole('button', { name: 'Crear nuevo' })).toBeVisible();
      
      // Screenshot
      await page.screenshot({ path: 'screenshots/current/01_insumos_list.png' });
    });

    test('Paso 2: La tabla muestra datos correctamente', async ({ page }) => {
      // Validar columnas
      const headers = ['Insumo', 'Categoría', 'Stock', 'Mínimo', 'Costo unitario', 'Nivel', 'Acciones'];
      for (const header of headers) {
        await expect(page.getByRole('columnheader', { name: header })).toBeVisible();
      }
      
      // Validar formato de moneda (ej: $ 8,80)
      const costoCell = page.locator('tbody tr').first().locator('td').nth(4);
      await expect(costoCell).toHaveText(/\$ \d{1,3},\d{2}/);
      
      // Validar botones de acción
      const firstRowActions = page.locator('tbody tr').first().getByRole('cell').last();
      await expect(firstRowActions.getByRole('button', { name: 'Editar' })).toBeVisible();
      await expect(firstRowActions.getByRole('button', { name: 'Eliminar' })).toBeVisible();
      
      // Screenshot
      await page.screenshot({ path: 'screenshots/current/02_insumos_table.png' });
    });

  });

  test.describe('Filtros', () => {

    test('Paso 3: Filtros de stock funcionan', async ({ page }) => {
      // Click en "OK"
      await page.getByRole('button', { name: /^OK/ }).click();
      await expect(page.getByRole('button', { name: /^OK/ })).toHaveAttribute('aria-pressed', 'true');
      await page.screenshot({ path: 'screenshots/current/03_filtro_ok.png' });
      
      // Click en "Bajo"
      await page.getByRole('button', { name: /^Bajo/ }).click();
      await expect(page.getByRole('button', { name: /^Bajo/ })).toHaveAttribute('aria-pressed', 'true');
      await page.screenshot({ path: 'screenshots/current/04_filtro_bajo.png' });
      
      // Resetear con "Todos"
      await page.getByRole('button', { name: /^Todos/ }).click();
      await expect(page.getByRole('button', { name: /^Todos/ })).toHaveAttribute('aria-pressed', 'true');
    });

    test('Paso 4: Filtros de categoría funcionan', async ({ page }) => {
      // Validar formato de categorías (· en vez de caracteres rotos)
      const categoriaButton = page.locator('button').filter({ hasText: /Papel/ }).first();
      await expect(categoriaButton).toContainText('·');
      
      // Click en categoría "Papel"
      await categoriaButton.click();
      await page.waitForTimeout(300);
      
      // Validar que solo se muestran insumos de papel
      const rows = page.locator('tbody tr');
      const rowCount = await rows.count();
      expect(rowCount).toBeGreaterThan(0);
      
      await page.screenshot({ path: 'screenshots/current/05_filtro_categoria.png' });
      
      // Resetear con "Todas"
      await page.getByRole('button', { name: 'Todas' }).click();
    });

  });

  test.describe('CRUD - Crear', () => {

    test('Pasos 5-8: Crear nuevo insumo', async ({ page }) => {
      // Paso 5: Abrir overlay de creación
      await page.getByRole('button', { name: 'Crear nuevo' }).click();
      
      // Validar overlay abierto
      const overlay = page.locator('div').filter({ hasText: /Nuevo/ }).first();
      await expect(overlay).toBeVisible();
      
      // Validar posicionamiento (left: 240px)
      const overlayBox = await overlay.boundingBox();
      expect(overlayBox?.x).toBe(240);
      
      await page.screenshot({ path: 'screenshots/current/06_overlay_create.png' });
      
      // Paso 6: Completar formulario
      const form = page.locator('form, [role="form"]').first();
      
      await form.getByLabel('Nombre').fill(TEST_INSUMO.nombre);
      await form.getByLabel('Categoría').selectOption({ label: TEST_INSUMO.categoria });
      await form.getByLabel('Unidad').fill(TEST_INSUMO.unidad);
      await form.getByLabel('Stock actual').fill(TEST_INSUMO.stockActual.toString());
      await form.getByLabel('Stock mínimo').fill(TEST_INSUMO.stockMinimo.toString());
      await form.getByLabel('Costo pack').fill(TEST_INSUMO.costoPaquete.toString());
      
      await page.screenshot({ path: 'screenshots/current/07_form_filled.png' });
      
      // Validar barra de stock
      const stockBar = form.locator('[data-testid="stock-bar"], .stock-bar').first();
      await expect(stockBar).toBeVisible();
      
      // Validar badge de nivel "OK"
      const nivelBadge = form.locator('[data-testid="nivel-badge"]').first();
      await expect(nivelBadge).toContainText('OK');
      
      // Paso 7: Validaciones - limpiar nombre y validar
      await form.getByLabel('Nombre').clear();
      await page.getByRole('button', { name: 'Guardar' }).click();
      
      // Validar error de validación
      const errorNombre = form.locator('[data-testid="error-nombre"]');
      await expect(errorNombre).toBeVisible();
      await expect(errorNombre).toHaveText(/requerido/i);
      
      await page.screenshot({ path: 'screenshots/current/08_validation_errors.png' });
      
      // Volver a completar nombre
      await form.getByLabel('Nombre').fill(TEST_INSUMO.nombre);
      
      // Paso 8: Guardar
      await page.getByRole('button', { name: 'Guardar' }).click();
      
      // Validar toast
      const toast = page.locator('[data-testid="toast"]').first();
      await expect(toast).toBeVisible();
      await expect(toast).toContainText('Insumo creado');
      
      // Validar overlay cerrado
      await expect(overlay).not.toBeVisible();
      
      // Validar insumo en tabla
      const newRow = page.locator('tbody tr').filter({ hasText: TEST_INSUMO.nombre });
      await expect(newRow).toBeVisible();
      
      await page.screenshot({ path: 'screenshots/current/09_insumo_created.png' });
    });

  });

  test.describe('CRUD - Editar', () => {

    test('Pasos 9-11: Editar insumo existente', async ({ page }) => {
      // Paso 9: Abrir overlay de edición
      const firstRow = page.locator('tbody tr').first();
      const insumoName = await firstRow.locator('td').first().textContent();
      
      await firstRow.getByRole('button', { name: 'Editar' }).click();
      
      const overlay = page.locator('div').filter({ hasText: insumoName! }).first();
      await expect(overlay).toBeVisible();
      
      // Validar datos precargados
      const form = overlay.locator('form, [role="form"]').first();
      const nombreInput = form.getByLabel('Nombre');
      await expect(nombreInput).toHaveValue(insumoName!);
      
      await page.screenshot({ path: 'screenshots/current/10_overlay_edit.png' });
      
      // Paso 10: Editar y guardar
      await form.getByLabel('Stock actual').clear();
      await form.getByLabel('Stock actual').fill('75');
      
      await form.getByLabel('Costo pack').clear();
      await form.getByLabel('Costo pack').fill('120');
      
      await page.getByRole('button', { name: 'Guardar' }).click();
      
      // Validar toast
      const toast = page.locator('[data-testid="toast"]').first();
      await expect(toast).toContainText('Insumo actualizado');
      
      // Validar overlay cerrado
      await expect(overlay).not.toBeVisible();
      
      await page.screenshot({ path: 'screenshots/current/11_insumo_updated.png' });
    });

    test('Paso 12: Dirty tracking funciona', async ({ page }) => {
      // Abrir overlay
      await page.locator('tbody tr').first().getByRole('button', { name: 'Editar' }).click();
      
      const overlay = page.locator('div').filter({ hasText: /.*/ }).first();
      const form = overlay.locator('form, [role="form"]').first();
      
      // Modificar campo
      await form.getByLabel('Stock actual').clear();
      await form.getByLabel('Stock actual').fill('99');
      
      // Validar botón Guardar habilitado
      const saveButton = page.getByRole('button', { name: 'Guardar' });
      await expect(saveButton).toBeEnabled();
      
      // Intentar cerrar sin guardar
      await page.getByRole('button', { name: 'Cerrar' }).click();
      
      // Validar diálogo de confirmación
      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible();
      await expect(dialog).toContainText(/sin guardar/i);
      
      await page.screenshot({ path: 'screenshots/current/12_dirty_tracking.png' });
      
      // Cancelar
      await dialog.getByRole('button', { name: 'Cancelar' }).click();
      await expect(dialog).not.toBeVisible();
      
      // Validar overlay aún abierto
      await expect(overlay).toBeVisible();
    });

  });

  test.describe('CRUD - Eliminar', () => {

    test('Paso 13: Eliminar insumo', async ({ page }) => {
      // Abrir overlay
      const firstRow = page.locator('tbody tr').first();
      const insumoName = await firstRow.locator('td').first().textContent();
      
      await firstRow.getByRole('button', { name: 'Editar' }).click();
      
      const overlay = page.locator('div').filter({ hasText: insumoName! }).first();
      await expect(overlay).toBeVisible();
      
      // Click en Eliminar
      await overlay.getByRole('button', { name: 'Eliminar' }).click();
      
      // Validar diálogo de confirmación
      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible();
      await expect(dialog).toContainText(/eliminar/i);
      
      await page.screenshot({ path: 'screenshots/current/13_delete_confirm.png' });
      
      // Confirmar eliminación
      await dialog.getByRole('button', { name: 'Eliminar' }).click();
      
      // Validar toast
      const toast = page.locator('[data-testid="toast"]').first();
      await expect(toast).toContainText('Insumo eliminado');
      
      // Validar overlay cerrado
      await expect(overlay).not.toBeVisible();
      
      // Validar insumo eliminado de tabla
      const deletedRow = page.locator('tbody tr').filter({ hasText: insumoName! });
      await expect(deletedRow).not.toBeVisible();
    });

  });

});
