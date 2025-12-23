import { useState } from 'react';
import { Loader2, Send, Phone, MessageSquare, Mail } from 'lucide-react';
import { supabase } from '../lib/supabase';

export function ContactPanel() {
    const [formStatus, setFormStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [formData, setFormData] = useState({
        full_name: '',
        phone: '',
        message: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormStatus('loading');

        try {
            const { error } = await supabase
                .from('landing_leads')
                .insert([
                    {
                        full_name: formData.full_name,
                        phone: formData.phone,
                        service_type: 'Soporte App',
                        message: formData.message
                    }
                ]);

            if (error) throw error;
            setFormStatus('success');
            setFormData({ full_name: '', phone: '', message: '' });
            setTimeout(() => setFormStatus('idle'), 5000);
        } catch (error) {
            console.error('Error submitting contact form:', error);
            setFormStatus('error');
        }
    };

    return (
        <div className="flex flex-col w-full min-h-full bg-background-light pb-24">
            <header className="px-6 pt-12 pb-6">
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">Centro de <span className="text-primary">Ayuda</span></h1>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-[0.2em] mt-2">Estamos aquí para escucharte</p>
            </header>

            <main className="px-6 space-y-6">
                {/* Quick Contact Buttons */}
                <div className="grid grid-cols-2 gap-4">
                    <a 
                        href="tel:+56912345678" 
                        className="bg-white p-6 rounded-[2rem] shadow-xl shadow-blue-500/5 border border-gray-50 flex flex-col items-center gap-3 active:scale-95 transition-all text-center no-underline"
                    >
                        <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-primary">
                            <Phone className="w-6 h-6" />
                        </div>
                        <span className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Llamar Soporte</span>
                    </a>

                    <a 
                        href="https://wa.me/56912345678" 
                        target="_blank" 
                        rel="noreferrer"
                        className="bg-white p-6 rounded-[2rem] shadow-xl shadow-blue-500/5 border border-gray-50 flex flex-col items-center gap-3 active:scale-95 transition-all text-center no-underline"
                    >
                        <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-green-600">
                            <MessageSquare className="w-6 h-6" />
                        </div>
                        <span className="text-[10px] font-black text-gray-900 uppercase tracking-widest">WhatsApp Directo</span>
                    </a>
                </div>

                {/* Contact Form Card */}
                <section className="bg-white rounded-[2.5rem] p-8 shadow-2xl shadow-gray-200/50 border border-gray-50">
                    <h3 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-3">
                        <Mail className="w-5 h-5 text-primary" />
                        Envíanos un Mensaje
                    </h3>

                    {formStatus === 'success' ? (
                        <div className="py-8 text-center animate-scale-in">
                            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="material-symbols-outlined text-3xl">check_circle</span>
                            </div>
                            <h4 className="text-lg font-black text-gray-900 mb-2">¡Mensaje Enviado!</h4>
                            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Te contactaremos en breve</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Tu Nombre</label>
                                <input 
                                    required
                                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold text-gray-800 focus:ring-2 focus:ring-primary/20 outline-none transition-all" 
                                    placeholder="Manuel García"
                                    value={formData.full_name}
                                    onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">WhatsApp / Celular</label>
                                <input 
                                    required type="tel"
                                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold text-gray-800 focus:ring-2 focus:ring-primary/20 outline-none transition-all" 
                                    placeholder="+56 9 1234 5678"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Mensaje o Consulta</label>
                                <textarea 
                                    required rows={4}
                                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold text-gray-800 focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none" 
                                    placeholder="¿Cómo podemos ayudarte hoy?"
                                    value={formData.message}
                                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                                />
                            </div>
                            <button 
                                disabled={formStatus === 'loading'}
                                className="w-full h-14 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 flex items-center justify-center gap-3 disabled:opacity-70 border-none cursor-pointer mt-4"
                            >
                                {formStatus === 'loading' ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        <Send className="w-4 h-4" />
                                        Enviar Consulta
                                    </>
                                )}
                            </button>
                        </form>
                    )}
                </section>
            </main>
        </div>
    );
}
