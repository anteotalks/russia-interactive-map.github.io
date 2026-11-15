/**
 * API для загрузки GeoJSON с поддержкой отмены запроса (AbortController)
 */

import { load } from '@loaders.gl/core';
import { JSONLoader } from '@loaders.gl/json';
import { FeatureCollection } from 'geojson';

export async function fetchRegionsFromGeoJSON(
  filePath: string,
  signal?: AbortSignal
): Promise<FeatureCollection> {
  try {
    const data = await load(filePath, JSONLoader, {
      fetch: {
        signal // передаём сигнал отмены
      }
    }) as FeatureCollection;

    if (!data || data.type !== 'FeatureCollection' || !Array.isArray(data.features)) {
      throw new Error('Некорректная структура GeoJSON');
    }

    console.log(`✅ Загружено ${data.features.length} регионов`);
    return data;
  } catch (error) {
    // Если запрос отменён – не логируем ошибку
    if (error instanceof DOMException && error.name === 'AbortError') {
      console.log('🛑 Загрузка регионов отменена');
      throw error;
    }
    console.error('❌ Ошибка загрузки GeoJSON:', error);
    throw error;
  }
}
