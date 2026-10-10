from typing import Any

class Output:
    DICT: int

def image_to_string(*args: Any, **kwargs: Any) -> str: ...
def image_to_data(*args: Any, **kwargs: Any) -> dict[str, list[Any]]: ...
