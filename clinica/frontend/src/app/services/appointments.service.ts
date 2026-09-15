import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface Availability {
  date: string;
  timezone: string;
  durationMinutes: number;
  available: string[];
  reason: string | null;
}

export interface AppointmentInput {
  patientName: string;
  date: string;
  time: string;
}

export interface AppointmentConfirmation {
  message: string;
  appointment: AppointmentInput & {
    id: number;
    timezone: string;
    durationMinutes: number;
  };
}

export interface Appointment {
  id: number;
  patientName: string;
  date: string;
  time: string;
}

export interface AppointmentsResponse {
  timezone: string;
  appointments: Appointment[];
}
@Injectable({
  providedIn: 'root',
})
export class AppointmentsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000';

  getAvailable(date: string) {
    return this.http.get<Availability>(
      `${this.apiUrl}/available`,
      { params: { date } },
    );
  }

  createAppointment(data: AppointmentInput) {
    return this.http.post<AppointmentConfirmation>(
      `${this.apiUrl}/appointments`,
      data,
    );
  }

  getAppointments() {
  return this.http.get<AppointmentsResponse>(
    `${this.apiUrl}/appointments`,
  );
}
}

