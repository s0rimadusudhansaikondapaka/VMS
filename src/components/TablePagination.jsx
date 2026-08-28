import React, { useState, useMemo, useEffect } from 'react';
import { Search, ChevronLeft, ChevronRight, Filter } from 'lucide-react';

export function useTablePagination(data = [], searchKeys = ['visitor_name', 'full_name', 'name', 'phone', 'visitor_phone', 'pass_code', 'vehicle_no', 'plate_number', 'flat_info', 'id'], pageSize = 10) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // 1. Sort latest first (newest timestamp or highest ID at top)
  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => {
      const timeA = new Date(a.created_at || a.timestamp || a.valid_from || a.departure_date || 0).getTime() || Number(a.id) || 0;
      const timeB = new Date(b.created_at || b.timestamp || b.valid_from || b.departure_date || 0).getTime() || Number(b.id) || 0;
      return timeB - timeA; // Latest comes first!
    });
  }, [data]);

  // 2. Filter by search query across Name, Phone, Passcode, Vehicle etc.
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return sortedData;
    const term = searchTerm.toLowerCase().trim();
    return sortedData.filter((item) => {
      return searchKeys.some((key) => {
        const val = item[key];
        return val && String(val).toLowerCase().includes(term);
      });
    });
  }, [sortedData, searchTerm, searchKeys]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // 3. Paginate
  const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize));
  const validPage = Math.min(Math.max(1, currentPage), totalPages);
  
  const paginatedData = useMemo(() => {
    const start = (validPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, validPage, pageSize]);

  return {
    searchTerm,
    setSearchTerm,
    currentPage: validPage,
    setCurrentPage,
    totalPages,
    totalItems: filteredData.length,
    paginatedData,
  };
}

export function PaginationControls({ searchTerm, setSearchTerm, currentPage, setCurrentPage, totalPages, totalItems, pageSize = 10, placeholder = "Search by Name, Phone, Passcode, Vehicle No..." }) {
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', margin: '0.8rem 0' }}>
      {/* Search Bar */}
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search size={16} color="#64748b" style={{ position: 'absolute', left: '0.75rem' }} />
          <input
            type="text"
            placeholder={placeholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', paddingLeft: '2.4rem', margin: 0, height: '38px', fontSize: '0.85rem', background: '#ffffff', color: '#1e293b', border: '1px solid #cbd5e1', borderRadius: '6px' }}
          />
        </div>
      </div>

      {/* Pagination Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: '#475569', background: '#f8fafc', padding: '0.4rem 0.8rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
        <span>
          Showing <strong>{startItem}-{endItem}</strong> of <strong>{totalItems}</strong> records (Latest First)
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            type="button"
            className="secondary outline"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage(currentPage - 1)}
            style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.2rem' }}
          >
            <ChevronLeft size={14} /> Prev
          </button>
          <span style={{ fontWeight: 'bold', color: '#1e293b', padding: '0 0.3rem' }}>
            Page {currentPage} of {totalPages}
          </span>
          <button
            type="button"
            className="secondary outline"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
            style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.2rem' }}
          >
            Next <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
