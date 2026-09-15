import express from 'express';
import cors from 'cors';
import 'dotenv/config';

const app = express();
const port = Number(process.env.PORT ?? 3000);

app.use(cors({
  origin: 'http://localhost:4200',
}));

app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    message: 'API da clínica funcionando!',
  });
});

app.listen(port, () => {
  console.log(`Servidor disponível em http://localhost:${port}`);
});