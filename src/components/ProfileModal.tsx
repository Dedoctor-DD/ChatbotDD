import { useState, useEffect, type ChangeEvent } from 'react';
import { supabase } from '../lib/supabase';
import { User, Phone, MapPin, Camera, Save, X, Loader2, Check } from 'lucide-react';
import type { Profile } from '../types';

interface ProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
    onUpdate: () => void;
}

export function ProfileModal({ isOpen, onClose, userId, onUpdate }: ProfileModalProps) {
    const [profile, setProfile] = useState<Partial<Profile>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (isOpen && userId) {
            loadProfile();
        }
    }, [isOpen, userId]);

    const loadProfile = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error && error.code !== 'PGRST116') throw error;
            if (data) setProfile(data);
        } catch (error) {
            console.error('Error loading profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUploadAvatar = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${userId}/${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file, { upsert: true });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            setProfile(prev => ({ ...prev, avatar_url: publicUrl }));
        } catch (error) {
            console.error('Error uploading avatar:', error);
            alert('Error al subir la imagen. Asegúrate de que el administrador haya configurado el bucket "avatars".');
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setSuccess(false);
        try {
            const { error } = await supabase
                .from('profiles')
                .upsert({
                    id: userId,
                    full_name: profile.full_name || '',
                    phone: profile.phone || '',
                    address: profile.address || '',
                    avatar_url: profile.avatar_url || '',
                    updated_at: new Date().toISOString()
                });

            if (error) throw error;

            setSuccess(true);
            setTimeout(() => {
                onUpdate();
                setSuccess(false);
            }, 1500);
        } catch (error) {
            console.error('Error saving profile:', error);
            alert('Error al guardar el perfil');
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
            <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden animate-slide-up relative">
                
                {/* Header Decoration */}
                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-sky-500 to-indigo-600 opacity-10"></div>
                
                <div className="p-8 relative z-10">
                    <div className="flex justify-between items-start mb-8">
                        <div>
                            <h3 className="text-2xl font-black text-slate-800 tracking-tight">Tu Perfil</h3>
                            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">Personaliza tu información</p>
                        </div>
                        <button onClick={onClose} className="p-2.5 hover:bg-slate-50 rounded-full text-slate-300 hover:text-slate-600 transition-all">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {loading ? (
                        <div className="py-20 flex flex-col items-center justify-center">
                            <Loader2 className="w-10 h-10 text-sky-500 animate-spin mb-4" />
                            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Cargando...</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Avatar Section */}
                            <div className="flex flex-col items-center space-y-4">
                                <div className="relative group">
                                    <div className="w-28 h-28 rounded-full bg-slate-100 border-4 border-white shadow-xl overflow-hidden flex items-center justify-center">
                                        {profile.avatar_url ? (
                                            <img src={profile.avatar_url} className="w-full h-full object-cover" alt="Avatar" />
                                        ) : (
                                            <User className="w-12 h-12 text-slate-300" />
                                        )}
                                        {uploading && (
                                            <div className="absolute inset-0 bg-white/60 flex items-center justify-center rounded-full">
                                                <Loader2 className="w-6 h-6 text-sky-500 animate-spin" />
                                            </div>
                                        )}
                                    </div>
                                    <label className="absolute bottom-1 right-1 bg-sky-500 text-white p-2 rounded-full shadow-lg cursor-pointer hover:bg-sky-600 transition-all active:scale-90">
                                        <Camera className="w-4 h-4" />
                                        <input type="file" className="hidden" accept="image/*" onChange={handleUploadAvatar} disabled={uploading} />
                                    </label>
                                </div>
                            </div>

                            {/* Form Fields */}
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-2">
                                        <User className="w-3 h-3" /> Nombre Completo
                                    </label>
                                    <input 
                                        type="text" 
                                        value={profile.full_name || ''} 
                                        onChange={e => setProfile(p => ({...p, full_name: e.target.value}))}
                                        placeholder="Tu nombre"
                                        className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-300 transition-all font-bold text-slate-600" 
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-2">
                                        <Phone className="w-3 h-3" /> Teléfono
                                    </label>
                                    <input 
                                        type="tel" 
                                        value={profile.phone || ''} 
                                        onChange={e => setProfile(p => ({...p, phone: e.target.value}))}
                                        placeholder="+56 9 XXXX XXXX"
                                        className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-300 transition-all font-bold text-slate-600" 
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-2">
                                        <MapPin className="w-3 h-3" /> Dirección
                                    </label>
                                    <textarea 
                                        rows={2}
                                        value={profile.address || ''} 
                                        onChange={e => setProfile(p => ({...p, address: e.target.value}))}
                                        placeholder="Tu dirección completa"
                                        className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-300 transition-all font-bold text-slate-600 resize-none" 
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-8 bg-slate-50/50 border-t border-slate-50 flex gap-3">
                    <button 
                        onClick={onClose}
                        className="flex-1 py-4 rounded-2xl bg-white border border-slate-200 text-xs font-black uppercase text-slate-400 hover:bg-slate-50 transition-all"
                    >
                        Cerrar
                    </button>
                    <button 
                        onClick={handleSave}
                        disabled={saving || uploading || loading}
                        className={`flex-1 py-4 rounded-2xl text-xs font-black uppercase shadow-lg transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 ${success ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-sky-500 text-white shadow-sky-500/20 hover:bg-sky-600'}`}
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : success ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                        {saving ? 'Guardando...' : success ? '¡Listo!' : 'Guardar Perfil'}
                    </button>
                </div>
            </div>
        </div>
    );
}
