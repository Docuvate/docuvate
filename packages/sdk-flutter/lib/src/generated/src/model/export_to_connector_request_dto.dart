//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'export_to_connector_request_dto.g.dart';

/// ExportToConnectorRequestDto
///
/// Properties:
/// * [documentId] 
/// * [destinationRef] 
@BuiltValue()
abstract class ExportToConnectorRequestDto implements Built<ExportToConnectorRequestDto, ExportToConnectorRequestDtoBuilder> {
  @BuiltValueField(wireName: r'documentId')
  String get documentId;

  @BuiltValueField(wireName: r'destinationRef')
  String? get destinationRef;

  ExportToConnectorRequestDto._();

  factory ExportToConnectorRequestDto([void updates(ExportToConnectorRequestDtoBuilder b)]) = _$ExportToConnectorRequestDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(ExportToConnectorRequestDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<ExportToConnectorRequestDto> get serializer => _$ExportToConnectorRequestDtoSerializer();
}

class _$ExportToConnectorRequestDtoSerializer implements PrimitiveSerializer<ExportToConnectorRequestDto> {
  @override
  final Iterable<Type> types = const [ExportToConnectorRequestDto, _$ExportToConnectorRequestDto];

  @override
  final String wireName = r'ExportToConnectorRequestDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    ExportToConnectorRequestDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'documentId';
    yield serializers.serialize(
      object.documentId,
      specifiedType: const FullType(String),
    );
    if (object.destinationRef != null) {
      yield r'destinationRef';
      yield serializers.serialize(
        object.destinationRef,
        specifiedType: const FullType(String),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    ExportToConnectorRequestDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required ExportToConnectorRequestDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'documentId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.documentId = valueDes;
          break;
        case r'destinationRef':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.destinationRef = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  ExportToConnectorRequestDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = ExportToConnectorRequestDtoBuilder();
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

