//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'document_region_field_dto.g.dart';

/// DocumentRegionFieldDto
///
/// Properties:
/// * [fieldKey] 
/// * [valueOverride] 
@BuiltValue()
abstract class DocumentRegionFieldDto implements Built<DocumentRegionFieldDto, DocumentRegionFieldDtoBuilder> {
  @BuiltValueField(wireName: r'fieldKey')
  String get fieldKey;

  @BuiltValueField(wireName: r'valueOverride')
  String get valueOverride;

  DocumentRegionFieldDto._();

  factory DocumentRegionFieldDto([void updates(DocumentRegionFieldDtoBuilder b)]) = _$DocumentRegionFieldDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(DocumentRegionFieldDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<DocumentRegionFieldDto> get serializer => _$DocumentRegionFieldDtoSerializer();
}

class _$DocumentRegionFieldDtoSerializer implements PrimitiveSerializer<DocumentRegionFieldDto> {
  @override
  final Iterable<Type> types = const [DocumentRegionFieldDto, _$DocumentRegionFieldDto];

  @override
  final String wireName = r'DocumentRegionFieldDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    DocumentRegionFieldDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'fieldKey';
    yield serializers.serialize(
      object.fieldKey,
      specifiedType: const FullType(String),
    );
    yield r'valueOverride';
    yield serializers.serialize(
      object.valueOverride,
      specifiedType: const FullType(String),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    DocumentRegionFieldDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required DocumentRegionFieldDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'fieldKey':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.fieldKey = valueDes;
          break;
        case r'valueOverride':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.valueOverride = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  DocumentRegionFieldDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = DocumentRegionFieldDtoBuilder();
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

