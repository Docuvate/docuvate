// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'ml_model_version_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const MlModelVersionDtoLifecycleEnum _$mlModelVersionDtoLifecycleEnum_failed =
    const MlModelVersionDtoLifecycleEnum._('failed');
const MlModelVersionDtoLifecycleEnum _$mlModelVersionDtoLifecycleEnum_active =
    const MlModelVersionDtoLifecycleEnum._('active');
const MlModelVersionDtoLifecycleEnum
    _$mlModelVersionDtoLifecycleEnum_registered =
    const MlModelVersionDtoLifecycleEnum._('registered');
const MlModelVersionDtoLifecycleEnum _$mlModelVersionDtoLifecycleEnum_canary =
    const MlModelVersionDtoLifecycleEnum._('canary');
const MlModelVersionDtoLifecycleEnum _$mlModelVersionDtoLifecycleEnum_archived =
    const MlModelVersionDtoLifecycleEnum._('archived');

MlModelVersionDtoLifecycleEnum _$mlModelVersionDtoLifecycleEnumValueOf(
    String name) {
  switch (name) {
    case 'failed':
      return _$mlModelVersionDtoLifecycleEnum_failed;
    case 'active':
      return _$mlModelVersionDtoLifecycleEnum_active;
    case 'registered':
      return _$mlModelVersionDtoLifecycleEnum_registered;
    case 'canary':
      return _$mlModelVersionDtoLifecycleEnum_canary;
    case 'archived':
      return _$mlModelVersionDtoLifecycleEnum_archived;
    default:
      throw new ArgumentError(name);
  }
}

final BuiltSet<MlModelVersionDtoLifecycleEnum>
    _$mlModelVersionDtoLifecycleEnumValues = new BuiltSet<
        MlModelVersionDtoLifecycleEnum>(const <MlModelVersionDtoLifecycleEnum>[
  _$mlModelVersionDtoLifecycleEnum_failed,
  _$mlModelVersionDtoLifecycleEnum_active,
  _$mlModelVersionDtoLifecycleEnum_registered,
  _$mlModelVersionDtoLifecycleEnum_canary,
  _$mlModelVersionDtoLifecycleEnum_archived,
]);

Serializer<MlModelVersionDtoLifecycleEnum>
    _$mlModelVersionDtoLifecycleEnumSerializer =
    new _$MlModelVersionDtoLifecycleEnumSerializer();

class _$MlModelVersionDtoLifecycleEnumSerializer
    implements PrimitiveSerializer<MlModelVersionDtoLifecycleEnum> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'failed': 'failed',
    'active': 'active',
    'registered': 'registered',
    'canary': 'canary',
    'archived': 'archived',
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    'failed': 'failed',
    'active': 'active',
    'registered': 'registered',
    'canary': 'canary',
    'archived': 'archived',
  };

  @override
  final Iterable<Type> types = const <Type>[MlModelVersionDtoLifecycleEnum];
  @override
  final String wireName = 'MlModelVersionDtoLifecycleEnum';

  @override
  Object serialize(
          Serializers serializers, MlModelVersionDtoLifecycleEnum object,
          {FullType specifiedType = FullType.unspecified}) =>
      _toWire[object.name] ?? object.name;

  @override
  MlModelVersionDtoLifecycleEnum deserialize(
          Serializers serializers, Object serialized,
          {FullType specifiedType = FullType.unspecified}) =>
      MlModelVersionDtoLifecycleEnum.valueOf(
          _fromWire[serialized] ?? (serialized is String ? serialized : ''));
}

class _$MlModelVersionDto extends MlModelVersionDto {
  @override
  final String id;
  @override
  final String familyId;
  @override
  final String versionTag;
  @override
  final String artifactUri;
  @override
  final String externalRunId;
  @override
  final BuiltMap<String, num> metrics;
  @override
  final MlModelVersionDtoLifecycleEnum lifecycle;
  @override
  final String trainingSnapshotId;
  @override
  final String notes;
  @override
  final String createdAt;
  @override
  final String promotedAt;

  factory _$MlModelVersionDto(
          [void Function(MlModelVersionDtoBuilder)? updates]) =>
      (new MlModelVersionDtoBuilder()..update(updates))._build();

  _$MlModelVersionDto._(
      {required this.id,
      required this.familyId,
      required this.versionTag,
      required this.artifactUri,
      required this.externalRunId,
      required this.metrics,
      required this.lifecycle,
      required this.trainingSnapshotId,
      required this.notes,
      required this.createdAt,
      required this.promotedAt})
      : super._() {
    BuiltValueNullFieldError.checkNotNull(id, r'MlModelVersionDto', 'id');
    BuiltValueNullFieldError.checkNotNull(
        familyId, r'MlModelVersionDto', 'familyId');
    BuiltValueNullFieldError.checkNotNull(
        versionTag, r'MlModelVersionDto', 'versionTag');
    BuiltValueNullFieldError.checkNotNull(
        artifactUri, r'MlModelVersionDto', 'artifactUri');
    BuiltValueNullFieldError.checkNotNull(
        externalRunId, r'MlModelVersionDto', 'externalRunId');
    BuiltValueNullFieldError.checkNotNull(
        metrics, r'MlModelVersionDto', 'metrics');
    BuiltValueNullFieldError.checkNotNull(
        lifecycle, r'MlModelVersionDto', 'lifecycle');
    BuiltValueNullFieldError.checkNotNull(
        trainingSnapshotId, r'MlModelVersionDto', 'trainingSnapshotId');
    BuiltValueNullFieldError.checkNotNull(notes, r'MlModelVersionDto', 'notes');
    BuiltValueNullFieldError.checkNotNull(
        createdAt, r'MlModelVersionDto', 'createdAt');
    BuiltValueNullFieldError.checkNotNull(
        promotedAt, r'MlModelVersionDto', 'promotedAt');
  }

  @override
  MlModelVersionDto rebuild(void Function(MlModelVersionDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  MlModelVersionDtoBuilder toBuilder() =>
      new MlModelVersionDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is MlModelVersionDto &&
        id == other.id &&
        familyId == other.familyId &&
        versionTag == other.versionTag &&
        artifactUri == other.artifactUri &&
        externalRunId == other.externalRunId &&
        metrics == other.metrics &&
        lifecycle == other.lifecycle &&
        trainingSnapshotId == other.trainingSnapshotId &&
        notes == other.notes &&
        createdAt == other.createdAt &&
        promotedAt == other.promotedAt;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, id.hashCode);
    _$hash = $jc(_$hash, familyId.hashCode);
    _$hash = $jc(_$hash, versionTag.hashCode);
    _$hash = $jc(_$hash, artifactUri.hashCode);
    _$hash = $jc(_$hash, externalRunId.hashCode);
    _$hash = $jc(_$hash, metrics.hashCode);
    _$hash = $jc(_$hash, lifecycle.hashCode);
    _$hash = $jc(_$hash, trainingSnapshotId.hashCode);
    _$hash = $jc(_$hash, notes.hashCode);
    _$hash = $jc(_$hash, createdAt.hashCode);
    _$hash = $jc(_$hash, promotedAt.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'MlModelVersionDto')
          ..add('id', id)
          ..add('familyId', familyId)
          ..add('versionTag', versionTag)
          ..add('artifactUri', artifactUri)
          ..add('externalRunId', externalRunId)
          ..add('metrics', metrics)
          ..add('lifecycle', lifecycle)
          ..add('trainingSnapshotId', trainingSnapshotId)
          ..add('notes', notes)
          ..add('createdAt', createdAt)
          ..add('promotedAt', promotedAt))
        .toString();
  }
}

class MlModelVersionDtoBuilder
    implements Builder<MlModelVersionDto, MlModelVersionDtoBuilder> {
  _$MlModelVersionDto? _$v;

  String? _id;
  String? get id => _$this._id;
  set id(String? id) => _$this._id = id;

  String? _familyId;
  String? get familyId => _$this._familyId;
  set familyId(String? familyId) => _$this._familyId = familyId;

  String? _versionTag;
  String? get versionTag => _$this._versionTag;
  set versionTag(String? versionTag) => _$this._versionTag = versionTag;

  String? _artifactUri;
  String? get artifactUri => _$this._artifactUri;
  set artifactUri(String? artifactUri) => _$this._artifactUri = artifactUri;

  String? _externalRunId;
  String? get externalRunId => _$this._externalRunId;
  set externalRunId(String? externalRunId) =>
      _$this._externalRunId = externalRunId;

  MapBuilder<String, num>? _metrics;
  MapBuilder<String, num> get metrics =>
      _$this._metrics ??= new MapBuilder<String, num>();
  set metrics(MapBuilder<String, num>? metrics) => _$this._metrics = metrics;

  MlModelVersionDtoLifecycleEnum? _lifecycle;
  MlModelVersionDtoLifecycleEnum? get lifecycle => _$this._lifecycle;
  set lifecycle(MlModelVersionDtoLifecycleEnum? lifecycle) =>
      _$this._lifecycle = lifecycle;

  String? _trainingSnapshotId;
  String? get trainingSnapshotId => _$this._trainingSnapshotId;
  set trainingSnapshotId(String? trainingSnapshotId) =>
      _$this._trainingSnapshotId = trainingSnapshotId;

  String? _notes;
  String? get notes => _$this._notes;
  set notes(String? notes) => _$this._notes = notes;

  String? _createdAt;
  String? get createdAt => _$this._createdAt;
  set createdAt(String? createdAt) => _$this._createdAt = createdAt;

  String? _promotedAt;
  String? get promotedAt => _$this._promotedAt;
  set promotedAt(String? promotedAt) => _$this._promotedAt = promotedAt;

  MlModelVersionDtoBuilder() {
    MlModelVersionDto._defaults(this);
  }

  MlModelVersionDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _id = $v.id;
      _familyId = $v.familyId;
      _versionTag = $v.versionTag;
      _artifactUri = $v.artifactUri;
      _externalRunId = $v.externalRunId;
      _metrics = $v.metrics.toBuilder();
      _lifecycle = $v.lifecycle;
      _trainingSnapshotId = $v.trainingSnapshotId;
      _notes = $v.notes;
      _createdAt = $v.createdAt;
      _promotedAt = $v.promotedAt;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(MlModelVersionDto other) {
    ArgumentError.checkNotNull(other, 'other');
    _$v = other as _$MlModelVersionDto;
  }

  @override
  void update(void Function(MlModelVersionDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  MlModelVersionDto build() => _build();

  _$MlModelVersionDto _build() {
    _$MlModelVersionDto _$result;
    try {
      _$result = _$v ??
          new _$MlModelVersionDto._(
              id: BuiltValueNullFieldError.checkNotNull(
                  id, r'MlModelVersionDto', 'id'),
              familyId: BuiltValueNullFieldError.checkNotNull(
                  familyId, r'MlModelVersionDto', 'familyId'),
              versionTag: BuiltValueNullFieldError.checkNotNull(
                  versionTag, r'MlModelVersionDto', 'versionTag'),
              artifactUri: BuiltValueNullFieldError.checkNotNull(
                  artifactUri, r'MlModelVersionDto', 'artifactUri'),
              externalRunId: BuiltValueNullFieldError.checkNotNull(
                  externalRunId, r'MlModelVersionDto', 'externalRunId'),
              metrics: metrics.build(),
              lifecycle: BuiltValueNullFieldError.checkNotNull(
                  lifecycle, r'MlModelVersionDto', 'lifecycle'),
              trainingSnapshotId: BuiltValueNullFieldError.checkNotNull(
                  trainingSnapshotId, r'MlModelVersionDto', 'trainingSnapshotId'),
              notes: BuiltValueNullFieldError.checkNotNull(
                  notes, r'MlModelVersionDto', 'notes'),
              createdAt: BuiltValueNullFieldError.checkNotNull(createdAt, r'MlModelVersionDto', 'createdAt'),
              promotedAt: BuiltValueNullFieldError.checkNotNull(promotedAt, r'MlModelVersionDto', 'promotedAt'));
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'metrics';
        metrics.build();
      } catch (e) {
        throw new BuiltValueNestedFieldError(
            r'MlModelVersionDto', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
