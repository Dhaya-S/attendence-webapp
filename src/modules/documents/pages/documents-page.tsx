import React, { useState } from "react";
import {
  Upload,
  Plus,
  Search,
  FileText,
  Eye,
  Download,
  Trash2,
} from "lucide-react";
import { AppPage } from "@/shared/types";
import { cn, fmtDate } from "@/shared/utils";
import {
  Btn,
  InputField,
  SelectField,
  Modal,
  StatusBadge,
} from "@/shared/components";
import { DOCUMENTS_LIST } from "@/modules/documents/data/documents-list";

export function DocumentsPage({ navigate }: { navigate: (p: AppPage) => void }) {
  const [docCat, setDocCat] = useState("All");
  const [showUpload, setShowUpload] = useState(false);

  return (
    <div className="flex flex-col h-full text-left">
      <PageHeader
        title="Documents"
        subtitle="Company policies, templates, and employee documents"
        breadcrumbs={[
          { label: "Home", onClick: () => navigate("my-space") },
          { label: "Documents" },
        ]}
      >
        <Btn variant="outline" size="sm" onClick={() => setShowUpload(true)}>
          <Upload size={13} />
          Upload
        </Btn>
        <Btn size="sm" onClick={() => setShowUpload(true)}>
          <Plus size={13} />
          New Document
        </Btn>
      </PageHeader>
      <div className="flex-1 overflow-auto p-6">
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex gap-2">
              {["All", "Policy", "Template", "Legal"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setDocCat(cat)}
                  className={cn(
                    "px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer",
                    cat === docCat ? "bg-[#5C5CFF] text-white" : "text-gray-600 hover:bg-gray-100"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
            <div className="relative">
              <Search
                size={13}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                className="pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#5C5CFF] text-gray-900"
                placeholder="Search…"
              />
            </div>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {[
                  "Document",
                  "Category",
                  "Size",
                  "Updated By",
                  "Updated",
                  "Status",
                  "Actions",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {DOCUMENTS_LIST.filter(
                (d) => docCat === "All" || d.category === docCat
              ).map((d) => (
                <tr key={d.id} className="hover:bg-gray-50 group">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded bg-red-50 flex items-center justify-center">
                        <FileText size={14} className="text-red-500" />
                      </div>
                      <span className="font-medium text-gray-800">{d.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                      {d.category}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-505 text-xs">{d.size}</td>
                  <td className="px-5 py-3 text-gray-600">{d.updatedBy}</td>
                  <td className="px-5 py-3 text-gray-505 text-xs">
                    {fmtDate(d.updated)}
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge status={d.status} />
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex gap-1.5 opacity-0 group-hover:opacity-100">
                      <button className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-[#5C5CFF] cursor-pointer">
                        <Eye size={13} />
                      </button>
                      <button className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600 cursor-pointer">
                        <Download size={13} />
                      </button>
                      <button className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-red-500 cursor-pointer">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {showUpload && (
        <Modal title="Upload Document" onClose={() => setShowUpload(false)}>
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-[#5C5CFF] transition-colors cursor-pointer">
              <Upload size={28} className="mx-auto text-gray-400 mb-3" />
              <p className="text-sm font-medium text-gray-700 mb-1">
                Drag &amp; drop files here
              </p>
              <p className="text-xs text-gray-400">PDF, DOCX, XLSX up to 25 MB</p>
              <Btn variant="outline" size="sm" className="mt-4">
                Browse Files
              </Btn>
            </div>
            <SelectField
              label="Category"
              options={["Policy", "Template", "Legal", "Other"]}
            />
            <InputField
              label="Document Name"
              placeholder="e.g. Employee Handbook 2025"
            />
            <SelectField
              label="Access Level"
              options={["All Employees", "HR Only", "Admins Only"]}
            />
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <Btn variant="outline" onClick={() => setShowUpload(false)}>
                Cancel
              </Btn>
              <Btn onClick={() => setShowUpload(false)}>
                <Upload size={13} />
                Upload
              </Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// Inline PageHeader helper for DocumentsPage
function PageHeader({
  title,
  subtitle,
  breadcrumbs,
  children,
}: {
  title: string;
  subtitle?: string;
  breadcrumbs?: { label: string; onClick?: () => void }[];
  children?: React.ReactNode;
}) {
  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        {breadcrumbs && (
          <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1">
            {breadcrumbs.map((b, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <span className="select-none">/</span>}
                {b.onClick ? (
                  <button
                    onClick={b.onClick}
                    className="hover:text-gray-655 font-medium cursor-pointer"
                  >
                    {b.label}
                  </button>
                ) : (
                  <span className="text-gray-500 font-semibold">{b.label}</span>
                )}
              </React.Fragment>
            ))}
          </div>
        )}
        <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
        {subtitle && <p className="text-xs text-gray-505 mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2.5">{children}</div>
    </div>
  );
}
