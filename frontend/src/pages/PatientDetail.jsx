import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  ArrowLeft,
  User,
  Heartbeat,
  Pill,
  Dna,
  Lightning,
  Info,
} from "@phosphor-icons/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ShapChart } from "@/components/charts/ShapChart";
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function PatientDetail() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [runningPrediction, setRunningPrediction] = useState(false);

  useEffect(() => {
    fetchPatient();
  }, [patientId]);

  const fetchPatient = async () => {
    try {
      const response = await axios.get(`${API}/patients/${patientId}`);
      setPatient(response.data);
    } catch (error) {
      console.error("Error fetching patient:", error);
      toast.error("Failed to load patient data");
      navigate("/patients");
    } finally {
      setLoading(false);
    }
  };

  const runPrediction = async () => {
    setRunningPrediction(true);
    try {
      // Generate random gene data for demo
      const geneData = {};
      for (let i = 1; i <= 50; i++) {
        geneData[`GENE_${i}`] = Math.random();
      }

      await axios.post(`${API}/predict`, {
        patient_id: patientId,
        gene_data: geneData,
      });

      toast.success("Prediction completed successfully");
      fetchPatient();
    } catch (error) {
      toast.error("Failed to run prediction");
    } finally {
      setRunningPrediction(false);
    }
  };

  const getRiskLevel = (risk) => {
    if (risk < 30) return { label: "Low", color: "text-emerald-600", bg: "bg-emerald-50" };
    if (risk < 60) return { label: "Medium", color: "text-amber-600", bg: "bg-amber-50" };
    return { label: "High", color: "text-rose-600", bg: "bg-rose-50" };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" data-testid="patient-detail-loading">
        <div className="w-8 h-8 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!patient) {
    return null;
  }

  const latestPrediction = patient.predictions?.[0];

  return (
    <div className="space-y-6" data-testid="patient-detail-page">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => navigate("/patients")}
        className="rounded-sm"
        data-testid="back-to-patients"
      >
        <ArrowLeft size={18} className="mr-2" />
        Back to Patients
      </Button>

      {/* Patient Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-zinc-100 rounded-sm flex items-center justify-center">
            <User size={40} className="text-zinc-600" />
          </div>
          <div>
            <h1 className="font-heading text-2xl font-bold text-zinc-900">
              {patient.name}
            </h1>
            <div className="flex items-center gap-4 mt-2">
              <span className="text-sm text-zinc-500 font-mono">
                {patient.age} years old
              </span>
              <span className="text-zinc-300">•</span>
              <span className="text-sm text-zinc-500 font-mono">
                {patient.gender}
              </span>
              <span className="text-zinc-300">•</span>
              <span className="text-sm text-zinc-500 font-mono">
                {patient.email || "No email"}
              </span>
            </div>
          </div>
        </div>

        <Button
          onClick={runPrediction}
          disabled={runningPrediction}
          className="rounded-sm bg-blue-600 hover:bg-blue-700"
          data-testid="run-prediction-btn"
        >
          {runningPrediction ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Running...
            </>
          ) : (
            <>
              <Lightning size={18} className="mr-2" weight="fill" />
              Run Prediction
            </>
          )}
        </Button>
      </div>

      {/* Main Content */}
      {latestPrediction ? (
        <Tabs defaultValue="predictions" className="w-full">
          <TabsList className="rounded-sm bg-zinc-100 p-1 mb-6">
            <TabsTrigger
              value="predictions"
              className="rounded-sm data-[state=active]:bg-white"
            >
              Disease Predictions
            </TabsTrigger>
            <TabsTrigger
              value="drugs"
              className="rounded-sm data-[state=active]:bg-white"
            >
              Drug Response
            </TabsTrigger>
            <TabsTrigger
              value="shap"
              className="rounded-sm data-[state=active]:bg-white"
            >
              SHAP Analysis
            </TabsTrigger>
            <TabsTrigger
              value="recommendations"
              className="rounded-sm data-[state=active]:bg-white"
            >
              Recommendations
            </TabsTrigger>
          </TabsList>

          {/* Disease Predictions Tab */}
          <TabsContent value="predictions" className="mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="rounded-sm border-zinc-200 shadow-none">
                <CardHeader className="border-b border-zinc-200 pb-4">
                  <CardTitle className="font-heading text-lg flex items-center gap-2">
                    <Heartbeat size={20} className="text-rose-500" weight="duotone" />
                    Disease Risk Assessment
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  {Object.entries(latestPrediction.disease_predictions).map(
                    ([disease, risk]) => {
                      const riskInfo = getRiskLevel(risk);
                      return (
                        <div key={disease} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-sm">{disease}</span>
                            <div className="flex items-center gap-2">
                              <span className={`font-mono text-sm font-bold ${riskInfo.color}`}>
                                {risk.toFixed(1)}%
                              </span>
                              <Badge
                                variant="outline"
                                className={`rounded-sm text-[10px] ${riskInfo.bg} ${riskInfo.color} border-0`}
                              >
                                {riskInfo.label}
                              </Badge>
                            </div>
                          </div>
                          <Progress
                            value={risk}
                            className="h-2 rounded-none bg-zinc-100"
                          />
                        </div>
                      );
                    }
                  )}
                </CardContent>
              </Card>

              <Card className="rounded-sm border-zinc-200 shadow-none">
                <CardHeader className="border-b border-zinc-200 pb-4">
                  <CardTitle className="font-heading text-lg flex items-center gap-2">
                    <Info size={20} className="text-blue-500" weight="duotone" />
                    Risk Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {Object.entries(latestPrediction.disease_predictions)
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, 3)
                      .map(([disease, risk]) => {
                        const riskInfo = getRiskLevel(risk);
                        return (
                          <div
                            key={disease}
                            className={`p-4 rounded-sm ${riskInfo.bg}`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-heading font-bold text-zinc-900">
                                {disease}
                              </span>
                              <span className={`font-mono font-bold ${riskInfo.color}`}>
                                {risk.toFixed(1)}%
                              </span>
                            </div>
                            <p className="text-sm text-zinc-600 mt-2 font-mono">
                              {risk > 50
                                ? "Elevated risk detected. Regular monitoring recommended."
                                : risk > 30
                                ? "Moderate risk level. Consider preventive measures."
                                : "Risk within normal range."}
                            </p>
                          </div>
                        );
                      })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Drug Response Tab */}
          <TabsContent value="drugs" className="mt-0">
            <Card className="rounded-sm border-zinc-200 shadow-none">
              <CardHeader className="border-b border-zinc-200 pb-4">
                <CardTitle className="font-heading text-lg flex items-center gap-2">
                  <Pill size={20} className="text-amber-500" weight="duotone" />
                  Drug Response Predictions
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(latestPrediction.drug_responses).map(
                    ([drug, response]) => {
                      const isEffective = response === "Effective";
                      return (
                        <div
                          key={drug}
                          className={`p-4 rounded-sm border ${
                            isEffective
                              ? "border-emerald-200 bg-emerald-50"
                              : "border-rose-200 bg-rose-50"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-heading font-bold text-zinc-900">
                              {drug}
                            </span>
                            <Badge
                              variant="outline"
                              className={`rounded-sm text-[10px] border-0 ${
                                isEffective
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-rose-100 text-rose-700"
                              }`}
                            >
                              {response}
                            </Badge>
                          </div>
                          <p className="text-sm text-zinc-600 mt-2 font-mono">
                            {isEffective
                              ? "Predicted to be effective based on genomic profile"
                              : "Not recommended based on genomic analysis"}
                          </p>
                        </div>
                      );
                    }
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* SHAP Analysis Tab */}
          <TabsContent value="shap" className="mt-0">
            <Card className="rounded-sm border-zinc-200 shadow-none">
              <CardHeader className="border-b border-zinc-200 pb-4">
                <CardTitle className="font-heading text-lg flex items-center gap-2">
                  <Dna size={20} className="text-blue-500" weight="duotone" />
                  SHAP Feature Importance
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-sm text-zinc-500 font-mono mb-6">
                  SHAP values show how each gene contributes to the prediction.
                  Positive values (blue) increase risk, negative values (red) decrease risk.
                </p>
                <div className="h-96">
                  <ShapChart shapValues={latestPrediction.shap_values} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Recommendations Tab */}
          <TabsContent value="recommendations" className="mt-0">
            <Card className="rounded-sm border-zinc-200 shadow-none">
              <CardHeader className="border-b border-zinc-200 pb-4">
                <CardTitle className="font-heading text-lg">
                  Personalized Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {latestPrediction.recommendations.map((rec, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-4 p-4 bg-zinc-50 rounded-sm"
                    >
                      <div className="w-8 h-8 bg-blue-100 rounded-sm flex items-center justify-center flex-shrink-0">
                        <span className="text-blue-600 font-heading font-bold text-sm">
                          {index + 1}
                        </span>
                      </div>
                      <p className="text-sm font-mono text-zinc-700 leading-relaxed">
                        {rec}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        <Card className="rounded-sm border-zinc-200 shadow-none">
          <CardContent className="p-12 text-center">
            <Dna size={48} className="mx-auto text-zinc-300 mb-4" />
            <p className="font-heading text-lg text-zinc-600">
              No predictions yet
            </p>
            <p className="text-sm text-zinc-500 font-mono mt-2">
              Run a prediction to see disease risks, drug responses, and AI explanations
            </p>
            <Button
              onClick={runPrediction}
              disabled={runningPrediction}
              className="mt-6 rounded-sm bg-blue-600 hover:bg-blue-700"
              data-testid="run-first-prediction-btn"
            >
              <Lightning size={18} className="mr-2" weight="fill" />
              Run First Prediction
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Prediction History */}
      {patient.predictions?.length > 1 && (
        <Card className="rounded-sm border-zinc-200 shadow-none">
          <CardHeader className="border-b border-zinc-200 pb-4">
            <CardTitle className="font-heading text-lg">
              Prediction History
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Top Risk</th>
                  <th>Risk Level</th>
                  <th>Effective Drugs</th>
                </tr>
              </thead>
              <tbody>
                {patient.predictions.map((pred) => {
                  const topRisk = Object.entries(pred.disease_predictions).sort(
                    (a, b) => b[1] - a[1]
                  )[0];
                  const effectiveDrugs = Object.entries(pred.drug_responses).filter(
                    ([_, r]) => r === "Effective"
                  ).length;
                  const riskInfo = getRiskLevel(topRisk[1]);

                  return (
                    <tr key={pred.id}>
                      <td className="font-mono">
                        {new Date(pred.created_at).toLocaleDateString()}
                      </td>
                      <td className="font-mono">{topRisk[0]}</td>
                      <td>
                        <Badge
                          variant="outline"
                          className={`rounded-sm text-[10px] ${riskInfo.bg} ${riskInfo.color} border-0`}
                        >
                          {topRisk[1].toFixed(1)}% - {riskInfo.label}
                        </Badge>
                      </td>
                      <td className="font-mono">{effectiveDrugs}/5</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
