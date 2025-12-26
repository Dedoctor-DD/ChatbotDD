import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { uploadAttachment } from '../../lib/storage';
import { Loader2, MapPin, History, Upload, Image as ImageIcon, Star, Plus } from 'lucide-react';

interface BookingModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
    userName: string;
}

interface SavedAddress {
    id: string;
    label: string;
    address: string;
}

export function BookingModal({ isOpen, onClose, userId, userName }: BookingModalProps) {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const [formData, setFormData] = useState({
        service_type: 'transport' as 'transport' | 'workshop',
        date: '',
        time: '',
        notes: '',
        origin: '',
        destination: ''
    });

    const [paymentProof, setPaymentProof] = useState<string | null>(null);
    const [recentAddresses, setRecentAddresses] = useState<string[]>([]);
    const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
    const [showSuggestions, setShowSuggestions] = useState<'origin' | 'destination' | null>(null);
    const [showSaveLabel, setShowSaveLabel] = useState<{ field: 'origin' | 'destination', value: string } | null>(null);
    const [newLabel, setNewLabel] = useState('');
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Fetch recent addresses and saved places on mount
    useEffect(() => {
        if (isOpen) {
            fetchRecentAddresses();
            fetchSavedAddresses();
        }
    }, [isOpen]);

    const fetchUniqueAddresses = async () => {
         // ... helper to deduplicate recent + saved if needed, but keeping separate for now
    };

    const fetchSavedAddresses = async () => {
        const { data } = await supabase.from('saved_addresses').select('*').eq('user_id', userId);
        if (data) setSavedAddresses(data);
    };

    const fetchRecentAddresses = async () => {
        try {
            const { data } = await supabase
                .from('appointments')
                .select('origin, destination')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(10);

            if (data) {
                const unique = new Set<string>();
                data.forEach(apt => {
                    if (apt.origin) unique.add(apt.origin);
                    if (apt.destination) unique.add(apt.destination);
                });
                setRecentAddresses(Array.from(unique));
            }
        } catch(e) {
            console.error(e);
        }
    };

    if (!isOpen) return null;

    const handleGPS = () => {
        if (!navigator.geolocation) return alert('GPS no disponible');
        navigator.geolocation.getCurrentPosition(pos => {
             const { latitude, longitude } = pos.coords;
             setFormData(prev => ({ ...prev, origin: `GPS: ${latitude}, ${longitude}` }));
        });
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const result = await uploadAttachment(file, userId);
            setPaymentProof(result.publicUrl);
        } catch (err) {
            alert('Error al subir imagen');
        } finally {
            setUploading(false);
        }
    };

    const handleSaveAddress = async () => {
        if (!showSaveLabel || !newLabel.trim()) return;
        
        try {
            const { data, error } = await supabase.from('saved_addresses').insert({
                user_id: userId,
                label: newLabel,
                address: showSaveLabel.value
            }).select().single();

            if (data) {
                setSavedAddresses(prev => [...prev, data]);
                setShowSaveLabel(null);
                setNewLabel('');
            }
        } catch(e) {
            console.error(e);
        }
    };

    const handleSubmit = async () => {
        setLoading(true);
        setError(null);

        try {
            const scheduledAt = new Date(`${formData.date}T${formData.time}`);
            if (isNaN(scheduledAt.getTime())) throw new Error('Fecha u hora inválida');

            const { error } = await supabase
                .from('appointments')
                .insert([{
                    user_id: userId,
                    service_type: formData.service_type,
                    scheduled_at: scheduledAt.toISOString(),
                    notes: formData.notes,
                    status: 'pending',
                    payment_status: 'paid_reported',
                    origin: formData.origin,
                    destination: formData.destination,
                    payment_proof_url: paymentProof
                }]);

            if (error) throw error;
            setSuccess(true);
        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : 'Error al agendar');
        } finally {
            setLoading(false);
        }
    };

    const reset = () => {
        setSuccess(false);
        setStep(1);
        setFormData({ service_type: 'transport', date: '', time: '', notes: '', origin: '', destination: '' });
        setPaymentProof(null);
        onClose();
    };

    const SuggestionsList = ({ field }: { field: 'origin' | 'destination' }) => {
        if (!showSuggestions || showSuggestions !== field) return null;
        
        // Combine Saved + Recent for suggestions
        const matches = [
            ...savedAddresses.map(s => ({ type: 'saved' as const, ...s })),
            ...recentAddresses.map(r => ({ type: 'recent' as const, label: r, address: r, id: r }))
        ].filter(item => item.address.toLowerCase().includes(formData[field].toLowerCase()));

        // Remove duplicates/empty
        const uniqueMatches = Array.from(new Map(matches.map(item => [item.address, item])).values());

        if (uniqueMatches.length === 0) return null;

        return (
            <div className="absolute top-full left-0 right-0 bg-white border border-slate-100 rounded-xl shadow-xl z-50 mt-1 max-h-40 overflow-y-auto">
                {uniqueMatches.slice(0, 5).map((item, i) => (
                    <div 
                        key={i} 
                        className="p-3 text-xs text-slate-600 hover:bg-slate-50 cursor-pointer flex items-center justify-between border-b border-slate-50 last:border-0"
                        onClick={() => {
                            setFormData(prev => ({ ...prev, [field]: item.address }));
                            setShowSuggestions(null);
                        }}
                    >
                        <div className="flex items-center gap-2">
                             {item.type === 'saved' ? <Star size={12} className="text-yellow-400 filled fill-yellow-400" /> : <History size={12} className="text-slate-400" />}
                             <span className="font-bold">{item.label !== item.address ? item.label : item.address}</span>
                             {item.label !== item.address && <span className="text-[10px] text-slate-400 truncate max-w-[120px]">({item.address})</span>}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
            
            <div className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl shadow-slate-900/20 overflow-hidden transform transition-all scale-100 flex flex-col max-h-[90vh]">
                
                {/* Header ... (same as before) */}
                <div className="relative bg-primary p-8 pb-12 overflow-hidden text-center shrink-0">
                    <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full -ml-10 -mt-10 blur-xl"></div>
                    <div className="absolute bottom-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mb-10 blur-xl"></div>
                    <h3 className="text-xl font-black text-white uppercase tracking-tight relative z-10">Agendar Cita</h3>
                    <p className="text-blue-200 text-xs font-bold uppercase tracking-widest mt-2 relative z-10">Aprovecha la Oferta Exclusiva</p>
                    <button onClick={onClose} className="absolute top-6 right-6 text-white/60 hover:text-white transition-colors">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <div className="p-8 -mt-6 bg-white rounded-t-[2.5rem] relative z-20 flex-1 overflow-y-auto no-scrollbar">
                    {success ? (
                         <div className="text-center py-8 animate-scale-in">
                            <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                                <span className="material-symbols-outlined text-4xl filled">check_circle</span>
                            </div>
                            <h4 className="text-2xl font-black text-slate-800 mb-2">¡Cita Confirmada!</h4>
                            <p className="text-sm font-medium text-slate-500 mb-8">
                                Se ha reservado tu hora para el <br/>
                                <span className="font-bold text-slate-800">{new Date(`${formData.date}T${formData.time}`).toLocaleString()}</span>
                            </p>
                            <button onClick={reset} className="w-full py-4 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 active:scale-95 transition-all">
                                Entendido
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Steps Indicator */}
                            <div className="flex justify-center gap-2 mb-2">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${step >= i ? 'w-8 bg-primary' : 'w-2 bg-slate-100'}`}></div>
                                ))}
                            </div>

                            {step === 1 && (
                                <div className="space-y-6 animate-slide-up">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Selecciona el Servicio</label>
                                        <div className="grid grid-cols-2 gap-4">
                                            <button onClick={() => setFormData({...formData, service_type: 'transport'})} className={`p-4 rounded-2xl border-2 text-left transition-all active:scale-95 ${formData.service_type === 'transport' ? 'border-primary bg-primary/5 shadow-md shadow-primary/10' : 'border-slate-100 hover:border-primary/20 bg-slate-50'}`}>
                                                <span className={`material-symbols-outlined text-3xl mb-2 ${formData.service_type === 'transport' ? 'text-primary filled' : 'text-slate-400'}`}>ambulance</span>
                                                <div className={`text-xs font-black uppercase ${formData.service_type === 'transport' ? 'text-primary' : 'text-slate-500'}`}>Traslado</div>
                                            </button>
                                            <button onClick={() => setFormData({...formData, service_type: 'workshop'})} className={`p-4 rounded-2xl border-2 text-left transition-all active:scale-95 ${formData.service_type === 'workshop' ? 'border-primary bg-primary/5 shadow-md shadow-primary/10' : 'border-slate-100 hover:border-primary/20 bg-slate-50'}`}>
                                                <span className={`material-symbols-outlined text-3xl mb-2 ${formData.service_type === 'workshop' ? 'text-primary filled' : 'text-slate-400'}`}>build</span>
                                                <div className={`text-xs font-black uppercase ${formData.service_type === 'workshop' ? 'text-primary' : 'text-slate-500'}`}>Taller</div>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Smart Addresses for Transport */}
                                    {formData.service_type === 'transport' && (
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center px-1">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ruta del Traslado</label>
                                                {/* Saved Chips */}
                                                <div className="flex gap-2">
                                                    {savedAddresses.slice(0, 3).map((sa) => (
                                                        <button 
                                                            key={sa.id} 
                                                            onClick={() => setFormData(prev => ({...prev, origin: sa.address}))} /* Logic to use smart filling? Just fill origin for now */
                                                            className="px-2 py-1 bg-yellow-50 text-yellow-600 rounded-lg text-[9px] font-bold uppercase tracking-wide border border-yellow-100 hover:bg-yellow-100 transition-colors flex items-center gap-1"
                                                        >
                                                            <Star size={8} className="fill-yellow-600" /> {sa.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            
                                            {/* ORIGIN Field */}
                                            <div className="relative">
                                                <div className="flex items-center gap-2 mb-2 group focus-within:ring-2 ring-primary/10 rounded-xl transition-all">
                                                    <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center shrink-0 ml-1">
                                                        <MapPin size={14} />
                                                    </div>
                                                    <input 
                                                        value={formData.origin}
                                                        onChange={(e) => setFormData({...formData, origin: e.target.value})}
                                                        onFocus={() => setShowSuggestions('origin')}
                                                        className="flex-1 bg-transparent border-none py-3 text-sm font-bold text-slate-700 outline-none placeholder-slate-400"
                                                        placeholder="Origen (Dirección o Comuna)"
                                                    />
                                                    {formData.origin && !savedAddresses.some(s => s.address === formData.origin) && (
                                                        <button onClick={() => setShowSaveLabel({ field: 'origin', value: formData.origin })} className="p-2 text-slate-300 hover:text-yellow-400 transition-colors"><Star size={16} /></button>
                                                    )}
                                                    <button onClick={handleGPS} className="p-2 m-1 bg-slate-100 text-slate-500 rounded-lg hover:bg-slate-200" title="Usar GPS">
                                                        <span className="material-symbols-outlined text-lg">my_location</span>
                                                    </button>
                                                </div>
                                                <SuggestionsList field="origin" />
                                            </div>

                                            {/* DESTINATION Field */}
                                            <div className="relative">
                                                 <div className="flex items-center gap-2 group focus-within:ring-2 ring-primary/10 rounded-xl transition-all">
                                                    <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center shrink-0 ml-1">
                                                        <MapPin size={14} />
                                                    </div>
                                                    <input 
                                                        value={formData.destination}
                                                        onChange={(e) => setFormData({...formData, destination: e.target.value})}
                                                        onFocus={() => setShowSuggestions('destination')}
                                                        className="flex-1 bg-transparent border-none py-3 text-sm font-bold text-slate-700 outline-none placeholder-slate-400"
                                                        placeholder="Destino"
                                                    />
                                                    {formData.destination && !savedAddresses.some(s => s.address === formData.destination) && (
                                                        <button onClick={() => setShowSaveLabel({ field: 'destination', value: formData.destination })} className="p-2 text-slate-300 hover:text-yellow-400 transition-colors"><Star size={16} /></button>
                                                    )}
                                                </div>
                                                <SuggestionsList field="destination" />
                                            </div>

                                            {/* Save Label Input Popover */}
                                            {showSaveLabel && (
                                                <div className="p-3 bg-yellow-50 rounded-xl border border-yellow-100 flex items-center gap-2 animate-scale-in">
                                                    <Star size={14} className="text-yellow-500 fill-yellow-500" />
                                                    <input 
                                                        autoFocus
                                                        value={newLabel}
                                                        onChange={(e) => setNewLabel(e.target.value)}
                                                        placeholder="Nombre (ej. Casa, Trabajo)"
                                                        className="flex-1 bg-white border-none rounded-lg px-2 py-1 text-xs font-bold text-slate-700 outline-none ring-1 ring-yellow-200 focus:ring-yellow-400"
                                                    />
                                                    <button onClick={handleSaveAddress} className="text-[10px] bg-yellow-400 text-yellow-900 font-bold px-3 py-1.5 rounded-lg hover:bg-yellow-500 uppercase tracking-wide">Guardar</button>
                                                    <button onClick={() => setShowSaveLabel(null)} className="p-1 text-slate-400 hover:text-slate-600"><span className="material-symbols-outlined text-sm">close</span></button>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Notas (Opcional)</label>
                                        <textarea 
                                            value={formData.notes}
                                            onChange={(e) => setFormData({...formData, notes: e.target.value})}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary/20 resize-none h-20"
                                            placeholder="Detalles adicionales..."
                                        />
                                    </div>

                                    <button 
                                        disabled={formData.service_type === 'transport' && (!formData.origin || !formData.destination)}
                                        onClick={() => setStep(2)}
                                        className="w-full py-4 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 flex items-center justify-center gap-2 active:scale-95 transition-all mt-4 disabled:opacity-50 disabled:shadow-none"
                                    >
                                        Continuar
                                        <span className="material-symbols-outlined text-sm">arrow_forward</span>
                                    </button>

                                    {/* WhatsApp Fallback */}
                                    <div className="mt-8 pt-6 border-t border-slate-50 text-center">
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-3">¿Prefieres atención personalizada?</p>
                                        <a 
                                            href="https://wa.me/56933003113?text=Hola,%20quisiera%20agendar%20una%20hora%20para..."
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-full py-4 bg-emerald-50 text-emerald-600 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-100 transition-all border border-emerald-100"
                                        >
                                            <span className="material-symbols-outlined text-lg">chat</span>
                                            Agendar por WhatsApp
                                        </a>
                                    </div>
                                </div>
                            )}

                            {step === 2 && (
                                <div className="space-y-6 animate-slide-up">
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center px-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Elige Fecha y Hora</label>
                                            <span className="text-[9px] text-rose-500 font-bold bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100 flex items-center gap-1">
                                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                                                8 Cupos Restantes
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <input 
                                                type="date" 
                                                min={new Date().toISOString().split('T')[0]}
                                                value={formData.date}
                                                onChange={(e) => setFormData({...formData, date: e.target.value})}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary/20"
                                            />
                                            <input 
                                                type="time" 
                                                value={formData.time}
                                                onChange={(e) => setFormData({...formData, time: e.target.value})}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary/20"
                                            />
                                        </div>
                                        <p className="text-[10px] text-slate-400 font-bold px-2">
                                            🕓 Nuestro horario de atención es de 09:00 a 19:00 hrs.
                                        </p>
                                    </div>

                                    <div className="flex gap-3 pt-4">
                                        <button 
                                            onClick={() => setStep(1)}
                                            className="flex-1 py-4 bg-slate-50 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-all"
                                        >
                                            Atrás
                                        </button>
                                        <button 
                                            disabled={!formData.date || !formData.time}
                                            onClick={() => setStep(3)}
                                            className="flex-[2] py-4 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50 disabled:shadow-none"
                                        >
                                            Ir al Pago
                                            <span className="material-symbols-outlined text-sm">arrow_forward</span>
                                        </button>
                                    </div>
                                </div>
                            )}

                            {step === 3 && (
                                <div className="space-y-6 animate-slide-up">
                                    <div className="flex justify-between items-center px-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pago y Confirmación</label>
                                        <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Paso 3 de 3</span>
                                    </div>

                                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 text-center space-y-4">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total a Pagar</p>
                                        <div className="text-4xl font-black text-slate-900 tracking-tight">$5.000 <span className="text-sm font-bold text-slate-400 normal-case">CLP</span></div>
                                        <p className="text-xs text-slate-500 font-medium px-4 leading-relaxed">
                                            Para asegurar tu cupo (8/10 disponibles), realiza el pago y sube el comprobante.
                                        </p>
                                    </div>

                                    <div className="space-y-3">
                                        <a 
                                            href="https://link.mercadopago.cl/dedoctor" 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="w-full py-4 bg-[#009EE3] text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-[#009EE3]/20 flex items-center justify-center gap-2 active:scale-95 transition-all hover:bg-[#008CC9] group"
                                        >
                                            <span className="material-symbols-outlined text-lg group-hover:animate-bounce">payments</span>
                                            Pagar con Mercado Pago
                                        </a>
                                    </div>

                                    <div className="relative py-2">
                                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
                                        <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest"><span className="bg-white px-2 text-slate-300">Subir Comprobante</span></div>
                                    </div>

                                    <div 
                                        onClick={() => fileInputRef.current?.click()}
                                        className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${paymentProof ? 'border-green-300 bg-green-50' : 'border-slate-200 hover:border-primary/50 hover:bg-slate-50'}`}
                                    >
                                        <input 
                                            type="file" 
                                            ref={fileInputRef} 
                                            className="hidden" 
                                            accept="image/*"
                                            onChange={handleFileUpload}
                                        />
                                        {uploading ? (
                                            <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
                                        ) : paymentProof ? (
                                            <div className="flex flex-col items-center gap-2">
                                                 <ImageIcon className="w-8 h-8 text-green-500" />
                                                 <span className="text-xs font-bold text-green-600">¡Comprobante Subido!</span>
                                                 <span className="text-[10px] text-green-500">Click para cambiar</span>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center gap-2">
                                                <Upload className="w-8 h-8 text-slate-300" />
                                                <span className="text-xs font-bold text-slate-400">Adjuntar Pantallazo</span>
                                            </div>
                                        )}
                                    </div>

                                    {error && (
                                        <div className="p-3 bg-rose-50 text-rose-600 text-[10px] font-black uppercase tracking-widest rounded-xl text-center border border-rose-100 animate-shake">
                                            {error}
                                        </div>
                                    )}

                                    <div className="flex gap-3">
                                        <button 
                                            onClick={() => setStep(2)}
                                            className="flex-1 py-4 bg-slate-50 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-all"
                                        >
                                            Atrás
                                        </button>
                                        <button 
                                            disabled={loading || !paymentProof}
                                            onClick={handleSubmit}
                                            className="flex-[2] py-4 bg-emerald-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50 disabled:shadow-none"
                                        >
                                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirmar Cita'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
