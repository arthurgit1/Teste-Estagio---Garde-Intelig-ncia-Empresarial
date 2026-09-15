# Clínica — Sistema de Agendamento

Projeto desenvolvido para um teste técnico de estágio Full Stack.

A aplicação permite consultar horários disponíveis, criar agendamentos
e visualizar as reservas cadastradas. O backend consulta a API pública
Nager.Date para bloquear agendamentos em feriados.

## Tecnologias

- Angular e Angular CLI
- TypeScript
- Node.js e Express
- MySQL
- Nager.Date

## Funcionalidades

- Consulta de disponibilidade por data.
- Cadastro de agendamento com nome do paciente, data e horário.
- Listagem dos agendamentos.
- Bloqueio de finais de semana e feriados.
- Bloqueio de horários ocupados.
- Confirmação com número de protocolo.
- Mensagens de carregamento, validação e falha de comunicação.

## Regras de negócio

- Atendimento de segunda a sexta-feira, das 08h às 18h.
- Consultas com duração de uma hora.
- Horários de início entre 08h e 17h, em horas inteiras.
- Não são permitidas reservas em finais de semana ou feriados
  retornados pela API.
- Não são permitidas duas reservas na mesma data e horário.
- As datas e os horários das consultas representam o horário
  local da clínica, no fuso America/Sao_Paulo.
- Datas passadas não são bloqueadas nesta implementação, permitindo
  reproduzir a data de exemplo fornecida no teste.

## Arquitetura

Angular → API REST em Node.js → MySQL

A API REST também consulta a Nager.Date para verificar feriados.

O frontend não acessa diretamente o banco de dados nem a API de feriados.

## Estrutura do projeto

```text
clinica/
├── backend/
│   ├── sql/
│   │   └── schema.sql
│   ├── src/
│   │   ├── config/
│   │   ├── routes/
│   │   ├── services/
│   │   └── server.ts
│   ├── .env.example
│   └── package.json
└── frontend/
    ├── src/
    │   └── app/
    └── package.json
```

## Pré-requisitos

- Node.js 24 LTS e npm.
- MySQL Server 8.4.
- Acesso à internet para consultar os feriados.
- MySQL Workbench ou outro cliente SQL.

Os comandos abaixo devem ser executados a partir da raiz do
repositório, que contém a pasta `clinica`.

No Windows PowerShell, se houver bloqueio de scripts do npm,
use `npm.cmd` no lugar de `npm`.

## 1. Configurar o banco

Abra `clinica/backend/sql/schema.sql` no MySQL Workbench e execute
o arquivo usando uma conta com permissão para criar banco e tabela.

Depois, crie um usuário local para a aplicação. Substitua a senha
de exemplo antes de executar:

```sql
CREATE USER 'clinica_app'@'localhost'
IDENTIFIED BY 'SUBSTITUA_POR_UMA_SENHA_FORTE';

GRANT SELECT, INSERT
ON clinica.*
TO 'clinica_app'@'localhost';
```

Esse comando de criação do usuário deve ser executado apenas
se o usuário ainda não existir.

## 2. Configurar e executar o backend

```bash
cd clinica/backend
npm ci
```

Copie `.env.example` para `.env`. No PowerShell:

```powershell
Copy-Item .env.example .env
```

Se já existir um `.env` configurado, preserve-o.

Preencha o arquivo com as configurações locais:

```dotenv
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=clinica_app
DB_PASSWORD="SENHA_DEFINIDA_NO_MYSQL"
DB_NAME=clinica
```

Verifique os tipos e inicie o servidor:

```bash
npm run typecheck
npm run dev
```

Endereço da API: http://localhost:3000

Rota de verificação: http://localhost:3000/health

O servidor verifica a conexão com o MySQL antes de iniciar.
A rota `/health` confirma que a API responde, mas não executa
uma nova consulta ao banco a cada acesso.

## 3. Executar o frontend

Abra outro terminal na raiz do repositório:

```bash
cd clinica/frontend
npm ci
npm start
```

Acesse http://localhost:4200.

Mantenha os terminais do frontend e do backend abertos.

Nesta configuração local:

- O frontend chama a API em `http://localhost:3000`.
- O backend permite chamadas da origem `http://localhost:4200`.

Se alterar essas portas, ajuste também a URL no serviço Angular
e a configuração de CORS no backend.

## Endpoints

### GET /health

Verifica se a API está respondendo.

### GET /available?date=2026-02-10

Retorna os horários disponíveis para a data informada.

Exemplo de resposta para um dia sem reservas ou bloqueios:

```json
{
  "date": "2026-02-10",
  "timezone": "America/Sao_Paulo",
  "durationMinutes": 60,
  "available": [
    "08:00",
    "09:00",
    "10:00",
    "11:00",
    "12:00",
    "13:00",
    "14:00",
    "15:00",
    "16:00",
    "17:00"
  ],
  "reason": null
}
```

Em finais de semana e feriados, retorna uma lista vazia e o motivo.

### POST /appointments

Cria um agendamento.

Corpo JSON:

```json
{
  "patientName": "Paciente Teste",
  "date": "2026-02-10",
  "time": "09:00"
}
```

Quando a criação é bem-sucedida, retorna HTTP 201 e os dados
da reserva, incluindo o protocolo.

### GET /appointments

Retorna os agendamentos ordenados por data e horário.

Exemplo:

```json
{
  "timezone": "America/Sao_Paulo",
  "appointments": [
    {
      "id": 1,
      "patientName": "Paciente Teste",
      "date": "2026-02-10",
      "time": "09:00"
    }
  ]
}
```

## Códigos HTTP

| Código | Significado |
|---|---|
| 200 | Consulta realizada |
| 201 | Agendamento criado |
| 400 | Dados inválidos ou data/horário não permitido |
| 409 | Horário já ocupado |
| 500 | Falha interna ao consultar ou salvar dados |
| 503 | Não foi possível verificar os feriados |

## API de feriados

Para datas de 2026, o backend utiliza:

https://date.nager.at/api/v3/PublicHolidays/2026/BR

O ano da consulta acompanha o ano da data escolhida.

Se a consulta falhar, o sistema não libera a operação dependente
dessa verificação e retorna HTTP 503.

## Proteção contra reservas duplicadas

A tabela possui uma restrição UNIQUE sobre:

```sql
(appointment_date, appointment_time)
```

Isso impede que duas requisições simultâneas reservem o mesmo
horário. O backend trata o conflito e retorna HTTP 409.

## Verificações manuais

Use dados fictícios. Os testes de criação salvam registros no banco.

| Cenário | Resultado esperado |
|---|---|
| Consultar dia útil | Horários livres |
| Consultar sábado ou domingo | Lista vazia com motivo |
| Consultar feriado | Lista vazia com motivo, após consulta à API |
| Informar data inexistente | HTTP 400 |
| Criar reserva às 18h | HTTP 400 |
| Criar reserva em horário livre | HTTP 201 |
| Repetir a mesma reserva | HTTP 409 |
| Consultar disponibilidade após reservar | Horário ocupado ausente |
| Recarregar a página | Reserva permanece salva |
| Criar reserva pela interface | Lista atualizada automaticamente |

## Verificação de compilação

No backend:

```bash
npm run typecheck
npm run build
```

No frontend:

```bash
npm run build
```

Esses comandos verificam tipos e compilação; não substituem
os testes funcionais.

## Escopo

Esta versão atende a uma única agenda, com uma consulta por horário.

Não inclui autenticação, cancelamento ou reagendamento.
A listagem de reservas está disponível sem autenticação nesta
versão de demonstração.