import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Component, inject, OnInit, signal } from '@angular/core';

import {
  Appointment,
  AppointmentsService,
  AppointmentConfirmation,
} from './services/appointments.service';
@Component({
  selector: 'app-root',
  imports: [FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  private readonly appointmentsService = inject(AppointmentsService);

  patientName = '';
  selectedDate = '';
  selectedTime = '';

  readonly availableTimes = signal<string[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly notice = signal('');
  readonly confirmation = signal<AppointmentConfirmation | null>(null);
  readonly appointments = signal<Appointment[]>([]);
  readonly loadingAppointments = signal(false);
  readonly appointmentsError = signal('');

  onDateChange(value: string): void {
    this.selectedDate = value;
    this.selectedTime = '';
    this.availableTimes.set([]);
    this.error.set('');
    this.notice.set('');
    this.confirmation.set(null);
  }

  async loadAvailable(): Promise<void> {
    if (!this.selectedDate || this.loading() || this.saving()) {
      return;
    }

    this.loading.set(true);
    this.error.set('');
    this.notice.set('');
    this.selectedTime = '';
    this.availableTimes.set([]);

    try {
      const result = await firstValueFrom(
        this.appointmentsService.getAvailable(this.selectedDate),
      );

      this.availableTimes.set(result.available);
      this.notice.set(result.reason ?? '');
    } catch (error) {
      this.error.set(this.getErrorMessage(error));
    } finally {
      this.loading.set(false);
    }
  }

  async bookAppointment(): Promise<void> {
    if (
      !this.patientName.trim() ||
      this.patientName.trim().length > 120 ||
      !this.selectedDate ||
      !this.availableTimes().includes(this.selectedTime) ||
      this.loading() ||
      this.saving()
    ) {
      return;
    }

    this.saving.set(true);
    this.error.set('');
    this.confirmation.set(null);

    try {
      const result = await firstValueFrom(
        this.appointmentsService.createAppointment({
          patientName: this.patientName.trim(),
          date: this.selectedDate,
          time: this.selectedTime,
        }),
      );

      this.confirmation.set(result);
      void this.loadAppointments();

      this.availableTimes.update((times) =>
        times.filter((time) => time !== result.appointment.time),
      );

      this.selectedTime = '';

      if (this.availableTimes().length === 0) {
        this.notice.set('Não há mais horários disponíveis nesta consulta.');
      }
    } catch (error) {
      this.error.set(this.getErrorMessage(error));

      if (error instanceof HttpErrorResponse && error.status === 409) {
        const occupiedTime = this.selectedTime;

        this.availableTimes.update((times) =>
          times.filter((time) => time !== occupiedTime),
        );

        this.selectedTime = '';
      }
    } finally {
      this.saving.set(false);
    }
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 0) {
        return 'Não foi possível acessar a API. Confira se o backend está rodando.';
      }

      if (typeof error.error?.message === 'string') {
        return error.error.message;
      }
    }

    return 'Não foi possível concluir a operação. Tente novamente.';
  }

  ngOnInit(): void {
  void this.loadAppointments();
}

async loadAppointments(): Promise<void> {
  if (this.loadingAppointments()) {
    return;
  }

  this.loadingAppointments.set(true);
  this.appointmentsError.set('');

  try {
    const result = await firstValueFrom(
      this.appointmentsService.getAppointments(),
    );

    this.appointments.set(result.appointments);
  } catch (error) {
    this.appointmentsError.set(this.getErrorMessage(error));
  } finally {
    this.loadingAppointments.set(false);
  }
}

formatDate(date: string): string {
  const [year, month, day] = date.split('-');
  return `${day}/${month}/${year}`;
}
}
