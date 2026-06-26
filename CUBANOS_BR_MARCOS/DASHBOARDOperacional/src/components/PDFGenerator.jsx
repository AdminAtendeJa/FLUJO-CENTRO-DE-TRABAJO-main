import React, { useState, useCallback } from 'react';
import { Loader2, FileText } from 'lucide-react';

// Componente para generar PDFs de forma asíncrona
const PDFGenerator = ({
    onGeneratePDF,
    tipoDocumento,
    cliente,
    datosOperacionales,
    familiarLlamante = null
}) => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [progress, setProgress] = useState(0);

    // Función para generar PDF en segundo plano usando Web Workers
    const generatePDFAsync = useCallback(async () => {
        setIsGenerating(true);
        setProgress(0);

        try {
            // Simular el progreso gradual
            const interval = setInterval(() => {
                setProgress(prev => {
                    const newProgress = prev + Math.random() * 15;
                    return newProgress >= 95 ? 95 : newProgress;
                });
            }, 300);

            // Llamar a la función de generación de PDF
            const result = await onGeneratePDF(
                tipoDocumento,
                cliente,
                datosOperacionales,
                familiarLlamante
            );

            clearInterval(interval);
            setProgress(100);

            // Resetear progreso después de completar
            setTimeout(() => {
                setProgress(0);
                setIsGenerating(false);
            }, 1000);

            return result;
        } catch (error) {
            clearInterval(interval);
            setProgress(0);
            setIsGenerating(false);
            console.error('Error generando PDF:', error);
            throw error;
        }
    }, [onGeneratePDF, tipoDocumento, cliente, datosOperacionales, familiarLlamante]);

    return (
        <div className="flex flex-col items-center">
            <button
                onClick={generatePDFAsync}
                disabled={isGenerating}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isGenerating ? (
                    <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Generando PDF... {Math.round(progress)}%
                    </>
                ) : (
                    <>
                        <FileText className="w-4 h-4" />
                        Generar {tipoDocumento}
                    </>
                )}
            </button>

            {isGenerating && (
                <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                    <div
                        className="bg-blue-600 h-1.5 rounded-full transition-all duration-300 ease-out"
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>
            )}
        </div>
    );
};

export default PDFGenerator;