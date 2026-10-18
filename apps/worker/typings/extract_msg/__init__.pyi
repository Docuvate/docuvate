from typing import BinaryIO

class Message:
    subject: str | None
    sender: str | None
    body: str | None

    def __init__(self, path_or_stream: str | BinaryIO) -> None: ...
    def close(self) -> None: ...
