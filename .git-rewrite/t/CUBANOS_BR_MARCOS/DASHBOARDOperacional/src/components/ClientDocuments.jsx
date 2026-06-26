import React, { memo } from 'react';
import { UploadCloud, FileText, Download, Trash2, Eye, Clock } from 'lucide-react';

// Componente para mostrar los documentos del cliente
const ClientDocuments = ({
    documentos,
    uploading,
    onFileUpload,
    onViewDocument,
    onDeleteDocument,
    formatDate
}) => {
    // Agrupar documentos por categoría
    const documentosPorCategoria = documentos.reduce((acc, doc) => {
        const categoria = doc.tipo_documento || 'Otros';
        if (!acc[categoria]) {
            acc[categoria] = [];
        }
        acc[categoria].push(doc);
        return acc;
    }, {});

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        Documentos
                    </h3>
                    <div className="flex items-center gap-2">
                        <label className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-lg cursor-pointer transition-colors">
                            <UploadCloud className="w-4 h-4" />
                            Subir
                            <input
                                type="file"
                                onChange={onFileUpload}
                                disabled={uploading}
                                className="hidden"
                                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                            />
                        </label>
                    </div>
                </div>
                {uploading && (
                    <div className="mt-3 text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                        <Clock className="w-4 h-4 animate-spin" />
                        Subiendo documento...
                    </div>
                )}
            </div>

            <div className="p-6">
                {Object.entries(documentosPorCategoria).map(([categoria, docs]) => (
                    <div key={categoria} className="mb-6 last:mb-0">
                        <h4 className="text-md font-medium text-gray-800 dark:text-gray-200 mb-3">{categoria}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {docs.map((documento) => (
                                <div
                                    key={documento.id}
                                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                >
                                    <div className="flex items-center gap-2 min-w-0">
                                        <FileText className="w-5 h-5 text-blue-500 flex-shrink-0" />
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                                {documento.nombre_archivo}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                {formatDate(documento.creado_en)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => onViewDocument(documento)}
                                            className="p-1.5 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                                            title="Ver documento"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </button>
                                        <a
                                            href={documento.url_publica || documento.url}
                                            download
                                            className="p-1.5 text-gray-500 hover:text-green-600 dark:text-gray-400 dark:hover:text-green-400 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                                            title="Descargar"
                                        >
                                            <Download className="w-4 h-4" />
                                        </a>
                                        <button
                                            onClick={() => onDeleteDocument(documento.id)}
                                            className="p-1.5 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                                            title="Eliminar"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}

                {documentos.length === 0 && (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>No hay documentos subidos aún</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default memo(ClientDocuments);