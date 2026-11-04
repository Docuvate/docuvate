//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'document_region_table_merge_dto.g.dart';

/// DocumentRegionTableMergeDto
///
/// Properties:
/// * [row0] 
/// * [col0] 
/// * [rowSpan] 
/// * [colSpan] 
@BuiltValue()
abstract class DocumentRegionTableMergeDto implements Built<DocumentRegionTableMergeDto, DocumentRegionTableMergeDtoBuilder> {
  @BuiltValueField(wireName: r'row0')
  num get row0;

  @BuiltValueField(wireName: r'col0')
  num get col0;

  @BuiltValueField(wireName: r'rowSpan')
  num get rowSpan;

  @BuiltValueField(wireName: r'colSpan')
  num get colSpan;

  DocumentRegionTableMergeDto._();

  factory DocumentRegionTableMergeDto([void updates(DocumentRegionTableMergeDtoBuilder b)]) = _$DocumentRegionTableMergeDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(DocumentRegionTableMergeDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<DocumentRegionTableMergeDto> get serializer => _$DocumentRegionTableMergeDtoSerializer();
}

class _$DocumentRegionTableMergeDtoSerializer implements PrimitiveSerializer<DocumentRegionTableMergeDto> {
  @override
  final Iterable<Type> types = const [DocumentRegionTableMergeDto, _$DocumentRegionTableMergeDto];

  @override
  final String wireName = r'DocumentRegionTableMergeDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    DocumentRegionTableMergeDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'row0';
    yield serializers.serialize(
      object.row0,
      specifiedType: const FullType(num),
    );
    yield r'col0';
    yield serializers.serialize(
      object.col0,
      specifiedType: const FullType(num),
    );
    yield r'rowSpan';
    yield serializers.serialize(
      object.rowSpan,
      specifiedType: const FullType(num),
    );
    yield r'colSpan';
    yield serializers.serialize(
      object.colSpan,
      specifiedType: const FullType(num),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    DocumentRegionTableMergeDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required DocumentRegionTableMergeDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'row0':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(num),
          ) as num;
          result.row0 = valueDes;
          break;
        case r'col0':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(num),
          ) as num;
          result.col0 = valueDes;
          break;
        case r'rowSpan':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(num),
          ) as num;
          result.rowSpan = valueDes;
          break;
        case r'colSpan':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(num),
          ) as num;
          result.colSpan = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  DocumentRegionTableMergeDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = DocumentRegionTableMergeDtoBuilder();
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

