// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'encoder_reindex_progress_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$EncoderReindexProgressDto extends EncoderReindexProgressDto {
  @override
  final String targetEncoderId;
  @override
  final String targetEncoderRevision;
  @override
  final num progressProcessed;
  @override
  final num progressTotal;
  @override
  final num progressPending;

  factory _$EncoderReindexProgressDto(
          [void Function(EncoderReindexProgressDtoBuilder)? updates]) =>
      (EncoderReindexProgressDtoBuilder()..update(updates))._build();

  _$EncoderReindexProgressDto._(
      {required this.targetEncoderId,
      required this.targetEncoderRevision,
      required this.progressProcessed,
      required this.progressTotal,
      required this.progressPending})
      : super._();
  @override
  EncoderReindexProgressDto rebuild(
          void Function(EncoderReindexProgressDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  EncoderReindexProgressDtoBuilder toBuilder() =>
      EncoderReindexProgressDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is EncoderReindexProgressDto &&
        targetEncoderId == other.targetEncoderId &&
        targetEncoderRevision == other.targetEncoderRevision &&
        progressProcessed == other.progressProcessed &&
        progressTotal == other.progressTotal &&
        progressPending == other.progressPending;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, targetEncoderId.hashCode);
    _$hash = $jc(_$hash, targetEncoderRevision.hashCode);
    _$hash = $jc(_$hash, progressProcessed.hashCode);
    _$hash = $jc(_$hash, progressTotal.hashCode);
    _$hash = $jc(_$hash, progressPending.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'EncoderReindexProgressDto')
          ..add('targetEncoderId', targetEncoderId)
          ..add('targetEncoderRevision', targetEncoderRevision)
          ..add('progressProcessed', progressProcessed)
          ..add('progressTotal', progressTotal)
          ..add('progressPending', progressPending))
        .toString();
  }
}

class EncoderReindexProgressDtoBuilder
    implements
        Builder<EncoderReindexProgressDto, EncoderReindexProgressDtoBuilder> {
  _$EncoderReindexProgressDto? _$v;

  String? _targetEncoderId;
  String? get targetEncoderId => _$this._targetEncoderId;
  set targetEncoderId(String? targetEncoderId) =>
      _$this._targetEncoderId = targetEncoderId;

  String? _targetEncoderRevision;
  String? get targetEncoderRevision => _$this._targetEncoderRevision;
  set targetEncoderRevision(String? targetEncoderRevision) =>
      _$this._targetEncoderRevision = targetEncoderRevision;

  num? _progressProcessed;
  num? get progressProcessed => _$this._progressProcessed;
  set progressProcessed(num? progressProcessed) =>
      _$this._progressProcessed = progressProcessed;

  num? _progressTotal;
  num? get progressTotal => _$this._progressTotal;
  set progressTotal(num? progressTotal) =>
      _$this._progressTotal = progressTotal;

  num? _progressPending;
  num? get progressPending => _$this._progressPending;
  set progressPending(num? progressPending) =>
      _$this._progressPending = progressPending;

  EncoderReindexProgressDtoBuilder() {
    EncoderReindexProgressDto._defaults(this);
  }

  EncoderReindexProgressDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _targetEncoderId = $v.targetEncoderId;
      _targetEncoderRevision = $v.targetEncoderRevision;
      _progressProcessed = $v.progressProcessed;
      _progressTotal = $v.progressTotal;
      _progressPending = $v.progressPending;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(EncoderReindexProgressDto other) {
    _$v = other as _$EncoderReindexProgressDto;
  }

  @override
  void update(void Function(EncoderReindexProgressDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  EncoderReindexProgressDto build() => _build();

  _$EncoderReindexProgressDto _build() {
    final _$result = _$v ??
        _$EncoderReindexProgressDto._(
          targetEncoderId: BuiltValueNullFieldError.checkNotNull(
              targetEncoderId, r'EncoderReindexProgressDto', 'targetEncoderId'),
          targetEncoderRevision: BuiltValueNullFieldError.checkNotNull(
              targetEncoderRevision,
              r'EncoderReindexProgressDto',
              'targetEncoderRevision'),
          progressProcessed: BuiltValueNullFieldError.checkNotNull(
              progressProcessed,
              r'EncoderReindexProgressDto',
              'progressProcessed'),
          progressTotal: BuiltValueNullFieldError.checkNotNull(
              progressTotal, r'EncoderReindexProgressDto', 'progressTotal'),
          progressPending: BuiltValueNullFieldError.checkNotNull(
              progressPending, r'EncoderReindexProgressDto', 'progressPending'),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
