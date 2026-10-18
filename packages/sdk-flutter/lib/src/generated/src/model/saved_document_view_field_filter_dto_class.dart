//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'saved_document_view_field_filter_dto_class.g.dart';

/// SavedDocumentViewFieldFilterDtoClass
///
/// Properties:
/// * [fieldKey] 
/// * [valueText] 
@BuiltValue()
abstract class SavedDocumentViewFieldFilterDtoClass implements Built<SavedDocumentViewFieldFilterDtoClass, SavedDocumentViewFieldFilterDtoClassBuilder> {
  @BuiltValueField(wireName: r'fieldKey')
  String get fieldKey;

  @BuiltValueField(wireName: r'valueText')
  String get valueText;

  SavedDocumentViewFieldFilterDtoClass._();

  factory SavedDocumentViewFieldFilterDtoClass([void updates(SavedDocumentViewFieldFilterDtoClassBuilder b)]) = _$SavedDocumentViewFieldFilterDtoClass;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(SavedDocumentViewFieldFilterDtoClassBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<SavedDocumentViewFieldFilterDtoClass> get serializer => _$SavedDocumentViewFieldFilterDtoClassSerializer();
}

class _$SavedDocumentViewFieldFilterDtoClassSerializer implements PrimitiveSerializer<SavedDocumentViewFieldFilterDtoClass> {
  @override
  final Iterable<Type> types = const [SavedDocumentViewFieldFilterDtoClass, _$SavedDocumentViewFieldFilterDtoClass];

  @override
  final String wireName = r'SavedDocumentViewFieldFilterDtoClass';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    SavedDocumentViewFieldFilterDtoClass object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'fieldKey';
    yield serializers.serialize(
      object.fieldKey,
      specifiedType: const FullType(String),
    );
    yield r'valueText';
    yield serializers.serialize(
      object.valueText,
      specifiedType: const FullType(String),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    SavedDocumentViewFieldFilterDtoClass object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required SavedDocumentViewFieldFilterDtoClassBuilder result,
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
        case r'valueText':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.valueText = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  SavedDocumentViewFieldFilterDtoClass deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = SavedDocumentViewFieldFilterDtoClassBuilder();
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

