class DocuvateApiException implements Exception {
  DocuvateApiException({
    required this.statusCode,
    required this.code,
    required this.message,
  });

  final int statusCode;
  final String code;
  final String message;

  @override
  String toString() => 'DocuvateApiException($statusCode, $code: $message)';
}

class DocuvateNetworkException implements Exception {
  DocuvateNetworkException(this.message, [this.cause]);

  final String message;
  final Object? cause;

  @override
  String toString() => 'DocuvateNetworkException: $message';
}
