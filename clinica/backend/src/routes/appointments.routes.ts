import { Router } from 'express';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import { pool } from '../config/database.js';
import { getHolidays } from '../services/holidays.service.js';

export const appointmentsRouter = Router();

function parseDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  if (
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== value
  ) {
    return null;
  }

  return date;
}

appointmentsRouter.post('/appointments', async (req, res) => {
  const { patientName, date, time } = req.body ?? {};

  // Valida os dados enviados pelo usuário.
  if (
    typeof patientName !== 'string' ||
    patientName.trim().length === 0 ||
    patientName.trim().length > 120
  ) {
    res.status(400).json({
      message: 'Informe um nome com 1 a 120 caracteres.',
    });
    return;
  }

  if (typeof date !== 'string') {
    res.status(400).json({
      message: 'Informe uma data no formato YYYY-MM-DD.',
    });
    return;
  }

  const parsedDate = parseDate(date);

  if (!parsedDate) {
    res.status(400).json({
      message: 'Data inválida. Use o formato YYYY-MM-DD.',
    });
    return;
  }

  // Aceita somente 08:00, 09:00, ..., 17:00.
  if (
    typeof time !== 'string' ||
    !/^(0[89]|1[0-7]):00$/.test(time)
  ) {
    res.status(400).json({
      message: 'Escolha um horário inteiro entre 08:00 e 17:00.',
    });
    return;
  }

  const dayOfWeek = parsedDate.getUTCDay();

  if (dayOfWeek === 0 || dayOfWeek === 6) {
    res.status(400).json({
      message: 'Não é possível agendar aos finais de semana.',
    });
    return;
  }

  // Verifica novamente os feriados antes de salvar.
  try {
    const holidays = await getHolidays(parsedDate.getUTCFullYear());
    const holiday = holidays.find((item) => item.date === date);

    if (holiday) {
      res.status(400).json({
        message: `Não é possível agendar neste feriado: ${holiday.localName}.`,
      });
      return;
    }
  } catch (error) {
    console.error('Falha ao consultar feriados:', error);

    res.status(503).json({
      message:
        'Não foi possível verificar os feriados. Tente novamente mais tarde.',
    });
    return;
  }

  try {
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO appointments (
        patient_name,
        appointment_date,
        appointment_time
      ) VALUES (?, ?, ?)`,
      [patientName.trim(), date, `${time}:00`],
    );

    res.status(201).json({
      message: 'Agendamento criado com sucesso!',
      appointment: {
        id: result.insertId,
        patientName: patientName.trim(),
        date,
        time,
        timezone: 'America/Sao_Paulo',
        durationMinutes: 60,
      },
    });
  } catch (error) {
    // A restrição UNIQUE do banco impede reservas duplicadas.
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'ER_DUP_ENTRY'
    ) {
      res.status(409).json({
        message: 'Este horário já está ocupado. Escolha outro.',
      });
      return;
    }

    console.error('Falha ao criar agendamento:', error);

    res.status(500).json({
      message: 'Não foi possível salvar o agendamento.',
    });
  }
});

interface AppointmentRow extends RowDataPacket {
  id: number;
  patientName: string;
  date: string;
  time: string;
}

appointmentsRouter.get('/appointments', async (_req, res) => {
  try {
    const [appointments] = await pool.execute<AppointmentRow[]>(
      `SELECT
         id,
         patient_name AS patientName,
         DATE_FORMAT(appointment_date, '%Y-%m-%d') AS date,
         TIME_FORMAT(appointment_time, '%H:%i') AS time
       FROM appointments
       ORDER BY appointment_date, appointment_time`,
    );

    res.json({
      timezone: 'America/Sao_Paulo',
      appointments,
    });
  } catch (error) {
    console.error('Falha ao listar agendamentos:', error);

    res.status(500).json({
      message: 'Não foi possível consultar os agendamentos.',
    });
  }
});