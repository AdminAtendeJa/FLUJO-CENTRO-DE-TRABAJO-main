// src/mockData.js
export const categorias = [
  { id: 1, codigo: 'INFORMACIONES_PERSONALES', nombre: 'Informaciones Personales', descripcion: 'Datos personales básicos', color: '#FF6B6B', icono: 'User' },
  { id: 2, codigo: 'DATOS_FAMILIARES', nombre: 'Datos Familiares', descripcion: 'Información de familiares', color: '#4ECDC4', icono: 'Users' },
  { id: 3, codigo: 'DOCUMENTOS_IDENTIDAD', nombre: 'Documentos de Identidad', descripcion: 'CPF, RG, etc.', color: '#45B7D1', icono: 'FileText' },
  { id: 4, codigo: 'DIRECCION', nombre: 'Dirección', descripcion: 'Datos de residencia', color: '#F9A826', icono: 'MapPin' },
];

export const campos = {
  1: [
    { id: 1, nombre_campo: 'Nombre Completo', tipo_campo: 'texto', requerido: true, permite_documento: false },
    { id: 2, nombre_campo: 'Fecha Nacimiento', tipo_campo: 'fecha', requerido: true, permite_documento: false },
    { id: 3, nombre_campo: 'Estado Civil', tipo_campo: 'select', opciones: '["Soltero", "Casado", "Divorciado", "Viudo"]', requerido: true, permite_documento: false },
    { id: 4, nombre_campo: 'Profesión', tipo_campo: 'texto', requerido: false, permite_documento: false },
    { id: 5, nombre_campo: 'Nacionalidad', tipo_campo: 'texto', requerido: false, permite_documento: false }
  ],
  2: [
    { id: 6, nombre_campo: 'Nombre de la Madre', tipo_campo: 'texto', requerido: false, permite_documento: false },
    { id: 7, nombre_campo: 'Nombre del Padre', tipo_campo: 'texto', requerido: false, permite_documento: false },
  ],
  3: [
    { id: 8, nombre_campo: 'CPF', tipo_campo: 'texto', requerido: true, permite_documento: true },
    { id: 9, nombre_campo: 'RG', tipo_campo: 'texto', requerido: false, permite_documento: true },
    { id: 10, nombre_campo: 'Pasaporte', tipo_campo: 'texto', requerido: false, permite_documento: true }
  ],
  4: [
    { id: 11, nombre_campo: 'CEP', tipo_campo: 'texto', requerido: false, permite_documento: true },
    { id: 12, nombre_campo: 'Dirección Completa', tipo_campo: 'texto', requerido: false, permite_documento: false },
  ]
};

export const clientes = [
  { id: 1, id_kommo: 'K-001', fecha: '2026-06-20', cpf: '123.456.789-00', nombre: 'Juan Díaz', telefono: '+5511999999999', email: 'juan@email.com', valor_total: 1500, pais: 'Brasil', ciudad: 'São Paulo', estado: 'SP', canal_adquisicion: 'Instagram', atendente: 'Admin', creado_en: '2026-06-20T10:00:00Z', estado_cliente: 'nuevo' },
  { id: 2, id_kommo: 'K-002', fecha: '2026-06-21', cpf: '987.654.321-11', nombre: 'Maria Silva', telefono: '+5511888888888', email: 'maria@email.com', valor_total: 800, pais: 'Brasil', ciudad: 'Rio de Janeiro', estado: 'RJ', canal_adquisicion: 'Facebook', atendente: 'Admin', creado_en: '2026-06-21T11:00:00Z', estado_cliente: 'verificado' },
  { id: 3, id_kommo: null, fecha: '2026-06-22', cpf: '456.789.123-22', nombre: 'Carlos Díaz', telefono: null, email: null, valor_total: 0, pais: 'Brasil', ciudad: 'São Paulo', estado: 'SP', canal_adquisicion: 'Recomendación', atendente: 'Admin', creado_en: '2026-06-22T09:00:00Z', estado_cliente: 'nuevo' } // Familiar de Juan
];

export const clienteDatos = {
  1: [
    { id: 1, campo_id: 1, valor: 'Juan Díaz', completado: true },
    { id: 2, campo_id: 2, valor: '1990-06-15', completado: true },
    { id: 3, campo_id: 3, valor: 'Soltero', completado: true },
    { id: 4, campo_id: 8, valor: '123.456.789-00', completado: true },
    { id: 5, campo_id: 6, valor: 'Ana María', completado: true }
  ],
  2: [
    { id: 6, campo_id: 1, valor: 'Maria Silva', completado: true },
    { id: 7, campo_id: 8, valor: '987.654.321-11', completado: true }
  ],
  3: [
    { id: 8, campo_id: 1, valor: 'Carlos Díaz', completado: true },
    { id: 9, campo_id: 8, valor: '456.789.123-22', completado: true },
    { id: 10, campo_id: 3, valor: 'Casado', completado: true }
  ]
};

export const documentos = {
  1: [
    { id: 1, dato_operacional_id: 4, tipo_documento: 'FOTO', nombre_archivo: 'cpf_frente.jpg', estado: 'verificado' },
    { id: 2, dato_operacional_id: null, tipo_documento: 'COMPROBANTE', nombre_archivo: 'comprobante_residencia.pdf', estado: 'pendiente' }
  ]
};

export const relaciones = [
  { id: 1, cliente_id: 1, cliente_relacionado_id: 3, tipo_relacion: 'hermano', descripcion: 'Hermano mayor' }
];

export const entradas = [
  { id: 101, id_kommo: 'K-001', fecha: '2026-06-24', nombre_pix: 'JUAN DIAZ', valor: 1500, servicio: 'Regularización RNM', cliente: 'Juan Díaz', telefono: '+5511999999999', email: 'juan@email.com', cpf: '123.456.789-00', id_cliente: 1, estado_tramite: 'pendiente', operario: 'Admin' },
  { id: 102, id_kommo: 'K-002', fecha: '2026-06-23', nombre_pix: 'MARIA SILVA', valor: 800, servicio: 'Emisión CPF', cliente: 'Maria Silva', telefono: '+5511888888888', email: 'maria@email.com', cpf: '987.654.321-11', id_cliente: 2, estado_tramite: 'procesando', operario: 'Admin' },
  { id: 103, id_kommo: null, fecha: '2026-06-24', nombre_pix: 'JUAN DIAZ', valor: 500, servicio: 'Regularización RNM', cliente: 'Carlos Díaz', telefono: null, email: null, cpf: '456.789.123-22', id_cliente: 3, estado_tramite: 'pendiente', operario: 'Admin' }
];
