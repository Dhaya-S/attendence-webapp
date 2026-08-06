import React, { useState, useEffect, useRef } from "react";
import {
  Upload,
  Plus,
  Search,
  FileText,
  Eye,
  Download,
  Trash2,
  FileCheck,
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
import { useAuth } from "@/shared/context/AuthContext";
import { db, auth } from "@/shared/utils/firebase";
import {
  collection,
  onSnapshot,
  setDoc,
  deleteDoc,
  doc,
  getDoc,
} from "firebase/firestore";

export function DocumentsPage({ navigate }: { navigate: (p: AppPage) => void }) {
  const { companyId, displayName, user } = useAuth();
  const [targetCompanyId, setTargetCompanyId] = useState<string>(companyId && companyId !== "default" ? companyId : "");
  const [documents, setDocuments] = useState<any[]>([]);
  const [docCat, setDocCat] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [showUpload, setShowUpload] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<any | null>(null);

  // Form states for upload modal
  const [docName, setDocName] = useState("");
  const [category, setCategory] = useState("Policy");
  const [accessLevel, setAccessLevel] = useState("All Employees");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileDataUrl, setFileDataUrl] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dynamically resolve active Company ID
  useEffect(() => {
    async function loadCompanyId() {
      let tid = companyId && companyId !== "default" ? companyId : "";
      const userEmail = (auth.currentUser?.email || user?.email || "").toLowerCase();
      if (!tid && userEmail) {
        try {
          const appSnap = await getDoc(doc(db, "approved_users", userEmail));
          if (appSnap.exists()) {
            tid = appSnap.data().companyId || appSnap.data().orgId || "";
          }
        } catch (_) {}
      }
      setTargetCompanyId(tid || "default");
    }
    loadCompanyId();
  }, [companyId, user]);

  // Real-time listener for Firestore documents subcollection
  useEffect(() => {
    if (!targetCompanyId) return;
    const colRef = collection(db, "organizations", targetCompanyId, "documents");
    const unsub = onSnapshot(
      colRef,
      (snap) => {
        const list = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        setDocuments(list);
      },
      (err) => {
        console.warn("Error listening to documents in real-time:", err);
      }
    );
    return () => unsub();
  }, [targetCompanyId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      if (!docName) {
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
        setDocName(nameWithoutExt);
      }
      if (file.size <= 4 * 1024 * 1024) {
        const reader = new FileReader();
        reader.onload = (event) => {
          setFileDataUrl(event.target?.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleUploadSubmit = async () => {
    if (!docName.trim() && !selectedFile) return;
    setIsUploading(true);
    try {
      const docId = `DOC_${Date.now()}`;
      const uName = displayName || user?.displayName || (user?.email ? user.email.split("@")[0] : "Admin");

      let sizeStr = "1.0 MB";
      if (selectedFile) {
        sizeStr = selectedFile.size >= 1024 * 1024
          ? `${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB`
          : `${Math.round(selectedFile.size / 1024)} KB`;
      }

      const newDoc = {
        id: docId,
        name: docName.trim() || selectedFile?.name || "Untitled Document",
        category: category || "Policy",
        accessLevel: accessLevel || "All Employees",
        size: sizeStr,
        updatedBy: uName,
        updated: new Date().toISOString().split("T")[0],
        status: "Published",
        fileUrl: fileDataUrl || "",
        fileName: selectedFile?.name || "",
        createdAt: new Date().toISOString(),
      };

      await setDoc(doc(db, "organizations", targetCompanyId, "documents", docId), newDoc);
      setShowUpload(false);
      setDocName("");
      setCategory("Policy");
      setAccessLevel("All Employees");
      setSelectedFile(null);
      setFileDataUrl("");
    } catch (e) {
      console.error("Error uploading document:", e);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteDoc = async (id: string) => {
    if (confirm("Are you sure you want to delete this document?")) {
      try {
        await deleteDoc(doc(db, "organizations", targetCompanyId, "documents", id));
      } catch (e) {
        console.error("Error deleting document:", e);
      }
    }
  };

  const handleDownloadDoc = (docItem: any) => {
    if (docItem.fileUrl) {
      const a = document.createElement("a");
      a.href = docItem.fileUrl;
      a.download = docItem.fileName || `${docItem.name}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      const textContent = `Document Name: ${docItem.name}\nCategory: ${docItem.category}\nUpdated By: ${docItem.updatedBy}\nDate: ${docItem.updated}`;
      const blob = new Blob([textContent], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${docItem.name}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const filteredDocs = documents.filter((d) => {
    const matchesCat = docCat === "All" || (d.category || "").toLowerCase() === docCat.toLowerCase();
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      (d.name || "").toLowerCase().includes(q) ||
      (d.category || "").toLowerCase().includes(q) ||
      (d.updatedBy || "").toLowerCase().includes(q);
    return matchesCat && matchesSearch;
  });

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
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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
              {filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-xs text-gray-500 font-medium">
                    No documents found. Click "Upload" or "New Document" to add one.
                  </td>
                </tr>
              ) : (
                filteredDocs.map((d) => (
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
                    <td className="px-5 py-3 text-gray-500 text-xs">{d.size || "1.0 MB"}</td>
                    <td className="px-5 py-3 text-gray-600">{d.updatedBy || "Staff"}</td>
                    <td className="px-5 py-3 text-gray-500 text-xs">
                      {fmtDate(d.updated)}
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={d.status || "Published"} />
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex gap-1.5 opacity-0 group-hover:opacity-100">
                        <button
                          onClick={() => setPreviewDoc(d)}
                          className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-[#5C5CFF] cursor-pointer"
                          title="View"
                        >
                          <Eye size={13} />
                        </button>
                        <button
                          onClick={() => handleDownloadDoc(d)}
                          className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600 cursor-pointer"
                          title="Download"
                        >
                          <Download size={13} />
                        </button>
                        <button
                          onClick={() => handleDeleteDoc(d.id)}
                          className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-red-500 cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showUpload && (
        <Modal title="Upload Document" onClose={() => setShowUpload(false)}>
          <div className="space-y-4">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-[#5C5CFF] transition-colors cursor-pointer"
            >
              {selectedFile ? (
                <div className="flex flex-col items-center justify-center">
                  <FileCheck size={28} className="text-[#5C5CFF] mb-2" />
                  <p className="text-sm font-semibold text-gray-800">{selectedFile.name}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
              ) : (
                <>
                  <Upload size={28} className="mx-auto text-gray-400 mb-3" />
                  <p className="text-sm font-medium text-gray-700 mb-1">
                    Drag &amp; drop files here
                  </p>
                  <p className="text-xs text-gray-400">PDF, DOCX, XLSX up to 25 MB</p>
                  <Btn
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                  >
                    Browse Files
                  </Btn>
                </>
              )}
            </div>
            <SelectField
              label="Category"
              value={category}
              onChange={(val: any) => setCategory(typeof val === "string" ? val : val?.target?.value || "Policy")}
              options={["Policy", "Template", "Legal", "Other"]}
            />
            <InputField
              label="Document Name"
              placeholder="e.g. Employee Handbook 2025"
              value={docName}
              onChange={(e: any) => setDocName(e?.target?.value || e || "")}
            />
            <SelectField
              label="Access Level"
              value={accessLevel}
              onChange={(val: any) => setAccessLevel(typeof val === "string" ? val : val?.target?.value || "All Employees")}
              options={["All Employees", "HR Only", "Admins Only"]}
            />
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <Btn variant="outline" onClick={() => setShowUpload(false)}>
                Cancel
              </Btn>
              <Btn onClick={handleUploadSubmit} disabled={isUploading}>
                <Upload size={13} />
                {isUploading ? "Uploading..." : "Upload"}
              </Btn>
            </div>
          </div>
        </Modal>
      )}

      {previewDoc && (
        <Modal title={previewDoc.name} onClose={() => setPreviewDoc(null)}>
          <div className="space-y-4 text-left">
            <div className="bg-gray-50 border border-gray-150 p-4 rounded-xl space-y-2">
              <div className="flex justify-between items-center text-xs text-gray-600">
                <span className="font-semibold text-gray-400 uppercase">Category:</span>
                <span className="font-medium text-gray-800">{previewDoc.category}</span>
              </div>
              <div className="flex justify-between items-center text-xs text-gray-600">
                <span className="font-semibold text-gray-400 uppercase">Access Level:</span>
                <span className="font-medium text-gray-800">{previewDoc.accessLevel || "All Employees"}</span>
              </div>
              <div className="flex justify-between items-center text-xs text-gray-600">
                <span className="font-semibold text-gray-400 uppercase">File Size:</span>
                <span className="font-medium text-gray-800">{previewDoc.size || "1.0 MB"}</span>
              </div>
              <div className="flex justify-between items-center text-xs text-gray-600">
                <span className="font-semibold text-gray-400 uppercase">Updated By:</span>
                <span className="font-medium text-gray-800">{previewDoc.updatedBy}</span>
              </div>
              <div className="flex justify-between items-center text-xs text-gray-600">
                <span className="font-semibold text-gray-400 uppercase">Last Updated:</span>
                <span className="font-medium text-gray-800">{fmtDate(previewDoc.updated)}</span>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Btn variant="outline" onClick={() => setPreviewDoc(null)}>
                Close
              </Btn>
              <Btn onClick={() => handleDownloadDoc(previewDoc)}>
                <Download size={13} />
                Download File
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
    <div className="bg-[#FFFFFF] border-b border-gray-200 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        {breadcrumbs && (
          <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1">
            {breadcrumbs.map((b, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <span className="select-none">/</span>}
                {b.onClick ? (
                  <button
                    onClick={b.onClick}
                    className="hover:text-gray-600 font-medium cursor-pointer"
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
        {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2.5">{children}</div>
    </div>
  );
}
