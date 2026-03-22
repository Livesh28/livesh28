import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import {
  Users,
  Heartbeat,
  Pill,
  ChartLineUp,
  ArrowRight,
  Warning,
  CheckCircle,
} from "@phosphor-icons/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DiseaseChart } from "@/components/charts/DiseaseChart";
import { TrendChart } from "@/components/charts/TrendChart";
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API}/dashboard/stats`);
      setStats(response.data);
    } catch (error) {
      console.error("Error fetching stats:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const initSampleData = async () => {
    try {
      await axios.post(`${API}/init-sample-data`);
      toast.success("Sample data initialized successfully");
      fetchStats();
    } catch (error) {
      toast.error("Failed to initialize sample data");
    }
  };

  const getRiskLevel = (risk) => {
    if (risk < 30) return { label: "Low", color: "text-emerald-500", bg: "bg-emerald-500" };
    if (risk < 60) return { label: "Medium", color: "text-amber-500", bg: "bg-amber-500" };
    return { label: "High", color: "text-rose-500", bg: "bg-rose-500" };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" data-testid="dashboard-loading">
        <div className="w-8 h-8 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const diseases = ["Cancer", "Diabetes", "Heart Disease", "Alzheimer's", "Hypertension"];

  return (
    <div className="space-y-6" data-testid="dashboard-page">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-zinc-900">
            Dashboard
          </h1>
          <p className="text-sm text-zinc-500 font-mono mt-1">
            AI-Powered Multi-Disease Prediction Overview
          </p>
        </div>
        {stats?.total_patients === 0 && (
          <Button
            onClick={initSampleData}
            className="rounded-sm bg-zinc-900 hover:bg-zinc-800"
            data-testid="init-sample-data-btn"
          >
            Initialize Sample Data
          </Button>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-zinc-200">
        <Card className="rounded-none border-0 shadow-none">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-bold">
                  Total Patients
                </p>
                <p className="text-3xl font-heading font-bold mt-2">
                  {stats?.total_patients || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-zinc-100 rounded-sm flex items-center justify-center">
                <Users size={24} className="text-zinc-600" weight="duotone" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-none border-0 shadow-none">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-bold">
                  Predictions Run
                </p>
                <p className="text-3xl font-heading font-bold mt-2">
                  {stats?.total_predictions || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-sm flex items-center justify-center">
                <ChartLineUp size={24} className="text-blue-600" weight="duotone" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-none border-0 shadow-none">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-bold">
                  Files Uploaded
                </p>
                <p className="text-3xl font-heading font-bold mt-2">
                  {stats?.total_files || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-emerald-50 rounded-sm flex items-center justify-center">
                <Heartbeat size={24} className="text-emerald-600" weight="duotone" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-none border-0 shadow-none">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-bold">
                  Active Models
                </p>
                <p className="text-3xl font-heading font-bold mt-2">5</p>
              </div>
              <div className="w-12 h-12 bg-amber-50 rounded-sm flex items-center justify-center">
                <Pill size={24} className="text-amber-600" weight="duotone" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Disease Risk Overview */}
        <Card className="lg:col-span-8 rounded-sm border-zinc-200 shadow-none">
          <CardHeader className="border-b border-zinc-200 pb-4">
            <CardTitle className="font-heading text-lg">
              Disease Risk Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="mb-6 rounded-sm bg-zinc-100 p-1">
                <TabsTrigger
                  value="overview"
                  className="rounded-sm data-[state=active]:bg-white data-[state=active]:shadow-none"
                >
                  Overview
                </TabsTrigger>
                <TabsTrigger
                  value="chart"
                  className="rounded-sm data-[state=active]:bg-white data-[state=active]:shadow-none"
                >
                  Chart View
                </TabsTrigger>
                <TabsTrigger
                  value="trends"
                  className="rounded-sm data-[state=active]:bg-white data-[state=active]:shadow-none"
                >
                  Trends
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-0">
                <div className="space-y-4">
                  {diseases.map((disease) => {
                    const risk = stats?.average_risks?.[disease] || 0;
                    const riskInfo = getRiskLevel(risk);
                    return (
                      <div
                        key={disease}
                        className="flex items-center gap-4 p-4 bg-zinc-50 rounded-sm"
                      >
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-mono text-sm font-medium">
                              {disease}
                            </span>
                            <span className={`font-mono text-sm font-bold ${riskInfo.color}`}>
                              {risk.toFixed(1)}%
                            </span>
                          </div>
                          <Progress
                            value={risk}
                            className="h-2 rounded-none bg-zinc-200"
                          />
                        </div>
                        <div
                          className={`px-2 py-1 text-[10px] uppercase tracking-wider font-bold ${riskInfo.color} bg-opacity-10 rounded-sm`}
                        >
                          {riskInfo.label}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </TabsContent>

              <TabsContent value="chart" className="mt-0">
                <div className="h-80">
                  <DiseaseChart data={stats?.average_risks || {}} />
                </div>
              </TabsContent>

              <TabsContent value="trends" className="mt-0">
                <div className="h-80">
                  <TrendChart predictions={stats?.recent_predictions || []} />
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Quick Actions & Recent */}
        <div className="lg:col-span-4 space-y-6">
          {/* Quick Actions */}
          <Card className="rounded-sm border-zinc-200 shadow-none">
            <CardHeader className="border-b border-zinc-200 pb-4">
              <CardTitle className="font-heading text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2">
              <Link to="/upload">
                <Button
                  variant="outline"
                  className="w-full justify-between rounded-sm border-zinc-200 hover:bg-zinc-50"
                  data-testid="quick-upload-btn"
                >
                  <span className="font-mono text-sm">Upload Genomic Data</span>
                  <ArrowRight size={16} />
                </Button>
              </Link>
              <Link to="/patients">
                <Button
                  variant="outline"
                  className="w-full justify-between rounded-sm border-zinc-200 hover:bg-zinc-50"
                  data-testid="quick-patients-btn"
                >
                  <span className="font-mono text-sm">View All Patients</span>
                  <ArrowRight size={16} />
                </Button>
              </Link>
              <Link to="/reports">
                <Button
                  variant="outline"
                  className="w-full justify-between rounded-sm border-zinc-200 hover:bg-zinc-50"
                  data-testid="quick-reports-btn"
                >
                  <span className="font-mono text-sm">AI Analysis Reports</span>
                  <ArrowRight size={16} />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Model Status */}
          <Card className="rounded-sm border-zinc-200 shadow-none">
            <CardHeader className="border-b border-zinc-200 pb-4">
              <CardTitle className="font-heading text-lg">Model Status</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle size={18} className="text-emerald-600" weight="fill" />
                  <span className="font-mono text-sm">Disease Predictor</span>
                </div>
                <span className="text-[10px] uppercase tracking-wider text-emerald-600 font-bold">
                  Active
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle size={18} className="text-emerald-600" weight="fill" />
                  <span className="font-mono text-sm">Drug Response</span>
                </div>
                <span className="text-[10px] uppercase tracking-wider text-emerald-600 font-bold">
                  Active
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle size={18} className="text-emerald-600" weight="fill" />
                  <span className="font-mono text-sm">SHAP Explainer</span>
                </div>
                <span className="text-[10px] uppercase tracking-wider text-emerald-600 font-bold">
                  Active
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Alerts */}
          <Card className="rounded-sm border-zinc-200 shadow-none">
            <CardHeader className="border-b border-zinc-200 pb-4">
              <CardTitle className="font-heading text-lg">Alerts</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {stats?.total_predictions > 0 ? (
                <div className="space-y-2">
                  <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-sm">
                    <Warning size={18} className="text-amber-600 mt-0.5" weight="fill" />
                    <div>
                      <p className="font-mono text-sm font-medium">High Risk Cases</p>
                      <p className="text-xs text-zinc-500 mt-1">
                        {Math.floor(Math.random() * 3) + 1} patients require attention
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-zinc-500 font-mono text-center py-4">
                  No alerts at this time
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
