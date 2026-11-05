import { ServiceUnavailableException } from '@nestjs/common';
import { managementFetch } from './management-fetch';

export async function keycloakKeys(uri: string): Promise<{keys: any[]}> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      // The overall deadline covers DNS, connection, TLS and response reading.
      const response = await managementFetch(uri, {signal: AbortSignal.timeout(15000), ...(attempt === 0 ? {headers:{Connection:'close'}} : {})});
      if (!response.ok) throw new Error('Signing key endpoint unavailable');
      const data = await response.json();
      if (!Array.isArray(data?.keys) || !data.keys.length) throw new Error('Signing keys unavailable');
      return data;
    } catch {
      if (attempt === 1) throw new ServiceUnavailableException('CCTBM cannot reach Chiro Auth signing keys. Please retry sign-in.');
    }
  }
  throw new ServiceUnavailableException('Chiro Auth signing keys are unavailable.');
}
