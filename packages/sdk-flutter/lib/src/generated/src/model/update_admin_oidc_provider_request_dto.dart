//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'update_admin_oidc_provider_request_dto.g.dart';

/// UpdateAdminOidcProviderRequestDto
///
/// Properties:
/// * [displayName] 
/// * [issuer] 
/// * [clientId] 
/// * [clientSecret] 
/// * [scopes] 
/// * [enabled] 
@BuiltValue()
abstract class UpdateAdminOidcProviderRequestDto implements Built<UpdateAdminOidcProviderRequestDto, UpdateAdminOidcProviderRequestDtoBuilder> {
  @BuiltValueField(wireName: r'displayName')
  String get displayName;

  @BuiltValueField(wireName: r'issuer')
  String get issuer;

  @BuiltValueField(wireName: r'clientId')
  String get clientId;

  @BuiltValueField(wireName: r'clientSecret')
  String? get clientSecret;

  @BuiltValueField(wireName: r'scopes')
  String get scopes;

  @BuiltValueField(wireName: r'enabled')
  bool get enabled;

  UpdateAdminOidcProviderRequestDto._();

  factory UpdateAdminOidcProviderRequestDto([void updates(UpdateAdminOidcProviderRequestDtoBuilder b)]) = _$UpdateAdminOidcProviderRequestDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(UpdateAdminOidcProviderRequestDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<UpdateAdminOidcProviderRequestDto> get serializer => _$UpdateAdminOidcProviderRequestDtoSerializer();
}

class _$UpdateAdminOidcProviderRequestDtoSerializer implements PrimitiveSerializer<UpdateAdminOidcProviderRequestDto> {
  @override
  final Iterable<Type> types = const [UpdateAdminOidcProviderRequestDto, _$UpdateAdminOidcProviderRequestDto];

  @override
  final String wireName = r'UpdateAdminOidcProviderRequestDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    UpdateAdminOidcProviderRequestDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'displayName';
    yield serializers.serialize(
      object.displayName,
      specifiedType: const FullType(String),
    );
    yield r'issuer';
    yield serializers.serialize(
      object.issuer,
      specifiedType: const FullType(String),
    );
    yield r'clientId';
    yield serializers.serialize(
      object.clientId,
      specifiedType: const FullType(String),
    );
    if (object.clientSecret != null) {
      yield r'clientSecret';
      yield serializers.serialize(
        object.clientSecret,
        specifiedType: const FullType(String),
      );
    }
    yield r'scopes';
    yield serializers.serialize(
      object.scopes,
      specifiedType: const FullType(String),
    );
    yield r'enabled';
    yield serializers.serialize(
      object.enabled,
      specifiedType: const FullType(bool),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    UpdateAdminOidcProviderRequestDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required UpdateAdminOidcProviderRequestDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'displayName':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.displayName = valueDes;
          break;
        case r'issuer':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.issuer = valueDes;
          break;
        case r'clientId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.clientId = valueDes;
          break;
        case r'clientSecret':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.clientSecret = valueDes;
          break;
        case r'scopes':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.scopes = valueDes;
          break;
        case r'enabled':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.enabled = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  UpdateAdminOidcProviderRequestDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = UpdateAdminOidcProviderRequestDtoBuilder();
    final serializedList = (serialized as Iterable<Object?>).toList();
    final unhandled = <Object?>[];
    _deserializeProperties(
      serializers,
      serialized,
      specifiedType: specifiedType,
      serializedList: serializedList,
      unhandled: unhandled,
      result: result,
    );
    return result.build();
  }
}

