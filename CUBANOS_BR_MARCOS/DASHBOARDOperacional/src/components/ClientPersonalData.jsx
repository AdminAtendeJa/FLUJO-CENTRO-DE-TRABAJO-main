import React, { memo } from 'react';
import { Copy, Edit2, User } from 'lucide-react';

// Componente para mostrar los datos personales del cliente
const ClientPersonalData = ({
    client,
    extractedData,
    onCopy,
    copiedId,
    onEditClick
}) => {
    // Obtener los datos combinados del cliente y los extraídos
    const combinedData = { ...client, ...extractedData };

    // Formatear la fecha de nacimiento
    const formattedBirthDate = combinedData.fecha_nacimiento
        ? new Date(combinedData.fecha_nacimiento).toLocaleDateString('es-ES')
        : '';

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <User className="w-5 h-5" />
                        Información Personal
                    </h3>
                    <button
                        onClick={() => onEditClick('Informaciones Personales')}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                    >
                        <Edit2 className="w-4 h-4" />
                        Editar
                    </button>
                </div>
            </div>

            <div className="p-6 space-y-4">
                {/* Nombre */}
                <div className="flex justify-between items-start py-2 border-b border-gray-100 dark:border-gray-700">
                    <div className="flex-1 min-w-0">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre</label>
                        <div className="flex items-center gap-2">
                            <span className="text-gray-900 dark:text-white truncate max-w-xs">
                                {combinedData.nombre || 'No especificado'}
                            </span>
                            <button
                                onClick={() => onCopy(combinedData.nombre || '', 'nombre')}
                                className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                            >
                                {copiedId === 'nombre' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Fecha de Nacimiento */}
                <div className="flex justify-between items-start py-2 border-b border-gray-100 dark:border-gray-700">
                    <div className="flex-1 min-w-0">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha de Nacimiento</label>
                        <div className="flex items-center gap-2">
                            <span className="text-gray-900 dark:text-white">
                                {formattedBirthDate || 'No especificado'}
                            </span>
                            <button
                                onClick={() => onCopy(formattedBirthDate || '', 'fecha_nacimiento')}
                                className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                            >
                                {copiedId === 'fecha_nacimiento' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Nacionalidad */}
                <div className="flex justify-between items-start py-2 border-b border-gray-100 dark:border-gray-700">
                    <div className="flex-1 min-w-0">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nacionalidad</label>
                        <div className="flex items-center gap-2">
                            <span className="text-gray-900 dark:text-white truncate max-w-xs">
                                {combinedData.nacionalidad || 'No especificado'}
                            </span>
                            <button
                                onClick={() => onCopy(combinedData.nacionalidad || '', 'nacionalidad')}
                                className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                            >
                                {copiedId === 'nacionalidad' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* País */}
                <div className="flex justify-between items-start py-2 border-b border-gray-100 dark:border-gray-700">
                    <div className="flex-1 min-w-0">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">País de Origen</label>
                        <div className="flex items-center gap-2">
                            <span className="text-gray-900 dark:text-white truncate max-w-xs">
                                {combinedData.pais || 'No especificado'}
                            </span>
                            <button
                                onClick={() => onCopy(combinedData.pais || '', 'pais')}
                                className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                            >
                                {copiedId === 'pais' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Estado Civil */}
                <div className="flex justify-between items-start py-2 border-b border-gray-100 dark:border-gray-700">
                    <div className="flex-1 min-w-0">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Estado Civil</label>
                        <div className="flex items-center gap-2">
                            <span className="text-gray-900 dark:text-white truncate max-w-xs">
                                {combinedData.estado_civil || 'No especificado'}
                            </span>
                            <button
                                onClick={() => onCopy(combinedData.estado_civil || '', 'estado_civil')}
                                className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                            >
                                {copiedId === 'estado_civil' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Sexo */}
                <div className="flex justify-between items-start py-2 border-b border-gray-100 dark:border-gray-700">
                    <div className="flex-1 min-w-0">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sexo</label>
                        <div className="flex items-center gap-2">
                            <span className="text-gray-900 dark:text-white truncate max-w-xs">
                                {combinedData.sexo || 'No especificado'}
                            </span>
                            <button
                                onClick={() => onCopy(combinedData.sexo || '', 'sexo')}
                                className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                            >
                                {copiedId === 'sexo' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default memo(ClientPersonalData);