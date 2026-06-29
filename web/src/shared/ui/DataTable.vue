<script setup lang="ts">
export interface Column {
  key: string
  label: string
  align?: 'left' | 'center' | 'right'
  width?: string
}

withDefaults(
  defineProps<{
    columns: Column[]
    rows: any[]
    loading?: boolean
    emptyText?: string
  }>(),
  {
    loading: false,
    emptyText: 'No se encontraron resultados',
  }
)

</script>

<template>
  <div class="w-full overflow-x-auto border border-border rounded-lg bg-surface shadow-1">
    <table class="w-full border-collapse">
      <thead>
        <tr class="bg-page-bg/50">
          <th
            v-for="col in columns"
            :key="col.key"
            class="text-11 uppercase tracking-[0.06em] text-ink-muted font-semibold px-4 py-3 border-b border-border select-none text-left"
            :style="col.width ? { width: col.width } : {}"
          >
            {{ col.label }}
          </th>
        </tr>
      </thead>
      <tbody class="divide-y divide-border">
        <template v-if="loading">
          <tr>
            <td :colspan="columns.length" class="text-center py-8 text-13 text-ink-muted">
              Cargando datos...
            </td>
          </tr>
        </template>
        <template v-else-if="rows.length === 0">
          <tr>
            <td :colspan="columns.length" class="text-center py-8 text-13 text-ink-muted">
              <slot name="empty">
                {{ emptyText }}
              </slot>
            </td>
          </tr>
        </template>
        <template v-else>
          <tr
            v-for="(row, idx) in rows"
            :key="row.id || idx"
            class="hover:bg-page-bg/40 transition-colors duration-75"
          >
            <slot name="row" :item="row" :index="idx" />
          </tr>
        </template>
      </tbody>
    </table>
  </div>
</template>
