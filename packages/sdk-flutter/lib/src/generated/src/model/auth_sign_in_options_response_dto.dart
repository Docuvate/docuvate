//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:docuvate/src/generated/src/model/auth_oidc_provider_public_response_dto.dart';
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'auth_sign_in_options_response_dto.g.dart';

/// AuthSignInOptionsResponseDto
///
/// Properties:
/// * [passkeysEnabled] 
/// * [oidcProviders] 
/// * [emailChangeAvailable] 
@BuiltValue()
abstract class AuthSignInOptionsResponseDto implements Built<AuthSignInOptionsResponseDto, AuthSignInOptionsResponseDtoBuilder> {
  @BuiltValueField(wireName: r'passkeysEnabled')
  bool get passkeysEnabled;

  @BuiltValueField(wireName: r'oidcProviders')
  BuiltList<AuthOidcProviderPublicResponseDto> get oidcProviders;

  @BuiltValueField(wireName: r'emailChangeAvailable')
  bool get emailChangeAvailable;

  AuthSignInOptionsResponseDto._();

  factory AuthSignInOptionsResponseDto([void updates(AuthSignInOptionsResponseDtoBuilder b)]) = _$AuthSignInOptionsResponseDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(AuthSignInOptionsResponseDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<AuthSignInOptionsResponseDto> get serializer => _$AuthSignInOptionsResponseDtoSerializer();
}

class _$AuthSignInOptionsResponseDtoSerializer implements PrimitiveSerializer<AuthSignInOptionsResponseDto> {
  @override
  final Iterable<Type> types = const [AuthSignInOptionsResponseDto, _$AuthSignInOptionsResponseDto];

  @override
  final String wireName = r'AuthSignInOptionsResponseDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    AuthSignInOptionsResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'passkeysEnabled';
    yield serializers.serialize(
      object.passkeysEnabled,
      specifiedType: const FullType(bool),
    );
    yield r'oidcProviders';
    yield serializers.serialize(
      object.oidcProviders,
      specifiedType: const FullType(BuiltList, [FullType(AuthOidcProviderPublicResponseDto)]),
    );
    yield r'emailChangeAvailable';
    yield serializers.serialize(
      object.emailChangeAvailable,
      specifiedType: const FullType(bool),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    AuthSignInOptionsResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required AuthSignInOptionsResponseDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'passkeysEnabled':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.passkeysEnabled = valueDes;
          break;
        case r'oidcProviders':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(AuthOidcProviderPublicResponseDto)]),
          ) as BuiltList<AuthOidcProviderPublicResponseDto>;
          result.oidcProviders.replace(valueDes);
          break;
        case r'emailChangeAvailable':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.emailChangeAvailable = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  AuthSignInOptionsResponseDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = AuthSignInOptionsResponseDtoBuilder();
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

