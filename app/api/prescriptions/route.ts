import { NextRequest, NextResponse } from 'next/server';
import { Prescription, CreatePrescriptionRequest } from '@/lib/types';

const API_BASE_URL = 'http://localhost:3001';

// GET /api/prescriptions - Get all prescriptions or filter by doctorId/patientId
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const doctorId = searchParams.get('doctorId');
    const patientId = searchParams.get('patientId');
    const appointmentId = searchParams.get('appointmentId');

    let url = `${API_BASE_URL}/prescriptions`;
    const params = new URLSearchParams();
    
    if (doctorId) params.append('doctorId', doctorId);
    if (patientId) params.append('patientId', patientId);
    if (appointmentId) params.append('appointmentId', appointmentId);
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error('Failed to fetch prescriptions');
    }

    const prescriptions: Prescription[] = await response.json();
    
    return NextResponse.json(prescriptions);
  } catch (error) {
    console.error('Error fetching prescriptions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch prescriptions' },
      { status: 500 }
    );
  }
}

// POST /api/prescriptions - Create a new prescription
export async function POST(request: NextRequest) {
  try {
    const body: CreatePrescriptionRequest = await request.json();
    
    // Generate medicines with IDs
    const medicinesWithIds = body.medicines.map((medicine, index) => ({
      ...medicine,
      id: `${Date.now()}_${index}`
    }));

    const prescriptionData: Omit<Prescription, 'id'> = {
      ...body,
      medicines: medicinesWithIds,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const response = await fetch(`${API_BASE_URL}/prescriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(prescriptionData),
    });

    if (!response.ok) {
      throw new Error('Failed to create prescription');
    }

    const newPrescription: Prescription = await response.json();
    
    return NextResponse.json(newPrescription, { status: 201 });
  } catch (error) {
    console.error('Error creating prescription:', error);
    return NextResponse.json(
      { error: 'Failed to create prescription' },
      { status: 500 }
    );
  }
}