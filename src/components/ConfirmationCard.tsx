import { useState, useRef } from 'react';
import { CheckCircle2, Edit3, Truck, Wrench, Camera, Loader2 } from 'lucide-react';

interface ConfirmationCardProps {
    serviceType: 'transport' | 'workshop';
    data: Record<string, any>;
    userId: string;
    onConfirm: (additionalData?: any) => void;
    onEdit: () => void;
}

import { uploadAttachment } from '../lib/storage';

export function ConfirmationCard({ serviceType, data, userId, onConfirm, onEdit }: ConfirmationCardProps) {
    const isTransport = serviceType === 'transport';
    const [uploading, setUploading] = useState(false);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [attachmentId, setAttachmentId] = useState<string | null>(null);
    const [fileType, setFileType] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Helper to robustly get data (handling various AI capitalizations/key names)
    const val = (keys: string[]) => {
        for (const k of keys) {
            if (data[k]) return data[k];
            // Try lowercase
            if (data[k.toLowerCase()]) return data[k.toLowerCase()];
        }
        return ''; // Return empty string if missing
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true);
            const file = event.target.files?.[0];
            if (!file) return;

            // Use the standard helper
            const result = await uploadAttachment(file, userId);
            setImageUrl(result.publicUrl);
            setAttachmentId(result.id);
            setFileType(file.type);
        } catch (error) {
            console.error('Error uploading image:', error);
            alert('Error al subir la imagen. Por favor intenta nuevamente.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden my-4 max-w-sm mx-auto animate-fade-in">
            {/* Header with Gradient */}
            <div className={`p-4 text-white flex items-center gap-3 ${isTransport ? 'bg-gradient-to-r from-blue-600 to-blue-500' : 'bg-gradient-to-r from-orange-500 to-red-500'}`}>
                {isTransport ? (
                    <Truck className="w-6 h-6" />
                ) : (
                    <Wrench className="w-6 h-6" />
                )}
                <h3 className="font-semibold text-lg">{isTransport ? 'Confirmar Transporte' : 'Confirmar Taller'}</h3>
            </div>

            {/* Body Content */}
            <div className="p-5 space-y-3 text-sm text-gray-700">
                {isTransport ? (
                    <>
                        <div className="flex justify-between border-b border-gray-100 pb-2">
                            <span className="font-medium text-gray-500">Origen:</span>
                            <span className="font-semibold text-gray-900 text-right max-w-[60%] leading-tight">
                                {val(['origen', 'origin', 'desde']) || '¿?'}
                            </span>
                        </div>
                        <div className="flex justify-between border-b border-gray-100 pb-2">
                            <span className="font-medium text-gray-500">Destino:</span>
                            <span className="font-semibold text-gray-900 text-right max-w-[60%] leading-tight">
                                {val(['destino', 'destination', 'hacia', 'hasta']) || '¿?'}
                            </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <span className="block font-medium text-gray-500 text-xs">Fecha</span>
                                <span className="block font-semibold">{val(['fecha', 'date', 'dia']) || '¿?'}</span>
                            </div>
                            <div className="text-right">
                                <span className="block font-medium text-gray-500 text-xs">Hora</span>
                                <span className="block font-semibold">{val(['hora', 'time']) || '¿?'}</span>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 pt-2">
                            <div>
                                <span className="block font-medium text-gray-500 text-xs">Pasajeros</span>
                                <span className="block font-semibold">{val(['pasajeros', 'passengers', 'cantidad_pasajeros']) || '1'}</span>
                            </div>
                            <div className="text-right">
                                <span className="block font-medium text-gray-500 text-xs">Sillas</span>
                                <span className="block font-semibold">{val(['cantidad_sillas', 'sillas', 'wheelchairs']) || '1'}</span>
                            </div>
                        </div>
                        {val(['observaciones', 'notes', 'comentarios']) && (
                            <div className="pt-2 border-t border-gray-100 mt-2">
                                <span className="block font-medium text-gray-500 text-xs mb-1">Observaciones:</span>
                                <p className="text-gray-600 italic text-xs">{val(['observaciones', 'notes', 'comentarios'])}</p>
                            </div>
                        )}
                    </>
                ) : (
                    <>
                        <div className="flex flex-col border-b border-gray-100 pb-2">
                            <span className="font-medium text-gray-500 text-xs uppercase tracking-wide">Problema / Falla</span>
                            <span className="font-semibold text-gray-900 mt-1 leading-snug">
                                {val(['tipo_problema', 'problema', 'falla', 'issue', 'problem', 'defect', 'falla_tecnica']) || 'No especificado'}
                            </span>
                        </div>
                        <div className="flex justify-between border-b border-gray-100 pb-2">
                            <span className="font-medium text-gray-500">Modelo Silla:</span>
                            <span className="font-semibold text-gray-900 text-right">
                                {val(['modelo_silla', 'modelo', 'model', 'marca', 'chair_model']) || 'No especificado'}
                            </span>
                        </div>
                        <div className="flex justify-between border-b border-gray-100 pb-2">
                            <span className="font-medium text-gray-500">Teléfono:</span>
                            <span className="font-semibold text-gray-900">
                                {val(['telefono', 'phone', 'celular', 'contacto', 'telephono', 'phone_number']) || 'No indicado'}
                            </span>
                        </div>
                        <div className="flex flex-col">
                            <span className="font-medium text-gray-500 text-xs uppercase tracking-wide">Dirección Retiro</span>
                            <span className="font-semibold text-gray-900 mt-1 leading-snug">
                                {val(['direccion', 'address', 'ubicacion']) || 'No especificada'}
                            </span>
                        </div>
                        {val(['observaciones', 'notes', 'comentarios']) && (
                            <div className="pt-2 border-t border-gray-100 mt-2">
                                <span className="block font-medium text-gray-500 text-xs mb-1">Observaciones:</span>
                                <p className="text-gray-600 italic text-xs">{val(['observaciones', 'notes', 'comentarios'])}</p>
                            </div>
                        )}
                    </>
                )}

                {/* Image Preview */}
                {imageUrl && (
                    <div className="relative mt-2 rounded-xl overflow-hidden border border-gray-200 shadow-sm group">
                        {fileType?.startsWith('image/') ? (
                            <img
                                src={imageUrl}
                                alt="Adjunto"
                                className="w-full h-32 object-cover"
                            />
                        ) : (
                            <div className="w-full h-20 bg-gray-100 flex items-center justify-center gap-2">
                                <span className="text-xs font-bold text-gray-500">📎 Archivo adjunto registrado</span>
                            </div>
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button
                                onClick={() => {
                                    setImageUrl(null);
                                    setAttachmentId(null);
                                    setFileType(null);
                                }}
                                className="text-white bg-red-500/80 p-1 rounded-full hover:bg-red-600"
                            >
                                <CheckCircle2 className="w-5 h-5 rotate-45" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Actions Footer */}
            <div className="bg-gray-50 p-3 flex gap-2 justify-end">
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept="image/*"
                />

                <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className={`flex-1 py-3 px-3 bg-white border border-gray-300 rounded-xl text-gray-600 text-xs font-bold hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5 shadow-sm active:scale-95 duration-200 ${uploading ? 'opacity-50 cursor-wait' : ''}`}
                >
                    {uploading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <Camera className="w-4 h-4" />
                    )}
                    <span>{imageUrl ? 'Cambiar Foto' : 'Adjuntar'}</span>
                </button>
                <button
                    onClick={onEdit}
                    disabled={uploading}
                    className="py-3 px-4 bg-white border border-gray-300 rounded-xl text-gray-700 text-xs font-bold hover:bg-gray-100 transition-colors shadow-sm active:scale-95 duration-200"
                >
                    <Edit3 className="w-4 h-4" />
                </button>
                <button
                    onClick={() => onConfirm({ 
                        image_url: imageUrl, 
                        attachment_id: attachmentId 
                    })}
                    disabled={uploading}
                    className="py-3 px-6 bg-green-600 text-white rounded-xl text-xs font-bold hover:bg-green-500 transition-colors shadow-lg shadow-green-600/20 flex items-center gap-2 active:scale-95 duration-200"
                >
                    <CheckCircle2 className="w-4 h-4" />
                    Confirmar
                </button>
            </div>
        </div>
    );
}
