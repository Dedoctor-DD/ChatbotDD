import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import type { Profile } from '../../types';

export function UsersManager() {
    const [users, setUsers] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [processingId, setProcessingId] = useState<string | null>(null);



    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            if (data) setUsers(data);
        } catch (error) {
            console.error('Error fetching users:', error);
            // Optional: Add a toast notification here
        } finally {
            setLoading(false);
        }
    };

    const handleRoleUpdate = async (userId: string, newRole: 'admin' | 'user') => {
        if (!window.confirm(`¿Confirmas cambiar el rol a ${newRole === 'admin' ? 'ADMINISTRADOR' : 'USUARIO'}?`)) return;
        
        setProcessingId(userId);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ role: newRole })
                .eq('id', userId);

            if (error) throw error;

            setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
        } catch (error) {
            console.error('Error updating role:', error);
            alert('No se pudo actualizar el rol. Verifica tus permisos.');
        } finally {
            setProcessingId(null);
        }
    };

    const filteredUsers = users.filter(user => 
        user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phone?.includes(searchTerm)
    );

    return (
        <div className="space-y-4 md:space-y-6 pb-20 md:pb-0">
            {/* Premium Header & Search */}
            <div className="bg-white p-5 md:p-8 rounded-[2.5rem] shadow-[0_4px_30px_rgb(0,0,0,0.03)] border border-slate-50 flex flex-col gap-6 sticky top-0 md:static z-10 backdrop-blur-md bg-white/95">
                <div className="flex justify-between items-center">
                    <div>
                       <h3 className="text-xl font-black text-slate-900 tracking-tight leading-none mb-1">Socios</h3>
                       <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">Gestión de Acceso</p>
                    </div>
                </div>
                <div className="relative group">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-slate-900 transition-colors">person_search</span>
                    <input 
                        type="text" 
                        placeholder="Buscar por nombre, email o RUT..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-6 py-4 bg-slate-50/50 border border-slate-100 rounded-2xl text-[13px] font-bold text-slate-700 focus:outline-none focus:bg-white focus:border-slate-300 focus:ring-4 focus:ring-slate-100 transition-all placeholder:text-slate-300 shadow-inner"
                    />
                </div>
            </div>

            {/* List of User Tiles */}
            <div className="grid grid-cols-1 gap-4">
                {loading ? (
                    <div className="bg-white p-16 rounded-[2.5rem] text-center border border-slate-50">
                        <div className="w-12 h-12 border-[6px] border-slate-100 border-t-slate-900 rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-xs font-black text-slate-300 uppercase tracking-widest animate-pulse">Sincronizando Usuarios...</p>
                    </div>
                ) : filteredUsers.length === 0 ? (
                    <div className="bg-white p-16 rounded-[2.5rem] text-center border border-slate-50 border-dashed">
                        <span className="material-symbols-outlined text-6xl text-slate-100 mb-4 scale-110">group_off</span>
                        <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Sin coincidencias</p>
                    </div>
                ) : (
                    filteredUsers.map((user) => (
                        <div key={user.id} className="relative bg-white p-5 rounded-[2.5rem] border border-slate-100 shadow-[0_4px_25px_rgb(0,0,0,0.03)] flex flex-col gap-5 group transition-all duration-300 hover:shadow-xl hover:border-slate-200 overflow-hidden">
                            {/* Admin Indicator Background */}
                            {user.role === 'admin' && (
                                <div className="absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 bg-slate-900/5 rounded-full blur-2xl pointer-events-none" />
                            )}

                            {/* Main Info Row */}
                            <div className="flex items-center gap-4 relative">
                                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-black shrink-0 shadow-lg transition-transform duration-500 group-hover:scale-105 ${
                                    user.role === 'admin' 
                                    ? 'bg-slate-900 text-white shadow-slate-900/20' 
                                    : 'bg-slate-50 text-slate-400 shadow-inner'
                                }`}>
                                {user.avatar_url ? (
                                    <img src={user.avatar_url || undefined} alt={user.full_name || 'Usuario'} className="w-full h-full object-cover rounded-2xl" />
                                ) : (
                                        user.full_name?.charAt(0).toUpperCase() || 'U'
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className="font-black text-slate-900 text-base tracking-tight truncate">{user.full_name || 'Sin Nombre'}</h4>
                                        {user.role === 'admin' && (
                                            <span className="bg-slate-900 text-[8px] text-white font-black px-2 py-0.5 rounded-full uppercase tracking-widest shadow-lg shadow-slate-900/20">Admin</span>
                                        )}
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest truncate mb-1">{user.email}</p>
                                    {user.phone && (
                                        <div className="flex items-center gap-1.5 text-slate-500">
                                            <span className="material-symbols-outlined text-[14px]">call</span>
                                            <span className="text-[11px] font-bold">{user.phone}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Actions Divider */}
                            <div className="border-t border-slate-50 border-dashed" />

                            {/* Action Buttons */}
                            <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-100 items-center justify-between gap-1 relative z-10">
                                <button 
                                    onClick={() => handleRoleUpdate(user.id, 'user')}
                                    disabled={user.role !== 'admin' || processingId === user.id}
                                    className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${
                                        user.role !== 'admin' 
                                        ? 'bg-white text-slate-900 shadow-md shadow-slate-200/50 ring-1 ring-slate-100' 
                                        : 'text-slate-400 hover:text-slate-600 disabled:opacity-50'
                                    }`}
                                >
                                    Usuario
                                </button>
                                <button 
                                    onClick={() => handleRoleUpdate(user.id, 'admin')}
                                    disabled={user.role === 'admin' || processingId === user.id}
                                    className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${
                                        user.role === 'admin' 
                                        ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/40 translate-z-10' 
                                        : 'text-slate-400 hover:text-slate-600 disabled:opacity-50'
                                    }`}
                                >
                                    {processingId === user.id ? 'Cambiando...' : 'Administrador'}
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
