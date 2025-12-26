import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import type { Profile } from '../../types';

export function UsersManager() {
    const [users, setUsers] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [updatingId, setUpdatingId] = useState<string | null>(null);

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
            alert('Error al cargar usuarios');
        } finally {
            setLoading(false);
        }
    };

    const handleRoleUpdate = async (userId: string, newRole: 'admin' | 'user') => {
        if (!window.confirm(`¿Estás seguro de cambiar el rol de este usuario a ${newRole}?`)) return;
        
        setUpdatingId(userId);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ role: newRole })
                .eq('id', userId);

            if (error) throw error;

            setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
        } catch (error) {
            console.error('Error updating role:', error);
            alert('Error al actualizar rol. Verifica tus permisos.');
        } finally {
            setUpdatingId(null);
        }
    };

    const filteredUsers = users.filter(user => 
        user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phone?.includes(searchTerm)
    );

    return (
        <div className="space-y-6">
            {/* Header & Search */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                   <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Usuarios Registrados</h3>
                   <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Gestión de Acceso y Roles</p>
                </div>
                <div className="w-full md:w-auto relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
                    <input 
                        type="text" 
                        placeholder="Buscar por nombre, email..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full md:w-64 pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all placeholder:text-slate-400 placeholder:uppedcrase"
                    />
                </div>
            </div>

            {/* List */}
            <div className="grid grid-cols-1 gap-4">
                {loading ? (
                    <div className="bg-white p-12 rounded-3xl text-center">
                        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Cargando Usuarios...</p>
                    </div>
                ) : filteredUsers.length === 0 ? (
                    <div className="bg-white p-12 rounded-3xl text-center border border-slate-100 border-dashed">
                        <span className="material-symbols-outlined text-4xl text-slate-200 mb-2">group_off</span>
                        <p className="text-sm font-bold text-slate-400">No se encontraron usuarios</p>
                    </div>
                ) : (
                    filteredUsers.map((user) => (
                        <div key={user.id} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row items-center gap-4 group">
                            {/* Avatar/Initials */}
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-black ${
                                user.role === 'admin' 
                                ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                                : 'bg-slate-100 text-slate-500'
                            }`}>
                                {user.avatar_url ? (
                                    <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover rounded-2xl" />
                                ) : (
                                    user.full_name?.charAt(0).toUpperCase() || 'U'
                                )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 text-center md:text-left">
                                <div className="flex items-center justify-center md:justify-start gap-2">
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

                            {/* Actions */}
                            <div className="flex items-center gap-2">
                                <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100">
                                    <button 
                                        onClick={() => handleRoleUpdate(user.id, 'user')}
                                        disabled={user.role !== 'admin' || updatingId === user.id}
                                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                                            user.role !== 'admin' 
                                            ? 'bg-white text-slate-700 shadow-sm' 
                                            : 'text-slate-400 hover:text-slate-600'
                                        }`}
                                    >
                                        Usuario
                                    </button>
                                    <button 
                                        onClick={() => handleRoleUpdate(user.id, 'admin')}
                                        disabled={user.role === 'admin' || updatingId === user.id}
                                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                                            user.role === 'admin' 
                                            ? 'bg-primary text-white shadow-md shadow-primary/20' 
                                            : 'text-slate-400 hover:text-slate-600'
                                        }`}
                                    >
                                        Admin
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
