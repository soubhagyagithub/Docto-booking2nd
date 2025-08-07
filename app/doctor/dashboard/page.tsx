"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { Navbar } from "@/components/Navbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { appointmentsAPI, type Appointment } from "@/lib/api"
import { Calendar, Users, Clock, TrendingUp, CheckCircle, XCircle, ChevronDown, FileText } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ModernFooter } from "@/components/ModernFooter"

export default function DoctorDashboard() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    confirmed: 0,
    completed: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    if (user) {
      loadAppointments()
    }

    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)

    return () => clearInterval(timer)
  }, [user])

  const loadAppointments = async () => {
    if (!user) return

    try {
      const appointmentsData = await appointmentsAPI.getByDoctorId(user.id)
      setAppointments(appointmentsData)
      const stats = {
        total: appointmentsData.length,
        pending: appointmentsData.filter((a) => a.status === "pending").length,
        confirmed: appointmentsData.filter((a) => a.status === "confirmed").length,
        completed: appointmentsData.filter((a) => a.status === "completed").length,
      }
      setStats(stats)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load appointments",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const todayAppointments = appointments.filter(
    (appointment) => appointment.date === new Date().toISOString().split("T")[0],
  )

  const getGreeting = () => {
    const hour = currentTime.getHours()
    if (hour < 12) return "Good morning"
    if (hour < 17) return "Good afternoon"
    return "Good evening"
  }

  const getTodayDate = () => {
    return currentTime.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getStatusIcon = (status: Appointment["status"]) => {
    switch (status) {
      case "confirmed":
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case "cancelled":
        return <XCircle className="w-4 h-4 text-red-500" />
      default:
        return <Clock className="w-4 h-4 text-yellow-500" />
    }
  }

  const getAppointmentType = (appointment: Appointment) => {
    const types = ["CONSULTATION", "FIRST VISIT", "EMERGENCY", "FOLLOW-UP"]
    return types[Math.floor(Math.random() * types.length)]
  }

  const getPatientAvatar = (patientName: string) => {
    const colors = [
      "bg-blue-100 text-blue-700",
      "bg-green-100 text-green-700", 
      "bg-purple-100 text-purple-700",
      "bg-pink-100 text-pink-700",
      "bg-indigo-100 text-indigo-700",
      "bg-yellow-100 text-yellow-700",
      "bg-red-100 text-red-700"
    ]
    const colorIndex = patientName.length % colors.length
    return colors[colorIndex]
  }

  return (
    <ProtectedRoute allowedRoles={["doctor"]}>
      <div className="min-h-screen bg-gradient-to-tr from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
        <Navbar />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="mb-10 flex flex-col md:flex-row justify-between items-start gap-4">
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight text-blue-700 dark:text-blue-400 mb-2">
                {getGreeting()} {user?.name || "Doctor"}!
              </h1>
              <p className="text-lg text-gray-700 dark:text-gray-300 font-medium">
                <span className="font-semibold">{todayAppointments.length}</span> patients today.
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                Don’t forget to review their history.
              </p>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 text-right self-end">
              <p className="uppercase tracking-wide">{getTodayDate()}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {[
              { label: "Total Appointments", value: stats.total, icon: <Calendar className="h-4 w-4 text-blue-500" />, desc: "All time" },
              { label: "Pending", value: stats.pending, icon: <Clock className="h-4 w-4 text-yellow-500" />, desc: "Awaiting confirmation" },
              { label: "Confirmed", value: stats.confirmed, icon: <Users className="h-4 w-4 text-green-500" />, desc: "Ready to see" },
              { label: "Completed", value: stats.completed, icon: <TrendingUp className="h-4 w-4 text-purple-500" />, desc: "This month" },
            ].map((stat, idx) => (
              <Card key={idx} className="rounded-xl shadow-md hover:shadow-xl transition-shadow bg-white/90 dark:bg-gray-900/70 backdrop-blur-md border border-gray-200 dark:border-gray-700">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-semibold text-gray-700 dark:text-gray-300">{stat.label}</CardTitle>
                  {stat.icon}
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">{stat.value}</div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{stat.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
            <Card 
              className="rounded-xl shadow-md hover:shadow-xl transition-all cursor-pointer bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border border-green-200 dark:border-green-700 group hover:scale-105"
              onClick={() => window.location.href = '/doctor/prescriptions'}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-semibold text-green-700 dark:text-green-300">Prescription Management</CardTitle>
                <FileText className="h-5 w-5 text-green-600 dark:text-green-400 group-hover:scale-110 transition-transform" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-800 dark:text-green-200 mb-1">
                  {stats.completed}
                </div>
                <p className="text-xs text-green-600 dark:text-green-400">Manage prescriptions for completed appointments</p>
                <div className="mt-3 text-xs font-medium text-green-700 dark:text-green-300 group-hover:text-green-800 dark:group-hover:text-green-200">
                  Click to manage →
                </div>
              </CardContent>
            </Card>
            
            <Card className="rounded-xl shadow-md hover:shadow-xl transition-shadow bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-200 dark:border-blue-700">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-semibold text-blue-700 dark:text-blue-300">Upcoming Consultations</CardTitle>
                <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-800 dark:text-blue-200 mb-1">
                  {appointments.filter(a => a.status === 'confirmed').length}
                </div>
                <p className="text-xs text-blue-600 dark:text-blue-400">Confirmed appointments this week</p>
              </CardContent>
            </Card>
            
            <Card className="rounded-xl shadow-md hover:shadow-xl transition-shadow bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border border-purple-200 dark:border-purple-700">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-semibold text-purple-700 dark:text-purple-300">Patient Records</CardTitle>
                <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-800 dark:text-purple-200 mb-1">
                  {new Set(appointments.map(a => a.patientId)).size}
                </div>
                <p className="text-xs text-purple-600 dark:text-purple-400">Unique patients treated</p>
              </CardContent>
            </Card>
          </div>

          <Card className="rounded-xl border border-gray-200 dark:border-gray-700 shadow-md bg-white/90 dark:bg-gray-900/70 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                Today's Appointments
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">Loading appointments...</div>
              ) : todayAppointments.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">No appointments scheduled for today</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {todayAppointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-md transition-all duration-200"
                    >
                      <div className="flex items-center space-x-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold shadow-md ${getPatientAvatar(appointment.patientName)}`}>
                          <span className="text-sm font-bold">
                            {appointment.patientName.split(" ").map((n) => n[0]).join("")}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{appointment.patientName}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{getAppointmentType(appointment)}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(appointment.status)}
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{appointment.time}</p>
                        </div>
                        <ChevronDown className="w-4 h-4 text-gray-400 cursor-pointer hover:text-gray-600 transition-colors" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <ModernFooter />
      </div>
    </ProtectedRoute>
  )
}
