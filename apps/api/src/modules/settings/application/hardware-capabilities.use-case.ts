// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Injectable } from '@nestjs/common';
import type { HardwareCapabilitiesDto } from '@docuvate/contracts';
import { fetchWorkerDependency } from '../../../shared/infrastructure/worker/worker-dependency-fetch.js';

function withDockerMemoryHints(base: HardwareCapabilitiesDto): HardwareCapabilitiesDto {
  const warn = process.env['DOCUVATE_DOCKER_MEMORY_WARNING'] !== 'false';
  if (!warn) {
    return base;
  }
  return {
    ...base,
    dockerMemoryWarning: true,
    dockerMemoryHintDe:
      'Docker Desktop: mindestens 10–12 GB RAM gesamt. Ollama-Container-Limit (OLLAMA_MEM_LIMIT) ist standardmäßig 3g — passt zu qwen2.5:3b; qwen3:4b braucht ≥ 5g.',
    dockerMemoryHintEn:
      'Docker Desktop: allocate at least 10–12 GB RAM total. Ollama container limit (OLLAMA_MEM_LIMIT) defaults to 3g for qwen2.5:3b; qwen3:4b needs ≥ 5g.',
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
      const data = (await response.json()) as HardwareCapabilitiesDto;
      return withDockerMemoryHints({
        device: data.device ?? 'cpu',
        vramMb: data.vramMb ?? 0,
        gpuAvailable: Boolean(data.gpuAvailable),
        capabilities: {
          heavyVision: Boolean(data.capabilities?.heavyVision),
          largeLocalLlm: Boolean(data.capabilities?.largeLocalLlm),
          cpuRag: data.capabilities?.cpuRag !== false,
        },
      });
    } catch {
      return CPU_FALLBACK;
    }
  }
}
