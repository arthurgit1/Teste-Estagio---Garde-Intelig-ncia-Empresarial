# Teste Estagio - Garde Inteligência Empresarial

Contexto (Problema real)
Uma clínica de saúde recebe dezenas de contatos por dia pelo WhatsApp perguntando:
• “Tem consulta para tal dia?”
• “Qual o horário disponível?”
• “Dá para marcar comigo?”
Hoje isso é feito manualmente.
A empresa quer um mini sistema de agendamento inteligente que:
• Mostre horários disponíveis
• Permita criar um agendamento
• Mostre dados reais de data, fuso horário e dias úteis
O desafio
Você deve criar um sistema web onde:
• O usuário escolhe uma data
• O sistema mostra horários disponíveis
• O usuário seleciona um horário e cria um agendamento
• O sistema salva e retorna a confirmação
Usando uma API pública real de datas e feriados.
API obrigatória
https://date.nager.at/api/v3/PublicHolidays/2026/BR
Você deve bloquear agendamentos em feriados e finais de semana.
Arquitetura
O projeto deve ser Full Stack. As tecnologias ficam a critério do candidato, desde que exista:
• Backend com rotas REST
• Persistência em banco de dados
• Consumo da API de feriados no backend
• Frontend web para interação do usuário
Fluxo obrigatório
Usuário escolhe data → Frontend chama backend → Backend consulta API de feriados →
Backend valida → Retorna horários → Usuário escolhe → Backend salva
Endpoints mínimos
GET /available?date=2026-02-10
POST /appointments
GET /appointments
Regras de negócio
• Horário de funcionamento: 08:00 às 18:00
• Consultas duram 1 hora
• Não pode marcar em feriados, finais de semana ou horários ocupado