import React, { useState } from 'react';
import { supabase } from '../../supabaseClient';
import { mergeContacts } from '../../services/mergeService';
import { Search, Wand2, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';

export default function MantenimientoSettings() {
    const [loading, setLoading] = useState(false);
    const [merging, setMerging] = useState(false);
    const [duplicates, setDuplicates] = useState([]);
    const [progress, setProgress] = useState(0);
    const [results, setResults] = useState(null);

    const findDuplicates = async () => {
        setLoading(true);
        setResults(null);
        setDuplicates([]);
        try {
            // 1. Fetch all clients with pagination
            let allClients = [];
            let from = 0;
            const step = 1000;
            
            while (true) {
                const { data, error } = await supabase
                    .from('clientes')
                    .select('*')
                    .range(from, from + step - 1);
                
                if (error) throw error;
                if (!data || data.length === 0) break;
                
                allClients = allClients.concat(data);
                if (data.length < step) break;
                from += step;
            }

            // 2. Group by phone
            const phoneGroups = {};
            allClients.forEach(client => {
                if (client.telefono) {
                    // Normalize phone (remove all non-numeric characters)
                    const phone = client.telefono.replace(/\D/g, '');
                    if (phone && phone.length > 5) { // Ensure it's a valid phone number length
                        if (!phoneGroups[phone]) phoneGroups[phone] = [];
                        phoneGroups[phone].push(client);
                    }
                }
            });

            // 3. Filter groups with > 1 client
            const dupes = Object.values(phoneGroups).filter(group => group.length > 1);
            setDuplicates(dupes);

        } catch (error) {
            console.error('Error finding duplicates:', error);
            alert('Error al buscar duplicados: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const getPrimaryContact = (group) => {
        // Strategy: most non-null fields
        let maxFields = -1;
        let primaryContact = group[0];

        group.forEach(contact => {
            let fieldsCount = 0;
            for (const key in contact) {
                if (contact[key] !== null && contact[key] !== '') {
                    fieldsCount++;
                }
            }
            if (fieldsCount > maxFields) {
                maxFields = fieldsCount;
                primaryContact = contact;
            } else if (fieldsCount === maxFields) {
                // tie-breaker: newer contact
                if (new Date(contact.created_at) > new Date(primaryContact.created_at)) {
                    primaryContact = contact;
                }
            }
        });
        return primaryContact;
    };

    const handleMergeAll = async () => {
        if (!window.confirm('¿Estás seguro de que quieres fusionar automáticamente todos estos contactos? Esta acción es irreversible.')) return;
        
        setMerging(true);
        setProgress(0);
        let successCount = 0;
        let failCount = 0;

        for (let i = 0; i < duplicates.length; i++) {
            const group = duplicates[i];
            const primaryContact = getPrimaryContact(group);
            const otherContacts = group.filter(c => c.id !== primaryContact.id);
            const contactIdsToDelete = otherContacts.map(c => c.id);

            // Create merged data
            const mergedData = { ...primaryContact };
            otherContacts.forEach(contact => {
                for (const key in contact) {
                    if ((mergedData[key] === null || mergedData[key] === '') && contact[key] !== null && contact[key] !== '') {
                        mergedData[key] = contact[key];
                    }
                }
            });

            // Clean data before merge
            delete mergedData.id;
            delete mergedData.created_at;

            const result = await mergeContacts(primaryContact.id, contactIdsToDelete, mergedData);
            if (result.success) {
                successCount++;
            } else {
                failCount++;
                console.error('Failed to merge group:', group, result.error);
            }

            setProgress(Math.round(((i + 1) / duplicates.length) * 100));
        }

        setResults({ success: successCount, failed: failCount });
        setMerging(false);
        setDuplicates([]); // clear list
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Wand2 size={24} color="var(--color-primary)" />
                    Mantenimiento de Datos
                </h2>
                <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>
                    Herramientas para mantener la base de datos limpia y organizada.
                </p>
            </div>

            <div className="glass-panel" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    Fusión Global de Duplicados
                </h3>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem', lineHeight: '1.5' }}>
                    Esta herramienta busca en toda la base de datos contactos que compartan el mismo número de teléfono. 
                    Al fusionar, el sistema preservará el contacto con más información y rellenará los campos vacíos con los datos de los duplicados.
                </p>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <button 
                        className="btn btn-secondary" 
                        onClick={findDuplicates}
                        disabled={loading || merging}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                        {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                        Buscar Duplicados
                    </button>

                    {duplicates.length > 0 && !merging && (
                        <button 
                            className="btn btn-primary" 
                            onClick={handleMergeAll}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--color-success)', color: 'white', border: 'none' }}
                        >
                            <Wand2 size={16} />
                            Fusionar {duplicates.length} grupos
                        </button>
                    )}
                </div>

                {merging && (
                    <div style={{ marginTop: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                            <span>Fusionando contactos...</span>
                            <span>{progress}%</span>
                        </div>
                        <div style={{ width: '100%', height: '8px', background: 'var(--color-bg-canvas)', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ width: `${progress}%`, height: '100%', background: 'var(--color-primary)', transition: 'width 0.3s ease' }}></div>
                        </div>
                    </div>
                )}

                {results && (
                    <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                        <CheckCircle2 size={20} color="#10b981" style={{ flexShrink: 0 }} />
                        <div>
                            <h4 style={{ margin: 0, color: '#10b981', fontWeight: 600 }}>Fusión Completada</h4>
                            <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                                Se fusionaron con éxito {results.success} grupos de contactos.
                                {results.failed > 0 && ` Hubo errores en ${results.failed} grupos.`}
                            </p>
                        </div>
                    </div>
                )}

                {!loading && !merging && duplicates.length > 0 && (
                    <div style={{ marginTop: '2rem' }}>
                        <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Grupos encontrados ({duplicates.length})</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '400px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                            {duplicates.map((group, index) => (
                                <div key={index} style={{ padding: '1rem', background: 'var(--color-bg-canvas)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                        <AlertTriangle size={16} color="var(--color-warning)" />
                                        <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>Teléfono: {group[0].telefono}</span>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginLeft: 'auto', background: 'var(--color-bg-surface)', padding: '2px 8px', borderRadius: '12px' }}>
                                            {group.length} contactos
                                        </span>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem' }}>
                                        {group.map(contact => (
                                            <div key={contact.id} style={{ fontSize: '0.75rem', padding: '0.5rem', background: 'var(--color-bg-surface)', borderRadius: 'var(--radius-sm)' }}>
                                                <div style={{ fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: '2px' }}>{contact.nombre || 'Sin nombre'}</div>
                                                <div style={{ color: 'var(--color-text-muted)' }}>{contact.email || 'Sin email'}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                
                {!loading && !merging && duplicates.length === 0 && results === null && (
                    <div style={{ marginTop: '1.5rem', padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)', border: '1px dashed var(--color-border)', borderRadius: 'var(--radius-md)' }}>
                        Haz clic en "Buscar Duplicados" para analizar la base de datos.
                    </div>
                )}
            </div>
        </div>
    );
}
