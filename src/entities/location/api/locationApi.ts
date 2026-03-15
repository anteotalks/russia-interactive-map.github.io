import papa from 'papaparse';
import { Location } from '../lib/types';

const parseEuropeanNumber = (str: string): number => {
  if (!str || str.trim() === '') return 0;
  return parseFloat(str.replace(',', '.')) || 0;
};

export const fetchLocationsFromCSV = async (csvPath: string): Promise<Location[]> => {
  const response = await fetch(csvPath);
  const csvText = await response.text();

  return new Promise((resolve, reject) => {
    papa.parse<Location>(csvText, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
      complete: (results) => {
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
        reject(error);
      },
    });
  });
};
