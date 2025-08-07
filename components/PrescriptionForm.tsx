'use client';

import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Plus, Trash2, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { CreatePrescriptionRequest, Medicine, Prescription, Appointment } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

const medicineSchema = z.object({
  name: z.string().min(1, 'Medicine name is required'),
  dosage: z.string().min(1, 'Dosage is required'),
  duration: z.string().min(1, 'Duration is required'),
  instructions: z.string().min(1, 'Instructions are required'),
});

const prescriptionSchema = z.object({
  medicines: z.array(medicineSchema).min(1, 'At least one medicine is required'),
  notes: z.string().optional(),
});

type PrescriptionFormData = z.infer<typeof prescriptionSchema>;

interface PrescriptionFormProps {
  appointment: Appointment;
  existingPrescription?: Prescription;
  onSubmit: (data: CreatePrescriptionRequest) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export default function PrescriptionForm({
  appointment,
  existingPrescription,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: PrescriptionFormProps) {
  const { toast } = useToast();
  
  const form = useForm<PrescriptionFormData>({
    resolver: zodResolver(prescriptionSchema),
    defaultValues: {
      medicines: existingPrescription?.medicines?.map(med => ({
        name: med.name,
        dosage: med.dosage,
        duration: med.duration,
        instructions: med.instructions,
      })) || [{ name: '', dosage: '', duration: '', instructions: '' }],
      notes: existingPrescription?.notes || '',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'medicines',
  });

  const handleSubmit = async (data: PrescriptionFormData) => {
    try {
      const prescriptionData: CreatePrescriptionRequest = {
        appointmentId: appointment.id,
        doctorId: appointment.doctorId,
        patientId: appointment.patientId,
        doctorName: appointment.doctorName,
        patientName: appointment.patientName,
        medicines: data.medicines,
        notes: data.notes || '',
      };

      await onSubmit(prescriptionData);
      
      toast({
        title: existingPrescription ? 'Prescription updated' : 'Prescription created',
        description: existingPrescription 
          ? 'Prescription has been updated successfully.'
          : 'New prescription has been created successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save prescription. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const addMedicine = () => {
    append({ name: '', dosage: '', duration: '', instructions: '' });
  };

  const removeMedicine = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>
            {existingPrescription ? 'Edit Prescription' : 'Create Prescription'}
          </span>
          <Button variant="outline" size="sm" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </CardTitle>
        <div className="text-sm text-muted-foreground">
          <p><strong>Patient:</strong> {appointment.patientName}</p>
          <p><strong>Doctor:</strong> {appointment.doctorName}</p>
          <p><strong>Appointment:</strong> {appointment.date} at {appointment.time}</p>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Medicines Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-lg font-semibold">Medicines</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addMedicine}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Medicine
                </Button>
              </div>

              {fields.map((field, index) => (
                <Card key={field.id} className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium">Medicine {index + 1}</h4>
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => removeMedicine(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name={`medicines.${index}.name`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Medicine Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., Lisinopril"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`medicines.${index}.dosage`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Dosage</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., 10mg"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`medicines.${index}.duration`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Duration</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., 30 days"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`medicines.${index}.instructions`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Instructions</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., Take once daily with food"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </Card>
              ))}
            </div>

            {/* Notes Section */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Additional instructions, follow-up recommendations, or notes..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Action Buttons */}
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {isSubmitting
                  ? 'Saving...'
                  : existingPrescription
                  ? 'Update Prescription'
                  : 'Create Prescription'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}