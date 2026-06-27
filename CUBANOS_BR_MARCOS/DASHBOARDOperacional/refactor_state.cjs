const fs = require('fs');
const path = './src/components/ClientView.jsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add useQueryClient import
content = content.replace(
  "import useClientData from '../hooks/useClientData';",
  "import useClientData from '../hooks/useClientData';\nimport { useQueryClient, useQuery } from '@tanstack/react-query';"
);

// 2. Replace state definitions
const stateRegex = /  const \[client, setClient\] = useState\(null\);\n[\s\S]*?const \[loading, setLoading\] = useState\(true\);/;
content = content.replace(
  stateRegex,
  `  const queryClient = useQueryClient();
  const { client, categories: categorias, fields: campos, clientData: clienteDatos, relations: relaciones, documents: documentos, entradas, duplicateContacts, isLoading } = useClientData(clientId);
  
  const { data: allClientes = [] } = useQuery({
    queryKey: ['allClientesBase'],
    queryFn: async () => {
      const { data } = await supabase.from('clientes').select('id, nombre, cpf');
      return data || [];
    }
  });`
);

// 3. Replace fetchClientData definition
const fetchClientRegex = /  const fetchClientData = useCallback\(async \(fullReload = false\) => \{[\s\S]*?  \}, \[clientId\]\);\n\n  const handleMergeComplete = async \(mergedData, keepContactId\) => \{/;
content = content.replace(
  fetchClientRegex,
  `  const fetchClientData = async (fullReload = false) => {
    await queryClient.invalidateQueries();
  };

  const handleMergeComplete = async (mergedData, keepContactId) => {`
);

// 4. Delete the duplicated contact state (it's now provided by the hook)
content = content.replace(
  "  const [duplicateContacts, setDuplicateContacts] = useState([]);\n",
  ""
);

// 5. Delete the use effect for fetchClientData
content = content.replace(
  "  useEffect(() => { fetchClientData(true); }, [clientId]);\n",
  ""
);

// 6. Replace loading -> isLoading
content = content.replace(/if \(loading\) \{/g, 'if (isLoading) {');

// 7. Fix manual state setters (they are optimistic updates or now useless)
content = content.replace(
  "setRelaciones(prev => prev.map(r => r.id === relId ? { ...r, tipo_relacion: newType } : r));",
  "queryClient.invalidateQueries({ queryKey: ['relations', clientId] });"
);
content = content.replace(
  "setDocumentos(prev => prev.map(d => d.id === doc.id ? { ...d, estado: newEstado } : d));",
  "queryClient.invalidateQueries({ queryKey: ['documents', clientId] });"
);
content = content.replace(
  "setEntradas(prev => prev.map(e => e.id === entradaId ? { ...e, estado_tramite: newState } : e));",
  "queryClient.invalidateQueries({ queryKey: ['entradas', clientId] });"
);
content = content.replace(
  "setDuplicateContacts([]);",
  "queryClient.invalidateQueries({ queryKey: ['duplicateContacts'] });"
);

fs.writeFileSync(path, content);
console.log('State migration complete');
