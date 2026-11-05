//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'document_region_table_cell_dto.g.dart';

/// DocumentRegionTableCellDto
///
/// Properties:
/// * [row] 
/// * [col] 
/// * [text] 
@BuiltValue()
abstract class DocumentRegionTableCellDto implements Built<DocumentRegionTableCellDto, DocumentRegionTableCellDtoBuilder> {
  @BuiltValueField(wireName: r'row')
  num get row;

  @BuiltValueField(wireName: r'col')
  num get col;

  @BuiltValueField(wireName: r'text')
  String get text;

  DocumentRegionTableCellDto._();

  factory DocumentRegionTableCellDto([void updates(DocumentRegionTableCellDtoBuilder b)]) = _$DocumentRegionTableCellDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(DocumentRegionTableCellDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<DocumentRegionTableCellDto> get serializer => _$DocumentRegionTableCellDtoSerializer();
}

class _$DocumentRegionTableCellDtoSerializer implements PrimitiveSerializer<DocumentRegionTableCellDto> {
  @override
  final Iterable<Type> types = const [DocumentRegionTableCellDto, _$DocumentRegionTableCellDto];

  @override
  final String wireName = r'DocumentRegionTableCellDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    DocumentRegionTableCellDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'row';
    yield serializers.serialize(
      object.row,
      specifiedType: const FullType(num),
    );
    yield r'col';
    yield serializers.serialize(
      object.col,
      specifiedType: const FullType(num),
    );
    yield r'text';
    yield serializers.serialize(
      object.text,
      specifiedType: const FullType(String),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    DocumentRegionTableCellDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required DocumentRegionTableCellDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'row':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(num),
          ) as num;
          result.row = valueDes;
          break;
        case r'col':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(num),
          ) as num;
          result.col = valueDes;
          break;
        case r'text':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.text = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  DocumentRegionTableCellDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = DocumentRegionTableCellDtoBuilder();
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

