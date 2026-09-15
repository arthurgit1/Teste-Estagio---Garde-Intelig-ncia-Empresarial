import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { pool } from './config/database.js';
import { availableRouter } from './routes/available.routes.js';


const app = express();
const port = Number(process.env.PORT ?? 3000);

app.use(cors({
  origin: 'http://localhost:4200',
}));

app.use(express.json());
app.use(availableRouter);


app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    message: 'API da clínica funcionando!',
  });
});

async function startServer(): Promise<void> {
  try {
    await pool.query('SELECT 1');

    console.log('Conexão com o MySQL estabelecida!');

    app.listen(port, () => {
      console.log(`Servidor disponível em http://localhost:${port}`);
    });
  } catch (error) {
    console.error('Não foi possível conectar ao MySQL:', error);
    await pool.end();
    process.exitCode = 1;
  }
}

void startServer();