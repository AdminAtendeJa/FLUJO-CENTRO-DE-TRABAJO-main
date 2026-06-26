import React, { useMemo } from 'react';
import { Search } from 'lucide-react';

// Componente para búsqueda eficiente de clientes
const ClientSearch = ({
    searchQuery,
    setSearchQuery,
    clientes,
    onClientSelect
}) => {
    // Usar useMemo para optimizar la búsqueda
    const filteredClientes = useMemo(() => {
        if (!searchQuery) return clientes;

        const q = searchQuery.toLowerCase().trim();
        if (q.length < 2) return []; // Evitar búsquedas con menos de 2 caracteres

        // Búsqueda solo en campos específicos para mejorar rendimiento
        return clientes.filter(cliente =>
            cliente.nombre?.toLowerCase().includes(q) ||
            cliente.cpf?.includes(q) ||
            cliente.email?.toLowerCase().includes(q)
        ).slice(0, 50); // Limitar resultados para rendimiento
    }, [searchQuery, clientes]);

    return (
        <div className="relative">
            <div className="relative">
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar clientes por nombre, CPF o email..."
                    className="w-full px-4 py-3 pl-12 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
            </div>

            {searchQuery && filteredClientes.length > 0 && (
                <div className="absolute z-10 mt-2 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredClientes.map(cliente => (
                        <div
                            key={cliente.id}
                            onClick={() => {
                                onClientSelect(cliente);
                                setSearchQuery(''); // Limpiar búsqueda después de seleccionar
                            }}
                            className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                        >
                            <div className="font-medium text-gray-900 dark:text-white truncate">
                                {cliente.nombre}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                {cliente.cpf} • {cliente.email}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {searchQuery && filteredClientes.length === 0 && searchQuery.length >= 2 && (
                <div className="absolute z-10 mt-2 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4">
                    <p className="text-gray-500 dark:text-gray-400 text-center">No se encontraron clientes</p>
                </div>
            )}
        </div>
    );
};

export default ClientSearch;