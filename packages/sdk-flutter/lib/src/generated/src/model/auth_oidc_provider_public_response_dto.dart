//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'auth_oidc_provider_public_response_dto.g.dart';

/// AuthOidcProviderPublicResponseDto
///
/// Properties:
/// * [providerId] 
/// * [displayName] 
@BuiltValue()
abstract class AuthOidcProviderPublicResponseDto implements Built<AuthOidcProviderPublicResponseDto, AuthOidcProviderPublicResponseDtoBuilder> {
  @BuiltValueField(wireName: r'providerId')
  String get providerId;

  @BuiltValueField(wireName: r'displayName')
  String get displayName;

  AuthOidcProviderPublicResponseDto._();

  factory AuthOidcProviderPublicResponseDto([void updates(AuthOidcProviderPublicResponseDtoBuilder b)]) = _$AuthOidcProviderPublicResponseDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(AuthOidcProviderPublicResponseDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<AuthOidcProviderPublicResponseDto> get serializer => _$AuthOidcProviderPublicResponseDtoSerializer();
}

class _$AuthOidcProviderPublicResponseDtoSerializer implements PrimitiveSerializer<AuthOidcProviderPublicResponseDto> {
  @override
  final Iterable<Type> types = const [AuthOidcProviderPublicResponseDto, _$AuthOidcProviderPublicResponseDto];

  @override
  final String wireName = r'AuthOidcProviderPublicResponseDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    AuthOidcProviderPublicResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'providerId';
    yield serializers.serialize(
      object.providerId,
      specifiedType: const FullType(String),
    );
    yield r'displayName';
    yield serializers.serialize(
      object.displayName,
      specifiedType: const FullType(String),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    AuthOidcProviderPublicResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required AuthOidcProviderPublicResponseDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'providerId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.providerId = valueDes;
          break;
        case r'displayName':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.displayName = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  AuthOidcProviderPublicResponseDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = AuthOidcProviderPublicResponseDtoBuilder();
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

