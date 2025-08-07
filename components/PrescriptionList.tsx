'use client';

import React, { useState, useEffect } from 'react';
import { Search, Filter, Edit, Trash2, Plus, Eye, Calendar, User, Stethoscope } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Prescription, Appointment } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import PrescriptionForm from './PrescriptionForm';

interface PrescriptionListProps {
  doctorId: string;
  appointments: Appointment[];
}

interface GroupedPrescriptions {
  [patientId: string]: {
    patientName: string;
    prescriptions: Prescription[];
  };
}

export default function PrescriptionList({ doctorId, appointments }: PrescriptionListProps) {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [filteredPrescriptions, setFilteredPrescriptions] = useState<Prescription[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState<'all' | 'patient' | 'recent'>('all');
  const [loading, setLoading] = useState(true);
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewBy, setViewBy] = useState<'list' | 'patient'>('list');
  const { toast } = useToast();

  useEffect(() => {
    fetchPrescriptions();
  }, [doctorId]);

  useEffect(() => {
    filterPrescriptions();
  }, [prescriptions, searchTerm, filterBy]);

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/prescriptions?doctorId=${doctorId}`);
      if (!response.ok) throw new Error('Failed to fetch prescriptions');
      const data = await response.json();
      setPrescriptions(data);
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch prescriptions',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filterPrescriptions = () => {
    let filtered = prescriptions;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(prescription =>
        prescription.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prescription.medicines.some(med => 
          med.name.toLowerCase().includes(searchTerm.toLowerCase())
        ) ||
        prescription.notes.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter
    if (filterBy === 'recent') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      filtered = filtered.filter(prescription => 
        new Date(prescription.createdAt) >= oneWeekAgo
      );
    }

    // Sort by creation date (newest first)
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    setFilteredPrescriptions(filtered);
  };

  const groupPrescriptionsByPatient = (): GroupedPrescriptions => {
    return filteredPrescriptions.reduce((groups, prescription) => {
      const patientId = prescription.patientId;
      if (!groups[patientId]) {
        groups[patientId] = {
          patientName: prescription.patientName,
          prescriptions: [],
        };
      }
      groups[patientId].prescriptions.push(prescription);
      return groups;
    }, {} as GroupedPrescriptions);
  };

  const handleCreatePrescription = async (data: any) => {
    try {
      setIsSubmitting(true);
      const response = await fetch('/api/prescriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Failed to create prescription');

      await fetchPrescriptions();
      setShowForm(false);
      setSelectedAppointment(null);
    } catch (error) {
      console.error('Error creating prescription:', error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdatePrescription = async (data: any) => {
    if (!selectedPrescription) return;

    try {
      setIsSubmitting(true);
      const response = await fetch(`/api/prescriptions/${selectedPrescription.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Failed to update prescription');

      await fetchPrescriptions();
      setShowForm(false);
      setSelectedPrescription(null);
    } catch (error) {
      console.error('Error updating prescription:', error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePrescription = async (prescriptionId: string) => {
    try {
      const response = await fetch(`/api/prescriptions/${prescriptionId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete prescription');

      await fetchPrescriptions();
      toast({
        title: 'Success',
        description: 'Prescription deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting prescription:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete prescription',
        variant: 'destructive',
      });
    }
  };

  const openCreateForm = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setSelectedPrescription(null);
    setShowForm(true);
  };

  const openEditForm = (prescription: Prescription) => {
    const appointment = appointments.find(apt => apt.id === prescription.appointmentId);
    if (appointment) {
      setSelectedAppointment(appointment);
      setSelectedPrescription(prescription);
      setShowForm(true);
    }
  };

  const getAppointmentForPrescription = (prescriptionId: string) => {
    const prescription = prescriptions.find(p => p.id === prescriptionId);
    return prescription ? appointments.find(apt => apt.id === prescription.appointmentId) : null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const completedAppointments = appointments.filter(apt => apt.status === 'completed');
  const groupedPrescriptions = groupPrescriptionsByPatient();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Prescriptions</h2>
          <p className="text-muted-foreground">
            Manage prescriptions for your patients
          </p>
        </div>
        
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                if (completedAppointments.length === 0) {
                  toast({
                    title: 'No completed appointments',
                    description: 'You need completed appointments to create prescriptions.',
                    variant: 'destructive',
                  });
                  return;
                }
                // For demo, use the first completed appointment
                openCreateForm(completedAppointments[0]);
              }}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              New Prescription
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            {showForm && selectedAppointment && (
              <PrescriptionForm
                appointment={selectedAppointment}
                existingPrescription={selectedPrescription || undefined}
                onSubmit={selectedPrescription ? handleUpdatePrescription : handleCreatePrescription}
                onCancel={() => setShowForm(false)}
                isSubmitting={isSubmitting}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search prescriptions, patients, or medicines..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={filterBy} onValueChange={(value: any) => setFilterBy(value)}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Prescriptions</SelectItem>
            <SelectItem value="recent">Recent (7 days)</SelectItem>
          </SelectContent>
        </Select>

        <Tabs value={viewBy} onValueChange={(value: any) => setViewBy(value)}>
          <TabsList>
            <TabsTrigger value="list">List View</TabsTrigger>
            <TabsTrigger value="patient">By Patient</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Content */}
      <Tabs value={viewBy} className="space-y-4">
        <TabsContent value="list" className="space-y-4">
          {filteredPrescriptions.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Stethoscope className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No prescriptions found</h3>
                <p className="text-muted-foreground text-center">
                  {searchTerm || filterBy !== 'all'
                    ? 'Try adjusting your search or filters'
                    : 'Create your first prescription for a completed appointment'
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredPrescriptions.map((prescription) => (
              <Card key={prescription.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{prescription.patientName}</CardTitle>
                      <div className="flex items-center text-sm text-muted-foreground space-x-4">
                        <span className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {format(new Date(prescription.createdAt), 'MMM dd, yyyy')}
                        </span>
                        <span className="flex items-center">
                          <User className="h-4 w-4 mr-1" />
                          Dr. {prescription.doctorName}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary">
                        {prescription.medicines.length} medicine{prescription.medicines.length !== 1 ? 's' : ''}
                      </Badge>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditForm(prescription)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Prescription</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this prescription? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeletePrescription(prescription.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium mb-2">Medicines:</h4>
                      <div className="grid gap-2">
                        {prescription.medicines.map((medicine) => (
                          <div key={medicine.id} className="bg-muted/50 p-3 rounded-lg">
                            <div className="flex justify-between items-start mb-1">
                              <span className="font-medium">{medicine.name}</span>
                              <Badge variant="outline" className="text-xs">
                                {medicine.dosage}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-1">
                              Duration: {medicine.duration}
                            </p>
                            <p className="text-sm">{medicine.instructions}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {prescription.notes && (
                      <div>
                        <h4 className="font-medium mb-1">Notes:</h4>
                        <p className="text-sm text-muted-foreground">{prescription.notes}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="patient" className="space-y-4">
          {Object.keys(groupedPrescriptions).length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <User className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No prescriptions found</h3>
                <p className="text-muted-foreground text-center">
                  No prescriptions match your current filters.
                </p>
              </CardContent>
            </Card>
          ) : (
            Object.entries(groupedPrescriptions).map(([patientId, data]) => (
              <Card key={patientId}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{data.patientName}</span>
                    <Badge variant="secondary">
                      {data.prescriptions.length} prescription{data.prescriptions.length !== 1 ? 's' : ''}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {data.prescriptions.map((prescription) => (
                      <div key={prescription.id} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(prescription.createdAt), 'MMM dd, yyyy')}
                          </span>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditForm(prescription)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Prescription</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete this prescription? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeletePrescription(prescription.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                        
                        <div className="grid gap-2">
                          {prescription.medicines.map((medicine) => (
                            <div key={medicine.id} className="text-sm">
                              <span className="font-medium">{medicine.name}</span> -{' '}
                              <span>{medicine.dosage}</span> for {medicine.duration}
                            </div>
                          ))}
                        </div>
                        
                        {prescription.notes && (
                          <p className="text-sm text-muted-foreground mt-2">
                            Note: {prescription.notes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}