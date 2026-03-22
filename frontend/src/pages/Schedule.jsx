import { useState, useEffect } from "react";
import axios from "axios";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday } from "date-fns";
import {
  CaretLeft,
  CaretRight,
  Plus,
  Clock,
  User,
  X,
} from "@phosphor-icons/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const eventTypes = [
  { value: "consultation", label: "Consultation", color: "bg-blue-500" },
  { value: "review", label: "Lab Review", color: "bg-emerald-500" },
  { value: "planning", label: "Treatment Planning", color: "bg-amber-500" },
  { value: "screening", label: "Screening", color: "bg-rose-500" },
];

export default function Schedule() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [newEvent, setNewEvent] = useState({
    title: "",
    patient_name: "",
    date: "",
    time: "09:00",
    type: "consultation",
    notes: "",
  });

  useEffect(() => {
    fetchEvents();
    fetchPatients();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await axios.get(`${API}/schedule`);
      setEvents(response.data);
    } catch (error) {
      console.error("Error fetching events:", error);
      toast.error("Failed to load schedule");
    } finally {
      setLoading(false);
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

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/schedule`, newEvent);
      toast.success("Event created successfully");
      setIsDialogOpen(false);
      setNewEvent({
        title: "",
        patient_name: "",
        date: "",
        time: "09:00",
        type: "consultation",
        notes: "",
      });
      fetchEvents();
    } catch (error) {
      toast.error("Failed to create event");
    }
  };

  const handleDeleteEvent = async (eventId) => {
    try {
      await axios.delete(`${API}/schedule/${eventId}`);
      toast.success("Event deleted");
      fetchEvents();
    } catch (error) {
      toast.error("Failed to delete event");
    }
  };

  const openNewEventDialog = (date) => {
    setSelectedDate(date);
    setNewEvent((prev) => ({
      ...prev,
      date: format(date, "yyyy-MM-dd"),
    }));
    setIsDialogOpen(true);
  };

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Pad days to start from Sunday
  const startDay = monthStart.getDay();
  const paddedDays = [...Array(startDay).fill(null), ...days];

  const getEventsForDate = (date) => {
    if (!date) return [];
    const dateStr = format(date, "yyyy-MM-dd");
    return events.filter((event) => event.date === dateStr);
  };

  const getEventTypeInfo = (type) => {
    return eventTypes.find((t) => t.value === type) || eventTypes[0];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" data-testid="schedule-loading">
        <div className="w-8 h-8 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="schedule-page">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-zinc-900">
            Schedule
          </h1>
          <p className="text-sm text-zinc-500 font-mono mt-1">
            Manage appointments and consultations
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              className="rounded-sm bg-zinc-900 hover:bg-zinc-800"
              data-testid="add-event-btn"
            >
              <Plus size={18} className="mr-2" />
              New Event
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-sm">
            <DialogHeader>
              <DialogTitle className="font-heading">Schedule New Event</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateEvent} className="space-y-4 mt-4">
              <div>
                <Label className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-bold">
                  Event Title
                </Label>
                <Input
                  value={newEvent.title}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, title: e.target.value })
                  }
                  required
                  className="rounded-sm mt-1"
                  data-testid="event-title-input"
                />
              </div>

              <div>
                <Label className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-bold">
                  Patient (Optional)
                </Label>
                <Select
                  value={newEvent.patient_name}
                  onValueChange={(value) =>
                    setNewEvent({ ...newEvent, patient_name: value })
                  }
                >
                  <SelectTrigger className="rounded-sm mt-1" data-testid="event-patient-select">
                    <SelectValue placeholder="Select patient" />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map((patient) => (
                      <SelectItem key={patient.id} value={patient.name}>
                        {patient.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-bold">
                    Date
                  </Label>
                  <Input
                    type="date"
                    value={newEvent.date}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, date: e.target.value })
                    }
                    required
                    className="rounded-sm mt-1"
                    data-testid="event-date-input"
                  />
                </div>
                <div>
                  <Label className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-bold">
                    Time
                  </Label>
                  <Input
                    type="time"
                    value={newEvent.time}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, time: e.target.value })
                    }
                    required
                    className="rounded-sm mt-1"
                    data-testid="event-time-input"
                  />
                </div>
              </div>

              <div>
                <Label className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-bold">
                  Event Type
                </Label>
                <Select
                  value={newEvent.type}
                  onValueChange={(value) =>
                    setNewEvent({ ...newEvent, type: value })
                  }
                >
                  <SelectTrigger className="rounded-sm mt-1" data-testid="event-type-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {eventTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${type.color}`} />
                          {type.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-bold">
                  Notes
                </Label>
                <Input
                  value={newEvent.notes}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, notes: e.target.value })
                  }
                  className="rounded-sm mt-1"
                  data-testid="event-notes-input"
                />
              </div>

              <Button
                type="submit"
                className="w-full rounded-sm bg-zinc-900 hover:bg-zinc-800"
                data-testid="submit-event-btn"
              >
                Create Event
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-2 rounded-sm border-zinc-200 shadow-none">
          <CardHeader className="border-b border-zinc-200 pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="font-heading text-lg">
                {format(currentDate, "MMMM yyyy")}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-sm"
                  onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                  data-testid="prev-month-btn"
                >
                  <CaretLeft size={18} />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-sm"
                  onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                  data-testid="next-month-btn"
                >
                  <CaretRight size={18} />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-px mb-2">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div
                  key={day}
                  className="text-center text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-bold py-2"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-px bg-zinc-200">
              {paddedDays.map((day, index) => {
                const dayEvents = day ? getEventsForDate(day) : [];
                const isCurrentMonth = day ? isSameMonth(day, currentDate) : false;
                const isTodayDate = day ? isToday(day) : false;

                return (
                  <div
                    key={index}
                    className={`min-h-24 bg-white p-2 ${
                      !isCurrentMonth ? "opacity-50" : ""
                    } ${day ? "cursor-pointer hover:bg-zinc-50" : ""}`}
                    onClick={() => day && openNewEventDialog(day)}
                    data-testid={day ? `calendar-day-${format(day, "yyyy-MM-dd")}` : undefined}
                  >
                    {day && (
                      <>
                        <span
                          className={`inline-flex items-center justify-center w-7 h-7 text-sm font-mono ${
                            isTodayDate
                              ? "bg-zinc-900 text-white rounded-sm"
                              : "text-zinc-700"
                          }`}
                        >
                          {format(day, "d")}
                        </span>
                        <div className="mt-1 space-y-1">
                          {dayEvents.slice(0, 2).map((event) => {
                            const typeInfo = getEventTypeInfo(event.type);
                            return (
                              <div
                                key={event.id}
                                className={`text-[10px] p-1 truncate text-white rounded-sm ${typeInfo.color}`}
                              >
                                {event.title}
                              </div>
                            );
                          })}
                          {dayEvents.length > 2 && (
                            <div className="text-[10px] text-zinc-500 font-mono">
                              +{dayEvents.length - 2} more
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card className="rounded-sm border-zinc-200 shadow-none">
          <CardHeader className="border-b border-zinc-200 pb-4">
            <CardTitle className="font-heading text-lg">Upcoming Events</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {events
                .filter((e) => new Date(e.date) >= new Date())
                .sort((a, b) => new Date(a.date) - new Date(b.date))
                .slice(0, 10)
                .map((event) => {
                  const typeInfo = getEventTypeInfo(event.type);
                  return (
                    <div
                      key={event.id}
                      className="p-3 bg-zinc-50 rounded-sm"
                      data-testid={`event-card-${event.id}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${typeInfo.color}`} />
                            <span className="font-mono text-sm font-medium">
                              {event.title}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 mt-2 text-xs text-zinc-500 font-mono">
                            <span className="flex items-center gap-1">
                              <Clock size={12} />
                              {format(new Date(event.date), "MMM d")} at {event.time}
                            </span>
                            {event.patient_name && (
                              <span className="flex items-center gap-1">
                                <User size={12} />
                                {event.patient_name}
                              </span>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="rounded-sm text-zinc-400 hover:text-rose-500 h-6 w-6"
                          onClick={() => handleDeleteEvent(event.id)}
                          data-testid={`delete-event-${event.id}`}
                        >
                          <X size={14} />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              {events.filter((e) => new Date(e.date) >= new Date()).length === 0 && (
                <p className="text-sm text-zinc-500 font-mono text-center py-8">
                  No upcoming events
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Event Type Legend */}
      <Card className="rounded-sm border-zinc-200 shadow-none">
        <CardContent className="p-4">
          <div className="flex items-center gap-6">
            <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-bold">
              Event Types:
            </span>
            {eventTypes.map((type) => (
              <div key={type.value} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-sm ${type.color}`} />
                <span className="text-sm font-mono text-zinc-600">{type.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
