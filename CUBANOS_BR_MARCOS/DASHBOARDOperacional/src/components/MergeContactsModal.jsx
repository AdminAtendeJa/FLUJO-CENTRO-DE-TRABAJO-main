import React, { useState, useEffect } from 'react';
import { X, User, Phone, Mail, Copy, Check } from 'lucide-react';
import { mergeContacts } from '../services/mergeService';

const MergeContactsModal = ({ isOpen, onClose, contact1, contact2, onMergeComplete }) => {
    const [copiedId, setCopiedId] = useState(null);
    const [selectedContact, setSelectedContact] = useState('contact1');
    const [mergeData, setMergeData] = useState({
        nombre: contact1?.nombre || contact2?.nombre || '',
        telefono: contact1?.telefono || contact2?.telefono || '',
        email: contact1?.email || contact2?.email || '',
        cpf: contact1?.cpf || contact2?.cpf || '',
        carnet_identidad: contact1?.carnet_identidad || contact2?.carnet_identidad || '',
        fecha_nacimiento: contact1?.fecha_nacimiento || contact2?.fecha_nacimiento || '',
        estado_civil: contact1?.estado_civil || contact2?.estado_civil || '',
        sexo: contact1?.sexo || contact2?.sexo || '',
        nacionalidad: contact1?.nacionalidad || contact2?.nacionalidad || '',
        pais: contact1?.pais || contact2?.pais || '',
        lugar_nacimiento: contact1?.lugar_nacimiento || contact2?.lugar_nacimiento || '',
        estado_federal: contact1?.estado_federal || contact2?.estado_federal || '',
        ciudad: contact1?.ciudad || contact2?.ciudad || '',
        direccion: contact1?.direccion || contact2?.direccion || '',
        rnm: contact1?.rnm || contact2?.rnm || '',
        numero_pasaporte: contact1?.numero_pasaporte || contact2?.numero_pasaporte || '',
        fecha_emision_pasaporte: contact1?.fecha_emision_pasaporte || contact2?.fecha_emision_pasaporte || '',
        fecha_vencimiento_pasaporte: contact1?.fecha_vencimiento_pasaporte || contact2?.fecha_vencimiento_pasaporte || '',
        numero_refugio: contact1?.numero_refugio || contact2?.numero_refugio || '',
        fecha_vencimiento_refugio: contact1?.fecha_vencimiento_refugio || contact2?.fecha_vencimiento_refugio || '',
        nombre_madre: contact1?.nombre_madre || contact2?.nombre_madre || '',
        nombre_padre: contact1?.nombre_padre || contact2?.nombre_padre || '',
    });

    useEffect(() => {
        if (contact1 && contact2) {
            setMergeData({
                nombre: contact1.nombre || contact2.nombre || '',
                telefono: contact1.telefono || contact2.telefono || '',
                email: contact1.email || contact2.email || '',
                cpf: contact1.cpf || contact2.cpf || '',
                carnet_identidad: contact1.carnet_identidad || contact2.carnet_identidad || '',
                fecha_nacimiento: contact1.fecha_nacimiento || contact2.fecha_nacimiento || '',
                estado_civil: contact1.estado_civil || contact2.estado_civil || '',
                sexo: contact1.sexo || contact2.sexo || '',
                nacionalidad: contact1.nacionalidad || contact2.nacionalidad || '',
                pais: contact1.pais || contact2.pais || '',
                lugar_nacimiento: contact1.lugar_nacimiento || contact2.lugar_nacimiento || '',
                estado_federal: contact1.estado_federal || contact2.estado_federal || '',
                ciudad: contact1.ciudad || contact2.ciudad || '',
                direccion: contact1.direccion || contact2.direccion || '',
                rnm: contact1.rnm || contact2.rnm || '',
                numero_pasaporte: contact1.numero_pasaporte || contact2.numero_pasaporte || '',
                fecha_emision_pasaporte: contact1.fecha_emision_pasaporte || contact2.fecha_emision_pasaporte || '',
                fecha_vencimiento_pasaporte: contact1.fecha_vencimiento_pasaporte || contact2.fecha_vencimiento_pasaporte || '',
                numero_refugio: contact1.numero_refugio || contact2.numero_refugio || '',
                fecha_vencimiento_refugio: contact1.fecha_vencimiento_refugio || contact2.fecha_vencimiento_refugio || '',
                nombre_madre: contact1.nombre_madre || contact2.nombre_madre || '',
                nombre_padre: contact1.nombre_padre || contact2.nombre_padre || '',
            });
        }
    }, [contact1, contact2]);

    const handleCopy = (text, id) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleSelectField = (field, contactSource) => {
        const sourceContact = contactSource === 'contact1' ? contact1 : contact2;
        setMergeData(prev => ({
            ...prev,
            [field]: sourceContact[field] || ''
        }));
    };

    const handleMerge = async () => {
        // Determinar cuál contacto mantener y cuál eliminar
        const contactToKeep = selectedContact === 'contact1' ? contact1 : contact2;
        const contactToDelete = selectedContact === 'contact1' ? contact2 : contact1;

        // Realizar la fusión de contactos
        const result = await mergeContacts(contactToKeep.id, contactToDelete.id, mergeData);

        if (result.success) {
            // Notificar al componente padre que la fusión se completó exitosamente
            onMergeComplete(mergeData, contactToKeep.id);
        } else {
            console.error('Error en la fusión de contactos:', result.error);
            alert('Error al fusionar contactos: ' + result.error);
        }
    };

    if (!isOpen || !contact1 || !contact2) return null;

    const commonFields = [
        { id: 'nombre', label: 'Nombre', icon: User },
        { id: 'telefono', label: 'Teléfono', icon: Phone },
        { id: 'email', label: 'Email', icon: Mail },
        { id: 'cpf', label: 'CPF' },
        { id: 'carnet_identidad', label: 'Carnet de Identidad' },
        { id: 'fecha_nacimiento', label: 'Fecha de Nacimiento' },
        { id: 'estado_civil', label: 'Estado Civil' },
        { id: 'sexo', label: 'Sexo' },
        { id: 'nacionalidad', label: 'Nacionalidad' },
        { id: 'pais', label: 'País' },
        { id: 'lugar_nacimiento', label: 'Lugar de Nacimiento' },
        { id: 'estado_federal', label: 'Estado Federal' },
        { id: 'ciudad', label: 'Ciudad' },
        { id: 'direccion', label: 'Dirección' },
        { id: 'rnm', label: 'RNM' },
        { id: 'numero_pasaporte', label: 'Número Pasaporte' },
        { id: 'fecha_emision_pasaporte', label: 'Fecha Emisión Pasaporte' },
        { id: 'fecha_vencimiento_pasaporte', label: 'Fecha Vencimiento Pasaporte' },
        { id: 'numero_refugio', label: 'Número Refugio' },
        { id: 'fecha_vencimiento_refugio', label: 'Fecha Vencimiento Refugio' },
        { id: 'nombre_madre', label: 'Nombre Madre' },
        { id: 'nombre_padre', label: 'Nombre Padre' },
    ];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Fusión de Contactos</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <div className="flex gap-4 mb-6">
                        <button
                            onClick={() => setSelectedContact('contact1')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${selectedContact === 'contact1'
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                }`}
                        >
                            Contacto Principal (Mantener)
                        </button>
                        <button
                            onClick={() => setSelectedContact('contact2')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${selectedContact === 'contact2'
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                }`}
                        >
                            Contacto Secundario (Eliminar)
                        </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Contact 1 */}
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <User className="w-4 h-4" />
                                Contacto 1: {contact1.nombre || 'Sin nombre'}
                            </h3>
                            {commonFields.map(field => {
                                const IconComponent = field.icon || User;
                                const value = contact1[field.id];
                                if (!value && !mergeData[field.id]) return null;

                                return (
                                    <div key={`contact1-${field.id}`} className="mb-3 p-2 bg-white dark:bg-gray-600 rounded border">
                                        <div className="flex items-center gap-2 mb-1">
                                            <IconComponent className="w-3 h-3 text-gray-500 dark:text-gray-400" />
                                            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{field.label}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-gray-900 dark:text-white truncate">{value || 'Vacío'}</span>
                                            <button
                                                onClick={() => handleCopy(value || '', `contact1-${field.id}`)}
                                                className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-500 rounded transition-colors"
                                            >
                                                {copiedId === `contact1-${field.id}` ?
                                                    <Check className="w-3 h-3 text-green-500" /> :
                                                    <Copy className="w-3 h-3" />
                                                }
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Selection Controls */}
                        <div className="flex flex-col justify-center items-center">
                            <div className="text-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Seleccionar datos</div>
                            {commonFields.map(field => {
                                const contact1Value = contact1[field.id];
                                const contact2Value = contact2[field.id];
                                if (!contact1Value && !contact2Value) return null;

                                return (
                                    <div key={`controls-${field.id}`} className="flex flex-col items-center gap-2 mb-4 w-full">
                                        <div className="text-xs text-gray-600 dark:text-gray-400 text-center truncate w-full">{field.label}</div>
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => handleSelectField(field.id, 'contact1')}
                                                className={`px-2 py-1 text-xs rounded ${mergeData[field.id] === contact1Value
                                                        ? 'bg-green-500 text-white'
                                                        : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500'
                                                    }`}
                                                disabled={!contact1Value}
                                            >
                                                C1
                                            </button>
                                            <button
                                                onClick={() => handleSelectField(field.id, 'contact2')}
                                                className={`px-2 py-1 text-xs rounded ${mergeData[field.id] === contact2Value
                                                        ? 'bg-green-500 text-white'
                                                        : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500'
                                                    }`}
                                                disabled={!contact2Value}
                                            >
                                                C2
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Contact 2 */}
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <User className="w-4 h-4" />
                                Contacto 2: {contact2.nombre || 'Sin nombre'}
                            </h3>
                            {commonFields.map(field => {
                                const IconComponent = field.icon || User;
                                const value = contact2[field.id];
                                if (!value && !mergeData[field.id]) return null;

                                return (
                                    <div key={`contact2-${field.id}`} className="mb-3 p-2 bg-white dark:bg-gray-600 rounded border">
                                        <div className="flex items-center gap-2 mb-1">
                                            <IconComponent className="w-3 h-3 text-gray-500 dark:text-gray-400" />
                                            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{field.label}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-gray-900 dark:text-white truncate">{value || 'Vacío'}</span>
                                            <button
                                                onClick={() => handleCopy(value || '', `contact2-${field.id}`)}
                                                className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-500 rounded transition-colors"
                                            >
                                                {copiedId === `contact2-${field.id}` ?
                                                    <Check className="w-3 h-3 text-green-500" /> :
                                                    <Copy className="w-3 h-3" />
                                                }
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Preview of merged data */}
                    <div className="border-t pt-6">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Resultado de la Fusión</h3>
                        <div className="grid grid-cols-2 gap-4">
                            {commonFields.map(field => {
                                const value = mergeData[field.id];
                                if (!value) return null;

                                return (
                                    <div key={`merged-${field.id}`} className="p-3 bg-blue-50 dark:bg-blue-900 rounded border border-blue-200 dark:border-blue-700">
                                        <div className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">{field.label}</div>
                                        <div className="text-sm text-blue-900 dark:text-blue-100">{value}</div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleMerge}
                        className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                    >
                        Fusionar Contactos
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MergeContactsModal;