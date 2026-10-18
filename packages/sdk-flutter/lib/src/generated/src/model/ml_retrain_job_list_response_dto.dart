//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:docuvate/src/generated/src/model/ml_retrain_job_dto.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'ml_retrain_job_list_response_dto.g.dart';

/// MlRetrainJobListResponseDto
///
/// Properties:
/// * [jobs] 
@BuiltValue()
abstract class MlRetrainJobListResponseDto implements Built<MlRetrainJobListResponseDto, MlRetrainJobListResponseDtoBuilder> {
  @BuiltValueField(wireName: r'jobs')
  BuiltList<MlRetrainJobDto> get jobs;

  MlRetrainJobListResponseDto._();

  factory MlRetrainJobListResponseDto([void updates(MlRetrainJobListResponseDtoBuilder b)]) = _$MlRetrainJobListResponseDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(MlRetrainJobListResponseDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<MlRetrainJobListResponseDto> get serializer => _$MlRetrainJobListResponseDtoSerializer();
}

class _$MlRetrainJobListResponseDtoSerializer implements PrimitiveSerializer<MlRetrainJobListResponseDto> {
  @override
  final Iterable<Type> types = const [MlRetrainJobListResponseDto, _$MlRetrainJobListResponseDto];

  @override
  final String wireName = r'MlRetrainJobListResponseDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    MlRetrainJobListResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'jobs';
    yield serializers.serialize(
      object.jobs,
      specifiedType: const FullType(BuiltList, [FullType(MlRetrainJobDto)]),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    MlRetrainJobListResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required MlRetrainJobListResponseDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'jobs':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(MlRetrainJobDto)]),
          ) as BuiltList<MlRetrainJobDto>;
          result.jobs.replace(valueDes);
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  MlRetrainJobListResponseDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = MlRetrainJobListResponseDtoBuilder();
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

