import 'package:dio/dio.dart';
import 'package:docuvate/src/generated/docuvate_api.dart';

export 'package:docuvate/src/generated/docuvate_api.dart';

/// Thin facade: configures Dio + auth and exposes all generated tag APIs.
class DocuvateClient {
  DocuvateClient(DocuvateClientConfig config)
      : dio = Dio(
          BaseOptions(
            baseUrl: config.baseUrl.replaceAll(RegExp(r'/+$'), ''),
            connectTimeout: config.connectTimeout,
            receiveTimeout: config.receiveTimeout,
            headers: {
              'Accept': 'application/json',
              if (config.apiKey != null) ...{
                'Authorization': 'Bearer ${config.apiKey}',
                'X-Docuvate-Api-Key': config.apiKey,
              },
            },
          ),
        ) {
    final serializers = standardSerializers;
    apiMetadata = APIMetadataApi(dio, serializers);
    documents = DocumentsApi(dio, serializers);
    labels = LabelsApi(dio, serializers);
    correspondents = CorrespondentsApi(dio, serializers);
    organizer = OrganizerApi(dio, serializers);
    settings = SettingsApi(dio, serializers);
    connectors = ConnectorsApi(dio, serializers);
    models = ModelsApi(dio, serializers);
  }

  final Dio dio;
  late final APIMetadataApi apiMetadata;
  late final DocumentsApi documents;
  late final LabelsApi labels;
  late final CorrespondentsApi correspondents;
  late final OrganizerApi organizer;
  late final SettingsApi settings;
  late final ConnectorsApi connectors;
  late final ModelsApi models;
}

class DocuvateClientConfig {
  const DocuvateClientConfig({
    required this.baseUrl,
    this.apiKey,
    this.connectTimeout = const Duration(seconds: 30),
    this.receiveTimeout = const Duration(seconds: 30),
  });

  final String baseUrl;
  final String? apiKey;
  final Duration connectTimeout;
  final Duration receiveTimeout;
}
