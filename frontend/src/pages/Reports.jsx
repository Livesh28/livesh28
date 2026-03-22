import { useState, useEffect } from "react";
import axios from "axios";
import { ChartBar, Pill, Heartbeat, Users } from "@phosphor-icons/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DiseaseChart } from "@/components/charts/DiseaseChart";
import { DrugChart } from "@/components/charts/DrugChart";
import { ShapChart } from "@/components/charts/ShapChart";
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Reports() {
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPrediction, setSelectedPrediction] = useState(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const response = await axios.get(`${API}/reports`);
      setReports(response.data);
      if (response.data.recent_predictions?.length > 0) {
        setSelectedPrediction(response.data.recent_predictions[0]);
      }
    } catch (error) {
      console.error("Error fetching reports:", error);
      toast.error("Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" data-testid="reports-loading">
        <div className="w-8 h-8 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="reports-page">
      {/* Page Header */}
      <div>
        <h1 className="font-heading text-2xl font-bold text-zinc-900">
          AI Analysis Reports
        </h1>
        <p className="text-sm text-zinc-500 font-mono mt-1">
          Aggregated insights from disease predictions and drug responses
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-px bg-zinc-200">
        <Card className="rounded-none border-0 shadow-none">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-zinc-100 rounded-sm flex items-center justify-center">
                <Users size={24} className="text-zinc-600" weight="duotone" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-bold">
                  Total Patients
                </p>
                <p className="text-2xl font-heading font-bold mt-1">
                  {reports?.total_patients || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-none border-0 shadow-none">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 rounded-sm flex items-center justify-center">
                <ChartBar size={24} className="text-blue-600" weight="duotone" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-bold">
                  Predictions
                </p>
                <p className="text-2xl font-heading font-bold mt-1">
                  {reports?.total_predictions || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-none border-0 shadow-none">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-rose-50 rounded-sm flex items-center justify-center">
                <Heartbeat size={24} className="text-rose-600" weight="duotone" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-bold">
                  Diseases Tracked
                </p>
                <p className="text-2xl font-heading font-bold mt-1">5</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-none border-0 shadow-none">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-50 rounded-sm flex items-center justify-center">
                <Pill size={24} className="text-amber-600" weight="duotone" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-bold">
                  Drugs Analyzed
                </p>
                <p className="text-2xl font-heading font-bold mt-1">5</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="disease" className="w-full">
        <TabsList className="rounded-sm bg-zinc-100 p-1 mb-6">
          <TabsTrigger
            value="disease"
            className="rounded-sm data-[state=active]:bg-white"
          >
            Disease Analysis
          </TabsTrigger>
          <TabsTrigger
            value="drug"
            className="rounded-sm data-[state=active]:bg-white"
          >
            Drug Response
          </TabsTrigger>
          <TabsTrigger
            value="shap"
            className="rounded-sm data-[state=active]:bg-white"
          >
            SHAP Explanations
          </TabsTrigger>
        </TabsList>

        {/* Disease Analysis Tab */}
        <TabsContent value="disease" className="mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="rounded-sm border-zinc-200 shadow-none">
              <CardHeader className="border-b border-zinc-200 pb-4">
                <CardTitle className="font-heading text-lg">
                  Disease Risk Distribution
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {reports?.disease_stats && Object.keys(reports.disease_stats).length > 0 ? (
                  <div className="h-80">
                    <DiseaseChart
                      data={Object.fromEntries(
                        Object.entries(reports.disease_stats).map(([disease, stats]) => [
                          disease,
                          stats.total > 0 ? (stats.high_risk / stats.total) * 100 : 0,
                        ])
                      )}
                    />
                  </div>
                ) : (
                  <div className="h-80 flex items-center justify-center">
                    <p className="text-zinc-500 font-mono text-sm">
                      No disease data available
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-sm border-zinc-200 shadow-none">
              <CardHeader className="border-b border-zinc-200 pb-4">
                <CardTitle className="font-heading text-lg">
                  High Risk Cases by Disease
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {reports?.disease_stats &&
                    Object.entries(reports.disease_stats).map(([disease, stats]) => (
                      <div
                        key={disease}
                        className="flex items-center justify-between p-4 bg-zinc-50 rounded-sm"
                      >
                        <span className="font-mono text-sm">{disease}</span>
                        <div className="flex items-center gap-4">
                          <span className="text-sm text-zinc-500 font-mono">
                            {stats.high_risk}/{stats.total} high risk
                          </span>
                          <div className="w-24 h-2 bg-zinc-200 rounded-none overflow-hidden">
                            <div
                              className="h-full bg-rose-500"
                              style={{
                                width: `${stats.total > 0 ? (stats.high_risk / stats.total) * 100 : 0}%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Drug Response Tab */}
        <TabsContent value="drug" className="mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="rounded-sm border-zinc-200 shadow-none">
              <CardHeader className="border-b border-zinc-200 pb-4">
                <CardTitle className="font-heading text-lg">
                  Drug Effectiveness Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {reports?.drug_stats && Object.keys(reports.drug_stats).length > 0 ? (
                  <div className="h-80">
                    <DrugChart data={reports.drug_stats} />
                  </div>
                ) : (
                  <div className="h-80 flex items-center justify-center">
                    <p className="text-zinc-500 font-mono text-sm">
                      No drug data available
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-sm border-zinc-200 shadow-none">
              <CardHeader className="border-b border-zinc-200 pb-4">
                <CardTitle className="font-heading text-lg">
                  Drug Response Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {reports?.drug_stats &&
                    Object.entries(reports.drug_stats).map(([drug, stats]) => {
                      const total = stats.effective + stats.not_recommended;
                      const effectiveRate = total > 0 ? (stats.effective / total) * 100 : 0;
                      return (
                        <div
                          key={drug}
                          className="flex items-center justify-between p-4 bg-zinc-50 rounded-sm"
                        >
                          <span className="font-mono text-sm font-medium">{drug}</span>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <span className="text-emerald-600 font-mono text-sm">
                                {stats.effective}
                              </span>
                              <span className="text-zinc-400 mx-1">/</span>
                              <span className="text-rose-600 font-mono text-sm">
                                {stats.not_recommended}
                              </span>
                            </div>
                            <div className="w-24 h-2 bg-rose-200 rounded-none overflow-hidden">
                              <div
                                className="h-full bg-emerald-500"
                                style={{ width: `${effectiveRate}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* SHAP Tab */}
        <TabsContent value="shap" className="mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Prediction Selector */}
            <Card className="rounded-sm border-zinc-200 shadow-none">
              <CardHeader className="border-b border-zinc-200 pb-4">
                <CardTitle className="font-heading text-lg">
                  Recent Predictions
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {reports?.recent_predictions?.map((pred, index) => (
                    <button
                      key={pred.id}
                      onClick={() => setSelectedPrediction(pred)}
                      className={`w-full text-left p-3 rounded-sm transition-colors duration-200 ${
                        selectedPrediction?.id === pred.id
                          ? "bg-zinc-900 text-white"
                          : "bg-zinc-50 hover:bg-zinc-100"
                      }`}
                      data-testid={`prediction-select-${index}`}
                    >
                      <p className="font-mono text-sm">
                        Prediction #{index + 1}
                      </p>
                      <p className="text-xs mt-1 opacity-70">
                        {new Date(pred.created_at).toLocaleDateString()}
                      </p>
                    </button>
                  ))}
                  {(!reports?.recent_predictions || reports.recent_predictions.length === 0) && (
                    <p className="text-zinc-500 font-mono text-sm text-center py-8">
                      No predictions available
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* SHAP Visualization */}
            <Card className="lg:col-span-2 rounded-sm border-zinc-200 shadow-none">
              <CardHeader className="border-b border-zinc-200 pb-4">
                <CardTitle className="font-heading text-lg">
                  SHAP Feature Importance
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {selectedPrediction?.shap_values ? (
                  <>
                    <p className="text-sm text-zinc-500 font-mono mb-6">
                      SHAP values indicate gene contribution to prediction.
                      Blue = increases risk, Red = decreases risk.
                    </p>
                    <div className="h-96">
                      <ShapChart shapValues={selectedPrediction.shap_values} />
                    </div>
                  </>
                ) : (
                  <div className="h-96 flex items-center justify-center">
                    <p className="text-zinc-500 font-mono text-sm">
                      Select a prediction to view SHAP analysis
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
