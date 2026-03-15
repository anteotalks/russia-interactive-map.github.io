import { load } from '@loaders.gl/core';
import { JSONLoader } from '@loaders.gl/json';
import { FeatureCollection } from 'geojson';

export async function fetchRegionsFromGeoJSON(filePath: string): Promise<FeatureCollection> {
  try {
    const data = await load(filePath, JSONLoader) as FeatureCollection;
    if (!data || data.type !== 'FeatureCollection' || !Array.isArray(data.features)) {
      throw new Error('Некорректная структура GeoJSON');
    }
    console.log(`✅ Загружено ${data.features.length} регионов`);
    return data;
  } catch (error) {
    console.error('❌ Ошибка загрузки GeoJSON:', error);
    throw error;
  }
}
