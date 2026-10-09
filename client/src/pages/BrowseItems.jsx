import React, { useState, useEffect } from 'react'
import { Search, Filter } from 'lucide-react'
import api from '../api/api'
import ItemCard from '../components/ItemCard'

export default function BrowseItems() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [category, setCategory] = useState('all')

  useEffect(() => {
    fetchItems()
  }, [])

  const fetchItems = async () => {
    try {
      const res = await api.get('/items')
      setItems(res.data.items)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCat = category === 'all' || item.category === category
    return matchesSearch && matchesCat
  })

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-bold text-white tracking-tight">Browse Items</h1>
      </div>

      <div className="glass-card p-4 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
          <input
            type="text"
            placeholder="Search items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-zinc-900/50 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50"
          />
        </div>
        <div className="relative min-w-[200px]">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-zinc-900/50 border border-white/10 rounded-xl text-white appearance-none focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50"
          >
            <option value="all">All Categories</option>
            <option value="electronics">Electronics</option>
            <option value="books">Books</option>
            <option value="sports">Sports</option>
            <option value="kitchen">Kitchen & Home</option>
            <option value="stationery">Stationery</option>
            <option value="clothing">Clothing</option>
            <option value="tools">Tools</option>
            <option value="others">Others</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="loading-spinner"></div>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="glass-card py-20 text-center">
          <p className="text-zinc-400">No items found matching your criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredItems.map((item, index) => (
            <div key={item._id} className={`stagger-${(index % 5) + 1} animate-fade-in-up`}>
              <ItemCard item={item} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
