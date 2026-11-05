//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:docuvate/src/generated/src/model/document_region_dto.dart';
import 'package:docuvate/src/generated/src/model/document_correction_dto.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'apply_table_correction_response_dto.g.dart';

/// ApplyTableCorrectionResponseDto
///
/// Properties:
/// * [noChange] 
/// * [correction] 
/// * [region] 
@BuiltValue()
abstract class ApplyTableCorrectionResponseDto implements Built<ApplyTableCorrectionResponseDto, ApplyTableCorrectionResponseDtoBuilder> {
  @BuiltValueField(wireName: r'noChange')
  bool get noChange;

  @BuiltValueField(wireName: r'correction')
  DocumentCorrectionDto get correction;

  @BuiltValueField(wireName: r'region')
  DocumentRegionDto get region;

  ApplyTableCorrectionResponseDto._();

  factory ApplyTableCorrectionResponseDto([void updates(ApplyTableCorrectionResponseDtoBuilder b)]) = _$ApplyTableCorrectionResponseDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(ApplyTableCorrectionResponseDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<ApplyTableCorrectionResponseDto> get serializer => _$ApplyTableCorrectionResponseDtoSerializer();
}

class _$ApplyTableCorrectionResponseDtoSerializer implements PrimitiveSerializer<ApplyTableCorrectionResponseDto> {
  @override
  final Iterable<Type> types = const [ApplyTableCorrectionResponseDto, _$ApplyTableCorrectionResponseDto];

  @override
  final String wireName = r'ApplyTableCorrectionResponseDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    ApplyTableCorrectionResponseDto object, {
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
    ApplyTableCorrectionResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required ApplyTableCorrectionResponseDtoBuilder result,
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
  ApplyTableCorrectionResponseDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = ApplyTableCorrectionResponseDtoBuilder();
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

