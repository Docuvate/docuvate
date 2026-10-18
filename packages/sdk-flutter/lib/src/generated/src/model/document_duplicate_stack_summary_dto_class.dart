//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'document_duplicate_stack_summary_dto_class.g.dart';

/// DocumentDuplicateStackSummaryDtoClass
///
/// Properties:
/// * [stackId] 
/// * [versionCount] 
/// * [pendingReview] 
@BuiltValue()
abstract class DocumentDuplicateStackSummaryDtoClass implements Built<DocumentDuplicateStackSummaryDtoClass, DocumentDuplicateStackSummaryDtoClassBuilder> {
  @BuiltValueField(wireName: r'stackId')
  String get stackId;

  @BuiltValueField(wireName: r'versionCount')
  num get versionCount;

  @BuiltValueField(wireName: r'pendingReview')
  bool get pendingReview;

  DocumentDuplicateStackSummaryDtoClass._();

  factory DocumentDuplicateStackSummaryDtoClass([void updates(DocumentDuplicateStackSummaryDtoClassBuilder b)]) = _$DocumentDuplicateStackSummaryDtoClass;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(DocumentDuplicateStackSummaryDtoClassBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<DocumentDuplicateStackSummaryDtoClass> get serializer => _$DocumentDuplicateStackSummaryDtoClassSerializer();
}

class _$DocumentDuplicateStackSummaryDtoClassSerializer implements PrimitiveSerializer<DocumentDuplicateStackSummaryDtoClass> {
  @override
  final Iterable<Type> types = const [DocumentDuplicateStackSummaryDtoClass, _$DocumentDuplicateStackSummaryDtoClass];

  @override
  final String wireName = r'DocumentDuplicateStackSummaryDtoClass';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    DocumentDuplicateStackSummaryDtoClass object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'stackId';
    yield serializers.serialize(
      object.stackId,
      specifiedType: const FullType(String),
    );
    yield r'versionCount';
    yield serializers.serialize(
      object.versionCount,
      specifiedType: const FullType(num),
    );
    yield r'pendingReview';
    yield serializers.serialize(
      object.pendingReview,
      specifiedType: const FullType(bool),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    DocumentDuplicateStackSummaryDtoClass object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required DocumentDuplicateStackSummaryDtoClassBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'stackId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.stackId = valueDes;
          break;
        case r'versionCount':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(num),
          ) as num;
          result.versionCount = valueDes;
          break;
        case r'pendingReview':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.pendingReview = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  DocumentDuplicateStackSummaryDtoClass deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = DocumentDuplicateStackSummaryDtoClassBuilder();
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

