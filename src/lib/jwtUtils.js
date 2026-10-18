/**
 * Pure JWT utility functions for DevLens JWT Inspector.
 * All operations execute locally in memory using native browser APIs (TextDecoder, atob, JSON.parse).
 * No external libraries or eval() are used.
 */

// Base64URL characters allowed by RFC 7515 / RFC 4648
const BASE64_URL_REGEX = /^[A-Za-z0-9_-]*$/;

/**
 * Decode a Base64URL string segment into a UTF-8 string and parse as JSON object.
 *
 * @param {string} segment - Base64URL-encoded segment
 * @param {string} segmentName - 'header' or 'payload' for clear error messages
 * @returns {{ data: Record<string, any>, rawJson: string }}
 */
export function decodeBase64UrlSegment(segment, segmentName = 'segment') {
  if (typeof segment !== 'string' || segment.length === 0) {
    throw new Error(`Invalid JWT: ${segmentName} segment is empty.`);
  }

  // Validate Base64URL character set (no spaces, no illegal characters, no unneeded padding in input)
  if (!BASE64_URL_REGEX.test(segment)) {
    throw new Error(
      `Invalid Base64URL encoding in ${segmentName}: contains illegal characters outside the Base64URL alphabet.`
    );
  }

  // Base64URL to standard Base64:
  // 1. '-' to '+'
  // 2. '_' to '/'
  // 3. Add required '=' padding
  let base64 = segment.replace(/-/g, '+').replace(/_/g, '/');
  const padLength = (4 - (base64.length % 4)) % 4;
  base64 += '='.repeat(padLength);

  let binaryString;
  try {
    binaryString = atob(base64);
  } catch (err) {
    throw new Error(
      `Failed to decode Base64 in ${segmentName}: ${err instanceof Error ? err.message : 'Invalid Base64 string'}.`
    );
  }

  // Convert binary string to byte array
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  // Decode UTF-8 safely using TextDecoder with fatal: true for strict validation
  let jsonString;
  try {
    const decoder = new TextDecoder('utf-8', { fatal: true });
    jsonString = decoder.decode(bytes);
  } catch (err) {
    throw new Error(
      `Malformed UTF-8 sequence in ${segmentName}: ${err instanceof Error ? err.message : 'Invalid UTF-8 bytes'}.`
    );
  }

  // Parse as JSON
  let parsed;
  try {
    parsed = JSON.parse(jsonString);
  } catch (err) {
    throw new Error(
      `Invalid JSON in ${segmentName}: ${err instanceof Error ? err.message : 'Syntax error while parsing JSON'}.`
    );
  }

  // RFC 7519 requirement: JWT Header and Payload must be JSON objects
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error(
      `Invalid JWT: ${segmentName} must decode to a JSON object (found ${parsed === null ? 'null' : Array.isArray(parsed) ? 'array' : typeof parsed}).`
    );
  }

  return {
    data: parsed,
    rawJson: JSON.stringify(parsed, null, 2),
  };
}

/**
 * Format a Unix timestamp (seconds) into a readable date string.
 *
 * @param {number} timestamp - Unix timestamp in seconds
 * @returns {{ dateString: string, isoString: string, timestamp: number } | null}
 */
export function formatTimestampClaim(timestamp) {
  if (typeof timestamp !== 'number' || isNaN(timestamp) || !isFinite(timestamp)) {
    return null;
  }

  try {
    const date = new Date(timestamp * 1000);
    if (isNaN(date.getTime())) return null;

    return {
      dateString: date.toLocaleString(),
      isoString: date.toISOString(),
      timestamp,
    };
  } catch {
    return null;
  }
}

/**
 * Parse and inspect a compact JWT token string.
 *
 * @param {string} token - Raw JWT string
 * @param {number} [now=Date.now()] - Current epoch ms (injectable for deterministic testing)
 * @returns {{
 *   valid: boolean,
 *   header: Record<string, any>,
 *   headerRaw: string,
 *   payload: Record<string, any>,
 *   payloadRaw: string,
 *   signature: string,
 *   claims: {
 *     iss?: string,
 *     sub?: string,
 *     aud?: string | string[],
 *     exp?: { timestamp: number, dateString: string, isoString: string, isExpired: boolean },
 *     iat?: { timestamp: number, dateString: string, isoString: string },
 *     nbf?: { timestamp: number, dateString: string, isoString: string, isNotYetValid: boolean },
 *     jti?: string,
 *   }
 * }}
 */
export function parseJwt(token, now = Date.now()) {
  if (typeof token !== 'string' || token.trim() === '') {
    throw new Error('Token input cannot be empty. Please provide a valid compact JWT.');
  }

  const trimmed = token.trim();
  const segments = trimmed.split('.');

  if (segments.length !== 3) {
    throw new Error(
      `Invalid JWT structure: Expected exactly 3 dot-separated segments (header.payload.signature), but found ${segments.length}.`
    );
  }

  const [headerSegment, payloadSegment, signatureSegment] = segments;

  if (!headerSegment || !payloadSegment) {
    throw new Error('Invalid JWT structure: Header and payload segments must not be empty.');
  }

  // Validate Base64URL characters in signature if present
  if (signatureSegment && !BASE64_URL_REGEX.test(signatureSegment)) {
    throw new Error(
      'Invalid Base64URL encoding in signature: contains illegal characters outside the Base64URL alphabet.'
    );
  }

  const decodedHeader = decodeBase64UrlSegment(headerSegment, 'header');
  const decodedPayload = decodeBase64UrlSegment(payloadSegment, 'payload');

  const payload = decodedPayload.data;
  const claims = {};

  if (payload.iss !== undefined) claims.iss = String(payload.iss);
  if (payload.sub !== undefined) claims.sub = String(payload.sub);
  if (payload.aud !== undefined) claims.aud = payload.aud;
  if (payload.jti !== undefined) claims.jti = String(payload.jti);

  // Handle exp claim
  if (typeof payload.exp === 'number') {
    const formatted = formatTimestampClaim(payload.exp);
    if (formatted) {
      claims.exp = {
        ...formatted,
        isExpired: now >= payload.exp * 1000,
      };
    }
  }

  // Handle iat claim
  if (typeof payload.iat === 'number') {
    const formatted = formatTimestampClaim(payload.iat);
    if (formatted) {
      claims.iat = formatted;
    }
  }

  // Handle nbf claim
  if (typeof payload.nbf === 'number') {
    const formatted = formatTimestampClaim(payload.nbf);
    if (formatted) {
      claims.nbf = {
        ...formatted,
        isNotYetValid: now < payload.nbf * 1000,
      };
    }
  }

  return {
    valid: true,
    header: decodedHeader.data,
    headerRaw: decodedHeader.rawJson,
    payload: decodedPayload.data,
    payloadRaw: decodedPayload.rawJson,
    signature: signatureSegment,
    claims,
  };
}

/**
 * Standard non-sensitive sample JWT token for demonstration and testing.
 */
export const SAMPLE_JWT =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
  'eyJpc3MiOiJodHRwczovL2F1dGguZGV2bGVucy5sb2NhbCIsInN1YiI6InVzcl9hYmMxMjM0NSIsImF1ZCI6Imh0dHBzOi8vYXBpLmRldmxlbnMubG9jYWwiLCJleHAiOjE4MDgwNDYwMDAsImlhdCI6MTc3NjUxMDAwMCwibmJmIjoxNzc2NTEwMDAwLCJqdGkiOiJqd3RfaWRfOTg3NjU0MzIxIiwicm9sZXMiOlsiZGV2ZWxvcGVyIl0sInByaXZhY3kiOiJsb2NhbC1vbmx5In0.' +
  'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk';
