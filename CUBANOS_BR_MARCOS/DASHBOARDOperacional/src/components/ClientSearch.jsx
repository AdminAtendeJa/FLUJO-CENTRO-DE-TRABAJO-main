import React, { useMemo, useState } from 'react';
import { Search, AlertTriangle } from 'lucide-react';
import { findDuplicateContacts } from '../utils/contactUtils';
import MergeContactsModal from './MergeContactsModal';

// Componente para búsqueda eficiente de clientes
const ClientSearch = ({
    searchQuery,
    setSearchQuery,
    clientes,
    onClientSelect
}) => {
    const [showMergeModal, setShowMergeModal] = useState(false);
    const [duplicateContacts, setDuplicateContacts] = useState([]);

    // Usar useMemo para optimizar la búsqueda
    const filteredClientes = useMemo(() => {
        if (!searchQuery) return clientes;

        const q = searchQuery.toLowerCase().trim();
        if (q.length < 2) return []; // Evitar búsquedas con menos de 2 caracteres

        // Búsqueda solo en campos específicos para mejorar rendimiento
        return clientes.filter(cliente =>
            cliente.nombre?.toLowerCase().includes(q) ||
            cliente.cpf?.includes(q) ||
            cliente.email?.toLowerCase().includes(q) ||
            cliente.telefono?.includes(q.replace(/\D/g, '')) // Buscar también por teléfono
        ).slice(0, 50); // Limitar resultados para rendimiento
    }, [searchQuery, clientes]);

    const handleShowDuplicates = async (cliente) => {
        if (cliente.telefono) {
            const duplicates = await findDuplicateContacts(cliente.telefono);
            if (duplicates.length > 1) {
                setDuplicateContacts(duplicates);
                setShowMergeModal(true);
            }
        }
    };

    const handleMergeComplete = async (mergedData, keepContactId) => {
        // Aquí iría la lógica para fusionar los contactos en la base de datos
        console.log('Fusión completada:', mergedData, keepContactId);
        setShowMergeModal(false);
        setDuplicateContacts([]);
    };

    return (
        <div className="relative">
            <div className="relative">
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar clientes por nombre, CPF, email o teléfono..."
                    className="w-full px-4 py-3 pl-12 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
            </div>

            {searchQuery && filteredClientes.length > 0 && (
                <div className="absolute z-10 mt-2 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredClientes.map(cliente => {
                        const hasDuplicates = cliente.telefono && clientes.filter(c =>
                            c.telefono && c.telefono.replace(/\D/g, '') === cliente.telefono.replace(/\D/g, '') && c.id !== cliente.id
                        ).length > 0;

                        return (
                            <div
                                key={cliente.id}
                                onClick={() => {
                                    if (hasDuplicates) {
                                        handleShowDuplicates(cliente);
                                    } else {
                                        onClientSelect(cliente);
                                        setSearchQuery(''); // Limpiar búsqueda después de seleccionar
                                    }
                                }}
                                className={`p-3 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-b-0 ${hasDuplicates
                                        ? 'hover:bg-yellow-50 dark:hover:bg-yellow-900/30 bg-yellow-50/50 dark:bg-yellow-900/20'
                                        : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="font-medium text-gray-900 dark:text-white truncate">
                                            {cliente.nombre}
                                        </div>
                                        <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                            {cliente.cpf} • {cliente.email} {cliente.telefono && `• ${cliente.telefono}`}
                                        </div>
                                    </div>
                                    {hasDuplicates && (
                                        <div className="ml-2 flex items-center">
                                            <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {searchQuery && filteredClientes.length === 0 && searchQuery.length >= 2 && (
                <div className="absolute z-10 mt-2 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4">
                    <p className="text-gray-500 dark:text-gray-400 text-center">No se encontraron clientes</p>
                </div>
            )}

            {showMergeModal && duplicateContacts.length > 0 && (
                <MergeContactsModal
                    isOpen={showMergeModal}
                    onClose={() => {
                        setShowMergeModal(false);
                        setDuplicateContacts([]);
                    }}
                    contact1={duplicateContacts[0]}
                    contact2={duplicateContacts[1]}
                    onMerge={handleMergeComplete}
                />
            )}
        </div>
    );
};

export default ClientSearch;
