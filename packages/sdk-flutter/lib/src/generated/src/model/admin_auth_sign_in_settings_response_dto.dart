//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:docuvate/src/generated/src/model/admin_oidc_provider_response_dto.dart';
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'admin_auth_sign_in_settings_response_dto.g.dart';

/// AdminAuthSignInSettingsResponseDto
///
/// Properties:
/// * [passkeysEnabled] 
/// * [oidcProviders] 
@BuiltValue()
abstract class AdminAuthSignInSettingsResponseDto implements Built<AdminAuthSignInSettingsResponseDto, AdminAuthSignInSettingsResponseDtoBuilder> {
  @BuiltValueField(wireName: r'passkeysEnabled')
  bool get passkeysEnabled;

  @BuiltValueField(wireName: r'oidcProviders')
  BuiltList<AdminOidcProviderResponseDto> get oidcProviders;

  AdminAuthSignInSettingsResponseDto._();

  factory AdminAuthSignInSettingsResponseDto([void updates(AdminAuthSignInSettingsResponseDtoBuilder b)]) = _$AdminAuthSignInSettingsResponseDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(AdminAuthSignInSettingsResponseDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<AdminAuthSignInSettingsResponseDto> get serializer => _$AdminAuthSignInSettingsResponseDtoSerializer();
}

class _$AdminAuthSignInSettingsResponseDtoSerializer implements PrimitiveSerializer<AdminAuthSignInSettingsResponseDto> {
  @override
  final Iterable<Type> types = const [AdminAuthSignInSettingsResponseDto, _$AdminAuthSignInSettingsResponseDto];

  @override
  final String wireName = r'AdminAuthSignInSettingsResponseDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    AdminAuthSignInSettingsResponseDto object, {
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
      specifiedType: const FullType(BuiltList, [FullType(AdminOidcProviderResponseDto)]),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    AdminAuthSignInSettingsResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required AdminAuthSignInSettingsResponseDtoBuilder result,
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
            specifiedType: const FullType(BuiltList, [FullType(AdminOidcProviderResponseDto)]),
          ) as BuiltList<AdminOidcProviderResponseDto>;
          result.oidcProviders.replace(valueDes);
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  AdminAuthSignInSettingsResponseDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = AdminAuthSignInSettingsResponseDtoBuilder();
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

