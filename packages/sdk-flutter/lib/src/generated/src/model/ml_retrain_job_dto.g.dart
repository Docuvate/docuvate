// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'ml_retrain_job_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const MlRetrainJobDtoTriggerKindEnum _$mlRetrainJobDtoTriggerKindEnum_manual =
    const MlRetrainJobDtoTriggerKindEnum._('manual');
const MlRetrainJobDtoTriggerKindEnum
    _$mlRetrainJobDtoTriggerKindEnum_threshold =
    const MlRetrainJobDtoTriggerKindEnum._('threshold');
const MlRetrainJobDtoTriggerKindEnum _$mlRetrainJobDtoTriggerKindEnum_cron =
    const MlRetrainJobDtoTriggerKindEnum._('cron');

MlRetrainJobDtoTriggerKindEnum _$mlRetrainJobDtoTriggerKindEnumValueOf(
    String name) {
  switch (name) {
    case 'manual':
      return _$mlRetrainJobDtoTriggerKindEnum_manual;
    case 'threshold':
      return _$mlRetrainJobDtoTriggerKindEnum_threshold;
    case 'cron':
      return _$mlRetrainJobDtoTriggerKindEnum_cron;
    default:
      throw new ArgumentError(name);
  }
}

final BuiltSet<MlRetrainJobDtoTriggerKindEnum>
    _$mlRetrainJobDtoTriggerKindEnumValues = new BuiltSet<
        MlRetrainJobDtoTriggerKindEnum>(const <MlRetrainJobDtoTriggerKindEnum>[
  _$mlRetrainJobDtoTriggerKindEnum_manual,
  _$mlRetrainJobDtoTriggerKindEnum_threshold,
  _$mlRetrainJobDtoTriggerKindEnum_cron,
]);

const MlRetrainJobDtoStatusEnum _$mlRetrainJobDtoStatusEnum_queued =
    const MlRetrainJobDtoStatusEnum._('queued');
const MlRetrainJobDtoStatusEnum _$mlRetrainJobDtoStatusEnum_failed =
    const MlRetrainJobDtoStatusEnum._('failed');
const MlRetrainJobDtoStatusEnum _$mlRetrainJobDtoStatusEnum_cancelled =
    const MlRetrainJobDtoStatusEnum._('cancelled');
const MlRetrainJobDtoStatusEnum _$mlRetrainJobDtoStatusEnum_running =
    const MlRetrainJobDtoStatusEnum._('running');
const MlRetrainJobDtoStatusEnum _$mlRetrainJobDtoStatusEnum_succeeded =
    const MlRetrainJobDtoStatusEnum._('succeeded');

MlRetrainJobDtoStatusEnum _$mlRetrainJobDtoStatusEnumValueOf(String name) {
  switch (name) {
    case 'queued':
      return _$mlRetrainJobDtoStatusEnum_queued;
    case 'failed':
      return _$mlRetrainJobDtoStatusEnum_failed;
    case 'cancelled':
      return _$mlRetrainJobDtoStatusEnum_cancelled;
    case 'running':
      return _$mlRetrainJobDtoStatusEnum_running;
    case 'succeeded':
      return _$mlRetrainJobDtoStatusEnum_succeeded;
    default:
      throw new ArgumentError(name);
  }
}

final BuiltSet<MlRetrainJobDtoStatusEnum> _$mlRetrainJobDtoStatusEnumValues =
    new BuiltSet<MlRetrainJobDtoStatusEnum>(const <MlRetrainJobDtoStatusEnum>[
  _$mlRetrainJobDtoStatusEnum_queued,
  _$mlRetrainJobDtoStatusEnum_failed,
  _$mlRetrainJobDtoStatusEnum_cancelled,
  _$mlRetrainJobDtoStatusEnum_running,
  _$mlRetrainJobDtoStatusEnum_succeeded,
]);

Serializer<MlRetrainJobDtoTriggerKindEnum>
    _$mlRetrainJobDtoTriggerKindEnumSerializer =
    new _$MlRetrainJobDtoTriggerKindEnumSerializer();
Serializer<MlRetrainJobDtoStatusEnum> _$mlRetrainJobDtoStatusEnumSerializer =
    new _$MlRetrainJobDtoStatusEnumSerializer();

class _$MlRetrainJobDtoTriggerKindEnumSerializer
    implements PrimitiveSerializer<MlRetrainJobDtoTriggerKindEnum> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'manual': 'manual',
    'threshold': 'threshold',
    'cron': 'cron',
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    'manual': 'manual',
    'threshold': 'threshold',
    'cron': 'cron',
  };

  @override
  final Iterable<Type> types = const <Type>[MlRetrainJobDtoTriggerKindEnum];
  @override
  final String wireName = 'MlRetrainJobDtoTriggerKindEnum';

  @override
  Object serialize(
          Serializers serializers, MlRetrainJobDtoTriggerKindEnum object,
          {FullType specifiedType = FullType.unspecified}) =>
      _toWire[object.name] ?? object.name;

  @override
  MlRetrainJobDtoTriggerKindEnum deserialize(
          Serializers serializers, Object serialized,
          {FullType specifiedType = FullType.unspecified}) =>
      MlRetrainJobDtoTriggerKindEnum.valueOf(
          _fromWire[serialized] ?? (serialized is String ? serialized : ''));
}

class _$MlRetrainJobDtoStatusEnumSerializer
    implements PrimitiveSerializer<MlRetrainJobDtoStatusEnum> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'queued': 'queued',
    'failed': 'failed',
    'cancelled': 'cancelled',
    'running': 'running',
    'succeeded': 'succeeded',
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    'queued': 'queued',
    'failed': 'failed',
    'cancelled': 'cancelled',
    'running': 'running',
    'succeeded': 'succeeded',
  };

  @override
  final Iterable<Type> types = const <Type>[MlRetrainJobDtoStatusEnum];
  @override
  final String wireName = 'MlRetrainJobDtoStatusEnum';

  @override
  Object serialize(Serializers serializers, MlRetrainJobDtoStatusEnum object,
          {FullType specifiedType = FullType.unspecified}) =>
      _toWire[object.name] ?? object.name;

  @override
  MlRetrainJobDtoStatusEnum deserialize(
          Serializers serializers, Object serialized,
          {FullType specifiedType = FullType.unspecified}) =>
      MlRetrainJobDtoStatusEnum.valueOf(
          _fromWire[serialized] ?? (serialized is String ? serialized : ''));
}

class _$MlRetrainJobDto extends MlRetrainJobDto {
  @override
  final String id;
  @override
  final String familyId;
  @override
  final MlRetrainJobDtoTriggerKindEnum triggerKind;
  @override
  final MlRetrainJobDtoStatusEnum status;
  @override
  final String trainingSnapshotId;
  @override
  final String resultVersionId;
  @override
  final String errorMessage;
  @override
  final String createdAt;
  @override
  final String startedAt;
  @override
  final String finishedAt;

  factory _$MlRetrainJobDto([void Function(MlRetrainJobDtoBuilder)? updates]) =>
      (new MlRetrainJobDtoBuilder()..update(updates))._build();

  _$MlRetrainJobDto._(
      {required this.id,
      required this.familyId,
      required this.triggerKind,
      required this.status,
      required this.trainingSnapshotId,
      required this.resultVersionId,
      required this.errorMessage,
      required this.createdAt,
      required this.startedAt,
      required this.finishedAt})
      : super._() {
    BuiltValueNullFieldError.checkNotNull(id, r'MlRetrainJobDto', 'id');
    BuiltValueNullFieldError.checkNotNull(
        familyId, r'MlRetrainJobDto', 'familyId');
    BuiltValueNullFieldError.checkNotNull(
        triggerKind, r'MlRetrainJobDto', 'triggerKind');
    BuiltValueNullFieldError.checkNotNull(status, r'MlRetrainJobDto', 'status');
    BuiltValueNullFieldError.checkNotNull(
        trainingSnapshotId, r'MlRetrainJobDto', 'trainingSnapshotId');
    BuiltValueNullFieldError.checkNotNull(
        resultVersionId, r'MlRetrainJobDto', 'resultVersionId');
    BuiltValueNullFieldError.checkNotNull(
        errorMessage, r'MlRetrainJobDto', 'errorMessage');
    BuiltValueNullFieldError.checkNotNull(
        createdAt, r'MlRetrainJobDto', 'createdAt');
    BuiltValueNullFieldError.checkNotNull(
        startedAt, r'MlRetrainJobDto', 'startedAt');
    BuiltValueNullFieldError.checkNotNull(
        finishedAt, r'MlRetrainJobDto', 'finishedAt');
  }

  @override
  MlRetrainJobDto rebuild(void Function(MlRetrainJobDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  MlRetrainJobDtoBuilder toBuilder() =>
      new MlRetrainJobDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is MlRetrainJobDto &&
        id == other.id &&
        familyId == other.familyId &&
        triggerKind == other.triggerKind &&
        status == other.status &&
        trainingSnapshotId == other.trainingSnapshotId &&
        resultVersionId == other.resultVersionId &&
        errorMessage == other.errorMessage &&
        createdAt == other.createdAt &&
        startedAt == other.startedAt &&
        finishedAt == other.finishedAt;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, id.hashCode);
    _$hash = $jc(_$hash, familyId.hashCode);
    _$hash = $jc(_$hash, triggerKind.hashCode);
    _$hash = $jc(_$hash, status.hashCode);
    _$hash = $jc(_$hash, trainingSnapshotId.hashCode);
    _$hash = $jc(_$hash, resultVersionId.hashCode);
    _$hash = $jc(_$hash, errorMessage.hashCode);
    _$hash = $jc(_$hash, createdAt.hashCode);
    _$hash = $jc(_$hash, startedAt.hashCode);
    _$hash = $jc(_$hash, finishedAt.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'MlRetrainJobDto')
          ..add('id', id)
          ..add('familyId', familyId)
          ..add('triggerKind', triggerKind)
          ..add('status', status)
          ..add('trainingSnapshotId', trainingSnapshotId)
          ..add('resultVersionId', resultVersionId)
          ..add('errorMessage', errorMessage)
          ..add('createdAt', createdAt)
          ..add('startedAt', startedAt)
          ..add('finishedAt', finishedAt))
        .toString();
  }
}

class MlRetrainJobDtoBuilder
    implements Builder<MlRetrainJobDto, MlRetrainJobDtoBuilder> {
  _$MlRetrainJobDto? _$v;

  String? _id;
  String? get id => _$this._id;
  set id(String? id) => _$this._id = id;

  String? _familyId;
  String? get familyId => _$this._familyId;
  set familyId(String? familyId) => _$this._familyId = familyId;

  MlRetrainJobDtoTriggerKindEnum? _triggerKind;
  MlRetrainJobDtoTriggerKindEnum? get triggerKind => _$this._triggerKind;
  set triggerKind(MlRetrainJobDtoTriggerKindEnum? triggerKind) =>
      _$this._triggerKind = triggerKind;

  MlRetrainJobDtoStatusEnum? _status;
  MlRetrainJobDtoStatusEnum? get status => _$this._status;
  set status(MlRetrainJobDtoStatusEnum? status) => _$this._status = status;

  String? _trainingSnapshotId;
  String? get trainingSnapshotId => _$this._trainingSnapshotId;
  set trainingSnapshotId(String? trainingSnapshotId) =>
      _$this._trainingSnapshotId = trainingSnapshotId;

  String? _resultVersionId;
  String? get resultVersionId => _$this._resultVersionId;
  set resultVersionId(String? resultVersionId) =>
      _$this._resultVersionId = resultVersionId;

  String? _errorMessage;
  String? get errorMessage => _$this._errorMessage;
  set errorMessage(String? errorMessage) => _$this._errorMessage = errorMessage;

  String? _createdAt;
  String? get createdAt => _$this._createdAt;
  set createdAt(String? createdAt) => _$this._createdAt = createdAt;

  String? _startedAt;
  String? get startedAt => _$this._startedAt;
  set startedAt(String? startedAt) => _$this._startedAt = startedAt;

  String? _finishedAt;
  String? get finishedAt => _$this._finishedAt;
  set finishedAt(String? finishedAt) => _$this._finishedAt = finishedAt;

  MlRetrainJobDtoBuilder() {
    MlRetrainJobDto._defaults(this);
  }

  MlRetrainJobDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _id = $v.id;
      _familyId = $v.familyId;
      _triggerKind = $v.triggerKind;
      _status = $v.status;
      _trainingSnapshotId = $v.trainingSnapshotId;
      _resultVersionId = $v.resultVersionId;
      _errorMessage = $v.errorMessage;
      _createdAt = $v.createdAt;
      _startedAt = $v.startedAt;
      _finishedAt = $v.finishedAt;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(MlRetrainJobDto other) {
    ArgumentError.checkNotNull(other, 'other');
    _$v = other as _$MlRetrainJobDto;
  }

  @override
  void update(void Function(MlRetrainJobDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  MlRetrainJobDto build() => _build();

  _$MlRetrainJobDto _build() {
    final _$result = _$v ??
        new _$MlRetrainJobDto._(
            id: BuiltValueNullFieldError.checkNotNull(
                id, r'MlRetrainJobDto', 'id'),
            familyId: BuiltValueNullFieldError.checkNotNull(
                familyId, r'MlRetrainJobDto', 'familyId'),
            triggerKind: BuiltValueNullFieldError.checkNotNull(
                triggerKind, r'MlRetrainJobDto', 'triggerKind'),
            status: BuiltValueNullFieldError.checkNotNull(
                status, r'MlRetrainJobDto', 'status'),
            trainingSnapshotId: BuiltValueNullFieldError.checkNotNull(
                trainingSnapshotId, r'MlRetrainJobDto', 'trainingSnapshotId'),
            resultVersionId: BuiltValueNullFieldError.checkNotNull(
                resultVersionId, r'MlRetrainJobDto', 'resultVersionId'),
            errorMessage: BuiltValueNullFieldError.checkNotNull(
                errorMessage, r'MlRetrainJobDto', 'errorMessage'),
            createdAt: BuiltValueNullFieldError.checkNotNull(
                createdAt, r'MlRetrainJobDto', 'createdAt'),
            startedAt:
                BuiltValueNullFieldError.checkNotNull(startedAt, r'MlRetrainJobDto', 'startedAt'),
            finishedAt: BuiltValueNullFieldError.checkNotNull(finishedAt, r'MlRetrainJobDto', 'finishedAt'));
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
