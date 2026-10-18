//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/json_object.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'update_connector_installation_request_dto.g.dart';

/// UpdateConnectorInstallationRequestDto
///
/// Properties:
/// * [displayName] 
/// * [sourceScope] 
@BuiltValue()
abstract class UpdateConnectorInstallationRequestDto implements Built<UpdateConnectorInstallationRequestDto, UpdateConnectorInstallationRequestDtoBuilder> {
  @BuiltValueField(wireName: r'displayName')
  String? get displayName;

  @BuiltValueField(wireName: r'sourceScope')
  JsonObject? get sourceScope;

  UpdateConnectorInstallationRequestDto._();

  factory UpdateConnectorInstallationRequestDto([void updates(UpdateConnectorInstallationRequestDtoBuilder b)]) = _$UpdateConnectorInstallationRequestDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(UpdateConnectorInstallationRequestDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<UpdateConnectorInstallationRequestDto> get serializer => _$UpdateConnectorInstallationRequestDtoSerializer();
}

class _$UpdateConnectorInstallationRequestDtoSerializer implements PrimitiveSerializer<UpdateConnectorInstallationRequestDto> {
  @override
  final Iterable<Type> types = const [UpdateConnectorInstallationRequestDto, _$UpdateConnectorInstallationRequestDto];

  @override
  final String wireName = r'UpdateConnectorInstallationRequestDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    UpdateConnectorInstallationRequestDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    if (object.displayName != null) {
      yield r'displayName';
      yield serializers.serialize(
        object.displayName,
        specifiedType: const FullType(String),
      );
    }
    if (object.sourceScope != null) {
      yield r'sourceScope';
      yield serializers.serialize(
        object.sourceScope,
        specifiedType: const FullType(JsonObject),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    UpdateConnectorInstallationRequestDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required UpdateConnectorInstallationRequestDtoBuilder result,
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
        case r'sourceScope':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(JsonObject),
          ) as JsonObject;
          result.sourceScope = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  UpdateConnectorInstallationRequestDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = UpdateConnectorInstallationRequestDtoBuilder();
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

