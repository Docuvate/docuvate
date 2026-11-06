//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'confirm_document_field_request_dto.g.dart';

/// ConfirmDocumentFieldRequestDto
///
/// Properties:
/// * [fieldKey] - Storage key of the field as returned in `extraction.fields[].key`.
/// * [value] - Value the person confirms. An empty string keeps the stored value.
@BuiltValue()
abstract class ConfirmDocumentFieldRequestDto implements Built<ConfirmDocumentFieldRequestDto, ConfirmDocumentFieldRequestDtoBuilder> {
  /// Storage key of the field as returned in `extraction.fields[].key`.
  @BuiltValueField(wireName: r'fieldKey')
  String get fieldKey;

  /// Value the person confirms. An empty string keeps the stored value.
  @BuiltValueField(wireName: r'value')
  String get value;

  ConfirmDocumentFieldRequestDto._();

  factory ConfirmDocumentFieldRequestDto([void updates(ConfirmDocumentFieldRequestDtoBuilder b)]) = _$ConfirmDocumentFieldRequestDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(ConfirmDocumentFieldRequestDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<ConfirmDocumentFieldRequestDto> get serializer => _$ConfirmDocumentFieldRequestDtoSerializer();
}

class _$ConfirmDocumentFieldRequestDtoSerializer implements PrimitiveSerializer<ConfirmDocumentFieldRequestDto> {
  @override
  final Iterable<Type> types = const [ConfirmDocumentFieldRequestDto, _$ConfirmDocumentFieldRequestDto];

  @override
  final String wireName = r'ConfirmDocumentFieldRequestDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    ConfirmDocumentFieldRequestDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'fieldKey';
    yield serializers.serialize(
      object.fieldKey,
      specifiedType: const FullType(String),
    );
    yield r'value';
    yield serializers.serialize(
      object.value,
      specifiedType: const FullType(String),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    ConfirmDocumentFieldRequestDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required ConfirmDocumentFieldRequestDtoBuilder result,
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
        case r'value':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.value = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  ConfirmDocumentFieldRequestDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = ConfirmDocumentFieldRequestDtoBuilder();
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

