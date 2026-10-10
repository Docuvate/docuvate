from typing import Any

class _CudaModule:
    def is_available(self) -> bool: ...
    def get_device_properties(self, device: int) -> Any: ...

class _BackendsModule:
    def is_built(self, name: str) -> bool: ...

class _VersionModule:
    cuda: str | None

cuda: _CudaModule
backends: _BackendsModule
version: _VersionModule

def __getattr__(name: str) -> Any: ...
