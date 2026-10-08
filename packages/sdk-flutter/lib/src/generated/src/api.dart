//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

import 'package:dio/dio.dart';
import 'package:built_value/serializer.dart';
import 'package:docuvate/src/generated/src/serializers.dart';
import 'package:docuvate/src/generated/src/auth/api_key_auth.dart';
import 'package:docuvate/src/generated/src/auth/basic_auth.dart';
import 'package:docuvate/src/generated/src/auth/bearer_auth.dart';
import 'package:docuvate/src/generated/src/auth/oauth.dart';
import 'package:docuvate/src/generated/src/api/api_metadata_api.dart';
import 'package:docuvate/src/generated/src/api/connectors_api.dart';
import 'package:docuvate/src/generated/src/api/correspondents_api.dart';
import 'package:docuvate/src/generated/src/api/documents_api.dart';
import 'package:docuvate/src/generated/src/api/labels_api.dart';
import 'package:docuvate/src/generated/src/api/models_api.dart';
import 'package:docuvate/src/generated/src/api/organizer_api.dart';
import 'package:docuvate/src/generated/src/api/search_api.dart';
import 'package:docuvate/src/generated/src/api/settings_api.dart';

class DocuvateApi {
  static const String basePath = r'/v1';

  final Dio dio;
  final Serializers serializers;

  DocuvateApi({
    Dio? dio,
    Serializers? serializers,
    String? basePathOverride,
    List<Interceptor>? interceptors,
  })  : this.serializers = serializers ?? standardSerializers,
        this.dio = dio ??
            Dio(BaseOptions(
              baseUrl: basePathOverride ?? basePath,
              connectTimeout: const Duration(milliseconds: 5000),
              receiveTimeout: const Duration(milliseconds: 3000),
            )) {
    if (interceptors == null) {
      this.dio.interceptors.addAll([
        OAuthInterceptor(),
        BasicAuthInterceptor(),
        BearerAuthInterceptor(),
        ApiKeyAuthInterceptor(),
      ]);
    } else {
      this.dio.interceptors.addAll(interceptors);
    }
  }

  void setOAuthToken(String name, String token) {
    if (this.dio.interceptors.any((i) => i is OAuthInterceptor)) {
      (this.dio.interceptors.firstWhere((i) => i is OAuthInterceptor) as OAuthInterceptor).tokens[name] = token;
    }
  }

  void setBearerAuth(String name, String token) {
    if (this.dio.interceptors.any((i) => i is BearerAuthInterceptor)) {
      (this.dio.interceptors.firstWhere((i) => i is BearerAuthInterceptor) as BearerAuthInterceptor).tokens[name] = token;
    }
  }

  void setBasicAuth(String name, String username, String password) {
    if (this.dio.interceptors.any((i) => i is BasicAuthInterceptor)) {
      (this.dio.interceptors.firstWhere((i) => i is BasicAuthInterceptor) as BasicAuthInterceptor).authInfo[name] = BasicAuthInfo(username, password);
    }
  }

  void setApiKey(String name, String apiKey) {
    if (this.dio.interceptors.any((i) => i is ApiKeyAuthInterceptor)) {
      (this.dio.interceptors.firstWhere((element) => element is ApiKeyAuthInterceptor) as ApiKeyAuthInterceptor).apiKeys[name] = apiKey;
    }
  }

  /// Get APIMetadataApi instance, base route and serializer can be overridden by a given but be careful,
  /// by doing that all interceptors will not be executed
  APIMetadataApi getAPIMetadataApi() {
    return APIMetadataApi(dio, serializers);
  }

  /// Get ConnectorsApi instance, base route and serializer can be overridden by a given but be careful,
  /// by doing that all interceptors will not be executed
  ConnectorsApi getConnectorsApi() {
    return ConnectorsApi(dio, serializers);
  }

  /// Get CorrespondentsApi instance, base route and serializer can be overridden by a given but be careful,
  /// by doing that all interceptors will not be executed
  CorrespondentsApi getCorrespondentsApi() {
    return CorrespondentsApi(dio, serializers);
  }

  /// Get DocumentsApi instance, base route and serializer can be overridden by a given but be careful,
  /// by doing that all interceptors will not be executed
  DocumentsApi getDocumentsApi() {
    return DocumentsApi(dio, serializers);
  }

  /// Get LabelsApi instance, base route and serializer can be overridden by a given but be careful,
  /// by doing that all interceptors will not be executed
  LabelsApi getLabelsApi() {
    return LabelsApi(dio, serializers);
  }

  /// Get ModelsApi instance, base route and serializer can be overridden by a given but be careful,
  /// by doing that all interceptors will not be executed
  ModelsApi getModelsApi() {
    return ModelsApi(dio, serializers);
  }

  /// Get OrganizerApi instance, base route and serializer can be overridden by a given but be careful,
  /// by doing that all interceptors will not be executed
  OrganizerApi getOrganizerApi() {
    return OrganizerApi(dio, serializers);
  }

  /// Get SearchApi instance, base route and serializer can be overridden by a given but be careful,
  /// by doing that all interceptors will not be executed
  SearchApi getSearchApi() {
    return SearchApi(dio, serializers);
  }

  /// Get SettingsApi instance, base route and serializer can be overridden by a given but be careful,
  /// by doing that all interceptors will not be executed
  SettingsApi getSettingsApi() {
    return SettingsApi(dio, serializers);
  }
}
