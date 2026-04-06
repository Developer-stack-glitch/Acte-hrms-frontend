import React, { useState, useEffect } from 'react';
import {
    X,
    Upload,
    Download,
    FileText,
    AlertCircle,
    CheckCircle2,
    ArrowRight,
    Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    getBatchAllocationsApi,
    downloadUserBulkTemplateApi,
    downloadUserReferenceIdsApi,
    bulkUploadUsersApi
} from '../../Action/api';
import toast from 'react-hot-toast';
import { FormSelect } from '../../Common/Form';

export default function BulkUploadModal({ isOpen, onClose, onSuccess }) {
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [structures, setStructures] = useState([]);
    const [selectedStructure, setSelectedStructure] = useState('');
    const [uploadSummary, setUploadSummary] = useState(null);

    useEffect(() => {
        if (isOpen) {
            fetchStructures();
            resetState();
        }
    }, [isOpen]);

    const fetchStructures = async () => {
        try {
            const res = await getBatchAllocationsApi();
            setStructures(res.data || []);
            if (res.data && res.data.length > 0) {
                setSelectedStructure(res.data[0].id);
            }
        } catch (error) {
            toast.error('Failed to load salary structures');
        }
    };

    const resetState = () => {
        setFile(null);
        setUploadSummary(null);
        setLoading(false);
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            if (selectedFile.name.endsWith('.xlsx')) {
                setFile(selectedFile);
            } else {
                toast.error('Please upload only XLSX files');
            }
        }
    };

    const handleDownloadTemplate = async () => {
        if (!selectedStructure) {
            toast.error('Please select a salary structure first');
            return;
        }
        try {
            const res = await downloadUserBulkTemplateApi(selectedStructure);
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            const structureName = structures.find(s => s.id === parseInt(selectedStructure))?.name || 'Structure';
            link.setAttribute('download', `Template_${structureName}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            toast.error('Failed to download template');
        }
    };

    const handleDownloadReference = async () => {
        try {
            const res = await downloadUserReferenceIdsApi();
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'User_Assignment_Reference_IDs.xlsx');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            toast.error('Failed to download reference IDs');
        }
    };

    const handleUpload = async () => {
        if (!file) {
            toast.error('Please select a file to upload');
            return;
        }

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            if (selectedStructure) {
                formData.append('salary_structure_id', selectedStructure);
            }

            const res = await bulkUploadUsersApi(formData);
            setUploadSummary(res.data.summary);
            toast.success(res.data.message);
            if (res.data.summary.success > 0 && onSuccess) {
                onSuccess();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Upload failed');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="bg-white rounded-[15px] shadow-2xl w-full max-w-xl overflow-hidden"
            >
                {/* Header */}
                <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
                    <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                        <Upload className="text-primary" size={24} />
                        Bulk Upload Employees
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-8 max-h-[80vh] overflow-y-auto">
                    {/* Note Box */}
                    <div className="bg-sky-50 border border-sky-100 rounded-[15px] p-5 flex gap-3 items-start">
                        <div className="bg-sky-500 text-white p-1 rounded-md shrink-0">
                            <AlertCircle size={16} />
                        </div>
                        <p className="text-[14px] text-sky-800 font-medium leading-relaxed">
                            <span className="font-bold">Note:</span> The salary structure and user details will be processed from the uploaded file. Ensure you use the correct template for your selected structure.
                        </p>
                    </div>

                    {!uploadSummary ? (
                        <>
                            {/* Step 1: Download Templates */}
                            <div className="space-y-4">
                                <h4 className="text-[15px] font-semibold text-gray-800 flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[12px]">1</div>
                                    Get Templates
                                </h4>

                                <div className="grid grid-cols-1 sm:grid-cols-1 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[14px] font-semibold text-gray-700 ml-1">Select Structure</label>
                                        <FormSelect
                                            value={selectedStructure}
                                            onChange={(e) => setSelectedStructure(e.target.value)}
                                            className=""
                                            options={structures.map(s => ({ value: s.id, label: s.name }))}
                                        />
                                    </div>
                                    <div className="flex flex-row justify-start gap-2">
                                        <button
                                            onClick={handleDownloadTemplate}
                                            className="flex items-center justify-center gap-2 bg-primary text-white px-4 py-2.5 rounded-full font-medium text-[14px] hover:bg-primary-hover transition-all shadow-md shadow-primary/10 active:scale-95"
                                        >
                                            <FileText size={18} />
                                            Download Template
                                        </button>
                                        <button
                                            onClick={handleDownloadReference}
                                            className="flex items-center justify-center gap-2 bg-gray-50 text-gray-600 border border-gray-200 px-4 py-2.5 rounded-full font-medium text-[14px] hover:bg-gray-100 transition-all active:scale-95"
                                        >
                                            <Download size={18} />
                                            Reference IDs
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Step 2: Upload */}
                            <div className="space-y-4">
                                <h4 className="text-[15px] font-semibold text-gray-800 flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[12px]">2</div>
                                    Upload Filled Template
                                </h4>

                                <div
                                    className={`relative group border-2 border-dashed rounded-[15px] p-10 flex flex-col items-center justify-center transition-all ${file ? 'border-green-400 bg-green-50' : 'border-gray-200 hover:border-primary/50 hover:bg-gray-50'
                                        }`}
                                >
                                    <input
                                        type="file"
                                        onChange={handleFileChange}
                                        accept=".xlsx"
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                    />

                                    <div className={`p-4 rounded-2xl mb-4 transition-colors ${file ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400 group-hover:bg-primary/10 group-hover:text-primary'
                                        }`}>
                                        <Upload size={32} />
                                    </div>

                                    {file ? (
                                        <div className="text-center">
                                            <p className="text-[16px] font-bold text-green-700">{file.name}</p>
                                            <p className="text-[12px] text-green-600 font-medium mt-1">Ready to import</p>
                                        </div>
                                    ) : (
                                        <div className="text-center">
                                            <p className="text-[16px] font-bold text-gray-700">Drag & drop XLSX file here</p>
                                            <p className="text-[13px] text-gray-400 font-medium mt-1">or <span className="text-primary font-bold">browse file</span> from device</p>
                                            <p className="text-[11px] text-gray-400 mt-4 font-bold uppercase tracking-widest">Only XLSX supported</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Action Footer */}
                            <div className="pt-4 flex gap-3">
                                <button
                                    onClick={onClose}
                                    className="flex-1 px-6 py-2.5 rounded-full font-medium text-gray-500 bg-gray-50 hover:bg-gray-100 transition-all border border-gray-100"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleUpload}
                                    disabled={!file || loading}
                                    className="flex-[2] flex items-center justify-center gap-2 bg-primary text-white px-6 py-2.5 rounded-full font-medium shadow-md shadow-primary/20 hover:bg-primary-hover active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100 disabled:shadow-none"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 size={20} className="animate-spin" />
                                            Importing Users...
                                        </>
                                    ) : (
                                        <>
                                            <ArrowRight size={20} />
                                            Start Import
                                        </>
                                    )}
                                </button>
                            </div>
                        </>
                    ) : (
                        /* Summary View */
                        <div className="space-y-6 py-4">
                            <div className="text-center">
                                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle2 size={32} />
                                </div>
                                <h4 className="text-2xl font-semibold text-gray-800">Processing Complete!</h4>
                                <p className="text-gray-500 font-medium mt-1">Here is a summary of the import</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-green-50 border border-green-100 rounded-2xl p-5 text-center">
                                    <p className="text-[12px] font-bold text-green-600 uppercase tracking-wider mb-1">Successful</p>
                                    <p className="text-2xl font-semibold text-green-700">{uploadSummary.success}</p>
                                </div>
                                <div className="bg-red-50 border border-red-100 rounded-2xl p-5 text-center">
                                    <p className="text-[12px] font-bold text-red-600 uppercase tracking-wider mb-1">Failed</p>
                                    <p className="text-2xl font-semibold text-red-700">{uploadSummary.failed}</p>
                                </div>
                            </div>

                            {uploadSummary.errors.length > 0 && (
                                <div className="space-y-3">
                                    <p className="text-[14px] font-bold text-gray-700 ml-1">Error Logs ({uploadSummary.errors.length})</p>
                                    <div className="bg-gray-50 rounded-2xl border border-gray-100 p-4 max-h-48 overflow-y-auto space-y-3">
                                        {uploadSummary.errors.map((err, i) => (
                                            <div key={i} className="flex gap-3 text-[13px] items-start p-3 bg-white rounded-xl border border-red-100">
                                                <AlertCircle size={14} className="text-red-500 shrink-0 mt-0.5" />
                                                <div>
                                                    <p className="font-bold text-gray-700">Row: {err.row?.['Employee Name'] || 'Unknown'}</p>
                                                    <p className="text-red-600 mt-1 font-medium">{err.message}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <button
                                onClick={onClose}
                                className="w-full bg-gray-900 text-white py-4 rounded-full font-medium shadow-md hover:bg-black transition-all"
                            >
                                Finish & Close
                            </button>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
