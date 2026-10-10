import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/api'
import { 
  Plus, 
  Package, 
  Trash2, 
  Eye, 
  EyeOff, 
  Loader, 
  X, 
  IndianRupee, 
  Sparkles, 
  Image as ImageIcon, 
  Tag, 
  FileText, 
  Layers, 
  AlertCircle,
  Clock,
  ArrowUpRight,
  Upload
} from 'lucide-react'

export default function MyItems() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ 
    name: '', 
    category: 'electronics', 
    description: '', 
    imageUrl: '', 
    depositAmount: '', 
    finePerDay: '' 
  })
  const [submitting, setSubmitting] = useState(false)
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState('')
  const [formError, setFormError] = useState('')

  useEffect(() => {
    if (!imageFile) {
      setImagePreview('')
      return
    }

    const previewUrl = URL.createObjectURL(imageFile)
    setImagePreview(previewUrl)
    return () => URL.revokeObjectURL(previewUrl)
  }, [imageFile])

  const load = async () => {
    try { 
      const r = await api.get('/items/mine')
      if (r.data.success) setItems(r.data.items) 
    } catch (err) {
      console.error('Failed to load user items:', err)
    }
    setLoading(false)
  }

  useEffect(() => { 
    load() 
  }, [])

  const handleAdd = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setFormError('')
    try {
      const itemData = new FormData()
      itemData.append('name', form.name)
      itemData.append('category', form.category)
      itemData.append('description', form.description)
      itemData.append('imageUrl', form.imageUrl)
      itemData.append('depositAmount', String(Number(form.depositAmount)))
      itemData.append('finePerDay', String(Number(form.finePerDay)))
      if (imageFile) itemData.append('image', imageFile)

      const r = await api.post('/items', itemData)
      if (r.data.success) { 
        setItems([r.data.item, ...items])
        setShowForm(false)
        setImageFile(null)
        setForm({ 
          name: '', 
          category: 'electronics', 
          description: '', 
          imageUrl: '', 
          depositAmount: '', 
          finePerDay: '' 
        }) 
      }
    } catch (err) {
      console.error('Failed to add item:', err)
      setFormError(err.response?.data?.message || 'Failed to add item. Please try again.')
    }
    setSubmitting(false)
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this item? This action cannot be undone.')) return
    try { 
      await api.delete(`/items/${id}`)
      setItems(items.filter(i => i._id !== id)) 
    } catch (err) {
      console.error('Failed to delete item:', err)
    }
  }

  const handleToggle = async (id) => {
    try { 
      const r = await api.put(`/items/${id}/toggle`)
      if (r.data.success) load() 
    } catch (err) {
      console.error('Failed to toggle item status:', err)
    }
  }

  const categories = [
    'electronics',
    'books',
    'sports',
    'kitchen',
    'stationery',
    'clothing',
    'tools',
    'others'
  ]

  const availableCount = items.filter(i => i.status === 'available').length
  const lentCount = items.filter(i => i.status === 'lent').length

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-28 animate-scale-in">
        <div className="loading-spinner mb-4 animate-pulse-glow"></div>
        <p className="text-zinc-400 text-sm font-medium">Loading your items...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-card-enter">
      {/* Hero Section */}
      <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl animate-scale-in animate-border-glow">
        {/* Background image with overlays */}
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 scale-105 "
          style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=1400&auto=format&fit=crop")' }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#09090b]/80 via-[#09090b]/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Hero Content */}
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 p-8 md:p-12">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-3">
              <span className="bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5" /> Personal Inventory Manager
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-zinc-100 tracking-tight leading-tight mb-3">
              My <span className="text-cyan-400">Listed Items</span>
            </h1>

            <p className="text-zinc-300 text-sm sm:text-base opacity-90 leading-relaxed mb-6">
              Manage items you have shared with the campus community, adjust availability, monitor borrow status, or list new gear.
            </p>

            {/* Quick Metrics */}
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <div className="flex items-center gap-2 bg-zinc-900/80 backdrop-blur-md px-3.5 py-1.5 rounded-lg border border-white/10 text-zinc-300 animate-border-glow">
                <Package className="w-3.5 h-3.5 text-blue-400" />
                <span>Total: <strong className="text-zinc-100 font-semibold">{items.length}</strong></span>
              </div>
              <div className="flex items-center gap-2 bg-zinc-900/80 backdrop-blur-md px-3.5 py-1.5 rounded-lg border border-white/10 text-zinc-300 animate-border-glow">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-glow"></span>
                <span>Available: <strong className="text-emerald-400 font-semibold">{availableCount}</strong></span>
              </div>
              <div className="flex items-center gap-2 bg-zinc-900/80 backdrop-blur-md px-3.5 py-1.5 rounded-lg border border-white/10 text-zinc-300 animate-border-glow">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse-glow"></span>
                <span>Lent Out: <strong className="text-amber-400 font-semibold">{lentCount}</strong></span>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="shrink-0 self-start md:self-center">
            <button 
              onClick={() => setShowForm(!showForm)} 
              className={`flex items-center gap-2 text-sm font-semibold py-3 px-6 rounded-xl transition-all shadow-lg animate-bounce-soft animate-border-glow ${
                showForm 
                  ? 'bg-zinc-800 text-zinc-300 border border-zinc-700 hover:bg-zinc-700 hover:text-white' 
                  : 'btn-primary shadow-blue-500/25'
              }`}
            >
              {showForm ? (
                <>
                  <X className="w-4 h-4 animate-rotate-in" />
                  <span>Cancel Listing</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 animate-rotate-in" />
                  <span>Add New Item</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Add Item Form */}
      {showForm && (
        <form 
          onSubmit={handleAdd} 
          className="glass-card p-6 md:p-8 rounded-2xl border border-blue-500/30 shadow-2xl shadow-blue-500/10 animate-scale-in space-y-6 animate-border-glow"
        >
          <div className="border-b border-white/10 pb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2 text-glow-blue">
                <Plus className="w-5 h-5 text-blue-400 animate-rotate-in" />
                List a New Item
              </h2>
              <p className="text-zinc-400 text-xs mt-1">
                Provide accurate details to help students find and borrow your item safely.
              </p>
            </div>
            <button 
              type="button" 
              onClick={() => setShowForm(false)}
              className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/80 transition-colors "
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Item Name */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-blue-400" />
                Item Name <span className="text-red-400">*</span>
              </label>
              <input 
                required 
                className="w-full bg-zinc-900/50 border border-white/10 rounded-xl text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none py-2.5 px-3.5 text-sm" 
                placeholder="e.g. Scientific Calculator FX-991CW, DSLR Camera..."
                value={form.name} 
                onChange={e => setForm({...form, name: e.target.value})} 
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-400" />
                Category <span className="text-red-400">*</span>
              </label>
              <select 
                className="w-full bg-zinc-900/50 border border-white/10 rounded-xl text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none py-2.5 px-3.5 text-sm capitalize" 
                value={form.category} 
                onChange={e => setForm({...form, category: e.target.value})}
              >
                {categories.map(c => (
                  <option key={c} value={c} className="capitalize">
                    {c.charAt(0).toUpperCase() + c.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-400" />
                Description <span className="text-red-400">*</span>
              </label>
              <textarea 
                required 
                rows={3} 
                className="w-full bg-zinc-900/50 border border-white/10 rounded-xl text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none py-2.5 px-3.5 text-sm leading-relaxed" 
                placeholder="Describe the condition, specs, included accessories, or pickup requirements..."
                value={form.description} 
                onChange={e => setForm({...form, description: e.target.value})} 
              />
            </div>

            {/* Image Upload and URL */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-blue-400" />
                Item Image (Optional)
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-zinc-900/50 px-3.5 py-2.5 text-sm text-zinc-300 hover:border-cyan-500/50 transition-colors">
                  <Upload className="w-4 h-4 shrink-0 text-blue-400" />
                  <span className="min-w-0 flex-1 truncate">
                    {imageFile ? imageFile.name : 'Choose an image from your device'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={e => {
                      setImageFile(e.target.files?.[0] || null)
                      if (e.target.files?.[0]) {
                        setForm({ ...form, imageUrl: '' })
                      }
                    }}
                  />
                </label>
                <input 
                  type="url"
                  className="w-full bg-zinc-900/50 border border-white/10 rounded-xl text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none py-2.5 px-3.5 text-sm" 
                  aria-label="Image URL"
                  placeholder="https://images.unsplash.com/photo-..."
                  value={form.imageUrl} 
                  onChange={e => {
                    setForm({ ...form, imageUrl: e.target.value })
                    if (e.target.value) setImageFile(null)
                  }} 
                />
              </div>
              <p className="mt-1.5 text-[11px] text-zinc-500">
                Upload an image (up to 5 MB) or provide an image URL.
              </p>
              {(imagePreview || form.imageUrl) && (
                <div className="mt-3 h-24 w-32 rounded-lg bg-zinc-800 border border-white/10 overflow-hidden animate-scale-in animate-border-glow">
                    <img 
                      src={imagePreview || form.imageUrl} 
                      alt="Preview" 
                      className="w-full h-full object-cover" 
                      onError={(e) => { e.target.style.display = 'none' }}
                    />
                </div>
              )}
            </div>

            {/* Deposit & Fine */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center gap-1.5">
                <IndianRupee className="w-3.5 h-3.5 text-emerald-400" />
                Security Deposit (₹) <span className="text-red-400">*</span>
              </label>
              <input 
                type="number" 
                required 
                min="0"
                className="w-full bg-zinc-900/50 border border-white/10 rounded-xl text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none py-2.5 px-3.5 text-sm" 
                placeholder="e.g. 500 (returned after a safe item return)"
                value={form.depositAmount} 
                onChange={e => setForm({...form, depositAmount: e.target.value})} 
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                Fine per Day (₹) <span className="text-red-400">*</span>
              </label>
              <input 
                type="number" 
                required 
                min="0"
                className="w-full bg-zinc-900/50 border border-white/10 rounded-xl text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none py-2.5 px-3.5 text-sm" 
                placeholder="e.g. 50 (Charged if returned late)"
                value={form.finePerDay} 
                onChange={e => setForm({...form, finePerDay: e.target.value})} 
              />
            </div>
          </div>

          {formError && (
            <p role="alert" className="flex items-center gap-2 text-sm text-red-400">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {formError}
            </p>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
            <button 
              type="button" 
              onClick={() => setShowForm(false)} 
              className="btn-outline text-xs py-2.5 px-4"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={submitting} 
              className="btn-primary flex items-center gap-2 text-xs py-2.5 px-6 shadow-md shadow-blue-500/25 animate-border-glow"
            >
              {submitting ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  <span>Listing Item...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>List Item</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Items Grid */}
      {items.length === 0 ? (
        <div className="glass-card text-center py-20 px-6 animate-scale-in border border-white/5 rounded-2xl animate-border-glow">
          <div className="w-16 h-16 rounded-2xl bg-zinc-800/80 flex items-center justify-center mx-auto mb-4 border border-white/5 ">
            <Package className="w-8 h-8 text-zinc-600 " />
          </div>
          <p className="text-zinc-200 text-lg font-bold text-glow-blue">No items listed yet</p>
          <p className="text-zinc-500 text-sm mt-1 max-w-sm mx-auto">
            Share items you don't use every day and help fellow students while keeping track of deposits.
          </p>
          <button 
            onClick={() => setShowForm(true)}
            className="mt-6 btn-primary inline-flex items-center gap-2 text-sm py-2.5 px-5 animate-border-glow animate-bounce-soft"
          >
            <Plus className="w-4 h-4" />
            List Your First Item
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item, i) => (
            <div 
              key={item._id} 
              className={`glass-card rounded-2xl overflow-hidden flex flex-col border border-white/5 transition-all duration-300 group animate-scale-in stagger-${(i % 4) + 1} animate-border-glow`}
            >
              {/* Image Container with Badges */}
              <div className="h-44 sm:h-48 bg-zinc-900/80 relative overflow-hidden shrink-0">
                {item.imageUrl ? (
                  <img 
                    src={item.imageUrl} 
                    alt={item.name} 
                    className="w-full h-full object-cover transition-transform duration-700 ease-out z-10 relative" 
                    onError={(e) => {
                      e.target.onerror = null
                      e.target.style.display = 'none'
                      if (e.target.nextElementSibling) e.target.nextElementSibling.style.display = 'flex'
                    }}
                  />
                ) : null}
                
                <div 
                  className={`w-full h-full flex-col items-center justify-center absolute inset-0 z-0 bg-gradient-to-br ${
                    {
                      'electronics': 'from-blue-600/40 to-indigo-900/60',
                      'books': 'from-emerald-600/40 to-teal-900/60',
                      'sports': 'from-amber-600/40 to-orange-900/60',
                      'kitchen': 'from-rose-600/40 to-red-900/60',
                      'stationery': 'from-pink-600/40 to-fuchsia-900/60',
                      'clothing': 'from-violet-600/40 to-purple-900/60',
                      'tools': 'from-cyan-600/40 to-sky-900/60'
                    }[item.category?.toLowerCase()] || 'from-zinc-600/40 to-zinc-900/60'
                  }`}
                  style={{ display: item.imageUrl ? 'none' : 'flex' }}
                >
                  <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '16px 16px' }}></div>
                  <Package className="w-14 h-14 text-white/70 mb-2 relative z-10 drop-shadow-md" />
                  <span className="text-[10px] font-bold text-white/70 tracking-wider uppercase relative z-10">{item.category || 'Item'}</span>
                </div>

                {/* Dark gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#18181b] via-transparent to-black/30 pointer-events-none z-20" />

                {/* Category Badge Top Left */}
                {item.category && (
                  <span className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-zinc-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-white/10 uppercase tracking-wider animate-pulse-glow z-30">
                    {item.category}
                  </span>
                )}

                {/* Status Badge Top Right */}
                <span className={`badge-${item.status || 'available'} absolute top-3 right-3 backdrop-blur-md shadow-md capitalize animate-pulse-glow z-30`}>
                  {item.status || 'available'}
                </span>
              </div>

              {/* Card Body */}
              <div className="p-5 flex flex-col flex-1">
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <h3 className="text-zinc-100 font-bold text-base truncate group-hover:text-blue-300 transition-colors text-glow-cyan">
                    {item.name}
                  </h3>
                  <Link 
                    to={`/items/${item._id}`} 
                    className="text-zinc-500 hover:text-blue-400 p-0.5 transition-colors "
                    title="View item details"
                  >
                    <ArrowUpRight className="w-4 h-4 animate-bounce-soft" />
                  </Link>
                </div>

                <p className="text-zinc-400 text-xs sm:text-sm line-clamp-2 mb-4 leading-relaxed flex-1">
                  {item.description}
                </p>

                {/* Pricing Badges */}
                <div className="flex items-center justify-between text-xs py-2.5 px-3 rounded-xl bg-zinc-900/60 border border-white/5 mb-4 animate-border-glow">
                  <span className="flex items-center text-emerald-400 font-semibold gap-0.5">
                    <IndianRupee className="w-3.5 h-3.5" />
                    {item.depositAmount}
                    <span className="text-zinc-500 font-normal text-[11px] ml-1">deposit</span>
                  </span>
                  <span className="text-zinc-400 bg-zinc-800/80 px-2 py-0.5 rounded border border-white/5">
                    ₹{item.finePerDay}/day fine
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 pt-2 border-t border-white/5 mt-auto">
                  <button 
                    onClick={() => handleToggle(item._id)} 
                    className="btn-outline text-xs py-2 px-3 flex-1 flex items-center justify-center gap-1.5 transition-all "
                    title={item.status === 'available' ? 'Hide from browse' : 'Make available for borrowing'}
                  >
                    {item.status === 'available' ? (
                      <>
                        <EyeOff className="w-3.5 h-3.5 text-zinc-400" />
                        <span>Hide</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-3.5 h-3.5 text-blue-400" />
                        <span>Make Available</span>
                      </>
                    )}
                  </button>

                  <button 
                    onClick={() => handleDelete(item._id)} 
                    className="btn-outline text-xs py-2 px-3 flex items-center justify-center gap-1.5 text-red-400 border-red-500/20 hover:bg-red-500/10 hover:text-red-300 transition-all "
                    title="Delete listing"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
