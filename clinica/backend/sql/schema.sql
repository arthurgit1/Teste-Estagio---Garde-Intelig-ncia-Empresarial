CREATE DATABASE IF NOT EXISTS clinica
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE clinica;

CREATE TABLE IF NOT EXISTS appointments (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  patient_name VARCHAR(120) NOT NULL,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT uq_appointment_slot
    UNIQUE (appointment_date, appointment_time)
);