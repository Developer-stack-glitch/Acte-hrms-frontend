import React, { useState, useEffect } from 'react';
import { Database, CheckCircle2, XCircle, RefreshCw, Loader2 } from 'lucide-react';
import { getCompaniesApi, setupCompanyDatabaseApi } from '../../Action/api';
import toast, { ErrorIcon } from 'react-hot-toast';
import TableSkeleton from '../../Common/CommonSkeletonLoader/TableSkeleton';

export default function CompanyDatabase() {
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);

    useEffect(() => {
        fetchCompanies();
    }, []);

    const fetchCompanies = async () => {
        try {
            setLoading(true);
            const res = await getCompaniesApi();
            setCompanies(res.data);
        } catch (error) {
            toast.error('Failed to fetch companies');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSetupDatabase = async (companyId) => {
        try {
            setActionLoading(companyId);
            const res = await setupCompanyDatabaseApi({ company_id: companyId });
            toast.success(res.data.message || 'Database initialized successfully');
            fetchCompanies(); // Refresh to show updated status
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to initialize database');
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <div className="p-6 mx-auto bg-white rounded-[8px]">
            <div className="mb-8 flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-semibold text-gray-800">Company Databases</h2>
                    <p className="text-gray-500 text-[16px] mt-1">Manage and initialize separate databases for each company.</p>
                </div>
                <button
                    onClick={fetchCompanies}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
                    title="Refresh List"
                >
                    <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            <div className="bg-white rounded-[10px] border border-gray-200 overflow-hidden shadow-sm">
                {loading ? (
                    <table className="w-full">
                        <tbody>
                            <TableSkeleton rows={5} columns={4} />
                        </tbody>
                    </table>
                ) : (
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-200 text-gray-600 uppercase text-[11px] font-bold tracking-wider">
                                <th className="px-6 py-4">Company Details</th>
                                <th className="px-6 py-4">Database Name</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {companies.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-12 text-center text-gray-400">
                                        <div className="flex flex-col items-center gap-2">
                                            <ErrorIcon size={32} className="opacity-20" />
                                            <span>No companies found. Add a company first.</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                companies.map((company) => (
                                    <tr key={company.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-gray-800">{company.name}</span>
                                                <span className="text-xs text-gray-500">{company.email || 'No email provided'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {company.db_name ? (
                                                <code className="bg-gray-100 px-2 py-1 rounded text-xs font-mono text-gray-700">
                                                    {company.db_name}
                                                </code>
                                            ) : (
                                                <span className="text-xs text-gray-400 italic font-mono">- Not Created -</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {company.db_name ? (
                                                <div className="flex items-center gap-2 text-green-600 bg-green-50 px-2.5 py-1 rounded-full w-fit border border-green-100">
                                                    <CheckCircle2 size={14} />
                                                    <span className="text-xs font-medium uppercase tracking-wider">Initialized</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 text-orange-600 bg-orange-50 px-2.5 py-1 rounded-full w-fit border border-orange-100">
                                                    <XCircle size={14} />
                                                    <span className="text-xs font-medium uppercase tracking-wider">Pending setup</span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {!company.db_name ? (
                                                <button
                                                    onClick={() => handleSetupDatabase(company.id)}
                                                    disabled={actionLoading === company.id}
                                                    className="flex items-center gap-2 ml-auto px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-hover transition-all disabled:opacity-50 active:scale-95 shadow-sm"
                                                >
                                                    {actionLoading === company.id ? (
                                                        <Loader2 size={14} className="animate-spin" />
                                                    ) : (
                                                        <Database size={14} />
                                                    )}
                                                    Initialize DB
                                                </button>
                                            ) : (
                                                <span className="text-xs text-gray-400 font-medium">No action needed</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
