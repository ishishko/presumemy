/* global React */
// Demo data for the Presumemi prototype.

const CLIENTS = [
  "Marisol Aguirre", "Laura Domínguez", "Café del Centro", "Pau Hernández",
  "Familia Rojas", "Estudio Pétalo", "Andrea Vázquez", "Iván Castillo",
];

const PRODUCTS = [
  { id: "P-001", name: "Banderines pastel — 3 m",      cat: "Decoración",  price: 180,  stock: 22, tone: "lavender" },
  { id: "P-002", name: "Servilletas papel — pack 20",  cat: "Mesa",        price: 60,   stock: 84, tone: "mint" },
  { id: "P-003", name: "Vasos kraft 240 ml — pack 10", cat: "Mesa",        price: 75,   stock: 41, tone: "pink" },
  { id: "P-004", name: "Topper torta — letra",         cat: "Repostería",  price: 25,   stock: 130,tone: "yellow" },
  { id: "P-005", name: "Cono dulce kraft — pack 12",   cat: "Mesa",        price: 95,   stock: 8,  tone: "lavender" },
  { id: "P-006", name: "Globo número 60 cm",           cat: "Decoración",  price: 110,  stock: 18, tone: "pink" },
  { id: "P-007", name: "Caja sorpresa M",              cat: "Empaque",     price: 145,  stock: 27, tone: "mint" },
  { id: "P-008", name: "Confeti biodegradable 50 g",   cat: "Decoración",  price: 70,   stock: 60, tone: "yellow" },
];

const PRESUPUESTOS = [
  { folio: "P-1027", client: "Marisol Aguirre",  event: "Cumpleaños",    status: "borrador",  total: 1840,  date: "23 may" },
  { folio: "P-1026", client: "Estudio Pétalo",   event: "Corporativo",   status: "enviado",   total: 5260,  date: "22 may" },
  { folio: "P-1025", client: "Laura Domínguez",  event: "Baby shower",   status: "pendiente", total: 2340,  date: "21 may" },
  { folio: "P-1024", client: "Marisol Aguirre",  event: "Cumpleaños",    status: "pagado",    total: 4820,  date: "18 may" },
  { folio: "P-1023", client: "Andrea Vázquez",   event: "Boda",          status: "pagado",    total: 12480, date: "16 may" },
  { folio: "P-1022", client: "Café del Centro",  event: "Corporativo",   status: "vencido",   total: 7160,  date: "12 may" },
  { folio: "P-1021", client: "Familia Rojas",    event: "Bautizo",       status: "pagado",    total: 3420,  date: "08 may" },
  { folio: "P-1020", client: "Iván Castillo",    event: "Cumpleaños",    status: "pagado",    total: 1980,  date: "05 may" },
];

const INSUMOS = [
  { name: "Cinta dorada 5 m",        cat: "Decoración",  stock: 3,   min: 10, unit: "rollo" },
  { name: "Papel kraft 70 g",        cat: "Empaque",     stock: 8,   min: 15, unit: "pliego" },
  { name: "Listón satín 1 cm",       cat: "Decoración",  stock: 24,  min: 20, unit: "m" },
  { name: "Tinta dorada",            cat: "Impresión",   stock: 4,   min: 6,  unit: "bote" },
  { name: "Etiqueta circular 3 cm",  cat: "Empaque",     stock: 320, min: 100,unit: "u" },
  { name: "Pegamento blanco 250 ml", cat: "Insumo",      stock: 12,  min: 8,  unit: "bote" },
];

const STATUS_TONES = {
  borrador:  { tone: "default",  label: "Borrador"  },
  enviado:   { tone: "pink",     label: "Enviado"   },
  pendiente: { tone: "yellow",   label: "Pendiente" },
  pagado:    { tone: "mint",     label: "Pagado"    },
  vencido:   { tone: "coral",    label: "Vencido"   },
};

const money = (n) =>
  "$ " + n.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const moneyShort = (n) =>
  "$ " + Math.round(n).toLocaleString("es-MX");

Object.assign(window, { CLIENTS, PRODUCTS, PRESUPUESTOS, INSUMOS, STATUS_TONES, money, moneyShort });
