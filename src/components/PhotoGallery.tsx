import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface GalleryItem {
  id: string;
  title: string;
  description: string;
  image_url: string;
  category: string;
}

export function PhotoGallery() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadGallery() {
      const { data } = await supabase
  .from('gallery')
  .select('*')
  .order('display_order', { ascending: true });
      
      if (data) setItems(data);
      setLoading(false);
    }
    loadGallery();
  }, []);

  if (loading) return null;

  return (
    <div className="w-full space-y-6">
      <div className="flex justify-between items-end mb-2">
        <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">Galería de <span className="text-primary">Servicios</span></h3>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        {items.map((item, idx) => (
          <div 
            key={item.id} 
            className={`group relative overflow-hidden rounded-[2rem] bg-gray-100 dark:bg-gray-800 shadow-lg ${idx === 0 ? 'col-span-2 h-64' : 'h-48'}`}
          >
            <img 
              src={item.image_url} 
              alt={item.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity"></div>
            <div className="absolute bottom-0 left-0 p-6 text-white transform translate-y-2 group-hover:translate-y-0 transition-transform">
              <span className="text-[8px] font-black uppercase tracking-[0.2em] opacity-80 mb-1 block">{item.category}</span>
              <h4 className="text-sm font-bold leading-tight">{item.title}</h4>
              <p className="text-[10px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 line-clamp-2 mt-1">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
