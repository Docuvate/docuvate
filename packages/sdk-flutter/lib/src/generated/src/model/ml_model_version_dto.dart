//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'ml_model_version_dto.g.dart';

/// MlModelVersionDto
///
/// Properties:
/// * [id] 
/// * [familyId] 
/// * [versionTag] 
/// * [artifactUri] 
/// * [externalRunId] 
/// * [metrics] 
/// * [lifecycle] 
/// * [trainingSnapshotId] 
/// * [notes] 
/// * [createdAt] 
/// * [promotedAt] 
@BuiltValue()
abstract class MlModelVersionDto implements Built<MlModelVersionDto, MlModelVersionDtoBuilder> {
  @BuiltValueField(wireName: r'id')
  String get id;

  @BuiltValueField(wireName: r'familyId')
  String get familyId;

  @BuiltValueField(wireName: r'versionTag')
  String get versionTag;

  @BuiltValueField(wireName: r'artifactUri')
  String get artifactUri;

  @BuiltValueField(wireName: r'externalRunId')
  String get externalRunId;

  @BuiltValueField(wireName: r'metrics')
  BuiltMap<String, num> get metrics;

  @BuiltValueField(wireName: r'lifecycle')
  MlModelVersionDtoLifecycleEnum get lifecycle;
  // enum lifecycleEnum {  failed,  active,  registered,  canary,  archived,  };

  @BuiltValueField(wireName: r'trainingSnapshotId')
  String get trainingSnapshotId;

  @BuiltValueField(wireName: r'notes')
  String get notes;

  @BuiltValueField(wireName: r'createdAt')
  String get createdAt;

  @BuiltValueField(wireName: r'promotedAt')
  String get promotedAt;

  MlModelVersionDto._();

  factory MlModelVersionDto([void updates(MlModelVersionDtoBuilder b)]) = _$MlModelVersionDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(MlModelVersionDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<MlModelVersionDto> get serializer => _$MlModelVersionDtoSerializer();
}

class _$MlModelVersionDtoSerializer implements PrimitiveSerializer<MlModelVersionDto> {
  @override
  final Iterable<Type> types = const [MlModelVersionDto, _$MlModelVersionDto];

  @override
  final String wireName = r'MlModelVersionDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    MlModelVersionDto object, {
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
    yield r'versionTag';
    yield serializers.serialize(
      object.versionTag,
      specifiedType: const FullType(String),
    );
    yield r'artifactUri';
    yield serializers.serialize(
      object.artifactUri,
      specifiedType: const FullType(String),
    );
    yield r'externalRunId';
    yield serializers.serialize(
      object.externalRunId,
      specifiedType: const FullType(String),
    );
    yield r'metrics';
    yield serializers.serialize(
      object.metrics,
      specifiedType: const FullType(BuiltMap, [FullType(String), FullType(num)]),
    );
    yield r'lifecycle';
    yield serializers.serialize(
      object.lifecycle,
      specifiedType: const FullType(MlModelVersionDtoLifecycleEnum),
    );
    yield r'trainingSnapshotId';
    yield serializers.serialize(
      object.trainingSnapshotId,
      specifiedType: const FullType(String),
    );
    yield r'notes';
    yield serializers.serialize(
      object.notes,
      specifiedType: const FullType(String),
    );
    yield r'createdAt';
    yield serializers.serialize(
      object.createdAt,
      specifiedType: const FullType(String),
    );
    yield r'promotedAt';
    yield serializers.serialize(
      object.promotedAt,
      specifiedType: const FullType(String),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    MlModelVersionDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required MlModelVersionDtoBuilder result,
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
        case r'versionTag':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.versionTag = valueDes;
          break;
        case r'artifactUri':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.artifactUri = valueDes;
          break;
        case r'externalRunId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.externalRunId = valueDes;
          break;
        case r'metrics':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltMap, [FullType(String), FullType(num)]),
          ) as BuiltMap<String, num>;
          result.metrics.replace(valueDes);
          break;
        case r'lifecycle':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(MlModelVersionDtoLifecycleEnum),
          ) as MlModelVersionDtoLifecycleEnum;
          result.lifecycle = valueDes;
          break;
        case r'trainingSnapshotId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.trainingSnapshotId = valueDes;
          break;
        case r'notes':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.notes = valueDes;
          break;
        case r'createdAt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.createdAt = valueDes;
          break;
        case r'promotedAt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.promotedAt = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  MlModelVersionDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = MlModelVersionDtoBuilder();
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

class MlModelVersionDtoLifecycleEnum extends EnumClass {

  @BuiltValueEnumConst(wireName: r'failed')
  static const MlModelVersionDtoLifecycleEnum failed = _$mlModelVersionDtoLifecycleEnum_failed;
  @BuiltValueEnumConst(wireName: r'active')
  static const MlModelVersionDtoLifecycleEnum active = _$mlModelVersionDtoLifecycleEnum_active;
  @BuiltValueEnumConst(wireName: r'registered')
  static const MlModelVersionDtoLifecycleEnum registered = _$mlModelVersionDtoLifecycleEnum_registered;
  @BuiltValueEnumConst(wireName: r'canary')
  static const MlModelVersionDtoLifecycleEnum canary = _$mlModelVersionDtoLifecycleEnum_canary;
  @BuiltValueEnumConst(wireName: r'archived')
  static const MlModelVersionDtoLifecycleEnum archived = _$mlModelVersionDtoLifecycleEnum_archived;

  static Serializer<MlModelVersionDtoLifecycleEnum> get serializer => _$mlModelVersionDtoLifecycleEnumSerializer;

  const MlModelVersionDtoLifecycleEnum._(String name): super(name);

  static BuiltSet<MlModelVersionDtoLifecycleEnum> get values => _$mlModelVersionDtoLifecycleEnumValues;
  static MlModelVersionDtoLifecycleEnum valueOf(String name) => _$mlModelVersionDtoLifecycleEnumValueOf(name);
}

