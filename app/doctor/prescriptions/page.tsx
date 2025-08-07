'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PrescriptionList from '@/components/PrescriptionList';
import { Appointment } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

export default function PrescriptionsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();

  // For demo purposes, we'll use doctor ID 1
  // In a real app, this would come from authentication context
  const doctorId = "1";

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      
      // Fetch appointments for this doctor from the JSON server
      const response = await fetch(`http://localhost:3001/appointments?doctorId=${doctorId}`);
      if (!response.ok) throw new Error('Failed to fetch appointments');
      
      const data = await response.json();
      setAppointments(data);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch appointments. Please make sure the JSON server is running.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <PrescriptionList 
        doctorId={doctorId} 
        appointments={appointments}
      />
    </div>
  );
}