//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'apply_label_correction_response_dto.g.dart';

/// ApplyLabelCorrectionResponseDto
///
/// Properties:
/// * [ok] 
/// * [correctionId] 
/// * [similarDocumentsUpdated] 
@BuiltValue()
abstract class ApplyLabelCorrectionResponseDto implements Built<ApplyLabelCorrectionResponseDto, ApplyLabelCorrectionResponseDtoBuilder> {
  @BuiltValueField(wireName: r'ok')
  bool get ok;

  @BuiltValueField(wireName: r'correctionId')
  String get correctionId;

  @BuiltValueField(wireName: r'similarDocumentsUpdated')
  num get similarDocumentsUpdated;

  ApplyLabelCorrectionResponseDto._();

  factory ApplyLabelCorrectionResponseDto([void updates(ApplyLabelCorrectionResponseDtoBuilder b)]) = _$ApplyLabelCorrectionResponseDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(ApplyLabelCorrectionResponseDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<ApplyLabelCorrectionResponseDto> get serializer => _$ApplyLabelCorrectionResponseDtoSerializer();
}

class _$ApplyLabelCorrectionResponseDtoSerializer implements PrimitiveSerializer<ApplyLabelCorrectionResponseDto> {
  @override
  final Iterable<Type> types = const [ApplyLabelCorrectionResponseDto, _$ApplyLabelCorrectionResponseDto];

  @override
  final String wireName = r'ApplyLabelCorrectionResponseDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    ApplyLabelCorrectionResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'ok';
    yield serializers.serialize(
      object.ok,
      specifiedType: const FullType(bool),
    );
    yield r'correctionId';
    yield serializers.serialize(
      object.correctionId,
      specifiedType: const FullType(String),
    );
    yield r'similarDocumentsUpdated';
    yield serializers.serialize(
      object.similarDocumentsUpdated,
      specifiedType: const FullType(num),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    ApplyLabelCorrectionResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required ApplyLabelCorrectionResponseDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'ok':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.ok = valueDes;
          break;
        case r'correctionId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.correctionId = valueDes;
          break;
        case r'similarDocumentsUpdated':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(num),
          ) as num;
          result.similarDocumentsUpdated = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  ApplyLabelCorrectionResponseDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = ApplyLabelCorrectionResponseDtoBuilder();
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

