// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { stdin, stdout } from 'node:process';

async function readStdinAll(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of stdin) {
    if (typeof chunk === 'string') {
      chunks.push(Buffer.from(chunk, 'utf8'));
    } else if (Buffer.isBuffer(chunk)) {
      chunks.push(chunk);
    }
  }
  return Buffer.concat(chunks)
    .toString('utf8')
    .replace(/\r?\n$/, '');
}

export async function readHiddenPassword(prompt: string): Promise<string> {
  if (!stdin.isTTY) {
    return readStdinAll();
  }

  return new Promise((resolve, reject) => {
    stdout.write(prompt);
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');

    let password = '';
    const onData = (char: string) => {
      switch (char) {
        case '\n':
        case '\r':
        case '\u0004':
          stdin.setRawMode(false);
          stdin.pause();
          stdin.removeListener('data', onData);
          stdout.write('\n');
          resolve(password);
          break;
        case '\u0003':
          process.exit(130);
          break;
        case '\u007f':
          password = password.slice(0, -1);
          break;
        default:
          if (char >= ' ') {
            password += char;
            stdout.write('*');
          }
          break;
      }
    };

    stdin.on('data', onData);
    stdin.on('error', reject);
  });
}
