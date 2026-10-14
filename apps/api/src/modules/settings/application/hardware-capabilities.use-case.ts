// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { HardwareCapabilitiesDto, InferenceDeviceKind } from '@docuvate/contracts';
import { Injectable } from '@nestjs/common';

import {
  parseBoolean,
  parseEnum,
  parseNumber,
  recordFromUnknown,
} from '../../../shared/infrastructure/database/row-parse.js';
import { fetchWorkerDependency } from '../../../shared/infrastructure/worker/worker-dependency-fetch.js';

const INFERENCE_DEVICES: readonly InferenceDeviceKind[] = ['cuda', 'mps', 'rocm', 'cpu'];

function parseHardwareCapabilitiesDto(value: unknown): HardwareCapabilitiesDto | null {
  const row = recordFromUnknown(value);
  if (!row) {
    return null;
  }
  const capabilitiesRow = recordFromUnknown(row.capabilities);
  return {
    device: parseEnum(row.device, INFERENCE_DEVICES, 'cpu'),
    vramMb: parseNumber(row.vramMb),
    gpuAvailable: parseBoolean(row.gpuAvailable),
    capabilities: {
      heavyVision: capabilitiesRow ? parseBoolean(capabilitiesRow.heavyVision) : false,
      largeLocalLlm: capabilitiesRow ? parseBoolean(capabilitiesRow.largeLocalLlm) : false,
      cpuRag: capabilitiesRow ? parseBoolean(capabilitiesRow.cpuRag) : true,
    },
  };
}

function withDockerMemoryHints(base: HardwareCapabilitiesDto): HardwareCapabilitiesDto {
  const warn = process.env['DOCUVATE_DOCKER_MEMORY_WARNING'] !== 'false';
  if (!warn) {
    return base;
  }
  return {
    ...base,
    dockerMemoryWarning: true,
    dockerMemoryHintDe:
      'Docker Desktop: mindestens 6 GB RAM für den Basis-Stack; mit Profil chat-local (Ollama + qwen2.5:1.5b) ≥ 8 GB. OLLAMA_MEM_LIMIT standardmäßig 2g; qwen2.5:3b braucht ~3g+.',
    dockerMemoryHintEn:
      'Docker Desktop: at least 6 GB RAM for the default stack; with chat-local profile (Ollama + qwen2.5:1.5b) use ≥ 8 GB. OLLAMA_MEM_LIMIT defaults to 2g; qwen2.5:3b needs ~3g+.',
  };
}

const CPU_FALLBACK: HardwareCapabilitiesDto = withDockerMemoryHints({
  device: 'cpu',
  vramMb: 0,
  gpuAvailable: false,
  capabilities: {
    heavyVision: false,
    largeLocalLlm: false,
    cpuRag: true,
  },
});

@Injectable()
export class GetHardwareCapabilitiesUseCase {
  private workerHeaders(): Record<string, string> {
    const secret = process.env['WORKER_SECRET'] ?? 'worker-shared-secret';
    return {
      'Content-Type': 'application/json',
      'X-Worker-Secret': secret,
    };
  }

  async execute(): Promise<HardwareCapabilitiesDto> {
    const workerUrl = process.env['WORKER_URL'];
    if (!workerUrl) {
      return CPU_FALLBACK;
    }
    try {
      const response = await fetchWorkerDependency(workerUrl, '/settings/hardware', {
        headers: this.workerHeaders(),
      });
      if (!response?.ok) {
        return CPU_FALLBACK;
      }
      const data = parseHardwareCapabilitiesDto(await response.json());
      if (!data) {
        return CPU_FALLBACK;
      }
      return withDockerMemoryHints(data);
    } catch {
      return CPU_FALLBACK;
    }
  }
}
