import { useState, useRef } from 'react';
import { CheckCircle2, Edit3, Truck, Wrench, Camera, Loader2, X, Paperclip } from 'lucide-react';

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
    
    // Support multiple attachments (up to 4)
    const [attachments, setAttachments] = useState<{id: string, url: string, type: string}[]>([]);
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    const val = (keys: string[]) => {
        for (const k of keys) {
            if (data[k]) return data[k];
            if (data[k.toLowerCase()]) return data[k.toLowerCase()];
        }
        return '';
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            const files = event.target.files;
            if (!files || files.length === 0) return;

            // Check limit
            if (attachments.length + files.length > 4) {
                alert('Máximo 4 fotos/archivos por solicitud.');
                return;
            }

            setUploading(true);
            
            // Upload only the first selected (or loop if multiple select is enabled, but current input is single)
            const file = files[0];
            const result = await uploadAttachment(file, userId);
            
            setAttachments(prev => [...prev, {
                id: result.id,
                url: result.publicUrl,
                type: file.type
            }]);

        } catch (error) {
            console.error('Error uploading image:', error);
            alert('Error al subir la imagen. Por favor intenta nuevamente.');
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const removeAttachment = (id: string) => {
        setAttachments(prev => prev.filter(a => a.id !== id));
    };

    return (
        <div className="premium-card rounded-[32px] overflow-hidden my-6 w-full max-w-sm md:max-w-md mx-auto animate-fade-in flex flex-col max-h-[600px]">
            {/* Header */}
            <div className={`p-5 text-white flex items-center justify-between flex-none ${isTransport ? 'bg-gradient-to-br from-sky-600 via-sky-600 to-indigo-700 shadow-lg shadow-sky-600/20' : 'bg-gradient-to-br from-orange-500 via-rose-500 to-rose-600 shadow-lg shadow-rose-500/20'}`}>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center">
                        {isTransport ? <Truck className="w-6 h-6" /> : <Wrench className="w-6 h-6" />}
                    </div>
                    <div>
                        <h3 className="font-black text-base tracking-tight">{isTransport ? 'Servicio de Transporte' : 'Servicio de Taller'}</h3>
                        <p className="text-[10px] text-white/70 font-bold uppercase tracking-widest px-0.5">Verifica los datos</p>
                    </div>
                </div>
                <div className="bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/30">
                    Confirmación
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="p-5 space-y-4 text-sm text-gray-700 overflow-y-auto custom-scrollbar flex-1">
                {isTransport ? (
                    <div className="space-y-3">
                        <div className="flex justify-between items-start border-b border-gray-50 pb-2">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Origen</span>
                            <span className="font-bold text-gray-900 text-right max-w-[60%] leading-tight">
                                {val(['origen', 'origin', 'desde']) || '---'}
                            </span>
                        </div>
                        <div className="flex justify-between items-start border-b border-gray-50 pb-2">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Destino</span>
                            <span className="font-bold text-gray-900 text-right max-w-[60%] leading-tight">
                                {val(['destino', 'destination', 'hacia', 'hasta']) || '---'}
                            </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded-2xl">
                            <div>
                                <span className="block text-[10px] font-black text-gray-400 uppercase mb-1">Fecha</span>
                                <span className="block font-bold text-gray-800">{val(['fecha', 'date', 'dia']) || '---'}</span>
                            </div>
                            <div className="text-right">
                                <span className="block text-[10px] font-black text-gray-400 uppercase mb-1">Hora</span>
                                <span className="block font-bold text-gray-800">{val(['hora', 'time']) || '---'}</span>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="px-3 py-2 border border-gray-100 rounded-xl text-center">
                                <span className="block text-[10px] font-black text-gray-400 uppercase mb-1 whitespace-nowrap">Pasajeros</span>
                                <span className="block font-bold text-lg text-indigo-600">{val(['pasajeros', 'passengers', 'cantidad_pasajeros']) || '1'}</span>
                            </div>
                            <div className="px-3 py-2 border border-gray-100 rounded-xl text-center">
                                <span className="block text-[10px] font-black text-gray-400 uppercase mb-1 whitespace-nowrap">Sillas</span>
                                <span className="block font-bold text-lg text-sky-600">{val(['cantidad_sillas', 'sillas', 'wheelchairs']) || '1'}</span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <div className="bg-rose-50/50 p-4 rounded-2xl border border-rose-100/50">
                            <span className="text-[10px] font-black text-rose-400 uppercase tracking-wider block mb-1">Descripción del Problema</span>
                            <p className="font-bold text-gray-900 leading-snug">
                                {val(['tipo_problema', 'problema', 'falla', 'issue', 'problem', 'defect', 'falla_tecnica']) || 'No especificado'}
                            </p>
                        </div>
                        <div className="flex justify-between items-center px-1">
                            <span className="text-[10px] font-black text-gray-400 uppercase">Modelo:</span>
                            <span className="font-bold text-gray-900">{val(['modelo_silla', 'modelo', 'model', 'marca', 'chair_model']) || 'No indicado'}</span>
                        </div>
                        <div className="flex justify-between items-center px-1">
                            <span className="text-[10px] font-black text-gray-400 uppercase">Contacto:</span>
                            <span className="font-bold text-gray-900">{val(['telefono', 'phone', 'celular', 'contacto', 'phone_number']) || 'No indicado'}</span>
                        </div>
                        <div className="pt-2">
                             <span className="text-[10px] font-black text-gray-400 uppercase block mb-1">Dirección de Retiro</span>
                             <div className="bg-gray-50 p-3 rounded-xl font-bold text-gray-800 text-xs">
                                 {val(['direccion', 'address', 'ubicacion']) || 'Santiago (Centro)'}
                             </div>
                        </div>
                    </div>
                )}

                {/* Estimate if exists */}
                {val(['precio_estimado', 'precio', 'estimate']) && (
                    <div className="bg-green-50 border border-green-100 p-3 rounded-2xl flex justify-between items-center shadow-sm">
                        <span className="text-[10px] font-black text-green-600 uppercase">Precio Estimado:</span>
                        <span className="text-lg font-black text-green-700">{val(['precio_estimado', 'precio', 'estimate'])}</span>
                    </div>
                )}

                {/* Thumbnails Grid (Fixed size thumbnails) */}
                {attachments.length > 0 && (
                    <div className="pt-2">
                        <span className="text-[10px] font-black text-gray-400 uppercase block mb-2">Fotos / Adjuntos ({attachments.length}/4)</span>
                        <div className="grid grid-cols-4 gap-2">
                            {attachments.map((att) => (
                                <div key={att.id} className="relative group w-16 h-16 rounded-lg overflow-hidden border border-gray-200 shadow-sm bg-gray-50">
                                    {att.type.startsWith('image/') ? (
                                        <img src={att.url} className="w-full h-full object-cover" alt="Preview" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Paperclip className="w-6 h-6 text-gray-400" />
                                        </div>
                                    )}
                                    <button 
                                        onClick={() => removeAttachment(att.id)}
                                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Actions Footer (Sticky/Flex-none) */}
            <div className="bg-gray-50/80 backdrop-blur-sm p-4 border-t border-gray-100 flex flex-col gap-3 flex-none">
                <div className="flex gap-2">
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading || attachments.length >= 4}
                        className={`flex-1 py-3 px-3 bg-white border border-gray-200 rounded-2xl text-gray-600 text-[11px] font-black hover:bg-gray-50 transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95 ${uploading ? 'opacity-50 cursor-wait' : ''} ${attachments.length >= 4 ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {uploading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Camera className="w-4 h-4 text-sky-500" />
                        )}
                        <span>{attachments.length > 0 ? 'Añadir Más' : 'Subir Fotos'}</span>
                    </button>
                    
                    <button
                        onClick={onEdit}
                        disabled={uploading}
                        className="w-12 h-12 flex items-center justify-center bg-white border border-gray-200 rounded-2xl text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-all shadow-sm active:scale-95"
                        title="Modificar datos"
                    >
                        <Edit3 className="w-4 h-4" />
                    </button>
                </div>

                <button
                    onClick={() => onConfirm({ 
                        image_urls: attachments.map(a => a.url), 
                        attachment_ids: attachments.map(a => a.id)
                    })}
                    disabled={uploading}
                    className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-2xl text-[13px] font-black hover:scale-[1.02] transition-all shadow-xl shadow-green-600/20 flex items-center justify-center gap-3 active:scale-95 disabled:grayscale"
                >
                    <CheckCircle2 className="w-5 h-5" />
                    Confirmar Pedido
                </button>
            </div>

            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/*,application/pdf"
            />
        </div>
    );
}
