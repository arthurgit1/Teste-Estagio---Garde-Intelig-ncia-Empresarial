type Holiday = {
  date: string;
  localName: string;
};

export async function getHolidays(year: number): Promise<Holiday[]> {
  const response = await fetch(
    `https://date.nager.at/api/v3/PublicHolidays/${year}/BR`,
    {
      signal: AbortSignal.timeout(8000),
    },
  );

  if (!response.ok) {
    throw new Error(`API de feriados retornou HTTP ${response.status}`);
  }

  const data: unknown = await response.json();

  if (!Array.isArray(data)) {
    throw new Error('Resposta inválida da API de feriados');
  }

  return data.map((item: unknown) => {
    if (
      typeof item !== 'object' ||
      item === null ||
      !('date' in item) ||
      typeof item.date !== 'string' ||
      !('localName' in item) ||
      typeof item.localName !== 'string'
    ) {
      throw new Error('Feriado inválido na resposta da API');
    }

    return {
      date: item.date,
      localName: item.localName,
    };
  });
}