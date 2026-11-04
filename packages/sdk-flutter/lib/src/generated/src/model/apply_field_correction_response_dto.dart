//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:docuvate/src/generated/src/model/document_region_dto.dart';
import 'package:docuvate/src/generated/src/model/document_correction_dto.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'apply_field_correction_response_dto.g.dart';

/// ApplyFieldCorrectionResponseDto
///
/// Properties:
/// * [noChange] 
/// * [correction] 
/// * [region] 
@BuiltValue()
abstract class ApplyFieldCorrectionResponseDto implements Built<ApplyFieldCorrectionResponseDto, ApplyFieldCorrectionResponseDtoBuilder> {
  @BuiltValueField(wireName: r'noChange')
  bool get noChange;

  @BuiltValueField(wireName: r'correction')
  DocumentCorrectionDto get correction;

  @BuiltValueField(wireName: r'region')
  DocumentRegionDto get region;

  ApplyFieldCorrectionResponseDto._();

  factory ApplyFieldCorrectionResponseDto([void updates(ApplyFieldCorrectionResponseDtoBuilder b)]) = _$ApplyFieldCorrectionResponseDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(ApplyFieldCorrectionResponseDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<ApplyFieldCorrectionResponseDto> get serializer => _$ApplyFieldCorrectionResponseDtoSerializer();
}

class _$ApplyFieldCorrectionResponseDtoSerializer implements PrimitiveSerializer<ApplyFieldCorrectionResponseDto> {
  @override
  final Iterable<Type> types = const [ApplyFieldCorrectionResponseDto, _$ApplyFieldCorrectionResponseDto];

  @override
  final String wireName = r'ApplyFieldCorrectionResponseDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    ApplyFieldCorrectionResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'noChange';
    yield serializers.serialize(
      object.noChange,
      specifiedType: const FullType(bool),
    );
    yield r'correction';
    yield serializers.serialize(
      object.correction,
      specifiedType: const FullType(DocumentCorrectionDto),
    );
    yield r'region';
    yield serializers.serialize(
      object.region,
      specifiedType: const FullType(DocumentRegionDto),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    ApplyFieldCorrectionResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required ApplyFieldCorrectionResponseDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'noChange':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.noChange = valueDes;
          break;
        case r'correction':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(DocumentCorrectionDto),
          ) as DocumentCorrectionDto;
          result.correction.replace(valueDes);
          break;
        case r'region':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(DocumentRegionDto),
          ) as DocumentRegionDto;
          result.region.replace(valueDes);
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  ApplyFieldCorrectionResponseDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = ApplyFieldCorrectionResponseDtoBuilder();
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

