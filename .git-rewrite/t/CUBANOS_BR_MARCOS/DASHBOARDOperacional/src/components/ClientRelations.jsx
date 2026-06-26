import React, { memo } from 'react';
import { Users, User, Search, Plus, X, Check, Edit2, Trash2 } from 'lucide-react';

// Componente para mostrar las relaciones del cliente
const ClientRelations = ({
    relaciones,
    allClientes,
    selectedRelateId,
    selectedRelateType,
    searchQuery,
    searchResults,
    isRelateModalOpen,
    isNewRelateClientModalOpen,
    editingRelId,
    onRelateModalToggle,
    onNewRelateClientModalToggle,
    onSelectRelateId,
    onSelectRelateType,
    onSearchChange,
    onRelateSubmit,
    onRelationDelete,
    onRelationEdit,
    onEditRelation,
    formatDate
}) => {
    // Filtrar relaciones para este cliente como principal
    const relacionesComoPrincipal = relaciones.filter(rel => rel.cliente_id === rel.cliente_principal.id);
    // Filtrar relaciones donde este cliente es secundario
    const relacionesComoSecundario = relaciones.filter(rel => rel.cliente_relacionado_id === rel.cliente_secundario.id);

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        Relaciones
                    </h3>
                    <button
                        onClick={onRelateModalToggle}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Relacionar
                    </button>
                </div>
            </div>

            <div className="p-6">
                <div className="space-y-6">
                    {/* Relaciones donde este cliente es el principal */}
                    {relacionesComoPrincipal.length > 0 && (
                        <div>
                            <h4 className="text-md font-medium text-gray-800 dark:text-gray-200 mb-3">Relaciones como Principal</h4>
                            <div className="space-y-3">
                                {relacionesComoPrincipal.map((relacion) => (
                                    <div
                                        key={relacion.id}
                                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <User className="w-8 h-8 text-blue-500 bg-blue-100 dark:bg-blue-900/50 rounded-full p-1.5" />
                                            <div>
                                                <p className="font-medium text-gray-900 dark:text-white">
                                                    {relacion.cliente_secundario.nombre}
                                                </p>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                    {relacion.tipo_relacion} • {formatDate(relacion.creado_en)}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {editingRelId === relacion.id ? (
                                                <>
                                                    <select
                                                        value={relacion.tipo_relacion}
                                                        onChange={(e) => onEditRelation(relacion.id, e.target.value)}
                                                        className="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                                    >
                                                        <option value="familiar">Familiar</option>
                                                        <option value="pareja">Pareja</option>
                                                        <option value="amigo">Amigo</option>
                                                        <option value="colega">Colega</option>
                                                        <option value="otro">Otro</option>
                                                    </select>
                                                    <button
                                                        onClick={() => onRelationEdit(relacion.id, false)}
                                                        className="p-1 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/50 rounded"
                                                    >
                                                        <Check className="w-4 h-4" />
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <button
                                                        onClick={() => onRelationEdit(relacion.id, true)}
                                                        className="p-1 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => onRelationDelete(relacion.id)}
                                                        className="p-1 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Relaciones donde este cliente es secundario */}
                    {relacionesComoSecundario.length > 0 && (
                        <div>
                            <h4 className="text-md font-medium text-gray-800 dark:text-gray-200 mb-3">Relaciones como Secundario</h4>
                            <div className="space-y-3">
                                {relacionesComoSecundario.map((relacion) => (
                                    <div
                                        key={relacion.id}
                                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <User className="w-8 h-8 text-green-500 bg-green-100 dark:bg-green-900/50 rounded-full p-1.5" />
                                            <div>
                                                <p className="font-medium text-gray-900 dark:text-white">
                                                    {relacion.cliente_principal.nombre}
                                                </p>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                    {relacion.tipo_relacion} • {formatDate(relacion.creado_en)}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {editingRelId === relacion.id ? (
                                                <>
                                                    <select
                                                        value={relacion.tipo_relacion}
                                                        onChange={(e) => onEditRelation(relacion.id, e.target.value)}
                                                        className="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                                    >
                                                        <option value="familiar">Familiar</option>
                                                        <option value="pareja">Pareja</option>
                                                        <option value="amigo">Amigo</option>
                                                        <option value="colega">Colega</option>
                                                        <option value="otro">Otro</option>
                                                    </select>
                                                    <button
                                                        onClick={() => onRelationEdit(relacion.id, false)}
                                                        className="p-1 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/50 rounded"
                                                    >
                                                        <Check className="w-4 h-4" />
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <button
                                                        onClick={() => onRelationEdit(relacion.id, true)}
                                                        className="p-1 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => onRelationDelete(relacion.id)}
                                                        className="p-1 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Mensaje si no hay relaciones */}
                    {relaciones.length === 0 && (
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                            <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>No hay relaciones registradas aún</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal para relacionar cliente */}
            {isRelateModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-md max-h-[80vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Relacionar Cliente</h3>
                                <button
                                    onClick={onRelateModalToggle}
                                    className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo de Relación</label>
                                    <select
                                        value={selectedRelateType}
                                        onChange={onSelectRelateType}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    >
                                        <option value="familiar">Familiar</option>
                                        <option value="pareja">Pareja</option>
                                        <option value="amigo">Amigo</option>
                                        <option value="colega">Colega</option>
                                        <option value="otro">Otro</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Buscar Cliente</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => onSearchChange(e.target.value)}
                                            placeholder="Buscar por nombre..."
                                            className="w-full px-3 py-2 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        />
                                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                                    </div>

                                    {searchResults.length > 0 && (
                                        <div className="mt-2 border border-gray-200 dark:border-gray-700 rounded-lg max-h-40 overflow-y-auto">
                                            {searchResults.map((cliente) => (
                                                <div
                                                    key={cliente.id}
                                                    onClick={() => onSelectRelateId(cliente.id)}
                                                    className={`p-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${selectedRelateId === cliente.id ? 'bg-blue-100 dark:bg-blue-900/50' : ''
                                                        }`}
                                                >
                                                    <p className="font-medium text-gray-900 dark:text-white">{cliente.nombre}</p>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">{cliente.cpf}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        onClick={onNewRelateClientModalToggle}
                                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                    >
                                        Nuevo Cliente
                                    </button>
                                    <button
                                        onClick={onRelateSubmit}
                                        disabled={!selectedRelateId}
                                        className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        Relacionar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal para nuevo cliente en relación */}
            {isNewRelateClientModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-md">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Crear Nuevo Cliente</h3>
                                <button
                                    onClick={onNewRelateClientModalToggle}
                                    className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre</label>
                                    <input
                                        type="text"
                                        placeholder="Nombre completo"
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">CPF</label>
                                    <input
                                        type="text"
                                        placeholder="CPF"
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    />
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        onClick={onNewRelateClientModalToggle}
                                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={() => {
                                            // Aquí iría la lógica para crear un nuevo cliente
                                            onNewRelateClientModalToggle();
                                        }}
                                        className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                                    >
                                        Crear y Relacionar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default memo(ClientRelations);