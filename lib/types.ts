export interface Medicine {
  id: string;
  name: string;
  dosage: string;
  duration: string;
  instructions: string;
}

export interface Prescription {
  id: string;
  appointmentId: string;
  doctorId: string;
  patientId: string;
  doctorName: string;
  patientName: string;
  medicines: Medicine[];
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePrescriptionRequest {
  appointmentId: string;
  doctorId: string;
  patientId: string;
  doctorName: string;
  patientName: string;
  medicines: Omit<Medicine, 'id'>[];
  notes: string;
}

export interface UpdatePrescriptionRequest extends Partial<CreatePrescriptionRequest> {
  id: string;
}

export interface Doctor {
  id: string;
  name: string;
  email: string;
  specialty: string;
  qualifications: string;
  experience: string;
  clinicAddress: string;
  rating: number;
  reviewCount: number;
  consultationFee: number;
  videoConsultationFee: number;
  availability: {
    clinic: string[];
    online: string[];
  };
  timeSlots: string[];
  image: string;
  about: string;
  consultationType: string[];
}

export interface Patient {
  id: string;
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
}

export interface Appointment {
  id: string;
  doctorId: string;
  patientId: string;
  doctorName: string;
  patientName: string;
  specialty: string;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  consultationType: 'clinic' | 'video' | 'call';
  symptoms?: string;
  fee: number;
}