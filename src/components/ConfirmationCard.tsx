import { useState, useRef } from 'react';
import { uploadAttachment } from '../lib/storage';

interface ConfirmationCardProps {
    serviceType: 'transport' | 'workshop';
    data: Record<string, any>;
    userId: string;
    onConfirm: (additionalData?: any) => void;
    onEdit: () => void;
}

export function ConfirmationCard({ serviceType, data, userId, onConfirm, onEdit }: ConfirmationCardProps) {
    const isTransport = serviceType === 'transport';
    const [uploading, setUploading] = useState(false);
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

            if (attachments.length + files.length > 4) {
                alert('Máximo 4 archivos.');
                return;
            }

            setUploading(true);
            const file = files[0];
            const result = await uploadAttachment(file, userId);
            
            setAttachments(prev => [...prev, {
                id: result.id,
                url: result.publicUrl,
                type: file.type
            }]);

        } catch (error) {
            console.error('Error uploading:', error);
            alert('Error al subir. Intenta nuevamente.');
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const removeAttachment = (id: string) => {
        setAttachments(prev => prev.filter(a => a.id !== id));
    };

    return (
        <div className="bg-white dark:bg-surface-dark rounded-[2.5rem] shadow-2xl shadow-blue-500/10 border border-gray-100 dark:border-gray-800 overflow-hidden animate-fade-in-up">
            {/* Gradient Header */}
            <div className={`px-6 py-5 flex items-center justify-between ${isTransport ? 'bg-primary' : 'bg-orange-600'} text-white`}>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                        <span className="material-symbols-outlined filled">{isTransport ? 'ambulance' : 'build'}</span>
                    </div>
                    <div>
                        <h3 className="text-sm font-black uppercase tracking-wider">Confirmar Pedido</h3>
                        <p className="text-[10px] opacity-80 font-bold uppercase tracking-widest">Verifica los detalles</p>
                    </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-sm">priority_high</span>
                </div>
            </div>

            <div className="p-6 space-y-5">
                {/* Data Fields */}
                <div className="space-y-4">
                    {isTransport ? (
                        <>
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-gray-400 text-lg">trip_origin</span>
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Desde</span>
                                </div>
                                <span className="text-sm font-bold text-gray-900 dark:text-white truncate max-w-[60%]">{val(['origen', 'desde', 'origin']) || '---'}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-gray-400 text-lg">location_on</span>
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Hasta</span>
                                </div>
                                <span className="text-sm font-bold text-gray-900 dark:text-white truncate max-w-[60%]">{val(['destino', 'hacia', 'destination']) || '---'}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-2xl">
                                <div>
                                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Fecha</span>
                                    <div className="flex items-center gap-1.5 font-bold text-gray-800 dark:text-gray-200">
                                        <span className="material-symbols-outlined text-sm">calendar_month</span>
                                        <span className="text-xs">{val(['fecha', 'date']) || '--/--'}</span>
                                    </div>
                                </div>
                                <div>
                                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Hora</span>
                                    <div className="flex items-center gap-1.5 font-bold text-gray-800 dark:text-gray-200">
                                        <span className="material-symbols-outlined text-sm">schedule</span>
                                        <span className="text-xs">{val(['hora', 'time']) || '--:--'}</span>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="bg-orange-50 dark:bg-orange-900/10 p-4 rounded-2xl border border-orange-100 dark:border-orange-800/50">
                                <span className="text-[10px] font-black text-orange-600 dark:text-orange-400 uppercase tracking-widest mb-2 block">Detalle del Problema</span>
                                <p className="text-sm font-bold text-gray-900 dark:text-white leading-relaxed">
                                    {val(['problema', 'falla', 'issue', 'detalle_problema']) || 'Sin especificar'}
                                </p>
                            </div>
                            <div className="flex justify-between items-center px-1">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Modelo Equipo</span>
                                <span className="text-xs font-bold text-gray-900 dark:text-white">{val(['modelo', 'equipo']) || '---'}</span>
                            </div>
                        </>
                    )}
                </div>

                {/* Adjuntos */}
                <div className="pt-2">
                    <div className="flex justify-between items-center mb-3">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Archivos / Fotos</span>
                        <span className="text-[9px] font-black text-primary px-2 py-0.5 bg-primary/10 rounded-full">{attachments.length}/4</span>
                    </div>
                    
                    <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading || attachments.length >= 4}
                            className="w-14 h-14 shrink-0 rounded-xl bg-gray-50 dark:bg-gray-800 border-2 border-dashed border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-400 hover:text-primary hover:border-primary transition-colors disabled:opacity-50"
                        >
                            <span className="material-symbols-outlined">{uploading ? 'sync' : 'add_photo_alternate'}</span>
                        </button>
                        
                        {attachments.map((att) => (
                            <div key={att.id} className="w-14 h-14 shrink-0 relative rounded-xl overflow-hidden border border-gray-100 dark:border-gray-800 group shadow-sm">
                                {att.type.startsWith('image/') ? (
                                    <img src={att.url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-gray-400">description</span>
                                    </div>
                                )}
                                <button 
                                    onClick={() => removeAttachment(att.id)}
                                    className="absolute inset-0 bg-red-500/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <span className="material-symbols-outlined text-sm">close</span>
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bottom Actions */}
                <div className="grid grid-cols-4 gap-3 pt-2">
                    <button 
                        onClick={onEdit}
                        className="col-span-1 h-14 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors active:scale-95"
                    >
                        <span className="material-symbols-outlined">edit_note</span>
                    </button>
                    <button 
                        onClick={() => onConfirm({ image_urls: attachments.map(a => a.url), attachment_ids: attachments.map(a => a.id) })}
                        disabled={uploading}
                        className="col-span-3 h-14 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-blue-500/30 flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-70 group"
                    >
                        <span className="material-symbols-outlined filled group-hover:rotate-12 transition-transform">verified</span>
                        Confirmar y Enviar
                    </button>
                </div>
            </div>

            <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} accept="image/*,application/pdf" />
        </div>
    );
}
