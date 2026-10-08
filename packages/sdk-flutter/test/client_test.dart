import 'package:docuvate/docuvate.dart';
import 'package:test/test.dart';

void main() {
  test('DocuvateClient wires generated API group instances', () {
    final client = DocuvateClient(
      const DocuvateClientConfig(baseUrl: 'http://localhost/v1', apiKey: 'k'),
    );
    expect(client.documents, isNotNull);
    expect(client.labels, isNotNull);
    expect(client.correspondents, isNotNull);
    expect(client.models, isNotNull);
    expect(client.connectors, isNotNull);
    expect(client.dio.options.headers['Authorization'], 'Bearer k');
  });
}
