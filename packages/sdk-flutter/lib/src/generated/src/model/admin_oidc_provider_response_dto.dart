//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'admin_oidc_provider_response_dto.g.dart';

/// AdminOidcProviderResponseDto
///
/// Properties:
/// * [id] 
/// * [providerId] 
/// * [displayName] 
/// * [issuer] 
/// * [clientId] 
/// * [scopes] 
/// * [enabled] 
/// * [source_] 
/// * [hasClientSecret] 
@BuiltValue()
abstract class AdminOidcProviderResponseDto implements Built<AdminOidcProviderResponseDto, AdminOidcProviderResponseDtoBuilder> {
  @BuiltValueField(wireName: r'id')
  String get id;

  @BuiltValueField(wireName: r'providerId')
  String get providerId;

  @BuiltValueField(wireName: r'displayName')
  String get displayName;

  @BuiltValueField(wireName: r'issuer')
  String get issuer;

  @BuiltValueField(wireName: r'clientId')
  String get clientId;

  @BuiltValueField(wireName: r'scopes')
  String get scopes;

  @BuiltValueField(wireName: r'enabled')
  bool get enabled;

  @BuiltValueField(wireName: r'source')
  AdminOidcProviderResponseDtoSource_Enum get source_;
  // enum source_Enum {  admin,  env,  };

  @BuiltValueField(wireName: r'hasClientSecret')
  bool get hasClientSecret;

  AdminOidcProviderResponseDto._();

  factory AdminOidcProviderResponseDto([void updates(AdminOidcProviderResponseDtoBuilder b)]) = _$AdminOidcProviderResponseDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(AdminOidcProviderResponseDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<AdminOidcProviderResponseDto> get serializer => _$AdminOidcProviderResponseDtoSerializer();
}

class _$AdminOidcProviderResponseDtoSerializer implements PrimitiveSerializer<AdminOidcProviderResponseDto> {
  @override
  final Iterable<Type> types = const [AdminOidcProviderResponseDto, _$AdminOidcProviderResponseDto];

  @override
  final String wireName = r'AdminOidcProviderResponseDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    AdminOidcProviderResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'id';
    yield serializers.serialize(
      object.id,
      specifiedType: const FullType(String),
    );
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
    yield r'source';
    yield serializers.serialize(
      object.source_,
      specifiedType: const FullType(AdminOidcProviderResponseDtoSource_Enum),
    );
    yield r'hasClientSecret';
    yield serializers.serialize(
      object.hasClientSecret,
      specifiedType: const FullType(bool),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    AdminOidcProviderResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required AdminOidcProviderResponseDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'id':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.id = valueDes;
          break;
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
        case r'source':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(AdminOidcProviderResponseDtoSource_Enum),
          ) as AdminOidcProviderResponseDtoSource_Enum;
          result.source_ = valueDes;
          break;
        case r'hasClientSecret':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.hasClientSecret = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  AdminOidcProviderResponseDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = AdminOidcProviderResponseDtoBuilder();
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

class AdminOidcProviderResponseDtoSource_Enum extends EnumClass {

  @BuiltValueEnumConst(wireName: r'admin')
  static const AdminOidcProviderResponseDtoSource_Enum admin = _$adminOidcProviderResponseDtoSourceEnum_admin;
  @BuiltValueEnumConst(wireName: r'env')
  static const AdminOidcProviderResponseDtoSource_Enum env = _$adminOidcProviderResponseDtoSourceEnum_env;

  static Serializer<AdminOidcProviderResponseDtoSource_Enum> get serializer => _$adminOidcProviderResponseDtoSourceEnumSerializer;

  const AdminOidcProviderResponseDtoSource_Enum._(String name): super(name);

  static BuiltSet<AdminOidcProviderResponseDtoSource_Enum> get values => _$adminOidcProviderResponseDtoSourceEnumValues;
  static AdminOidcProviderResponseDtoSource_Enum valueOf(String name) => _$adminOidcProviderResponseDtoSourceEnumValueOf(name);
}

