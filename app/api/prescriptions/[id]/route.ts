import { NextRequest, NextResponse } from 'next/server';
import { Prescription, UpdatePrescriptionRequest } from '@/lib/types';

const API_BASE_URL = 'http://localhost:3001';

// GET /api/prescriptions/[id] - Get a specific prescription
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const response = await fetch(`${API_BASE_URL}/prescriptions/${params.id}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { error: 'Prescription not found' },
          { status: 404 }
        );
      }
      throw new Error('Failed to fetch prescription');
    }

    const prescription: Prescription = await response.json();
    
    return NextResponse.json(prescription);
  } catch (error) {
    console.error('Error fetching prescription:', error);
    return NextResponse.json(
      { error: 'Failed to fetch prescription' },
      { status: 500 }
    );
  }
}

// PUT /api/prescriptions/[id] - Update a specific prescription
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body: UpdatePrescriptionRequest = await request.json();
    
    // Get existing prescription first
    const existingResponse = await fetch(`${API_BASE_URL}/prescriptions/${params.id}`);
    
    if (!existingResponse.ok) {
      if (existingResponse.status === 404) {
        return NextResponse.json(
          { error: 'Prescription not found' },
          { status: 404 }
        );
      }
      throw new Error('Failed to fetch existing prescription');
    }

    const existingPrescription: Prescription = await existingResponse.json();
    
    // Update medicines with IDs if medicines are being updated
    let updatedMedicines = existingPrescription.medicines;
    if (body.medicines) {
      updatedMedicines = body.medicines.map((medicine, index) => ({
        ...medicine,
        id: `${Date.now()}_${index}`
      }));
    }

    const updatedData = {
      ...existingPrescription,
      ...body,
      medicines: updatedMedicines,
      updatedAt: new Date().toISOString(),
    };

    const response = await fetch(`${API_BASE_URL}/prescriptions/${params.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatedData),
    });

    if (!response.ok) {
      throw new Error('Failed to update prescription');
    }

    const updatedPrescription: Prescription = await response.json();
    
    return NextResponse.json(updatedPrescription);
  } catch (error) {
    console.error('Error updating prescription:', error);
    return NextResponse.json(
      { error: 'Failed to update prescription' },
      { status: 500 }
    );
  }
}

// DELETE /api/prescriptions/[id] - Delete a specific prescription
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const response = await fetch(`${API_BASE_URL}/prescriptions/${params.id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { error: 'Prescription not found' },
          { status: 404 }
        );
      }
      throw new Error('Failed to delete prescription');
    }

    return NextResponse.json(
      { message: 'Prescription deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting prescription:', error);
    return NextResponse.json(
      { error: 'Failed to delete prescription' },
      { status: 500 }
    );
  }
}