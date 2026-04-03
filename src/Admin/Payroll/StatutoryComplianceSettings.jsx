import React, { useState, useEffect } from 'react';
import {
    ShieldCheck,
    HeartPulse,
    Wallet,
    Building2,
    Receipt,
    FileText,
    Save,
    Edit2,
    Calendar,
    ArrowUpRight,
    Calculator,
    Info,
    CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
    getPFSettingsApi, updatePFSettingsApi,
    getESISettingsApi, updateESISettingsApi,
    getPTSettingsApi, updatePTSettingsApi, getPTStatesApi, updatePTStateApi,
    getLWFSettingsApi, updateLWFSettingsApi, getLWFStatesApi, updateLWFStateApi,
    getTDSSettingsApi, updateTDSSettingsApi
} from '../../Action/api';
import { FormInput, FormToggle } from '../../Common/Form';
import DataTable from '../../Common/DataTable';

const TabButton = ({ active, label, onClick, icon: Icon }) => (
    <button
        onClick={onClick}
        className={`px-6 py-3 border-b-2 transition-all duration-300 flex items-center gap-2 whitespace-nowrap ${active
            ? 'border-primary text-primary bg-primary/5'
            : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50'
            }`}
    >
        {Icon && <Icon size={16} className={active ? 'text-primary' : 'text-gray-400'} />}
        <span className="text-[13px] font-semibold uppercase tracking-wider">{label}</span>
    </button>
);

const SectionTitle = ({ title, subtitle }) => (
    <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
        {subtitle && <p className="text-[13px] text-gray-500 font-medium">{subtitle}</p>}
    </div>
);

const Card = ({ title, children, footerAction }) => (
    <div className="bg-white rounded-[15px] border border-gray-200 overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/30">
            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-widest">{title}</h3>
        </div>
        <div className="p-6">
            {children}
        </div>
        {footerAction && (
            <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-50 flex justify-end">
                {footerAction}
            </div>
        )}
    </div>
);

export default function StatutoryComplianceSettings() {
    const [activeTab, setActiveTab] = useState('PF');
    const [loading, setLoading] = useState(false);
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    const company_id = userInfo.company;

    // State for all settings
    const [pfSettings, setPfSettings] = useState({});
    const [esiSettings, setEsiSettings] = useState({});
    const [ptSettings, setPtSettings] = useState({});
    const [ptStates, setPtStates] = useState([]);
    const [lwfSettings, setLwfSettings] = useState({});
    const [lwfStates, setLwfStates] = useState([]);
    const [tdsSettings, setTdsSettings] = useState({});

    // PT/LWF State Editing
    const [isStateModalOpen, setIsStateModalOpen] = useState(false);
    const [editingState, setEditingState] = useState(null);

    useEffect(() => {
        fetchSettings();
    }, [activeTab]);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            switch (activeTab) {
                case 'PF':
                    const pfRes = await getPFSettingsApi({ company_id });
                    setPfSettings(pfRes.data || {});
                    break;
                case 'ESI':
                    const esiRes = await getESISettingsApi({ company_id });
                    setEsiSettings(esiRes.data || {});
                    break;
                case 'PT':
                    const ptSetRes = await getPTSettingsApi({ company_id });
                    setPtSettings(ptSetRes.data || {});
                    const ptStatesRes = await getPTStatesApi({ company_id });
                    setPtStates(ptStatesRes.data || []);
                    break;
                case 'LWF':
                    const lwfSetRes = await getLWFSettingsApi({ company_id });
                    setLwfSettings(lwfSetRes.data || {});
                    const lwfStatesRes = await getLWFStatesApi({ company_id });
                    setLwfStates(lwfStatesRes.data || []);
                    break;
                case 'TDS':
                    const tdsRes = await getTDSSettingsApi({ company_id });
                    setTdsSettings(tdsRes.data || {});
                    break;
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
            toast.error('Failed to load settings');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdatePF = async () => {
        try {
            await updatePFSettingsApi({ company_id, ...pfSettings });
            toast.success('PF Settings saved');
        } catch (error) { toast.error('Error saving PF settings'); }
    };

    const handleUpdateESI = async () => {
        try {
            await updateESISettingsApi({ company_id, ...esiSettings });
            toast.success('ESI Settings saved');
        } catch (error) { toast.error('Error saving ESI settings'); }
    };

    const handleUpdatePT = async () => {
        try {
            await updatePTSettingsApi({ company_id, ...ptSettings });
            toast.success('PT Settings saved');
        } catch (error) { toast.error('Error saving PT settings'); }
    };

    const handleUpdateLWF = async () => {
        try {
            await updateLWFSettingsApi({ company_id, ...lwfSettings });
            toast.success('LWF Settings saved');
        } catch (error) { toast.error('Error saving LWF settings'); }
    };

    const handleUpdateTDS = async () => {
        try {
            await updateTDSSettingsApi({ company_id, ...tdsSettings });
            toast.success('TDS Settings saved');
        } catch (error) { toast.error('Error saving TDS settings'); }
    };

    const handleUpdateState = async (e) => {
        e.preventDefault();
        try {
            if (activeTab === 'PT') {
                await updatePTStateApi(editingState.id, editingState);
            } else {
                await updateLWFStateApi(editingState.id, editingState);
            }
            toast.success('State settings updated');
            setIsStateModalOpen(false);
            fetchSettings();
        } catch (error) { toast.error('Error updating state'); }
    };

    const ptColumns = [
        { header: 'State Name', key: 'state_name' },
        {
            header: 'Applicable', key: 'is_applicable', align: 'center',
            render: (val) => val ? <span className="text-emerald-500 font-bold">Yes</span> : <span className="text-red-400 font-bold">No</span>
        },
        { header: 'No. of Slabs', key: 'no_of_slabs', align: 'center' },
    ];

    const lwfColumns = [
        { header: 'State Name', key: 'state_name' },
        { header: 'Applicable', key: 'is_applicable', align: 'center', render: (val) => val ? <span className="text-emerald-500 font-bold">Yes</span> : <span className="text-red-400 font-bold">No</span> },
        { header: 'Frequency', key: 'frequency', align: 'center' },
        { header: 'EE Share (₹)', key: 'ee_share', align: 'right' },
        { header: 'ER Share (₹)', key: 'er_share', align: 'right' },
    ];

    return (
        <div className="md:p-4 p-2 space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 rounded-[15px] border border-gray-100 shadow-sm">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-3">
                        <ShieldCheck className="text-primary" size={28} />
                        Compliance Settings
                    </h1>
                    <p className="text-sm text-gray-500 font-medium">Configure rules for PF, ESI, Professional Tax, and TDS</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-full font-medium hover:bg-primary-hover transition-all shadow-lg text-[14px]"><Calculator size={18} /> PF Calculator</button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-full font-medium hover:bg-gray-50 transition-all text-[14px]"><FileText size={18} /> PF Rules</button>
                </div>
            </div>

            <div className="bg-white rounded-[15px] border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex overflow-x-auto no-scrollbar border-b border-gray-100">
                    <TabButton active={activeTab === 'PF'} label="PF Details" onClick={() => setActiveTab('PF')} icon={ShieldCheck} />
                    <TabButton active={activeTab === 'ESI'} label="ESI Details" onClick={() => setActiveTab('ESI')} icon={HeartPulse} />
                    <TabButton active={activeTab === 'PT'} label="Professional Tax" onClick={() => setActiveTab('PT')} icon={Wallet} />
                    <TabButton active={activeTab === 'LWF'} label="LWF" onClick={() => setActiveTab('LWF')} icon={Building2} />
                    <TabButton active={activeTab === 'TDS'} label="TDS Configuration" onClick={() => setActiveTab('TDS')} icon={Receipt} />
                    <TabButton active={activeTab === 'F16'} label="Form 16 Part B" onClick={() => setActiveTab('F16')} icon={FileText} />
                </div>

                <div className="p-6">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            {activeTab === 'PF' && (
                                <div className="max-w-5xl space-y-8">
                                    <SectionTitle title="Provident Fund Details" subtitle="Configure employee and employer PF contributions" />

                                    <Card title="PF Configuration" footerAction={<button onClick={handleUpdatePF} className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 transition-all"><Save size={18} /> Save Settings</button>}>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
                                            <div className="space-y-1.5">
                                                <label className="text-[14px] font-semibold text-gray-700 uppercase tracking-widest pl-1">Company PF Number</label>
                                                <FormInput
                                                    type="text"
                                                    value={pfSettings.company_pf_number || ''}
                                                    onChange={(e) => setPfSettings({ ...pfSettings, company_pf_number: e.target.value })}
                                                    placeholder="Enter PF number"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[14px] font-semibold text-gray-700 uppercase tracking-widest pl-1">Employee Rate (%)</label>
                                                <FormInput
                                                    type="number"
                                                    value={pfSettings.employee_rate || 12}
                                                    onChange={(e) => setPfSettings({ ...pfSettings, employee_rate: e.target.value })}
                                                />
                                            </div>
                                        </div>

                                        <div className="mt-8 p-4 bg-blue-50/30 rounded-2xl border border-blue-100/50">
                                            <div className="flex items-center justify-between">
                                                <div className="space-y-1">
                                                    <p className="text-md font-semibold text-gray-900">Deduct Employer EPF from salary</p>
                                                    <p className="text-[12px] text-gray-500 leading-relaxed font-medium">When enabled, Employer EPF + EPS are shown as deductions and reduce net pay. When disabled, employer contribution is part of CTC only and not deducted from salary.</p>
                                                </div>
                                                <FormToggle
                                                    checked={!!pfSettings.deduct_employer_pf}
                                                    onChange={(val) => setPfSettings({ ...pfSettings, deduct_employer_pf: val ? 1 : 0 })}
                                                />
                                            </div>
                                        </div>
                                    </Card>

                                    <Card title="PF Settings" footerAction={<button onClick={handleUpdatePF} className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-full font-medium text-sm shadow-xs shadow-primary/20 hover:bg-primary/90 transition-all"><Save size={18} /> Save Changes</button>}>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                                            {[
                                                { label: 'EPS Enabled', key: 'eps_enabled' },
                                                { label: 'Include EDLI in CTC', key: 'include_edli_in_ctc' },
                                                { label: 'Include admin charges in CTC', key: 'include_admin_charges_in_ctc' },
                                                { label: 'Pro-rate restricted PF wage', key: 'prorate_restricted_pf_wage' },
                                                { label: 'Consider components based on LOP', key: 'consider_components_based_on_lop' },
                                                { label: 'Allow employee level override', key: 'allow_employee_level_override' }
                                            ].map((item) => (
                                                <div key={item.key} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors rounded-lg px-2">
                                                    <span className="text-[13px] font-semibold text-gray-700">{item.label}</span>
                                                    <FormToggle
                                                        checked={!!pfSettings[item.key]}
                                                        onChange={(val) => setPfSettings({ ...pfSettings, [item.key]: val ? 1 : 0 })}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </Card>
                                </div>
                            )}

                            {activeTab === 'ESI' && (
                                <div className="max-w-5xl space-y-8">
                                    <SectionTitle title="ESI Details" subtitle="Configure Employee State Insurance contributions" />

                                    <Card title="ESI Configuration" footerAction={<button onClick={handleUpdateESI} className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-full font-medium text-sm shadow-xs shadow-emerald-200 hover:bg-emerald-700 transition-all"><Save size={18} /> Save Settings</button>}>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                            <div className="col-span-1 space-y-1.5">
                                                <label className="text-[13px] font-semibold text-gray-700 uppercase tracking-widest">Company ESI Number</label>
                                                <FormInput value={esiSettings.company_esi_number || ''} onChange={(e) => setEsiSettings({ ...esiSettings, company_esi_number: e.target.value })} placeholder="17-digit" />
                                            </div>
                                            <div className="col-span-1 space-y-1.5">
                                                <label className="text-[13px] font-semibold text-gray-700 uppercase tracking-widest">Company IP Number</label>
                                                <FormInput value={esiSettings.company_ip_number || ''} onChange={(e) => setEsiSettings({ ...esiSettings, company_ip_number: e.target.value })} />
                                            </div>
                                            <div className="col-span-1 space-y-1.5">
                                                <label className="text-[13px] font-semibold text-gray-700 uppercase tracking-widest">Employee Rate (%)</label>
                                                <FormInput type="number" step="0.01" value={esiSettings.employee_rate || 0.75} onChange={(e) => setEsiSettings({ ...esiSettings, employee_rate: e.target.value })} />
                                            </div>
                                            <div className="col-span-1 space-y-1.5">
                                                <label className="text-[13px] font-semibold text-gray-700 uppercase tracking-widest">Employer Rate (%)</label>
                                                <FormInput type="number" step="0.01" value={esiSettings.employer_rate || 3.25} onChange={(e) => setEsiSettings({ ...esiSettings, employer_rate: e.target.value })} />
                                            </div>
                                            <div className="col-span-1 space-y-1.5">
                                                <label className="text-[13px] font-semibold text-gray-700 uppercase tracking-widest">Normal Employees Ceiling</label>
                                                <FormInput type="number" value={esiSettings.normal_employees_ceiling || 21000} onChange={(e) => setEsiSettings({ ...esiSettings, normal_employees_ceiling: e.target.value })} />
                                            </div>
                                            <div className="col-span-1 space-y-1.5">
                                                <label className="text-[13px] font-semibold text-gray-700 uppercase tracking-widest">Disabled Employees Ceiling</label>
                                                <FormInput type="number" value={esiSettings.disabled_employees_ceiling || 25000} onChange={(e) => setEsiSettings({ ...esiSettings, disabled_employees_ceiling: e.target.value })} />
                                            </div>
                                            <div className="col-span-2 space-y-1.5">
                                                <label className="text-[13px] font-semibold text-gray-700 uppercase tracking-widest">ESI Wage Definition</label>
                                                <FormInput value={esiSettings.esi_wage_definition || 'Basic + DA + HRA'} onChange={(e) => setEsiSettings({ ...esiSettings, esi_wage_definition: e.target.value })} />
                                            </div>
                                        </div>
                                    </Card>

                                    <Card title="ESI Options" footerAction={<button onClick={handleUpdateESI} className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-full font-medium text-sm shadow-xs shadow-emerald-200 hover:bg-emerald-700 transition-all"><Save size={18} /> Save Changes</button>}>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                                            {[
                                                { label: 'ESI enabled', key: 'esi_enabled' },
                                                { label: 'Auto calculate ESI', key: 'auto_calculate_esi' },
                                                { label: 'Consider components based on LOP', key: 'consider_components_based_on_lop' },
                                                { label: 'Include allowances in calculation', key: 'include_allowances_in_calculation' },
                                                { label: 'Allow employee level override', key: 'allow_employee_level_override' },
                                                { label: 'Pro-rate ESI wage', key: 'prorate_esi_wage' }
                                            ].map((item) => (
                                                <div key={item.key} className="flex items-center justify-between py-2 px-2 hover:bg-emerald-50/30 rounded-lg transition-colors">
                                                    <span className="text-[13px] font-semibold text-gray-700">{item.label}</span>
                                                    <FormToggle checked={!!esiSettings[item.key]} onChange={(val) => setEsiSettings({ ...esiSettings, [item.key]: val ? 1 : 0 })} />
                                                </div>
                                            ))}
                                        </div>
                                    </Card>
                                </div>
                            )}

                            {activeTab === 'PT' && (
                                <div className="max-w-5xl space-y-8">
                                    <SectionTitle title="Professional Tax" subtitle="Manage state-wise Professional Tax configuration" />

                                    <Card title="PT Registration Details">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-4">
                                            <div className="space-y-1.5">
                                                <label className="text-[12px] font-bold text-gray-500 uppercase tracking-widest pl-1">PT Registration Number</label>
                                                <FormInput
                                                    value={ptSettings.pt_registration_number || ''}
                                                    onChange={(e) => setPtSettings({ ...ptSettings, pt_registration_number: e.target.value })}
                                                    placeholder="Enter PT Reg Number"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[12px] font-bold text-gray-500 uppercase tracking-widest pl-1">Notes (Optional)</label>
                                                <FormInput
                                                    value={ptSettings.notes || ''}
                                                    onChange={(e) => setPtSettings({ ...ptSettings, notes: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <div className="mt-8 flex items-center justify-between p-4 bg-indigo-50/30 rounded-2xl border border-indigo-100">
                                            <div className="space-y-1">
                                                <p className="text-md font-semibold text-gray-900">Enable Professional Tax</p>
                                                <p className="text-[11px] text-gray-500 font-medium whitespace-nowrap overflow-hidden text-ellipsis">Enable this to activate Professional Tax deduction for eligible employees</p>
                                            </div>
                                            <FormToggle checked={!!ptSettings.pt_enabled} onChange={(val) => setPtSettings({ ...ptSettings, pt_enabled: val ? 1 : 0 })} />
                                        </div>
                                        <div className="mt-6 flex justify-end">
                                            <button onClick={handleUpdatePT} className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:brightness-110 shadow-lg shadow-indigo-100"><Save size={18} /> Save Settings</button>
                                        </div>
                                    </Card>

                                    <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm overflow-hidden mt-8">
                                        <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-gray-50/20">
                                            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-[2px]">State-wise Professional Tax Configuration</h3>
                                        </div>
                                        <DataTable
                                            columns={ptColumns}
                                            data={ptStates}
                                            isLoading={loading}
                                            onEdit={(item) => { setEditingState(item); setIsStateModalOpen(true); }}
                                            emptyMessage="No states found"
                                        />
                                    </div>
                                </div>
                            )}

                            {activeTab === 'LWF' && (
                                <div className="max-w-5xl space-y-8">
                                    <SectionTitle title="Labour Welfare Fund" subtitle="Configure state-wise LWF deductions and contributions" />

                                    <Card title="LWF Registration Details">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-4">
                                            <div className="space-y-1.5">
                                                <label className="text-[12px] font-bold text-gray-500 uppercase tracking-widest pl-1">LWF Registration Number</label>
                                                <FormInput value={lwfSettings.lwf_registration_number || ''} onChange={(e) => setLwfSettings({ ...lwfSettings, lwf_registration_number: e.target.value })} />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[12px] font-bold text-gray-500 uppercase tracking-widest pl-1">Notes (Optional)</label>
                                                <FormInput value={lwfSettings.notes || ''} onChange={(e) => setLwfSettings({ ...lwfSettings, notes: e.target.value })} />
                                            </div>
                                        </div>
                                        <div className="mt-8 flex items-center justify-between p-4 bg-orange-50/30 rounded-2xl border border-orange-100">
                                            <div className="space-y-1">
                                                <p className="text-md font-semibold text-gray-900">Enable Labour Welfare Fund</p>
                                                <p className="text-[11px] text-gray-500 font-medium">Enable this to activate Labour Welfare Fund deduction for eligible employees</p>
                                            </div>
                                            <FormToggle checked={!!lwfSettings.lwf_enabled} onChange={(val) => setLwfSettings({ ...lwfSettings, lwf_enabled: val ? 1 : 0 })} />
                                        </div>
                                        <div className="mt-6 flex justify-end">
                                            <button onClick={handleUpdateLWF} className="flex items-center gap-2 px-6 py-2 bg-orange-600 text-white rounded-xl text-sm font-bold hover:brightness-110 shadow-lg shadow-orange-100"><Save size={18} /> Save Settings</button>
                                        </div>
                                    </Card>

                                    <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm overflow-hidden mt-8">
                                        <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-gray-50/20">
                                            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-[2px]">State-wise Labour Welfare Configuration</h3>
                                        </div>
                                        <DataTable
                                            columns={lwfColumns}
                                            data={lwfStates}
                                            isLoading={loading}
                                            onEdit={(item) => { setEditingState(item); setIsStateModalOpen(true); }}
                                            emptyMessage="No LWF state configurations found"
                                        />
                                    </div>
                                </div>
                            )}

                            {activeTab === 'TDS' && (
                                <div className="max-w-5xl space-y-8">
                                    <SectionTitle title="TDS Configuration" subtitle="Tax deduction at source settings" />

                                    <div className="mb-6 flex items-center gap-3 p-4 bg-blue-50/50 rounded-[15px] border border-blue-100">
                                        <Info className="text-blue-500" size={20} />
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between">
                                                <p className="text-md font-semibold text-gray-900">Enable TDS Calculation</p>
                                                <FormToggle checked={!!tdsSettings.tds_enabled} onChange={(val) => setTdsSettings({ ...tdsSettings, tds_enabled: val ? 1 : 0 })} />
                                            </div>
                                            <p className="text-[11px] text-gray-500 font-medium mt-1 uppercase tracking-tight">If enabled, TDS will be calculated automatically during payroll generation.</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                        <div className="lg:col-span-2">
                                            <Card title="Deductor Details">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div className="space-y-2">
                                                        <label className="text-md font-semibold text-gray-800 pl-1 flex items-center gap-1">Tan Number <span className="text-red-500">*</span></label>
                                                        <FormInput value={tdsSettings.tan_number || ''} onChange={(e) => setTdsSettings({ ...tdsSettings, tan_number: e.target.value })} placeholder="e.g., ABCD12345E" required />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-md font-semibold text-gray-800 pl-1 flex items-center gap-1">Pan Number <span className="text-red-500">*</span></label>
                                                        <FormInput value={tdsSettings.pan_number || ''} onChange={(e) => setTdsSettings({ ...tdsSettings, pan_number: e.target.value })} placeholder="e.g., ABCDE1234F" required />
                                                    </div>
                                                    <div className="col-span-full space-y-2">
                                                        <label className="text-md font-semibold text-gray-800 pl-1 flex items-center gap-1">Deductor Name <span className="text-red-500">*</span></label>
                                                        <FormInput value={tdsSettings.deductor_name || ''} onChange={(e) => setTdsSettings({ ...tdsSettings, deductor_name: e.target.value })} placeholder="Company/Employer Name" required />
                                                    </div>
                                                    <div className="col-span-full space-y-2">
                                                        <label className="text-md font-semibold text-gray-800 pl-1 flex items-center gap-1">Address <span className="text-red-500">*</span></label>
                                                        <textarea
                                                            value={tdsSettings.address || ''}
                                                            onChange={(e) => setTdsSettings({ ...tdsSettings, address: e.target.value })}
                                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all text-sm min-h-[100px] resize-none"
                                                            placeholder="Street address"
                                                            required
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-md font-semibold text-gray-800 pl-1 flex items-center gap-1">City <span className="text-red-500">*</span></label>
                                                        <FormInput value={tdsSettings.city || ''} onChange={(e) => setTdsSettings({ ...tdsSettings, city: e.target.value })} placeholder="City" required />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-md font-semibold text-gray-800 pl-1 flex items-center gap-1">State <span className="text-red-500">*</span></label>
                                                        <FormInput value={tdsSettings.state || ''} onChange={(e) => setTdsSettings({ ...tdsSettings, state: e.target.value })} placeholder="State" required />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-md font-semibold text-gray-800 pl-1 flex items-center gap-1">Pincode <span className="text-red-500">*</span></label>
                                                        <FormInput value={tdsSettings.pincode || ''} onChange={(e) => setTdsSettings({ ...tdsSettings, pincode: e.target.value })} placeholder="Pincode" required />
                                                    </div>
                                                </div>

                                                <div className="mt-8 pt-8 border-t border-gray-100 flex flex-col gap-6">
                                                    <h4 className="text-[14px] font-semibold text-gray-700 uppercase tracking-widest">Contact Information (Optional)</h4>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        <div className="space-y-2">
                                                            <label className="text-md font-semibold text-gray-800 pl-1">Email</label>
                                                            <FormInput type="email" value={tdsSettings.email || ''} onChange={(e) => setTdsSettings({ ...tdsSettings, email: e.target.value })} placeholder="contact@company.com" />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="text-md font-semibold text-gray-800 pl-1">Phone</label>
                                                            <FormInput type="tel" value={tdsSettings.phone || ''} onChange={(e) => setTdsSettings({ ...tdsSettings, phone: e.target.value })} placeholder="Phone number" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </Card>
                                        </div>
                                        <div className="lg:col-span-1">
                                            <div className="sticky top-24 space-y-4">
                                                <button onClick={handleUpdateTDS} className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-white rounded-full font-medium text-sm uppercase tracking-widest shadow-md hover:bg-primary-hover transition-all">
                                                    <Save size={18} />
                                                    Save Configuration
                                                </button>
                                                <div className="p-6 bg-white rounded-[20px] border border-gray-100 shadow-sm space-y-4">
                                                    <h5 className="font-semibold text-gray-900 border-b border-gray-50 pb-3 flex items-center gap-2">
                                                        <CheckCircle2 size={16} className="text-emerald-500" />
                                                        Validation Status
                                                    </h5>
                                                    <ul className="space-y-3">
                                                        <li className="flex items-start gap-3 text-xs font-medium text-gray-500">
                                                            <div className={`mt-0.5 w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center ${tdsSettings.tan_number ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-300'}`}>
                                                                <CheckCircle2 size={10} />
                                                            </div>
                                                            TAN Details Provided
                                                        </li>
                                                        <li className="flex items-start gap-3 text-xs font-medium text-gray-500">
                                                            <div className={`mt-0.5 w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center ${tdsSettings.pan_number ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-300'}`}>
                                                                <CheckCircle2 size={10} />
                                                            </div>
                                                            PAN Details Provided
                                                        </li>
                                                        <li className="flex items-start gap-3 text-xs font-medium text-gray-500">
                                                            <div className={`mt-0.5 w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center ${tdsSettings.address ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-300'}`}>
                                                                <CheckCircle2 size={10} />
                                                            </div>
                                                            Location Details Provided
                                                        </li>
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'F16' && (
                                <div className="flex flex-col items-center justify-center py-24 text-gray-400 opacity-20">
                                    <FileText size={80} strokeWidth={1} />
                                    <h3 className="mt-4 text-xl font-bold uppercase tracking-[4px]">Form 16 Generation Coming Soon</h3>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            {/* State Edit Modal */}
            <AnimatePresence>
                {isStateModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsStateModalOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-md bg-white rounded-[24px] shadow-2xl overflow-hidden">
                            <form onSubmit={handleUpdateState}>
                                <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/20">
                                    <div>
                                        <h2 className="text-xl font-semibold text-gray-900">{editingState.state_name}</h2>
                                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mt-1">{activeTab} Configuration</p>
                                    </div>
                                    <ShieldCheck className="text-primary" size={24} />
                                </div>
                                <div className="p-8 space-y-6">
                                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                                        <span className="text-sm font-bold text-gray-700">Applicable</span>
                                        <FormToggle checked={!!editingState.is_applicable} onChange={(val) => setEditingState({ ...editingState, is_applicable: val ? 1 : 0 })} />
                                    </div>

                                    {activeTab === 'PT' && (
                                        <div className="space-y-1.5">
                                            <label className="text-[12px] font-bold text-gray-500 uppercase tracking-widest pl-1">No. of Slabs</label>
                                            <FormInput type="number" value={editingState.no_of_slabs || 0} onChange={(e) => setEditingState({ ...editingState, no_of_slabs: e.target.value })} />
                                        </div>
                                    )}

                                    {activeTab === 'LWF' && (
                                        <>
                                            <div className="space-y-1.5">
                                                <label className="text-[12px] font-bold text-gray-500 uppercase tracking-widest pl-1">Frequency</label>
                                                <FormInput value={editingState.frequency || 'Yearly'} onChange={(e) => setEditingState({ ...editingState, frequency: e.target.value })} />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <label className="text-[12px] font-bold text-gray-500 uppercase tracking-widest pl-1">EE Share (₹)</label>
                                                    <FormInput type="number" value={editingState.ee_share || 0} onChange={(e) => setEditingState({ ...editingState, ee_share: e.target.value })} />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-[12px] font-bold text-gray-500 uppercase tracking-widest pl-1">ER Share (₹)</label>
                                                    <FormInput type="number" value={editingState.er_share || 0} onChange={(e) => setEditingState({ ...editingState, er_share: e.target.value })} />
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                                <div className="p-8 bg-gray-50/50 border-t border-gray-50 flex gap-3">
                                    <button type="button" onClick={() => setIsStateModalOpen(false)} className="flex-1 py-3 text-sm font-bold text-gray-500 hover:text-gray-700 hover:bg-white rounded-xl transition-all">Cancel</button>
                                    <button type="submit" className="flex-1 py-3 bg-primary text-white rounded-xl text-sm font-black uppercase tracking-[2px] shadow-lg shadow-primary/20">Update Settings</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
