import { hash, verify } from '@node-rs/argon2';

export async function hashSftpIngressPassword(plain: string): Promise<string> {
  return hash(plain, {
    algorithm: 2,
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
  });
}

export async function verifySftpIngressPassword(plain: string, encoded: string): Promise<boolean> {
  try {
    return await verify(encoded, plain);
  } catch {
    return false;
  }
}
