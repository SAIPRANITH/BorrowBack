import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Star, IndianRupee, ArrowRight, User } from 'lucide-react'

const CATEGORY_FALLBACKS = {
 electronics: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop&q=80',
 books: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=800&auto=format&fit=crop&q=80',
 sports: 'https://images.unsplash.com/photo-1519861531473-9200262188bf?w=800&auto=format&fit=crop&q=80',
 kitchen: 'https://images.unsplash.com/photo-1588854337236-6889d631faa8?w=800&auto=format&fit=crop&q=80',
 tools: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800&auto=format&fit=crop&q=80',
 stationery: 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=800&auto=format&fit=crop&q=80',
 clothing: 'https://images.unsplash.com/photo-1520045892732-304bc3ac5d8e?w=800&auto=format&fit=crop&q=80',
 others: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&auto=format&fit=crop&q=80'
}

export default function ItemCard({ item }) {
 const [imgSrc, setImgSrc] = useState(
 item.imageUrl && item.imageUrl.trim() !== ''
 ? item.imageUrl
 : (CATEGORY_FALLBACKS[item.category] || CATEGORY_FALLBACKS.electronics)
 )

 const handleImageError = () => {
 const fallback = CATEGORY_FALLBACKS[item.category] || CATEGORY_FALLBACKS.electronics
 if (imgSrc !== fallback) {
 setImgSrc(fallback)
 }
 }

 return (
 <Link 
 to={`/items/${item._id}`} 
 className="glass-card flex flex-col h-full group rounded-2xl overflow-hidden border border-white/5 dark:border-white/5 transition-all duration-300"
 >
 {/* Card Image Area with 3D Hover Zoom */}
 <div className="h-48 sm:h-52 bg-zinc-900/80 relative overflow-hidden shrink-0">
 <img 
 src={imgSrc} 
 alt={item.name} 
 onError={handleImageError}
 className="w-full h-full object-cover transition-transform duration-700 ease-out " 
 loading="lazy"
 />

 {/* Subtle Dark Gradient Overlay */}
 <div className="absolute inset-0 bg-gradient-to-t from-[#18181b] via-transparent to-black/30 pointer-events-none opacity-75 group-hover:opacity-50 transition-opacity" />

 {/* Category Pill (Top Left) */}
 {item.category && (
 <span className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-zinc-300 text-[10px] font-bold px-2.5 py-1 rounded-full border border-white/10 uppercase tracking-wider shadow-sm">
 {item.category}
 </span>
 )}

 {/* Status Badge (Top Right) */}
 <span className={`badge-${item.status || 'available'} absolute top-3 right-3 backdrop-blur-md shadow-md`}>
 {item.status || 'available'}
 </span>
 </div>

 {/* Card Content */}
 <div className="p-4 sm:p-5 flex flex-col flex-1">
 <h3 className="text-zinc-100 font-bold text-base mb-1.5 truncate group-hover:text-cyan-400 transition-colors">
 {item.name}
 </h3>
 
 <p className="text-zinc-400 text-xs sm:text-sm mb-4 line-clamp-2 flex-1 leading-relaxed">
 {item.description}
 </p>

 {/* Deposit and Fine Details */}
 <div className="flex items-center justify-between pt-3 border-t border-white/5 mt-auto">
 <div className="flex items-center gap-2">
 <div className="flex items-center text-emerald-400 font-bold text-sm">
 <IndianRupee className="w-3.5 h-3.5" />
 <span>{item.depositAmount}</span>
 <span className="text-zinc-500 font-normal text-[11px] ml-1">deposit</span>
 </div>
 <span className="text-zinc-600 text-xs">•</span>
 <span className="text-zinc-400 text-xs bg-zinc-800/80 px-2 py-0.5 rounded border border-white/5">
 ₹{item.finePerDay}/day fine
 </span>
 </div>

 {item.averageRating > 0 && (
 <span className="flex items-center gap-1 text-amber-400 text-xs font-semibold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
 <Star className="w-3 h-3 fill-amber-400" />
 {item.averageRating.toFixed(1)}
 </span>
 )}
 </div>

 {/* Owner & Action Hint */}
 {item.owner && (
 <div className="flex items-center justify-between text-xs text-zinc-500 mt-3 pt-2.5 border-t border-white/[0.04]">
 <div className="flex items-center gap-1.5 truncate">
 <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 text-white font-bold text-[10px] flex items-center justify-center shrink-0 shadow-sm">
 {item.owner.name ? item.owner.name.charAt(0).toUpperCase() : <User className="w-3 h-3" />}
 </div>
 <span className="truncate text-zinc-400">by <span className="text-zinc-300 font-medium">{item.owner.name}</span></span>
 </div>
 <span className="text-cyan-400 group- transition-transform flex items-center text-[11px] font-semibold shrink-0">
 View <ArrowRight className="w-3 h-3 ml-0.5" />
 </span>
 </div>
 )}
 </div>
 </Link>
 )
}
