import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import {
  MagnifyingGlass,
  Plus,
  User,
  ArrowRight,
  Trash,
} from "@phosphor-icons/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Patients() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newPatient, setNewPatient] = useState({
    name: "",
    age: "",
    gender: "",
    email: "",
    phone: "",
  });

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const response = await axios.get(`${API}/patients`);
      setPatients(response.data);
    } catch (error) {
      console.error("Error fetching patients:", error);
      toast.error("Failed to load patients");
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePatient = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/patients`, {
        ...newPatient,
        age: parseInt(newPatient.age),
      });
      toast.success("Patient created successfully");
      setIsDialogOpen(false);
      setNewPatient({ name: "", age: "", gender: "", email: "", phone: "" });
      fetchPatients();
    } catch (error) {
      toast.error("Failed to create patient");
    }
  };

  const handleDeletePatient = async (patientId, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this patient?")) return;
    
    try {
      await axios.delete(`${API}/patients/${patientId}`);
      toast.success("Patient deleted successfully");
      fetchPatients();
    } catch (error) {
      toast.error("Failed to delete patient");
    }
  };

  const filteredPatients = patients.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" data-testid="patients-loading">
        <div className="w-8 h-8 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="patients-page">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-zinc-900">
            Patients
          </h1>
          <p className="text-sm text-zinc-500 font-mono mt-1">
            Manage patient records and genomic data
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              className="rounded-sm bg-zinc-900 hover:bg-zinc-800"
              data-testid="add-patient-btn"
            >
              <Plus size={18} className="mr-2" />
              Add Patient
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-sm">
            <DialogHeader>
              <DialogTitle className="font-heading">Add New Patient</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreatePatient} className="space-y-4 mt-4">
              <div>
                <Label className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-bold">
                  Full Name
                </Label>
                <Input
                  value={newPatient.name}
                  onChange={(e) =>
                    setNewPatient({ ...newPatient, name: e.target.value })
                  }
                  required
                  className="rounded-sm mt-1"
                  data-testid="patient-name-input"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-bold">
                    Age
                  </Label>
                  <Input
                    type="number"
                    value={newPatient.age}
                    onChange={(e) =>
                      setNewPatient({ ...newPatient, age: e.target.value })
                    }
                    required
                    className="rounded-sm mt-1"
                    data-testid="patient-age-input"
                  />
                </div>
                <div>
                  <Label className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-bold">
                    Gender
                  </Label>
                  <Select
                    value={newPatient.gender}
                    onValueChange={(value) =>
                      setNewPatient({ ...newPatient, gender: value })
                    }
                  >
                    <SelectTrigger className="rounded-sm mt-1" data-testid="patient-gender-select">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-bold">
                  Email
                </Label>
                <Input
                  type="email"
                  value={newPatient.email}
                  onChange={(e) =>
                    setNewPatient({ ...newPatient, email: e.target.value })
                  }
                  className="rounded-sm mt-1"
                  data-testid="patient-email-input"
                />
              </div>
              <div>
                <Label className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-bold">
                  Phone
                </Label>
                <Input
                  value={newPatient.phone}
                  onChange={(e) =>
                    setNewPatient({ ...newPatient, phone: e.target.value })
                  }
                  className="rounded-sm mt-1"
                  data-testid="patient-phone-input"
                />
              </div>
              <Button
                type="submit"
                className="w-full rounded-sm bg-zinc-900 hover:bg-zinc-800"
                data-testid="submit-patient-btn"
              >
                Create Patient
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Card className="rounded-sm border-zinc-200 shadow-none">
        <CardContent className="p-4">
          <div className="relative">
            <MagnifyingGlass
              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
              size={18}
            />
            <Input
              type="search"
              placeholder="Search patients by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 rounded-sm border-zinc-200 font-mono text-sm"
              data-testid="patient-search-input"
            />
          </div>
        </CardContent>
      </Card>

      {/* Patients Grid */}
      {filteredPatients.length === 0 ? (
        <Card className="rounded-sm border-zinc-200 shadow-none">
          <CardContent className="p-12 text-center">
            <User size={48} className="mx-auto text-zinc-300 mb-4" />
            <p className="font-heading text-lg text-zinc-600">No patients found</p>
            <p className="text-sm text-zinc-500 font-mono mt-2">
              {patients.length === 0
                ? "Add your first patient to get started"
                : "Try a different search term"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPatients.map((patient) => (
            <Link
              key={patient.id}
              to={`/patients/${patient.id}`}
              data-testid={`patient-card-${patient.id}`}
            >
              <Card className="rounded-sm border-zinc-200 shadow-none hover:border-zinc-400 transition-colors duration-200">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-zinc-100 rounded-sm flex items-center justify-center">
                        <User size={24} className="text-zinc-600" />
                      </div>
                      <div>
                        <h3 className="font-heading font-bold text-zinc-900">
                          {patient.name}
                        </h3>
                        <p className="text-sm text-zinc-500 font-mono mt-1">
                          {patient.age} years • {patient.gender}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-sm text-zinc-400 hover:text-rose-500"
                      onClick={(e) => handleDeletePatient(patient.id, e)}
                      data-testid={`delete-patient-${patient.id}`}
                    >
                      <Trash size={18} />
                    </Button>
                  </div>

                  <div className="mt-4 pt-4 border-t border-zinc-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-bold">
                          Contact
                        </p>
                        <p className="text-sm font-mono text-zinc-700 mt-1">
                          {patient.email || "No email"}
                        </p>
                      </div>
                      <ArrowRight size={20} className="text-zinc-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
