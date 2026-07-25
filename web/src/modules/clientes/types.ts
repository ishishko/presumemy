export interface Cliente {
  id: number
  nombre: string
  codigo: string
  domicilio?: Record<string, any>
  notas?: string
  activo: boolean
  contactos?: ClienteContacto[]
  totalPedidos?: number
  totalGastado?: number
}

export interface ClienteContacto {
  id: number
  clienteId: number
  canal: 'instagram' | 'whatsapp' | 'mail' | 'otros'
  valor: string
  esPrincipal: boolean
}
