import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Tariff } from '../types';

export function TariffsManager() {
  const [tariffs, setTariffs] = useState<Tariff[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Tariff>>({
    category: 'Transporte',
    sub_category: '',
    price: 0,
    description: ''
  });

  useEffect(() => {
    loadTariffs();
  }, []);

  const loadTariffs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('tariffs')
      .select('*')
      .order('category', { ascending: true })
      .order('sub_category', { ascending: true });

    if (!error && data) {
      setTariffs(data);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta tarifa?')) return;

    const { error } = await supabase.from('tariffs').delete().eq('id', id);
    if (!error) {
      setTariffs(prev => prev.filter(t => t.id !== id));
    } else {
      alert('Error al eliminar');
    }
  };

  const handleEdit = (tariff: Tariff) => {
    setFormData(tariff);
    setEditingId(tariff.id);
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.sub_category || !formData.price) return alert('Campos obligatorios');

    const { error } = await supabase
      .from('tariffs')
      .upsert({
        id: editingId || undefined,
        category: formData.category,
        sub_category: formData.sub_category,
        price: formData.price,
        description: formData.description
      })
      .select()
      .single();

    if (!error) {
      loadTariffs(); // Reload to sort correctly
      setIsFormOpen(false);
      setEditingId(null);
      setFormData({ category: 'Transporte', sub_category: '', price: 0, description: '' });
    } else {
      console.error(error);
      alert('Error al guardar');
    }
  };

  if (loading) return <div className="p-4 text-center text-slate-400">Cargando tarifas...</div>;

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="font-black text-slate-800 text-lg">Gestor de Tarifas</h3>
          <p className="text-xs text-slate-400">Precios que usa el Chatbot</p>
        </div>
        <button 
          onClick={() => {
            setEditingId(null);
            setFormData({ category: 'Transporte', sub_category: '', price: 0, description: '' });
            setIsFormOpen(true);
          }}
          className="bg-primary text-white rounded-xl px-4 py-2 text-xs font-bold flex items-center gap-2 hover:bg-blue-700 transition-all"
        >
          <span className="material-symbols-outlined text-sm">add</span>
          Nueva Tarifa
        </button>
      </div>

      {/* Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-scale-in">
            <h4 className="font-black text-slate-800 mb-4">{editingId ? 'Editar Tarifa' : 'Nueva Tarifa'}</h4>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Categoría</label>
                <select 
                  className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 outline-none focus:border-primary"
                  value={formData.category}
                  onChange={e => setFormData({...formData, category: e.target.value})}
                >
                  <option value="Transporte">Transporte</option>
                  <option value="Taller">Taller</option>
                  <option value="Insumos">Insumos</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Nombre / Sub-categoría</label>
                <input 
                  type="text"
                  placeholder="Ej: Traslado Aeropuerto"
                  className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 outline-none focus:border-primary"
                  value={formData.sub_category}
                  onChange={e => setFormData({...formData, sub_category: e.target.value})}
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Precio</label>
                <input 
                  type="number"
                  placeholder="0"
                  className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 outline-none focus:border-primary"
                  value={formData.price}
                  onChange={e => setFormData({...formData, price: Number(e.target.value)})}
                />
              </div>
               <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Descripción (Opcional)</label>
                <input 
                  type="text"
                  placeholder="Ej: Solo ida, incluye espera..."
                  className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 outline-none focus:border-primary"
                  value={formData.description || ''}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setIsFormOpen(false)} className="flex-1 py-3 text-xs font-bold text-slate-400 hover:bg-slate-50 rounded-xl transition-all">Cancelar</button>
                <button type="submit" className="flex-1 py-3 bg-emerald-500 text-white text-xs font-black rounded-xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* List */}
      <div className="space-y-3">
        {tariffs.map(tariff => (
          <div key={tariff.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-blue-200 transition-all">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                  tariff.category === 'Transporte' ? 'bg-blue-100 text-blue-600' : 
                  tariff.category === 'Taller' ? 'bg-orange-100 text-orange-600' : 'bg-slate-200 text-slate-500'
                }`}>
                  {tariff.category}
                </span>
                <span className="font-bold text-slate-700 text-sm">{tariff.sub_category}</span>
              </div>
              <p className="text-xs text-slate-400">{tariff.description}</p>
            </div>
            <div className="flex items-center gap-4">
               <span className="font-black text-slate-900">${tariff.price.toLocaleString()}</span>
               <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                 <button onClick={() => handleEdit(tariff)} className="p-1.5 text-slate-400 hover:text-blue-500 bg-white rounded-lg shadow-sm"><span className="material-symbols-outlined text-sm">edit</span></button>
                 <button onClick={() => handleDelete(tariff.id)} className="p-1.5 text-slate-400 hover:text-red-500 bg-white rounded-lg shadow-sm"><span className="material-symbols-outlined text-sm">delete</span></button>
               </div>
            </div>
          </div>
        ))}
        {tariffs.length === 0 && (
          <div className="text-center py-10">
            <p className="text-sm text-slate-400 font-bold">No hay tarifas registradas</p>
          </div>
        )}
      </div>
    </div>
  );
}
