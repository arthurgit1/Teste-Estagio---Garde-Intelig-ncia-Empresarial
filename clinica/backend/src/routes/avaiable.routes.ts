import { Router } from 'express';
import type { RowDataPacket } from 'mysql2';
import { pool } from '../config/database.js';
import { getHolidays } from '../services/holidays.service.js';

export const availableRouter = Router();

interface OccupiedSlot extends RowDataPacket {
  time: string;
}

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

availableRouter.get('/available', async (req, res) => {
  const dateValue = req.query.date;

  if (typeof dateValue !== 'string') {
    res.status(400).json({
      message: 'Informe uma data no formato YYYY-MM-DD.',
    });
    return;
  }

  const date = parseDate(dateValue);

  if (!date) {
    res.status(400).json({
      message: 'Data inválida. Use o formato YYYY-MM-DD.',
    });
    return;
  }

  const baseResponse = {
    date: dateValue,
    timezone: 'America/Sao_Paulo',
    durationMinutes: 60,
  };

  const dayOfWeek = date.getUTCDay();

  if (dayOfWeek === 0 || dayOfWeek === 6) {
    res.json({
      ...baseResponse,
      available: [],
      reason: 'A clínica não atende aos finais de semana.',
    });
    return;
  }

  let holidays;

  try {
    holidays = await getHolidays(date.getUTCFullYear());
  } catch (error) {
    console.error('Falha ao consultar feriados:', error);

    res.status(503).json({
      message:
        'Não foi possível verificar os feriados. Tente novamente mais tarde.',
    });
    return;
  }

  const holiday = holidays.find((item) => item.date === dateValue);

  if (holiday) {
    res.json({
      ...baseResponse,
      available: [],
      reason: `A clínica não atende neste feriado: ${holiday.localName}.`,
    });
    return;
  }

  try {
    const [occupiedSlots] = await pool.execute<OccupiedSlot[]>(
      `SELECT TIME_FORMAT(appointment_time, '%H:%i') AS time
       FROM appointments
       WHERE appointment_date = ?`,
      [dateValue],
    );

    const occupiedTimes = new Set(
      occupiedSlots.map((slot) => slot.time),
    );

    const workingHours = Array.from(
      { length: 10 },
      (_, index) => `${String(index + 8).padStart(2, '0')}:00`,
    );

    const available = workingHours.filter(
      (time) => !occupiedTimes.has(time),
    );

    res.json({
      ...baseResponse,
      available,
      reason:
        available.length === 0
          ? 'Não há horários disponíveis nesta data.'
          : null,
    });
  } catch (error) {
    console.error('Falha ao consultar agendamentos:', error);

    res.status(500).json({
      message: 'Não foi possível consultar os horários disponíveis.',
    });
  }
});