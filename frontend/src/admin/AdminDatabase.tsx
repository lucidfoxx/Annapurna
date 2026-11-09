import React, { useEffect, useState } from "react";
import { Database, Download, Search, Eye, X, ShieldCheck } from "lucide-react";
import { api, endpoints, getErrorMessage } from "../lib/api";

interface TableInfo {
  entity: string;
  row_count: number;
  columns: string[];
}

export function AdminDatabase() {
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [activeEntity, setActiveEntity] = useState<string>("users");
  const [columns, setColumns] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, any>[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<Record<string, any> | null>(null);

  const loadTables = async () => {
    try {
      const res = await api.get(endpoints.admin.databaseTables);
      setTables(res.data.tables || []);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const loadEntityRecords = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(endpoints.admin.databaseEntity(activeEntity), {
        params: {
          search: search || undefined,
          page,
          page_size: 20,
        },
      });
      setColumns(res.data.columns || []);
      setRows(res.data.items || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTables();
  }, []);

  useEffect(() => {
    loadEntityRecords();
  }, [activeEntity, search, page]);

  const handleExportCsv = async () => {
    try {
      const res = await api.get(endpoints.admin.databaseExport(activeEntity), {
        responseType: "blob",
      });
      const blob = new Blob([res.data], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${activeEntity}_export.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <div className="px-8 py-7 max-w-[1360px] mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold tracking-[0.14em] text-[#C84614] uppercase mb-1.5">
            SANITIZED ORM DATA EXPLORER
          </p>
          <h1 className="font-display text-[28px] font-extrabold text-[#1C1B18] tracking-[-0.02em]">
            Database Management
          </h1>
          <p className="text-[13.5px] text-[#7D776F] mt-1">
            Inspect platform tables, relationships, and export authorized datasets to CSV. Sensitive credentials and password hashes are strictly stripped.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportCsv}
          className="bg-[#C84614] hover:bg-[#B03C10] text-white text-[13px] font-semibold px-4 py-2.5 rounded-xl inline-flex items-center gap-2 transition-colors cursor-pointer shrink-0"
        >
          <Download className="w-4 h-4" />
          <span>Export {activeEntity}.csv</span>
        </button>
      </div>

      <div className="bg-[#FAF9F6] border border-[#EAE6DF] rounded-xl px-4 py-3 flex items-center gap-2.5 text-[12.5px] text-[#4A4640]">
        <ShieldCheck className="w-4 h-4 text-[#2E7D52] shrink-0" />
        <span>
          <strong>Security Policy:</strong> Read-only ORM inspection &amp; CSV export. Raw SQL execution, database credentials, and password hashes are never exposed.
        </span>
      </div>

      {error && (
        <div className="bg-[#FCEEE9] border border-[#F2C9B9] text-[#A83B18] text-[13px] px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      {/* Table Entity Selector Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
        {tables.map((t) => {
          const active = activeEntity === t.entity;
          return (
            <button
              key={t.entity}
              type="button"
              onClick={() => {
                setActiveEntity(t.entity);
                setPage(1);
              }}
              className={`p-3 rounded-xl border text-left transition-colors cursor-pointer ${
                active
                  ? "bg-[#FCEEE9] border-[#C84614]"
                  : "bg-white border-[#EAE6DF] hover:bg-[#FAF9F6]"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <Database
                  className={`w-4 h-4 ${active ? "text-[#C84614]" : "text-[#7D776F]"}`}
                />
                <span className="font-display font-extrabold text-[15px] text-[#1C1B18]">
                  {t.row_count}
                </span>
              </div>
              <p className="text-[11.5px] font-bold text-[#1C1B18] truncate">{t.entity}</p>
            </button>
          );
        })}
      </div>

      {/* Search within table */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#8A847C] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={`Search records in ${activeEntity}...`}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full bg-white pl-10 pr-4 py-2.5 rounded-xl border border-[#EAE6DF] text-[13.5px] focus:outline-none focus:border-[#C84614]"
          />
        </div>
        <span className="text-[12.5px] font-medium text-[#7D776F]">
          Showing {rows.length} of {total} records
        </span>
      </div>

      {/* Paginated Records Table */}
      <div className="bg-white border border-[#EAE6DF] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#EAE6DF] bg-[#FAF9F6] text-[11px] font-bold tracking-[0.08em] text-[#7D776F] uppercase">
                {columns.slice(0, 6).map((col) => (
                  <th key={col} className="py-3.5 px-4">
                    {col}
                  </th>
                ))}
                <th className="py-3.5 px-4 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0EDE6] text-[12.5px]">
              {loading ? (
                <tr>
                  <td
                    colSpan={columns.slice(0, 6).length + 1}
                    className="py-8 text-center text-[#7D776F]"
                  >
                    Loading records...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.slice(0, 6).length + 1}
                    className="py-8 text-center text-[#7D776F]"
                  >
                    No records in {activeEntity}.
                  </td>
                </tr>
              ) : (
                rows.map((row, idx) => (
                  <tr key={row.id ?? idx} className="hover:bg-[#FAF9F6]">
                    {columns.slice(0, 6).map((col) => (
                      <td key={col} className="py-3 px-4 max-w-[220px] truncate text-[#1C1B18]">
                        {row[col] !== null && row[col] !== undefined
                          ? String(row[col])
                          : "—"}
                      </td>
                    ))}
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedRecord(row)}
                        className="p-1.5 rounded-lg border border-[#EAE6DF] hover:bg-[#F5F3EE] text-[#4A4640] cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record JSON Detail Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white border border-[#EAE6DF] rounded-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-bold tracking-[0.12em] text-[#C84614] uppercase">
                  SANITIZED RECORD VIEW · {activeEntity}
                </p>
                <h3 className="font-display text-[18px] font-extrabold text-[#1C1B18]">
                  Record #{selectedRecord.id}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="p-1.5 rounded-lg hover:bg-[#F5F3EE] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <pre className="p-4 rounded-xl bg-[#FAF9F6] border border-[#EAE6DF] text-[12px] font-mono overflow-x-auto text-[#1C1B18]">
              {JSON.stringify(selectedRecord, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
