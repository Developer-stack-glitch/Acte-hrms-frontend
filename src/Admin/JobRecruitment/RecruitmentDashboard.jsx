import React, { useState, useEffect } from 'react';
import { Users, Briefcase, UserCheck, TrendingUp, PieChart as PieChartIcon } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { getJobsApi, getApplicantsApi } from '../../Action/api';
import DashboardSkeleton from '../../Common/CommonSkeletonLoader/DashboardSkeleton';

const RecruitmentDashboard = () => {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalJobs: 0,
        activeJobs: 0,
        totalApplicants: 0,
        newApplicants: 0,
        hiredThisMonth: 0
    });
    const [pipelineData, setPipelineData] = useState([]);
    const [departmentData, setDepartmentData] = useState([]);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                const [jobsRes, appsRes] = await Promise.all([
                    getJobsApi(),
                    getApplicantsApi()
                ]);

                const jobs = jobsRes.data;
                const apps = appsRes.data;

                // Process Stats
                const activeJobs = jobs.filter(j => j.status === 'Open').length;
                const hiredThisMonth = apps.filter(a => a.status === 'Hired').length; // Simplified for demo

                setStats({
                    totalJobs: jobs.length,
                    activeJobs: activeJobs,
                    totalApplicants: apps.length,
                    newApplicants: apps.filter(a => a.status === 'Applied').length,
                    hiredThisMonth: hiredThisMonth
                });

                // Pipeline data
                const pipeline = ['Applied', 'Interviewing', 'Offered', 'Hired', 'Rejected'].map(status => ({
                    name: status,
                    value: apps.filter(a => a.status === status).length
                }));
                setPipelineData(pipeline);

                // Department data (using jobs)
                const departments = [...new Set(jobs.map(j => j.department))];
                const deptData = departments.map(dept => ({
                    name: dept,
                    jobs: jobs.filter(j => j.department === dept).length
                }));
                setDepartmentData(deptData);

            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const COLORS = ['#3b82f6', '#eab308', '#a855f7', '#10b981', '#ef4444'];

    const StatCard = ({ title, value, icon: Icon, color, trend }) => (
        <div className="bg-white p-6 rounded-[15px] border border-gray-200 hover:shadow-xs transition-shadow">
            <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl ${color} bg-opacity-10 text-white`}>
                    <Icon size={24} />
                </div>
                {trend && (
                    <span className="flex items-center gap-1 text-green-500 text-sm font-semibold">
                        <TrendingUp size={16} /> {trend}
                    </span>
                )}
            </div>
            <h3 className="text-gray-700 text-[13.5px] font-semibold tracking-tight">{title}</h3>
            <p className="text-3xl font-semibold text-gray-800 mt-1">{value}</p>
        </div>
    );

    if (loading) {
        return <DashboardSkeleton />;
    }

    return (
        <div className="p-6 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Active Job Openings"
                    value={stats.activeJobs}
                    icon={Briefcase}
                    color="bg-blue-500"
                    trend="+2 new"
                />
                <StatCard
                    title="Total Applicants"
                    value={stats.totalApplicants}
                    icon={Users}
                    color="bg-purple-500"
                    trend="+5 today"
                />
                <StatCard
                    title="Interviews Scheduled"
                    value={stats.pipelineData?.find(p => p.name === 'Interviewing')?.value || 0}
                    icon={PieChartIcon}
                    color="bg-yellow-500"
                />
                <StatCard
                    title="Hired this Month"
                    value={stats.hiredThisMonth}
                    icon={UserCheck}
                    color="bg-green-500"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Pipeline Chart */}
                <div className="bg-white p-6 rounded-[13px] border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-3">
                        <Users className="text-primary" size={20} /> Recruitment Pipeline
                    </h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={pipelineData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                    cursor={{ fill: '#f8fafc' }}
                                />
                                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                                    {pipelineData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Job Distribution Chart */}
                <div className="bg-white p-6 rounded-[13px] border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-3">
                        <Briefcase className="text-primary" size={20} /> Jobs by Department
                    </h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={departmentData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="jobs"
                                >
                                    {departmentData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mt-[-20px]">
                            {departmentData.map((entry, index) => (
                                <div key={entry.name} className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                    <span className="text-sm font-medium text-gray-600">{entry.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RecruitmentDashboard;
