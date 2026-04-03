import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
    Printer,
    Download,
    Settings2,
    Image as ImageIcon,
    Layout,
    Save,
    ChevronRight,
    Building2,
    Calendar,
    User
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getCompanyByIdApi, updateCompanyApi } from '../../Action/api';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5003';

export const PayslipView = ({ companyInfo, logo, payslipData, printRef }) => (
    <div id="print-area" ref={printRef} className="bg-white text-black p-[10mm] shadow-lg mx-auto w-[210mm] min-h-[297mm] print:shadow-none print:border-none print:p-0 font-['Outfit',_sans-serif]">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
            <div className="max-w-[200px]">
                {logo ? (
                    <div className="flex flex-col gap-3">
                        <img src={logo} alt="Logo" className="max-h-20 object-contain" />
                    </div>
                ) : (
                    <div className="flex flex-col gap-2">
                        <div className="w-40 h-20 bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center text-gray-400">
                            <ImageIcon size={32} />
                            <span className="text-[10px] uppercase font-bold tracking-widest mt-1">Company Logo</span>
                        </div>
                        {companyInfo.name && <p className="font-bold text-[13px] leading-tight text-gray-800 tracking-wide uppercase mt-1">{companyInfo.name}</p>}
                    </div>
                )}
            </div>
            <div className="text-right text-[11px] font-semibold leading-[1.6] text-gray-800">
                <p>{companyInfo.address?.split('\n')[0]}</p>
                <p>{companyInfo.address?.split('\n')[1]}</p>
                <p>{companyInfo.address?.split('\n')[2]}</p>
                <p>phone: {companyInfo.phone}</p>
                <p>E-mail:- {companyInfo.email}</p>
                <p>{companyInfo.website}</p>
            </div>
        </div>

        <div className="text-center mb-4">
            <h2 className="text-[14px] font-bold uppercase tracking-[0.1em] inline-block">PAY SLIP FOR THE MONTH OF {payslipData.monthYear}</h2>
        </div>

        {/* Employee Details Table */}
        <div className="mb-6">
            <table className="w-full border-collapse border-[1.5px] border-black text-[11px] uppercase table-fixed">
                <thead>
                    <tr>
                        <th colSpan="4" className="border-[1.5px] border-black py-2.5 text-center font-bold text-[12px] tracking-[0.1em] bg-white">EMPLOYEE DETAILS</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td className="border-[1.5px] border-black p-2 px-4 font-semibold w-1/4 text-[11px]">CODE</td>
                        <td className="border-[1.5px] border-black p-2 px-4 w-1/4">{payslipData.employee.code}</td>
                        <td className="border-[1.5px] border-black p-2 px-4 font-semibold w-1/4 text-[11px]">NAME</td>
                        <td className="border-[1.5px] border-black p-2 px-4 w-1/4">{payslipData.employee.name}</td>
                    </tr>
                    <tr>
                        <td className="border-[1.5px] border-black p-2 px-4 font-semibold text-[11px]">DESIGNATION</td>
                        <td className="border-[1.5px] border-black p-2 px-4 text-[11px]">{payslipData.employee.designation}</td>
                        <td className="border-[1.5px] border-black p-2 px-4 font-semibold text-[11px]">PAY MODE</td>
                        <td className="border-[1.5px] border-black p-2 px-4 text-[11px]">{payslipData.employee.payMode}</td>
                    </tr>
                    <tr>
                        <td className="border-[1.5px] border-black p-2 px-4 font-semibold text-[11px]">DEPARTMENT</td>
                        <td className="border-[1.5px] border-black p-2 px-4 text-[11px]">{payslipData.employee.department}</td>
                        <td className="border-[1.5px] border-black p-2 px-4 font-semibold text-[11px]">ACCT. NO.</td>
                        <td className="border-[1.5px] border-black p-2 px-4 text-[11px]">{payslipData.employee.accountNo}</td>
                    </tr>
                    <tr>
                        <td className="border-[1.5px] border-black p-2 px-4 font-semibold text-[11px]">LOSS OF PAY</td>
                        <td className="border-[1.5px] border-black p-2 px-4 text-[11px]">{payslipData.employee.lossOfPay}</td>
                        <td className="border-[1.5px] border-black p-2 px-4 font-semibold text-[11px]">PF NO.</td>
                        <td className="border-[1.5px] border-black p-2 px-4 text-[11px]">{payslipData.employee.pfNo}</td>
                    </tr>
                </tbody>
            </table>
        </div>

        {/* Salary Details Table */}
        <div className="mb-6">
            <table className="w-full border-collapse border-[1.5px] border-black text-[11px] uppercase table-fixed">
                <thead>
                    <tr>
                        <th colSpan="4" className="border-[1.5px] border-black py-2.5 text-center text-[12px] font-bold tracking-[0.1em] bg-white">SALARY DETAILS</th>
                    </tr>
                    <tr className="bg-white">
                        <th className="border-[1.5px] border-black p-2 px-4 text-left w-[35%] text-[12px] font-bold tracking-[0.1em]">EARNINGS</th>
                        <th className="border-[1.5px] border-black p-2 px-4 text-right w-[15%] text-[12px] font-bold tracking-[0.1em]">RUPEES</th>
                        <th className="border-[1.5px] border-black p-2 px-4 text-left w-[35%] text-[12px] font-bold tracking-[0.1em]">DEDUCTIONS</th>
                        <th className="border-[1.5px] border-black p-2 px-4 text-right w-[15%] text-[12px] font-bold tracking-[0.1em]">RUPEES</th>
                    </tr>
                </thead>
                <tbody>
                    {Array.from({ length: Math.max(payslipData.earnings.length, payslipData.deductions.length) }).map((_, idx) => (
                        <tr key={idx}>
                            <td className={`border-[1.5px] font-semibold text-[11px] border-black p-2 px-4 whitespace-nowrap ${payslipData.earnings[idx]?.label === 'GROSS' ? 'font-bold' : ''}`}>
                                {payslipData.earnings[idx]?.label}
                            </td>
                            <td className={`border-[1.5px] border-black p-2 px-4 text-right whitespace-nowrap ${payslipData.earnings[idx]?.label === 'GROSS' ? 'font-bold' : ''}`}>
                                {payslipData.earnings[idx] ? (typeof payslipData.earnings[idx].value === 'number' ? payslipData.earnings[idx].value.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : payslipData.earnings[idx].value) : ''}
                            </td>
                            <td className={`border-[1.5px] border-black p-2 px-4 whitespace-nowrap ${payslipData.deductions[idx]?.label === 'NET' ? 'font-bold' : ''}`}>
                                {payslipData.deductions[idx]?.label}
                            </td>
                            <td className={`border-[1.5px] border-black p-2 px-4 text-right whitespace-nowrap ${payslipData.deductions[idx]?.label === 'NET' ? 'font-bold' : ''}`}>
                                {payslipData.deductions[idx] ? (typeof payslipData.deductions[idx].value === 'number' ? payslipData.deductions[idx].value.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : payslipData.deductions[idx].value) : ''}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>

        {/* Leave Details Table */}
        <div className="mb-6">
            <table className="w-full border-collapse border-[1.5px] border-black text-[11px] uppercase table-fixed">
                <thead>
                    <tr className="bg-white">
                        <th className="border-[1.5px] border-black p-2 px-4 text-left w-[50%] text-[11px] font-bold tracking-[0.1em]">LEAVE DETAILS</th>
                        <th className="border-[1.5px] border-black p-2 text-center w-[25%] text-[11px] font-bold tracking-[0.1em]">OPENING BALANCE</th>
                        <th className="border-[1.5px] border-black p-2 text-center w-[25%] text-[11px] font-bold tracking-[0.1em]">CLOSING BALANCE</th>
                    </tr>
                </thead>
                <tbody>
                    {payslipData.leaveDetails.map((leave, idx) => (
                        <tr key={idx}>
                            <td className="border-[1.5px] border-black p-2 px-4 font-semibold text-[11px]">{leave.label}</td>
                            <td className="border-[1.5px] border-black p-2 text-center text-[11px]">{leave.opening}</td>
                            <td className="border-[1.5px] border-black p-2 text-center text-[11px]">{leave.closing}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>

        {/* Footer */}
        <div className="text-center text-[11px] font-semibold space-y-1.5 text-black mt-2">
            <p className="tracking-wide">System generated pay slip signature not required</p>
            <p className="tracking-tight">Regarding any queries on pay structure please write a mail to <span className="text-[#1a5ea8] font-bold border-b border-[#1a5ea8]">{companyInfo.email}</span></p>
        </div>
    </div>
);

export default function PayslipTemplate() {
    const [logo, setLogo] = useState(null);
    const [logoFile, setLogoFile] = useState(null);
    const [companyId, setCompanyId] = useState(null);
    const [companyInfo, setCompanyInfo] = useState({
        name: '',
        address: 'No: 1A, Sai Aditya Building\nTaramani Link Road\nVelachery, 600 042',
        phone: '84381 84253',
        email: 'admin@actetechnologies.com',
        website: 'www.actetechnologies.com'
    });

    const [payslipData, setPayslipData] = useState({
        monthYear: 'AUGUST 2025',
        employee: {
            code: 'XXXXXXXXXXXX',
            name: 'XXXXXXXXXXXX',
            designation: 'XXXXXXXXXXXX',
            payMode: 'XXXXXXXXXXXX',
            department: 'XXXXXXXXXXXX',
            accountNo: 'XXXXXXXXXXXX',
            lossOfPay: 'XXXXXXXXXXXX',
            pfNo: 'XXXXXXXXXXXX'
        },
        earnings: [
            { label: 'BASIC', value: 'XXXXXXXXXXXX' },
            { label: 'HRA', value: 'XXXXXXXXXXXX' },
            { label: 'CONVEYANCE', value: 'XXXXXXXXXXXX' },
            { label: 'MEDICAL REIM', value: 'XXXXXXXXXXXX' },
            { label: 'TRAVEL ALLOW', value: 'XXXXXXXXXXXX' },
            { label: 'PER DIEM ALLOW', value: 'XXXXXXXXXXXX' },
            { label: 'SPL ALLOW', value: 'XXXXXXXXXXXX' },
            { label: 'GROSS', value: 'XXXXXXXXXXXX' },
            { label: 'BALANCE', value: 'XXXXXXXXXXXX' },
            { label: 'INCENTIVES', value: 'XXXXXXXXXXXX' },
        ],
        deductions: [
            { label: 'ESI', value: 'XXXXXXXXXXXX' },
            { label: 'IT', value: 'XXXXXXXXXXXX' },
            { label: 'PT', value: 'XXXXXXXXXXXX' },
            { label: 'PF', value: 'XXXXXXXXXXXX' },
            { label: 'VPF', value: 'XXXXXXXXXXXX' },
            { label: 'LOP', value: 'XXXXXXXXXXXX' },
            { label: 'OTHER', value: 'XXXXXXXXXXXX' },
            { label: 'NET', value: 'XXXXXXXXXXXX' },
        ],
        leaveDetails: [
            { label: 'CASUAL LEAVE', opening: 'XXXXXXXXXXXX', closing: 'XXXXXXXXXXXX' },
            { label: 'WEEKLY OFF', opening: 'XXXXXXXXXXXX', closing: 'XXXXXXXXXXXX' },
        ]
    });

    const [activeTab, setActiveTab] = useState('General');
    const [isPrinting, setIsPrinting] = useState(false);
    const printRef = useRef();

    useEffect(() => {
        const fetchCompanyData = async () => {
            const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
            const storedCompanyId = userInfo.company || localStorage.getItem('companyId');

            if (storedCompanyId) {
                setCompanyId(storedCompanyId);
                try {
                    const response = await getCompanyByIdApi(storedCompanyId);
                    const companyData = response.data;
                    if (companyData) {
                        setCompanyInfo({
                            name: companyData.name || '',
                            address: companyData.address || '',
                            phone: companyData.phone || '',
                            email: companyData.email || '',
                            website: companyData.website || ''
                        });
                        if (companyData.logo) {
                            setLogo(`${API_URL}/${companyData.logo.replace(/\\/g, '/')}`);
                        }
                    }
                } catch (error) {
                    console.error('Error fetching company data:', error);
                }
            }
        };

        fetchCompanyData();
    }, []);

    const handlePrint = () => {
        setIsPrinting(true);
        setTimeout(() => {
            window.print();
            setIsPrinting(false);
        }, 500);
    };

    const handleLogoUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            setLogoFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogo(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSaveConfig = async () => {
        if (!companyId) {
            toast.error('Company ID not found');
            return;
        }

        try {
            const formData = new FormData();
            formData.append('name', companyInfo.name);
            formData.append('address', companyInfo.address);
            formData.append('phone', companyInfo.phone);
            formData.append('email', companyInfo.email);
            formData.append('website', companyInfo.website);

            if (logoFile) {
                formData.append('logo', logoFile);
            }

            await updateCompanyApi(companyId, formData);
            toast.success('Template settings saved successfully!');

            const response = await getCompanyByIdApi(companyId);
            if (response.data.logo) {
                setLogo(`${API_URL}/${response.data.logo.replace(/\\/g, '/')}`);
                setLogoFile(null);
            }
        } catch (error) {
            console.error('Error saving config:', error);
            toast.error('Failed to save configuration');
        }
    };

    return (
        <div className="flex bg-[#fbfcfd] h-full overflow-hidden">
            {/* Left Sidebar - Controls */}
            <div className="w-[380px] border-r border-gray-100 bg-white overflow-y-auto custom-scrollbar flex-shrink-0">
                <div className="p-6 border-b border-gray-50">
                    <div className="flex items-center gap-3 mb-1">
                        <div className="p-2 bg-primary/10 text-primary rounded-xl">
                            <Layout size={20} />
                        </div>
                        <h1 className="text-xl font-semibold text-gray-900 tracking-tight">Payslip Template</h1>
                    </div>
                    <p className="text-[12px] font-semibold text-gray-500 uppercase tracking-widest leading-none pt-2">Customizer & Preview</p>
                </div>

                <div className="p-4 space-y-1">
                    {['General', 'Employee Details', 'Earnings', 'Deductions', 'Appearance'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`w-full flex items-center justify-between p-3.5 rounded-xl transition-all ${activeTab === tab
                                ? 'bg-primary/5 text-primary shadow-sm'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                {tab === 'General' && <Settings2 size={18} />}
                                {tab === 'Employee Details' && <User size={18} />}
                                {tab === 'Earnings' && <Building2 size={18} />}
                                {tab === 'Deductions' && <Calendar size={18} />}
                                {tab === 'Appearance' && <ImageIcon size={18} />}
                                <span className="text-[13px] font-semibold">{tab}</span>
                            </div>
                            <ChevronRight size={16} className={`transition-transform duration-300 ${activeTab === tab ? 'rotate-90' : 'opacity-0 xl:opacity-40'}`} />
                        </button>
                    ))}
                </div>

                <div className="p-6 space-y-6">
                    <AnimatePresence mode="wait">
                        {activeTab === 'General' && (
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                className="space-y-4"
                            >
                                <div>
                                    <label className="text-[12px] font-bold text-[#2a2a2a]/40 uppercase tracking-widest block mb-2">Company Address</label>
                                    <textarea
                                        rows="4"
                                        value={companyInfo.address}
                                        onChange={(e) => setCompanyInfo({ ...companyInfo, address: e.target.value })}
                                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all font-medium resize-none"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[12px] font-bold text-[#2a2a2a]/40 uppercase tracking-widest block mb-2">Phone</label>
                                        <input
                                            type="text"
                                            value={companyInfo.phone}
                                            onChange={(e) => setCompanyInfo({ ...companyInfo, phone: e.target.value })}
                                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-primary/5 transition-all font-medium"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[12px] font-bold text-[#2a2a2a]/40 uppercase tracking-widest block mb-2">Pay Month</label>
                                        <input
                                            type="text"
                                            value={payslipData.monthYear}
                                            onChange={(e) => setPayslipData({ ...payslipData, monthYear: e.target.value.toUpperCase() })}
                                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-primary/5 transition-all font-medium"
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'Appearance' && (
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                className="space-y-6"
                            >
                                <div className="p-4 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 text-center group transition-all hover:bg-white hover:border-primary/30">
                                    <h3 className="text-[12px] font-bold text-gray-700 mb-4 uppercase tracking-widest">Company Logo</h3>
                                    <div className="w-24 h-24 mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center overflow-hidden mb-4 p-2">
                                        {logo ? (
                                            <img src={logo} alt="Preview" className="w-full h-full object-contain" />
                                        ) : (
                                            <ImageIcon size={32} className="text-gray-300" />
                                        )}
                                    </div>
                                    <label className="inline-flex items-center gap-2 px-6 py-2 bg-white text-gray-700 text-[12px] font-bold rounded-full border border-gray-200 hover:shadow-md cursor-pointer transition-all active:scale-95">
                                        <ImageIcon size={14} className="text-primary" />
                                        Change Logo
                                        <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                                    </label>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="pt-6 border-t border-gray-100 mt-10">
                        <button
                            onClick={handleSaveConfig}
                            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-primary text-white rounded-full font-medium shadow-xl shadow-primary/20 hover:brightness-110 active:scale-[0.98] transition-all"
                        >
                            <Save size={18} />
                            Save Config
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Preview Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#f8fafc] p-8 md:p-10">
                <div className="max-w-[800px] mx-auto space-y-6">
                    {/* Toolbar */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 z-10">
                        <div className="flex items-center gap-4">

                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handlePrint}
                                className="flex items-center gap-2 px-5 py-2.5 bg-white text-gray-700 text-[12px] font-semibold rounded-xl border border-gray-200 hover:shadow-lg transition-all active:scale-95"
                            >
                                <Download size={16} />
                                Export PDF
                            </button>
                            <button
                                onClick={handlePrint}
                                className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white text-[12px] font-semibold rounded-xl shadow-lg shadow-primary/20 hover:brightness-110 transition-all active:scale-95"
                            >
                                <Printer size={16} />
                                Print Payslip
                            </button>
                        </div>
                    </div>

                    <div className="relative group">
                        <div className="absolute inset-x-0 -top-6 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="px-4 py-1.5 bg-gray-900 text-white text-[10px] font-semibold rounded-t-xl uppercase tracking-[0.2em] shadow-xl">Template Preview</span>
                        </div>
                        <PayslipView companyInfo={companyInfo} logo={logo} payslipData={payslipData} printRef={printRef} />
                    </div>
                </div>
            </div>

            {/* Print Styles */}
            <style>{`
                @media print {
                    @page {
                        size: A4;
                        margin: 0;
                    }
                    body {
                        margin: 0;
                        padding: 0;
                        -webkit-print-color-adjust: exact;
                    }
                    body * {
                        visibility: hidden;
                    }
                    #print-area, #print-area * {
                        visibility: visible;
                    }
                    #print-area {
                        position: fixed !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 210mm !important;
                        min-height: 297mm !important;
                        margin: 0 !important;
                        padding: 10mm !important;
                        background: white !important;
                        box-sizing: border-box !important;
                        box-shadow: none !important;
                        border: none !important;
                        display: block !important;
                    }
                    /* Background graphics for tables */
                    .bg-white {
                        background-color: white !important;
                    }
                }
            `}</style>
        </div>
    );
}