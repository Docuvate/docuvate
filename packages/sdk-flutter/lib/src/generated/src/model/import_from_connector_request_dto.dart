//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'import_from_connector_request_dto.g.dart';

/// ImportFromConnectorRequestDto
///
/// Properties:
/// * [ref] 
@BuiltValue()
abstract class ImportFromConnectorRequestDto implements Built<ImportFromConnectorRequestDto, ImportFromConnectorRequestDtoBuilder> {
  @BuiltValueField(wireName: r'ref')
  String get ref;

  ImportFromConnectorRequestDto._();

  factory ImportFromConnectorRequestDto([void updates(ImportFromConnectorRequestDtoBuilder b)]) = _$ImportFromConnectorRequestDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(ImportFromConnectorRequestDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<ImportFromConnectorRequestDto> get serializer => _$ImportFromConnectorRequestDtoSerializer();
}

class _$ImportFromConnectorRequestDtoSerializer implements PrimitiveSerializer<ImportFromConnectorRequestDto> {
  @override
  final Iterable<Type> types = const [ImportFromConnectorRequestDto, _$ImportFromConnectorRequestDto];

  @override
  final String wireName = r'ImportFromConnectorRequestDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    ImportFromConnectorRequestDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'ref';
    yield serializers.serialize(
      object.ref,
      specifiedType: const FullType(String),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    ImportFromConnectorRequestDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required ImportFromConnectorRequestDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'ref':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.ref = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  ImportFromConnectorRequestDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = ImportFromConnectorRequestDtoBuilder();
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

