const fs = require('fs');
const path = './src/hooks/useClientData.js';
let content = fs.readFileSync(path, 'utf8');

// Add findDuplicateContacts import
content = content.replace(
  "import { supabase } from '../supabaseClient';",
  "import { supabase } from '../supabaseClient';\nimport { findDuplicateContacts } from '../utils/contactUtils';"
);

// Add entradasQuery
content = content.replace(
  "// Query para obtener relaciones",
  `// Query para obtener entradas (trámites)\n    const entradasQuery = useQuery({\n        queryKey: ['entradas', clientId],\n        queryFn: async () => {\n            const { data, error } = await supabase\n                .from('entradas')\n                .select('*')\n                .eq('id_cliente', clientId)\n                .order('creado_en', { ascending: false });\n            if (error) throw new Error(error.message);\n            return data;\n        },\n        enabled: !!clientId,\n        staleTime: 2 * 60 * 1000,\n        cacheTime: 5 * 60 * 1000,\n    });\n\n    // Query para obtener relaciones`
);

// Add duplicateContactsQuery
content = content.replace(
  "// Query para obtener documentos",
  `// Query para obtener contactos duplicados\n    const duplicateContactsQuery = useQuery({\n        queryKey: ['duplicateContacts', clientQuery.data?.telefono],\n        queryFn: async () => {\n            if (!clientQuery.data?.telefono) return [];\n            return await findDuplicateContacts(clientQuery.data.telefono);\n        },\n        enabled: !!clientQuery.data?.telefono,\n        staleTime: 5 * 60 * 1000,\n        cacheTime: 10 * 60 * 1000,\n    });\n\n    // Query para obtener documentos`
);

// Update return statement
content = content.replace(
  "documents: documentsQuery.data,",
  "documents: documentsQuery.data,\n        entradas: entradasQuery.data,\n        duplicateContacts: duplicateContactsQuery.data,"
);

// Update isLoading and isError
content = content.replace(
  "clientDataQuery.isLoading || relationsQuery.isLoading || documentsQuery.isLoading,",
  "clientDataQuery.isLoading || relationsQuery.isLoading || documentsQuery.isLoading || entradasQuery.isLoading || duplicateContactsQuery.isLoading,"
);

content = content.replace(
  "clientDataQuery.isError || relationsQuery.isError || documentsQuery.isError,",
  "clientDataQuery.isError || relationsQuery.isError || documentsQuery.isError || entradasQuery.isError || duplicateContactsQuery.isError,"
);

content = content.replace(
  "clientDataQuery.error || relationsQuery.error || documentsQuery.error,",
  "clientDataQuery.error || relationsQuery.error || documentsQuery.error || entradasQuery.error || duplicateContactsQuery.error,"
);

fs.writeFileSync(path, content);
console.log('Hook patched');
