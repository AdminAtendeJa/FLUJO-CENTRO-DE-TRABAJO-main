import React, { useMemo, useState } from 'react';
import { Search, AlertTriangle, UserX } from 'lucide-react';
import { findDuplicateContacts } from '../utils/contactUtils';
import MergeContactsModal from './MergeContactsModal';
import useDebounce from '../hooks/useDebounce';
import Avatar from './ui/Avatar';
import EmptyState from './ui/EmptyState';

// Búsqueda eficiente de clientes con debounce y UI consistente con tokens.css.
const ClientSearch = ({
    searchQuery,
    setSearchQuery,
    clientes = [],
    onClientSelect
}) => {
    const [showMergeModal, setShowMergeModal] = useState(false);
    const [duplicateContacts, setDuplicateContacts] = useState([]);
    const debouncedSearchQuery = useDebounce(searchQuery, 300);

    const filteredClientes = useMemo(() => {
        if (!debouncedSearchQuery) return [];

        const q = debouncedSearchQuery.toLowerCase().trim();
        if (q.length < 2) return [];

        const phoneQuery = q.replace(/\D/g, '');

        return clientes.filter(cliente => {
            const phone = cliente.telefono?.replace(/\D/g, '') || '';
            return (
                cliente.nombre?.toLowerCase().includes(q) ||
                cliente.cpf?.includes(q) ||
                cliente.email?.toLowerCase().includes(q) ||
                (phoneQuery && phone.includes(phoneQuery))
            );
        }).slice(0, 50);
    }, [debouncedSearchQuery, clientes]);

    const handleShowDuplicates = async (cliente) => {
        if (cliente.telefono) {
            const duplicates = await findDuplicateContacts(cliente.telefono);
            if (duplicates.length > 1) {
                setDuplicateContacts(duplicates);
                setShowMergeModal(true);
            }
        }
    };

    const handleSelectCliente = (cliente, hasDuplicates) => {
        if (hasDuplicates) {
            handleShowDuplicates(cliente);
            return;
        }
        onClientSelect(cliente);
        setSearchQuery('');
    };

    const handleMergeComplete = async (mergedData, keepContactId) => {
        console.log('Fusión completada:', mergedData, keepContactId);
        setShowMergeModal(false);
        setDuplicateContacts([]);
    };

    const showResults = debouncedSearchQuery?.trim().length >= 2;

    return (
        <div style={{ position: 'relative', width: '100%' }}>
            <label
                htmlFor="client-search"
                style={{
                    display: 'block',
                    marginBottom: 'var(--gap-xs, 4px)',
                    font: 'var(--font-section)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: 'var(--color-text-secondary)'
                }}
            >
                Buscar cliente
            </label>
            <div style={{ position: 'relative' }}>
                <Search
                    size={18}
                    aria-hidden="true"
                    style={{
                        position: 'absolute',
                        left: 12,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--color-text-muted)',
                        pointerEvents: 'none'
                    }}
                />
                <input
                    id="client-search"
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Nombre, CPF, email o teléfono..."
                    autoComplete="off"
                    aria-label="Buscar clientes por nombre, CPF, email o teléfono"
                    aria-expanded={showResults}
                    aria-controls="client-search-results"
                    style={{
                        width: '100%',
                        minHeight: 44,
                        padding: '8px 12px 8px 40px',
                        borderRadius: 'var(--radius-md, 10px)',
                        border: '1px solid var(--border-default)',
                        background: 'var(--surface-elevated)',
                        color: 'var(--color-text-primary)',
                        font: 'var(--font-body)',
                        transition: 'border-color var(--transition-normal), background var(--transition-normal)'
                    }}
                />
            </div>

            {showResults && filteredClientes.length > 0 && (
                <div
                    id="client-search-results"
                    role="listbox"
                    style={{
                        position: 'absolute',
                        zIndex: 10,
                        marginTop: 'var(--gap-sm, 8px)',
                        width: '100%',
                        maxHeight: 320,
                        overflowY: 'auto',
                        borderRadius: 'var(--radius-md, 10px)',
                        border: '1px solid var(--border-default)',
                        background: 'var(--surface-raised)',
                        boxShadow: 'var(--shadow-md)',
                        animation: 'fadeIn var(--transition-normal)'
                    }}
                >
                    {filteredClientes.map(cliente => {
                        const hasDuplicates = cliente.telefono && clientes.filter(c =>
                            c.telefono && c.telefono.replace(/\D/g, '') === cliente.telefono.replace(/\D/g, '') && c.id !== cliente.id
                        ).length > 0;

                        return (
                            <button
                                key={cliente.id}
                                type="button"
                                role="option"
                                onClick={() => handleSelectCliente(cliente, hasDuplicates)}
                                style={{
                                    width: '100%',
                                    minHeight: 56,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 'var(--gap-md, 12px)',
                                    padding: 'var(--card-padding, 14px 16px)',
                                    border: 0,
                                    borderBottom: '1px solid var(--border-subtle)',
                                    background: hasDuplicates ? 'var(--color-warning-bg)' : 'transparent',
                                    color: 'var(--color-text-primary)',
                                    textAlign: 'left',
                                    cursor: 'pointer'
                                }}
                            >
                                <Avatar name={cliente.nombre} size={36} />
                                <span style={{ flex: 1, minWidth: 0 }}>
                                    <span style={{ display: 'block', font: 'var(--font-body)', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {cliente.nombre || 'Cliente sin nombre'}
                                    </span>
                                    <span style={{ display: 'block', marginTop: 2, font: 'var(--font-body)', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {cliente.cpf || 'Sin CPF'} • {cliente.email || 'Sin email'} {cliente.telefono && `• ${cliente.telefono}`}
                                    </span>
                                </span>
                                {hasDuplicates && (
                                    <AlertTriangle size={16} color="var(--color-warning)" aria-label="Posible duplicado" />
                                )}
                            </button>
                        );
                    })}
                </div>
            )}

            {showResults && filteredClientes.length === 0 && (
                <div
                    id="client-search-results"
                    style={{
                        position: 'absolute',
                        zIndex: 10,
                        marginTop: 'var(--gap-sm, 8px)',
                        width: '100%',
                        borderRadius: 'var(--radius-md, 10px)',
                        border: '1px solid var(--border-default)',
                        background: 'var(--surface-raised)',
                        boxShadow: 'var(--shadow-md)',
                        animation: 'fadeIn var(--transition-normal)'
                    }}
                >
                    <EmptyState
                        icon={<UserX size={28} />}
                        title="Sin resultados"
                        description="No se encontraron clientes con ese criterio."
                        style={{ padding: 'var(--section-gap, 16px)' }}
                    />
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