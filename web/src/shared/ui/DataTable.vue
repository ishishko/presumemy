<script setup lang="ts">
type Align = 'left' | 'center' | 'right'

interface Column {
  key: string
  label: string
  align?: Align
  width?: string
}

const props = defineProps<{
  columns: Column[]
  rows: any[]
  emptyText?: string
}>()

const ALIGN_MAP: Record<Align, string> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
}
</script>

<template>
  <div class="bg-surface border border-border rounded-lg overflow-hidden">
    <table class="w-full">
      <thead>
        <tr class="border-b border-border bg-page-bg">
          <th
            v-for="col in columns"
            :key="col.key"
            class="px-4 py-3 text-12 font-medium text-ink-muted uppercase tracking-0.06em"
            :class="ALIGN_MAP[col.align || 'left']"
            :style="col.width ? { width: col.width } : {}"
          >
            {{ col.label }}
          </th>
        </tr>
      </thead>
      <tbody>
        <template v-if="rows.length > 0">
          <tr v-for="(item, idx) in rows" :key="idx">
            <slot name="row" :item="item" :index="idx" />
          </tr>
        </template>
        <tr v-else>
          <td :colspan="columns.length" class="px-4 py-8 text-center text-13 text-ink-muted">
            {{ emptyText || 'Sin datos' }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
