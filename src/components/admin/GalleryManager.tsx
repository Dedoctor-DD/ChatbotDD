import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Loader2, Trash2, Plus } from 'lucide-react';

interface GalleryItem {
    id: string;
    title: string;
    description: string;
    image_url: string;
    category: string;
}

export function GalleryManager() {
    const [items, setItems] = useState<GalleryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    
    // New item form state
    const [newItem, setNewItem] = useState({
        title: '',
        description: '',
        imageUrl: '',
        category: 'general'
    });
    const [isFormOpen, setIsFormOpen] = useState(false);

    useEffect(() => {
        loadGallery();
    }, []);

    const loadGallery = async () => {
        const { data } = await supabase
            .from('gallery')
            .select('*')
            .order('created_at', { ascending: false });
        if (data) setItems(data);
        setLoading(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar esta imagen?')) return;
        
        const { error } = await supabase.from('gallery').delete().eq('id', id);
        if (!error) {
            setItems(items.filter(i => i.id !== id));
        }
    };

    const handleCreate = async () => {
        if (!newItem.imageUrl) return;
        setUploading(true);
        
        try {
            const { error } = await supabase.from('gallery').insert([{
                title: newItem.title,
                description: newItem.description,
                image_url: newItem.imageUrl,
                category: newItem.category
            }]);

            if (error) throw error;
            
            await loadGallery();
            setIsFormOpen(false);
            setNewItem({ title: '', description: '', imageUrl: '', category: 'general' });
        } catch (e) {
            console.error(e);
            alert('Error al guardar imagen');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-3xl shadow-lg shadow-slate-200/50 border border-slate-50 h-fit">
            <div className="flex justify-between items-center mb-6">
                 <div>
                    <h3 className="font-black text-slate-800">Galería de Imágenes</h3>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Landing Page</p>
                 </div>
                 <button 
                  onClick={() => setIsFormOpen(!isFormOpen)}
                  className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center hover:bg-primary hover:text-white transition-all"
                 >
                    <Plus size={20} />
                 </button>
            </div>

            {isFormOpen && (
                <div className="mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-100 animate-fade-in">
                    <div className="space-y-3">
                        <input 
                            placeholder="Título (Opcional)" 
                            value={newItem.title}
                            onChange={(e) => setNewItem({...newItem, title: e.target.value})}
                            className="w-full bg-white p-3 rounded-xl text-xs font-bold border border-slate-200 outline-none focus:border-primary"
                        />
                         <input 
                            placeholder="Descripción (Opcional)" 
                            value={newItem.description}
                            onChange={(e) => setNewItem({...newItem, description: e.target.value})}
                            className="w-full bg-white p-3 rounded-xl text-xs font-bold border border-slate-200 outline-none focus:border-primary"
                        />
                        <input 
                            placeholder="URL de la Imagen (https://...)" 
                            value={newItem.imageUrl}
                            onChange={(e) => setNewItem({...newItem, imageUrl: e.target.value})}
                            className="w-full bg-white p-3 rounded-xl text-xs font-bold border border-slate-200 outline-none focus:border-primary"
                        />
                        <select 
                            value={newItem.category}
                            onChange={(e) => setNewItem({...newItem, category: e.target.value})}
                            className="w-full bg-white p-3 rounded-xl text-xs font-bold border border-slate-200 outline-none focus:border-primary"
                        >
                            <option value="general">General</option>
                            <option value="transport">Transporte</option>
                            <option value="workshop">Taller</option>
                        </select>
                        <button 
                            disabled={uploading || !newItem.imageUrl}
                            onClick={handleCreate}
                            className="w-full py-3 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest disabled:opacity-50"
                        >
                            {uploading ? 'Guardando...' : 'Añadir Imagen'}
                        </button>
                    </div>
                </div>
            )}

            <div className="space-y-3 max-h-[400px] overflow-y-auto no-scrollbar">
                {loading ? (
                    <div className="text-center py-4"><Loader2 className="animate-spin mx-auto text-primary" /></div>
                ) : items.length === 0 ? (
                    <p className="text-center text-xs text-slate-400 py-4">No hay imágenes en la galería</p>
                ) : (
                    items.map(item => (
                        <div key={item.id} className="flex gap-3 bg-slate-50 p-2 rounded-2xl group border border-slate-100">
                           <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-200 shrink-0">
                                <img src={item.image_url} alt="Gallery" className="w-full h-full object-cover" />
                           </div>
                           <div className="flex-1 flex flex-col justify-center min-w-0">
                                <h4 className="text-xs font-black text-slate-700 truncate">{item.title || 'Sin título'}</h4>
                                <p className="text-[10px] text-slate-400 truncate">{item.image_url}</p>
                           </div>
                           <button 
                            onClick={() => handleDelete(item.id)}
                            className="w-8 h-8 self-center rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all flex items-center justify-center"
                           >
                               <Trash2 size={16} />
                           </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
