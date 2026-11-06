//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'extracted_field_dto.g.dart';

/// ExtractedFieldDto
///
/// Properties:
/// * [key] 
/// * [value] 
/// * [confidence] 
/// * [tagId] - Label id for label-scoped custom fields (`label:{tagId}:{key}`).
/// * [userConfirmed] - True once a person confirmed or corrected the value.
@BuiltValue()
abstract class ExtractedFieldDto implements Built<ExtractedFieldDto, ExtractedFieldDtoBuilder> {
  @BuiltValueField(wireName: r'key')
  String get key;

  @BuiltValueField(wireName: r'value')
  String get value;

  @BuiltValueField(wireName: r'confidence')
  num? get confidence;

  /// Label id for label-scoped custom fields (`label:{tagId}:{key}`).
  @BuiltValueField(wireName: r'tagId')
  String? get tagId;

  /// True once a person confirmed or corrected the value.
  @BuiltValueField(wireName: r'userConfirmed')
  bool? get userConfirmed;

  ExtractedFieldDto._();

  factory ExtractedFieldDto([void updates(ExtractedFieldDtoBuilder b)]) = _$ExtractedFieldDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(ExtractedFieldDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<ExtractedFieldDto> get serializer => _$ExtractedFieldDtoSerializer();
}

class _$ExtractedFieldDtoSerializer implements PrimitiveSerializer<ExtractedFieldDto> {
  @override
  final Iterable<Type> types = const [ExtractedFieldDto, _$ExtractedFieldDto];

  @override
  final String wireName = r'ExtractedFieldDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    ExtractedFieldDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'key';
    yield serializers.serialize(
      object.key,
      specifiedType: const FullType(String),
    );
    yield r'value';
    yield serializers.serialize(
      object.value,
      specifiedType: const FullType(String),
    );
    if (object.confidence != null) {
      yield r'confidence';
      yield serializers.serialize(
        object.confidence,
        specifiedType: const FullType(num),
      );
    }
    if (object.tagId != null) {
      yield r'tagId';
      yield serializers.serialize(
        object.tagId,
        specifiedType: const FullType(String),
      );
    }
    if (object.userConfirmed != null) {
      yield r'userConfirmed';
      yield serializers.serialize(
        object.userConfirmed,
        specifiedType: const FullType(bool),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    ExtractedFieldDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required ExtractedFieldDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'key':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.key = valueDes;
          break;
        case r'value':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.value = valueDes;
          break;
        case r'confidence':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(num),
          ) as num;
          result.confidence = valueDes;
          break;
        case r'tagId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.tagId = valueDes;
          break;
        case r'userConfirmed':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.userConfirmed = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  ExtractedFieldDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = ExtractedFieldDtoBuilder();
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

