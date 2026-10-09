//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'document_extraction_summary_dto_layout_ir_pages_inner.g.dart';

/// DocumentExtractionSummaryDtoLayoutIrPagesInner
///
/// Properties:
/// * [page] 
/// * [widthPt] 
/// * [heightPt] 
@BuiltValue()
abstract class DocumentExtractionSummaryDtoLayoutIrPagesInner implements Built<DocumentExtractionSummaryDtoLayoutIrPagesInner, DocumentExtractionSummaryDtoLayoutIrPagesInnerBuilder> {
  @BuiltValueField(wireName: r'page')
  int? get page;

  @BuiltValueField(wireName: r'widthPt')
  num? get widthPt;

  @BuiltValueField(wireName: r'heightPt')
  num? get heightPt;

  DocumentExtractionSummaryDtoLayoutIrPagesInner._();

  factory DocumentExtractionSummaryDtoLayoutIrPagesInner([void updates(DocumentExtractionSummaryDtoLayoutIrPagesInnerBuilder b)]) = _$DocumentExtractionSummaryDtoLayoutIrPagesInner;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(DocumentExtractionSummaryDtoLayoutIrPagesInnerBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<DocumentExtractionSummaryDtoLayoutIrPagesInner> get serializer => _$DocumentExtractionSummaryDtoLayoutIrPagesInnerSerializer();
}

class _$DocumentExtractionSummaryDtoLayoutIrPagesInnerSerializer implements PrimitiveSerializer<DocumentExtractionSummaryDtoLayoutIrPagesInner> {
  @override
  final Iterable<Type> types = const [DocumentExtractionSummaryDtoLayoutIrPagesInner, _$DocumentExtractionSummaryDtoLayoutIrPagesInner];

  @override
  final String wireName = r'DocumentExtractionSummaryDtoLayoutIrPagesInner';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    DocumentExtractionSummaryDtoLayoutIrPagesInner object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    if (object.page != null) {
      yield r'page';
      yield serializers.serialize(
        object.page,
        specifiedType: const FullType(int),
      );
    }
    if (object.widthPt != null) {
      yield r'widthPt';
      yield serializers.serialize(
        object.widthPt,
        specifiedType: const FullType(num),
      );
    }
    if (object.heightPt != null) {
      yield r'heightPt';
      yield serializers.serialize(
        object.heightPt,
        specifiedType: const FullType(num),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    DocumentExtractionSummaryDtoLayoutIrPagesInner object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required DocumentExtractionSummaryDtoLayoutIrPagesInnerBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'page':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.page = valueDes;
          break;
        case r'widthPt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(num),
          ) as num;
          result.widthPt = valueDes;
          break;
        case r'heightPt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(num),
          ) as num;
          result.heightPt = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  DocumentExtractionSummaryDtoLayoutIrPagesInner deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = DocumentExtractionSummaryDtoLayoutIrPagesInnerBuilder();
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

