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
            {/* Header & Search */}
            <div className="bg-white p-4 md:p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sticky top-0 md:static z-10">
                <div>
                   <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Usuarios</h3>
                   <p className="text-[10px] md:text-xs text-slate-400 font-bold uppercase tracking-wider">Gestión de Acceso</p>
                </div>
                <div className="w-full md:w-auto relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
                    <input 
                        type="text" 
                        placeholder="Buscar usuario..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full md:w-64 pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all placeholder:text-slate-400"
                    />
                </div>
            </div>

            {/* List */}
            <div className="grid grid-cols-1 gap-3 md:gap-4">
                {loading ? (
                    <div className="bg-white p-12 rounded-3xl text-center">
                        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Cargando...</p>
                    </div>
                ) : filteredUsers.length === 0 ? (
                    <div className="bg-white p-12 rounded-3xl text-center border border-slate-100 border-dashed">
                        <span className="material-symbols-outlined text-4xl text-slate-200 mb-2">person_off</span>
                        <p className="text-sm font-bold text-slate-400">Sin resultados</p>
                    </div>
                ) : (
                    filteredUsers.map((user) => (
                        <div key={user.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row gap-4 group transition-all hover:shadow-md">
                            {/* Header Mobile / Left Desktop */}
                            <div className="flex items-center gap-3 w-full sm:w-auto">
                                <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center text-base md:text-lg font-black shrink-0 ${
                                    user.role === 'admin' 
                                    ? 'bg-gradient-to-br from-primary to-blue-600 text-white shadow-lg shadow-primary/20' 
                                    : 'bg-slate-100 text-slate-500'
                                }`}>
                                {user.avatar_url ? (
                                    <img src={user.avatar_url || undefined} alt={user.full_name || 'Usuario'} className="w-full h-full object-cover rounded-xl" />
                                ) : (
                                        user.full_name?.charAt(0).toUpperCase() || 'U'
                                    )}
                                </div>
                                <div className="sm:hidden flex-1">
                                    <h4 className="font-bold text-slate-800 text-sm truncate">{user.full_name || 'Sin Nombre'}</h4>
                                    <p className="text-xs text-slate-400 truncate">{user.email}</p>
                                </div>
                                {/* Flag for Mobile */}
                                {user.role === 'admin' && (
                                    <span className="sm:hidden bg-primary/10 text-primary text-[9px] font-black px-2 py-1 rounded-md uppercase tracking-wider">
                                        Admin
                                    </span>
                                )}
                            </div>

                            {/* Info Desktop */}
                            <div className="hidden sm:block flex-1">
                                <div className="flex items-center gap-2">
                                    <h4 className="font-bold text-slate-800">{user.full_name || 'Sin Nombre'}</h4>
                                    {user.role === 'admin' && (
                                        <span className="bg-primary/10 text-primary text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider border border-primary/10">Admin</span>
                                    )}
                                </div>
                                <div className="flex flex-col md:flex-row gap-1 md:gap-4 mt-1">
                                    <span className="text-xs text-slate-400 flex items-center gap-1">
                                        <span className="material-symbols-outlined text-[14px]">mail</span>
                                        {user.email}
                                    </span>
                                    {user.phone && (
                                        <span className="text-xs text-slate-400 flex items-center gap-1">
                                            <span className="material-symbols-outlined text-[14px]">call</span>
                                            {user.phone}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Actions & Mobile Details */}
                            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-50">
                                <div className="sm:hidden grid grid-cols-2 gap-2 text-xs text-slate-500">
                                   {user.phone && (
                                       <div className="flex items-center gap-1">
                                           <span className="material-symbols-outlined text-[14px]">call</span>
                                           {user.phone}
                                       </div>
                                   )}
                                </div>

                                <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100 self-start sm:self-auto w-full sm:w-auto">
                                    <button 
                                        onClick={() => handleRoleUpdate(user.id, 'user')}
                                        disabled={user.role !== 'admin' || processingId === user.id}
                                        className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                                            user.role !== 'admin' 
                                            ? 'bg-white text-slate-700 shadow-sm' 
                                            : 'text-slate-400 hover:text-slate-600 disabled:opacity-50'
                                        }`}
                                    >
                                        Usuario
                                    </button>
                                    <button 
                                        onClick={() => handleRoleUpdate(user.id, 'admin')}
                                        disabled={user.role === 'admin' || processingId === user.id}
                                        className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                                            user.role === 'admin' 
                                            ? 'bg-primary text-white shadow-md shadow-primary/20' 
                                            : 'text-slate-400 hover:text-slate-600 disabled:opacity-50'
                                        }`}
                                    >
                                        {processingId === user.id ? '...' : 'Admin'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
