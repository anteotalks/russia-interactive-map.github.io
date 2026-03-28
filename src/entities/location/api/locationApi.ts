import papa from 'papaparse';
import { Location } from '../lib/types';

const parseEuropeanNumber = (str: string): number => {
  if (!str || str.trim() === '') return 0;
  return parseFloat(str.replace(',', '.')) || 0;
};

export const fetchLocationsFromCSV = async (
  csvPath: string,
  signal?: AbortSignal,
  timeout: number = 30000
): Promise<Location[]> => {
  // Создаём контроллер для таймаута
  const controller = new AbortController();
  const actualSignal = signal || controller.signal;

  // Таймаут, который прервёт запрос, если он太长
  const timeoutId = setTimeout(() => {
    controller.abort(new Error('Превышен таймаут загрузки CSV (30с)'));
  }, timeout);

  try {
    const response = await fetch(csvPath, { signal: actualSignal });
    if (!response.ok) {
      throw new Error(`HTTP ошибка ${response.status}: ${response.statusText}`);
    }
    const csvText = await response.text();

    return new Promise((resolve, reject) => {
      papa.parse<Location>(csvText, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: false,
        complete: (results) => {
          clearTimeout(timeoutId);
          const locations = results.data
            .filter((row: any) => row['ID'] && row['ID'].trim() !== '')
            .map((row: any, index: number) => ({
              id: index,
              code_2021: row['Код 2021']?.trim() || '',
              population_2002: parseEuropeanNumber(row['ВПН-2002']),
              population_2010: parseEuropeanNumber(row['ВПН-2010']),
              population_2021: parseEuropeanNumber(row['ВПН-2021']),
              region: row['Регион']?.trim() || '',
              municipal_formation: row['Муниципальное образование']?.trim() || '',
              settlement: row['Поселение']?.trim() || '',
              populated_place: row['Населенный пункт']?.trim() || '',
              latitude: parseEuropeanNumber(row['Широта']),
              longitude: parseEuropeanNumber(row['Долгота']),
            }));
          resolve(locations);
        },
        error: (error: any) => {
          clearTimeout(timeoutId);
          reject(error);
        },
      });
    });
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};
