//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'ml_retrain_job_dto.g.dart';

/// MlRetrainJobDto
///
/// Properties:
/// * [id] 
/// * [familyId] 
/// * [triggerKind] 
/// * [status] 
/// * [trainingSnapshotId] 
/// * [resultVersionId] 
/// * [errorMessage] 
/// * [createdAt] 
/// * [startedAt] 
/// * [finishedAt] 
@BuiltValue()
abstract class MlRetrainJobDto implements Built<MlRetrainJobDto, MlRetrainJobDtoBuilder> {
  @BuiltValueField(wireName: r'id')
  String get id;

  @BuiltValueField(wireName: r'familyId')
  String get familyId;

  @BuiltValueField(wireName: r'triggerKind')
  MlRetrainJobDtoTriggerKindEnum get triggerKind;
  // enum triggerKindEnum {  manual,  threshold,  cron,  };

  @BuiltValueField(wireName: r'status')
  MlRetrainJobDtoStatusEnum get status;
  // enum statusEnum {  queued,  failed,  cancelled,  running,  succeeded,  };

  @BuiltValueField(wireName: r'trainingSnapshotId')
  String get trainingSnapshotId;

  @BuiltValueField(wireName: r'resultVersionId')
  String get resultVersionId;

  @BuiltValueField(wireName: r'errorMessage')
  String get errorMessage;

  @BuiltValueField(wireName: r'createdAt')
  String get createdAt;

  @BuiltValueField(wireName: r'startedAt')
  String get startedAt;

  @BuiltValueField(wireName: r'finishedAt')
  String get finishedAt;

  MlRetrainJobDto._();

  factory MlRetrainJobDto([void updates(MlRetrainJobDtoBuilder b)]) = _$MlRetrainJobDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(MlRetrainJobDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<MlRetrainJobDto> get serializer => _$MlRetrainJobDtoSerializer();
}

class _$MlRetrainJobDtoSerializer implements PrimitiveSerializer<MlRetrainJobDto> {
  @override
  final Iterable<Type> types = const [MlRetrainJobDto, _$MlRetrainJobDto];

  @override
  final String wireName = r'MlRetrainJobDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    MlRetrainJobDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'id';
    yield serializers.serialize(
      object.id,
      specifiedType: const FullType(String),
    );
    yield r'familyId';
    yield serializers.serialize(
      object.familyId,
      specifiedType: const FullType(String),
    );
    yield r'triggerKind';
    yield serializers.serialize(
      object.triggerKind,
      specifiedType: const FullType(MlRetrainJobDtoTriggerKindEnum),
    );
    yield r'status';
    yield serializers.serialize(
      object.status,
      specifiedType: const FullType(MlRetrainJobDtoStatusEnum),
    );
    yield r'trainingSnapshotId';
    yield serializers.serialize(
      object.trainingSnapshotId,
      specifiedType: const FullType(String),
    );
    yield r'resultVersionId';
    yield serializers.serialize(
      object.resultVersionId,
      specifiedType: const FullType(String),
    );
    yield r'errorMessage';
    yield serializers.serialize(
      object.errorMessage,
      specifiedType: const FullType(String),
    );
    yield r'createdAt';
    yield serializers.serialize(
      object.createdAt,
      specifiedType: const FullType(String),
    );
    yield r'startedAt';
    yield serializers.serialize(
      object.startedAt,
      specifiedType: const FullType(String),
    );
    yield r'finishedAt';
    yield serializers.serialize(
      object.finishedAt,
      specifiedType: const FullType(String),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    MlRetrainJobDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required MlRetrainJobDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'id':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.id = valueDes;
          break;
        case r'familyId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.familyId = valueDes;
          break;
        case r'triggerKind':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(MlRetrainJobDtoTriggerKindEnum),
          ) as MlRetrainJobDtoTriggerKindEnum;
          result.triggerKind = valueDes;
          break;
        case r'status':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(MlRetrainJobDtoStatusEnum),
          ) as MlRetrainJobDtoStatusEnum;
          result.status = valueDes;
          break;
        case r'trainingSnapshotId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.trainingSnapshotId = valueDes;
          break;
        case r'resultVersionId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.resultVersionId = valueDes;
          break;
        case r'errorMessage':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.errorMessage = valueDes;
          break;
        case r'createdAt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.createdAt = valueDes;
          break;
        case r'startedAt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.startedAt = valueDes;
          break;
        case r'finishedAt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.finishedAt = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  MlRetrainJobDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = MlRetrainJobDtoBuilder();
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

class MlRetrainJobDtoTriggerKindEnum extends EnumClass {

  @BuiltValueEnumConst(wireName: r'manual')
  static const MlRetrainJobDtoTriggerKindEnum manual = _$mlRetrainJobDtoTriggerKindEnum_manual;
  @BuiltValueEnumConst(wireName: r'threshold')
  static const MlRetrainJobDtoTriggerKindEnum threshold = _$mlRetrainJobDtoTriggerKindEnum_threshold;
  @BuiltValueEnumConst(wireName: r'cron')
  static const MlRetrainJobDtoTriggerKindEnum cron = _$mlRetrainJobDtoTriggerKindEnum_cron;

  static Serializer<MlRetrainJobDtoTriggerKindEnum> get serializer => _$mlRetrainJobDtoTriggerKindEnumSerializer;

  const MlRetrainJobDtoTriggerKindEnum._(String name): super(name);

  static BuiltSet<MlRetrainJobDtoTriggerKindEnum> get values => _$mlRetrainJobDtoTriggerKindEnumValues;
  static MlRetrainJobDtoTriggerKindEnum valueOf(String name) => _$mlRetrainJobDtoTriggerKindEnumValueOf(name);
}

class MlRetrainJobDtoStatusEnum extends EnumClass {

  @BuiltValueEnumConst(wireName: r'queued')
  static const MlRetrainJobDtoStatusEnum queued = _$mlRetrainJobDtoStatusEnum_queued;
  @BuiltValueEnumConst(wireName: r'failed')
  static const MlRetrainJobDtoStatusEnum failed = _$mlRetrainJobDtoStatusEnum_failed;
  @BuiltValueEnumConst(wireName: r'cancelled')
  static const MlRetrainJobDtoStatusEnum cancelled = _$mlRetrainJobDtoStatusEnum_cancelled;
  @BuiltValueEnumConst(wireName: r'running')
  static const MlRetrainJobDtoStatusEnum running = _$mlRetrainJobDtoStatusEnum_running;
  @BuiltValueEnumConst(wireName: r'succeeded')
  static const MlRetrainJobDtoStatusEnum succeeded = _$mlRetrainJobDtoStatusEnum_succeeded;

  static Serializer<MlRetrainJobDtoStatusEnum> get serializer => _$mlRetrainJobDtoStatusEnumSerializer;

  const MlRetrainJobDtoStatusEnum._(String name): super(name);

  static BuiltSet<MlRetrainJobDtoStatusEnum> get values => _$mlRetrainJobDtoStatusEnumValues;
  static MlRetrainJobDtoStatusEnum valueOf(String name) => _$mlRetrainJobDtoStatusEnumValueOf(name);
}

