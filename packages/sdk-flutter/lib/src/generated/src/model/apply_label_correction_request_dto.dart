//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'apply_label_correction_request_dto.g.dart';

/// ApplyLabelCorrectionRequestDto
///
/// Properties:
/// * [toTagId] 
@BuiltValue()
abstract class ApplyLabelCorrectionRequestDto implements Built<ApplyLabelCorrectionRequestDto, ApplyLabelCorrectionRequestDtoBuilder> {
  @BuiltValueField(wireName: r'toTagId')
  String get toTagId;

  ApplyLabelCorrectionRequestDto._();

  factory ApplyLabelCorrectionRequestDto([void updates(ApplyLabelCorrectionRequestDtoBuilder b)]) = _$ApplyLabelCorrectionRequestDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(ApplyLabelCorrectionRequestDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<ApplyLabelCorrectionRequestDto> get serializer => _$ApplyLabelCorrectionRequestDtoSerializer();
}

class _$ApplyLabelCorrectionRequestDtoSerializer implements PrimitiveSerializer<ApplyLabelCorrectionRequestDto> {
  @override
  final Iterable<Type> types = const [ApplyLabelCorrectionRequestDto, _$ApplyLabelCorrectionRequestDto];

  @override
  final String wireName = r'ApplyLabelCorrectionRequestDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    ApplyLabelCorrectionRequestDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'toTagId';
    yield serializers.serialize(
      object.toTagId,
      specifiedType: const FullType(String),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    ApplyLabelCorrectionRequestDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required ApplyLabelCorrectionRequestDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'toTagId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.toTagId = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  ApplyLabelCorrectionRequestDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = ApplyLabelCorrectionRequestDtoBuilder();
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

