import { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import axios from "axios";
import {
  CloudArrowUp,
  File,
  CheckCircle,
  X,
  Download,
  Trash,
  Lightning,
} from "@phosphor-icons/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Upload() {
  const [files, setFiles] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState("");
  const [selectedFile, setSelectedFile] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchUploadedFiles();
    fetchPatients();
  }, []);

  const fetchUploadedFiles = async () => {
    try {
      const response = await axios.get(`${API}/files`);
      setUploadedFiles(response.data);
    } catch (error) {
      console.error("Error fetching files:", error);
    }
  };

  const fetchPatients = async () => {
    try {
      const response = await axios.get(`${API}/patients`);
      setPatients(response.data);
    } catch (error) {
      console.error("Error fetching patients:", error);
    }
  };

  const onDrop = useCallback((acceptedFiles) => {
    const csvFiles = acceptedFiles.filter((file) => file.name.endsWith(".csv"));
    if (csvFiles.length !== acceptedFiles.length) {
      toast.error("Only CSV files are supported");
    }
    setFiles((prev) => [...prev, ...csvFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/csv": [".csv"],
    },
  });

  const handleUpload = async () => {
    if (files.length === 0) return;

    setUploading(true);
    setUploadProgress(0);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append("file", file);

      try {
        await axios.post(`${API}/upload`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (progressEvent) => {
            const progress = Math.round(
              ((i + progressEvent.loaded / progressEvent.total) / files.length) * 100
            );
            setUploadProgress(progress);
          },
        });
        toast.success(`Uploaded ${file.name}`);
      } catch (error) {
        toast.error(`Failed to upload ${file.name}`);
      }
    }

    setFiles([]);
    setUploading(false);
    setUploadProgress(0);
    fetchUploadedFiles();
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleProcess = async () => {
    if (!selectedPatient || !selectedFile) {
      toast.error("Please select both a patient and a file");
      return;
    }

    setProcessing(true);
    try {
      const response = await axios.post(
        `${API}/files/${selectedFile}/process?patient_id=${selectedPatient}`
      );
      toast.success("Prediction completed successfully!");
      console.log("Prediction result:", response.data);
    } catch (error) {
      toast.error("Failed to process file");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6" data-testid="upload-page">
      {/* Page Header */}
      <div>
        <h1 className="font-heading text-2xl font-bold text-zinc-900">
          Upload Genomic Data
        </h1>
        <p className="text-sm text-zinc-500 font-mono mt-1">
          Upload CSV files containing gene expression data for analysis
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Zone */}
        <Card className="rounded-sm border-zinc-200 shadow-none">
          <CardHeader className="border-b border-zinc-200 pb-4">
            <CardTitle className="font-heading text-lg">Upload Files</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {/* Dropzone */}
            <div
              {...getRootProps()}
              className={`dropzone p-12 text-center cursor-pointer rounded-sm ${
                isDragActive ? "dropzone-active" : ""
              }`}
              data-testid="file-dropzone"
            >
              <input {...getInputProps()} data-testid="file-input" />
              <CloudArrowUp
                size={48}
                className={`mx-auto mb-4 ${
                  isDragActive ? "text-blue-600" : "text-zinc-400"
                }`}
                weight="duotone"
              />
              <p className="font-heading font-bold text-zinc-900">
                {isDragActive ? "Drop files here" : "Drag & drop CSV files"}
              </p>
              <p className="text-sm text-zinc-500 font-mono mt-2">
                or click to browse
              </p>
              <p className="text-xs text-zinc-400 font-mono mt-4">
                Supported format: CSV with gene expression data
              </p>
            </div>

            {/* File List */}
            {files.length > 0 && (
              <div className="mt-6 space-y-2">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-zinc-50 rounded-sm"
                  >
                    <div className="flex items-center gap-3">
                      <File size={20} className="text-zinc-600" />
                      <div>
                        <p className="font-mono text-sm">{file.name}</p>
                        <p className="text-xs text-zinc-500">
                          {(file.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFile(index)}
                      className="rounded-sm text-zinc-400 hover:text-rose-500"
                      data-testid={`remove-file-${index}`}
                    >
                      <X size={18} />
                    </Button>
                  </div>
                ))}

                {/* Upload Progress */}
                {uploading && (
                  <div className="mt-4">
                    <Progress value={uploadProgress} className="h-2 rounded-none" />
                    <p className="text-xs text-zinc-500 font-mono mt-2 text-center">
                      Uploading... {uploadProgress}%
                    </p>
                  </div>
                )}

                <Button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="w-full mt-4 rounded-sm bg-zinc-900 hover:bg-zinc-800"
                  data-testid="upload-btn"
                >
                  {uploading ? "Uploading..." : "Upload Files"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Process File */}
        <Card className="rounded-sm border-zinc-200 shadow-none">
          <CardHeader className="border-b border-zinc-200 pb-4">
            <CardTitle className="font-heading text-lg">
              Process & Predict
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-bold mb-2">
                Select Patient
              </p>
              <Select value={selectedPatient} onValueChange={setSelectedPatient}>
                <SelectTrigger className="rounded-sm" data-testid="patient-select">
                  <SelectValue placeholder="Choose a patient" />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((patient) => (
                    <SelectItem key={patient.id} value={patient.id}>
                      {patient.name} ({patient.age} years, {patient.gender})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-bold mb-2">
                Select Data File
              </p>
              <Select value={selectedFile} onValueChange={setSelectedFile}>
                <SelectTrigger className="rounded-sm" data-testid="file-select">
                  <SelectValue placeholder="Choose an uploaded file" />
                </SelectTrigger>
                <SelectContent>
                  {uploadedFiles.map((file) => (
                    <SelectItem key={file.id} value={file.id}>
                      {file.original_filename}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleProcess}
              disabled={processing || !selectedPatient || !selectedFile}
              className="w-full rounded-sm bg-blue-600 hover:bg-blue-700"
              data-testid="process-btn"
            >
              {processing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  <Lightning size={18} className="mr-2" weight="fill" />
                  Run Prediction
                </>
              )}
            </Button>

            <div className="pt-4 border-t border-zinc-100">
              <p className="text-xs text-zinc-500 font-mono">
                Expected CSV format:
              </p>
              <code className="text-xs bg-zinc-100 p-2 rounded-sm block mt-2 overflow-x-auto">
                age, gender, GENE_1, GENE_2, ..., GENE_N, label
              </code>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Uploaded Files List */}
      <Card className="rounded-sm border-zinc-200 shadow-none">
        <CardHeader className="border-b border-zinc-200 pb-4">
          <CardTitle className="font-heading text-lg">Uploaded Files</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {uploadedFiles.length > 0 ? (
            <table className="w-full data-table">
              <thead>
                <tr>
                  <th>Filename</th>
                  <th>Size</th>
                  <th>Uploaded</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {uploadedFiles.map((file) => (
                  <tr key={file.id}>
                    <td className="font-mono">
                      <div className="flex items-center gap-2">
                        <File size={16} className="text-zinc-400" />
                        {file.original_filename}
                      </div>
                    </td>
                    <td className="font-mono text-zinc-500">
                      {(file.size / 1024).toFixed(1)} KB
                    </td>
                    <td className="font-mono text-zinc-500">
                      {new Date(file.created_at).toLocaleDateString()}
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="rounded-sm"
                          onClick={() =>
                            window.open(`${API}/files/${file.id}/download`, "_blank")
                          }
                          data-testid={`download-file-${file.id}`}
                        >
                          <Download size={16} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-12 text-center">
              <File size={48} className="mx-auto text-zinc-300 mb-4" />
              <p className="font-heading text-lg text-zinc-600">No files uploaded</p>
              <p className="text-sm text-zinc-500 font-mono mt-2">
                Upload CSV files to get started
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
