import * as Crypto from "expo-crypto";

/**
 * Generates a UUID v4 on the device.
 *
 * Records created offline get their id here instead of from the database, so
 * resending the same record after a lost response hits the same primary key
 * and is ignored instead of duplicated.
 */
export function newId(): string {
  return Crypto.randomUUID();
}