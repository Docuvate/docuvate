//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'create_connector_installation_request_dto.g.dart';

/// CreateConnectorInstallationRequestDto
///
/// Properties:
/// * [pluginId] 
/// * [displayName] 
/// * [credentials] 
@BuiltValue()
abstract class CreateConnectorInstallationRequestDto implements Built<CreateConnectorInstallationRequestDto, CreateConnectorInstallationRequestDtoBuilder> {
  @BuiltValueField(wireName: r'pluginId')
  CreateConnectorInstallationRequestDtoPluginIdEnum get pluginId;
  // enum pluginIdEnum {  gmail,  outlook,  paperless,  home_assistant,  amazon_s3,  };

  @BuiltValueField(wireName: r'displayName')
  String get displayName;

  @BuiltValueField(wireName: r'credentials')
  BuiltMap<String, String> get credentials;

  CreateConnectorInstallationRequestDto._();

  factory CreateConnectorInstallationRequestDto([void updates(CreateConnectorInstallationRequestDtoBuilder b)]) = _$CreateConnectorInstallationRequestDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(CreateConnectorInstallationRequestDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<CreateConnectorInstallationRequestDto> get serializer => _$CreateConnectorInstallationRequestDtoSerializer();
}

class _$CreateConnectorInstallationRequestDtoSerializer implements PrimitiveSerializer<CreateConnectorInstallationRequestDto> {
  @override
  final Iterable<Type> types = const [CreateConnectorInstallationRequestDto, _$CreateConnectorInstallationRequestDto];

  @override
  final String wireName = r'CreateConnectorInstallationRequestDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    CreateConnectorInstallationRequestDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'pluginId';
    yield serializers.serialize(
      object.pluginId,
      specifiedType: const FullType(CreateConnectorInstallationRequestDtoPluginIdEnum),
    );
    yield r'displayName';
    yield serializers.serialize(
      object.displayName,
      specifiedType: const FullType(String),
    );
    yield r'credentials';
    yield serializers.serialize(
      object.credentials,
      specifiedType: const FullType(BuiltMap, [FullType(String), FullType(String)]),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    CreateConnectorInstallationRequestDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required CreateConnectorInstallationRequestDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'pluginId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(CreateConnectorInstallationRequestDtoPluginIdEnum),
          ) as CreateConnectorInstallationRequestDtoPluginIdEnum;
          result.pluginId = valueDes;
          break;
        case r'displayName':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.displayName = valueDes;
          break;
        case r'credentials':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltMap, [FullType(String), FullType(String)]),
          ) as BuiltMap<String, String>;
          result.credentials.replace(valueDes);
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  CreateConnectorInstallationRequestDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = CreateConnectorInstallationRequestDtoBuilder();
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

class CreateConnectorInstallationRequestDtoPluginIdEnum extends EnumClass {

  @BuiltValueEnumConst(wireName: r'gmail')
  static const CreateConnectorInstallationRequestDtoPluginIdEnum gmail = _$createConnectorInstallationRequestDtoPluginIdEnum_gmail;
  @BuiltValueEnumConst(wireName: r'outlook')
  static const CreateConnectorInstallationRequestDtoPluginIdEnum outlook = _$createConnectorInstallationRequestDtoPluginIdEnum_outlook;
  @BuiltValueEnumConst(wireName: r'paperless')
  static const CreateConnectorInstallationRequestDtoPluginIdEnum paperless = _$createConnectorInstallationRequestDtoPluginIdEnum_paperless;
  @BuiltValueEnumConst(wireName: r'home_assistant')
  static const CreateConnectorInstallationRequestDtoPluginIdEnum homeAssistant = _$createConnectorInstallationRequestDtoPluginIdEnum_homeAssistant;
  @BuiltValueEnumConst(wireName: r'amazon_s3')
  static const CreateConnectorInstallationRequestDtoPluginIdEnum amazonS3 = _$createConnectorInstallationRequestDtoPluginIdEnum_amazonS3;

  static Serializer<CreateConnectorInstallationRequestDtoPluginIdEnum> get serializer => _$createConnectorInstallationRequestDtoPluginIdEnumSerializer;

  const CreateConnectorInstallationRequestDtoPluginIdEnum._(String name): super(name);

  static BuiltSet<CreateConnectorInstallationRequestDtoPluginIdEnum> get values => _$createConnectorInstallationRequestDtoPluginIdEnumValues;
  static CreateConnectorInstallationRequestDtoPluginIdEnum valueOf(String name) => _$createConnectorInstallationRequestDtoPluginIdEnumValueOf(name);
}

