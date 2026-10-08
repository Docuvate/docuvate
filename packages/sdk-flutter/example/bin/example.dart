import 'dart:io';

import 'package:args/args.dart';
import 'package:docuvate/docuvate.dart';

Future<void> main(List<String> arguments) async {
  final parser = ArgParser()
    ..addOption('base-url', defaultsTo: 'http://localhost:3001/v1')
    ..addOption('api-key', mandatory: true);
  final args = parser.parse(arguments);

  final client = DocuvateClient(
    DocuvateClientConfig(
      baseUrl: args['base-url'] as String,
      apiKey: args['api-key'] as String,
    ),
  );

  final response = await client.documents.listDocuments();
  final list = response.data;
  if (list == null) {
    stderr.writeln('listDocuments failed: HTTP ${response.statusCode}');
    exitCode = 1;
    return;
  }
  stdout.writeln('Documents: ${list.items.length}');
  for (final doc in list.items.take(5)) {
    stdout.writeln('- ${doc.value}');
  }
}
