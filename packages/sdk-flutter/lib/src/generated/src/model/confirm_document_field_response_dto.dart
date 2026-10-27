//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'confirm_document_field_response_dto.g.dart';

/// ConfirmDocumentFieldResponseDto
///
/// Properties:
/// * [confirmed] 
/// * [fieldKey] 
/// * [valueSha256] 
@BuiltValue()
abstract class ConfirmDocumentFieldResponseDto implements Built<ConfirmDocumentFieldResponseDto, ConfirmDocumentFieldResponseDtoBuilder> {
  @BuiltValueField(wireName: r'confirmed')
  bool get confirmed;

  @BuiltValueField(wireName: r'fieldKey')
  String get fieldKey;

  @BuiltValueField(wireName: r'valueSha256')
  String get valueSha256;

  ConfirmDocumentFieldResponseDto._();

  factory ConfirmDocumentFieldResponseDto([void updates(ConfirmDocumentFieldResponseDtoBuilder b)]) = _$ConfirmDocumentFieldResponseDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(ConfirmDocumentFieldResponseDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<ConfirmDocumentFieldResponseDto> get serializer => _$ConfirmDocumentFieldResponseDtoSerializer();
}

class _$ConfirmDocumentFieldResponseDtoSerializer implements PrimitiveSerializer<ConfirmDocumentFieldResponseDto> {
  @override
  final Iterable<Type> types = const [ConfirmDocumentFieldResponseDto, _$ConfirmDocumentFieldResponseDto];

  @override
  final String wireName = r'ConfirmDocumentFieldResponseDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    ConfirmDocumentFieldResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'confirmed';
    yield serializers.serialize(
      object.confirmed,
      specifiedType: const FullType(bool),
    );
    yield r'fieldKey';
    yield serializers.serialize(
      object.fieldKey,
      specifiedType: const FullType(String),
    );
    yield r'valueSha256';
    yield serializers.serialize(
      object.valueSha256,
      specifiedType: const FullType(String),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    ConfirmDocumentFieldResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required ConfirmDocumentFieldResponseDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'confirmed':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.confirmed = valueDes;
          break;
        case r'fieldKey':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.fieldKey = valueDes;
          break;
        case r'valueSha256':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.valueSha256 = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  ConfirmDocumentFieldResponseDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = ConfirmDocumentFieldResponseDtoBuilder();
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

